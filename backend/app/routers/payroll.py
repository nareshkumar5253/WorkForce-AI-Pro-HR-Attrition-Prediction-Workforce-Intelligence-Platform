from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.employee import Employee
from app.models.payroll import Payroll, PayrollStatus
from app.schemas.payroll import (
    PayrollCreate,
    PayrollResponse,
    PayrollUpdate,
)
from app.utils.enums import UserRole
from app.services.notification_service import create_notification
from app.models.notification import NotificationType

router = APIRouter(
    prefix="/payrolls",
    tags=["Payroll"],
)


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def get_employee_for_user(
    db: Session,
    user_id: int,
):
    employee = (
        db.query(Employee)
        .filter(Employee.user_id == user_id)
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee profile not found for current user.",
        )

    return employee


def check_payroll_access(
    db: Session,
    current_user,
    payroll: Payroll,
):
    """
    Access rules:

    ADMIN / HR:
        Can access all payrolls.

    MANAGER:
        Can access payrolls of direct team members.

    EMPLOYEE:
        Can access only own payroll.
    """

    role = current_user.role

    if role in [UserRole.ADMIN, UserRole.HR]:
        return

    current_employee = get_employee_for_user(
        db,
        current_user.id,
    )

    # Employee can access own payroll
    if payroll.employee_id == current_employee.id:
        return

    # Manager can access direct team member payroll
    if role == UserRole.MANAGER:

        target_employee = (
            db.query(Employee)
            .filter(
                Employee.id == payroll.employee_id
            )
            .first()
        )

        if (
            target_employee
            and target_employee.manager_id
            == current_employee.id
        ):
            return

    raise HTTPException(
        status_code=403,
        detail="You do not have permission to access this payroll.",
    )


def check_management_permission(current_user):
    if current_user.role not in [
        UserRole.ADMIN,
        UserRole.HR,
    ]:
        raise HTTPException(
            status_code=403,
            detail="Only ADMIN or HR can manage payroll.",
        )


# ============================================================
# CREATE PAYROLL
# ============================================================

@router.post(
    "",
    response_model=PayrollResponse,
    status_code=201,
)
def create_payroll(
    payroll_data: PayrollCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    check_management_permission(current_user)

    # --------------------------------------------------------
    # Validate employee
    # --------------------------------------------------------

    employee = (
        db.query(Employee)
        .filter(Employee.id == payroll_data.employee_id)
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found.",
        )

    # --------------------------------------------------------
    # Prevent duplicate payroll for same month
    # --------------------------------------------------------

    existing_payroll = (
        db.query(Payroll)
        .filter(
            Payroll.employee_id
            == payroll_data.employee_id,
            Payroll.payroll_year
            == payroll_data.payroll_year,
            Payroll.payroll_month
            == payroll_data.payroll_month,
        )
        .first()
    )

    if existing_payroll:
        raise HTTPException(
            status_code=400,
            detail=(
                "Payroll already exists for this employee "
                "and payroll period."
            ),
        )

    # --------------------------------------------------------
    # Salary calculation
    # --------------------------------------------------------

    gross_salary = (
        payroll_data.basic_salary
        + payroll_data.hra
        + payroll_data.allowances
        + payroll_data.bonus
    )

    net_salary = (
        gross_salary
        - payroll_data.deductions
    )

    if net_salary < 0:
        raise HTTPException(
            status_code=400,
            detail="Deductions cannot exceed gross salary.",
        )

    # --------------------------------------------------------
    # Create payroll
    # --------------------------------------------------------

    payroll = Payroll(
        employee_id=payroll_data.employee_id,
        payroll_year=payroll_data.payroll_year,
        payroll_month=payroll_data.payroll_month,

        basic_salary=payroll_data.basic_salary,
        hra=payroll_data.hra,
        allowances=payroll_data.allowances,
        bonus=payroll_data.bonus,
        deductions=payroll_data.deductions,

        gross_salary=gross_salary,
        net_salary=net_salary,

        status=PayrollStatus.PENDING,
        remarks=payroll_data.remarks,
    )

    db.add(payroll)
    db.commit()
    db.refresh(payroll)

    return payroll


# ============================================================
# GET ALL PAYROLLS
# ============================================================

@router.get(
    "",
    response_model=list[PayrollResponse],
)
def list_payrolls(
    employee_id: int | None = Query(
        default=None,
        gt=0,
    ),
    payroll_year: int | None = Query(
        default=None,
        ge=2000,
        le=2100,
    ),
    payroll_month: int | None = Query(
        default=None,
        ge=1,
        le=12,
    ),
    status: PayrollStatus | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    role = current_user.role

    # --------------------------------------------------------
    # ADMIN / HR
    # --------------------------------------------------------

    if role in [UserRole.ADMIN, UserRole.HR]:

        query = db.query(Payroll)

        if employee_id:
            query = query.filter(
                Payroll.employee_id == employee_id
            )

    # --------------------------------------------------------
    # MANAGER
    # --------------------------------------------------------

    elif role == UserRole.MANAGER:

        current_employee = get_employee_for_user(
            db,
            current_user.id,
        )

        team_ids = [
            employee.id
            for employee in (
                db.query(Employee)
                .filter(
                    Employee.manager_id
                    == current_employee.id
                )
                .all()
            )
        ]

        if not team_ids:
            return []

        query = (
            db.query(Payroll)
            .filter(
                Payroll.employee_id.in_(team_ids)
            )
        )

        if employee_id:
            if employee_id not in team_ids:
                raise HTTPException(
                    status_code=403,
                    detail="You can only view your team payrolls.",
                )

            query = query.filter(
                Payroll.employee_id == employee_id
            )

    # --------------------------------------------------------
    # EMPLOYEE
    # --------------------------------------------------------

    else:

        employee = get_employee_for_user(
            db,
            current_user.id,
        )

        query = (
            db.query(Payroll)
            .filter(
                Payroll.employee_id
                == employee.id
            )
        )

        if employee_id and employee_id != employee.id:
            raise HTTPException(
                status_code=403,
                detail="You can only view your own payroll.",
            )

    # --------------------------------------------------------
    # Common filters
    # --------------------------------------------------------

    if payroll_year:
        query = query.filter(
            Payroll.payroll_year == payroll_year
        )

    if payroll_month:
        query = query.filter(
            Payroll.payroll_month == payroll_month
        )

    if status:
        query = query.filter(
            Payroll.status == status
        )

    return (
        query
        .order_by(
            Payroll.payroll_year.desc(),
            Payroll.payroll_month.desc(),
            Payroll.id.desc(),
        )
        .all()
    )


# ============================================================
# GET MY PAYROLL
# ============================================================

@router.get(
    "/my",
    response_model=list[PayrollResponse],
)
def get_my_payroll(
    payroll_year: int | None = Query(
        default=None,
        ge=2000,
        le=2100,
    ),
    payroll_month: int | None = Query(
        default=None,
        ge=1,
        le=12,
    ),
    status: PayrollStatus | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    employee = get_employee_for_user(
        db,
        current_user.id,
    )

    query = (
        db.query(Payroll)
        .filter(
            Payroll.employee_id
            == employee.id
        )
    )

    if payroll_year:
        query = query.filter(
            Payroll.payroll_year == payroll_year
        )

    if payroll_month:
        query = query.filter(
            Payroll.payroll_month == payroll_month
        )

    if status:
        query = query.filter(
            Payroll.status == status
        )

    return (
        query
        .order_by(
            Payroll.payroll_year.desc(),
            Payroll.payroll_month.desc(),
        )
        .all()
    )


# ============================================================
# GET PAYROLL BY ID
# ============================================================

@router.get(
    "/{payroll_id}",
    response_model=PayrollResponse,
)
def get_payroll(
    payroll_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    payroll = (
        db.query(Payroll)
        .filter(Payroll.id == payroll_id)
        .first()
    )

    if not payroll:
        raise HTTPException(
            status_code=404,
            detail="Payroll not found.",
        )

    check_payroll_access(
        db,
        current_user,
        payroll,
    )

    return payroll


# ============================================================
# UPDATE PAYROLL
# ============================================================

@router.put(
    "/{payroll_id}",
    response_model=PayrollResponse,
)
def update_payroll(
    payroll_id: int,
    payroll_data: PayrollUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    check_management_permission(current_user)

    payroll = (
        db.query(Payroll)
        .filter(Payroll.id == payroll_id)
        .first()
    )

    if not payroll:
        raise HTTPException(
            status_code=404,
            detail="Payroll not found.",
        )

    # --------------------------------------------------------
    # Paid payroll should not be modified
    # --------------------------------------------------------

    if payroll.status == PayrollStatus.PAID:
        raise HTTPException(
            status_code=400,
            detail="Paid payroll cannot be modified.",
        )

    update_data = payroll_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(
            payroll,
            field,
            value,
        )

    # --------------------------------------------------------
    # Recalculate salary
    # --------------------------------------------------------

    payroll.gross_salary = (
        payroll.basic_salary
        + payroll.hra
        + payroll.allowances
        + payroll.bonus
    )

    payroll.net_salary = (
        payroll.gross_salary
        - payroll.deductions
    )

    if payroll.net_salary < 0:
        raise HTTPException(
            status_code=400,
            detail="Deductions cannot exceed gross salary.",
        )

    db.commit()
    db.refresh(payroll)

    return payroll


# ============================================================
# PROCESS PAYROLL
# ============================================================

@router.post(
    "/{payroll_id}/process",
    response_model=PayrollResponse,
)
def process_payroll(
    payroll_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    check_management_permission(current_user)

    payroll = (
        db.query(Payroll)
        .filter(Payroll.id == payroll_id)
        .first()
    )

    if not payroll:
        raise HTTPException(
            status_code=404,
            detail="Payroll not found.",
        )

    if payroll.status != PayrollStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail="Only pending payroll can be processed.",
        )

    payroll.status = PayrollStatus.PROCESSED

    db.commit()
    db.refresh(payroll)

    return payroll


# ============================================================
# MARK PAYROLL AS PAID
# ============================================================

@router.post(
    "/{payroll_id}/pay",
    response_model=PayrollResponse,
)
def pay_payroll(
    payroll_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    check_management_permission(current_user)

    payroll = (
        db.query(Payroll)
        .filter(Payroll.id == payroll_id)
        .first()
    )

    if not payroll:
        raise HTTPException(
            status_code=404,
            detail="Payroll not found.",
        )

    if payroll.status != PayrollStatus.PROCESSED:
        raise HTTPException(
            status_code=400,
            detail="Only processed payroll can be marked as paid.",
        )

    payroll.status = PayrollStatus.PAID
    payroll.payment_date = datetime.utcnow()
    create_notification(
    db=db,
    user_id=payroll.employee.user_id,
    title="Payroll Paid",
    message=(
        f"Your payroll for {payroll.payroll_month:02d}/"
        f"{payroll.payroll_year} has been paid successfully. "
        f"Net salary: ₹{payroll.net_salary}"
    ),
    notification_type=NotificationType.SUCCESS,
)
    db.commit()
    db.refresh(payroll)

    return payroll