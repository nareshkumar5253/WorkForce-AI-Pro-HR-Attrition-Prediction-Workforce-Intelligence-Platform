from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User

from app.schemas.reports import (
    WorkforceReportResponse,
    AttendanceReportResponse,
    LeaveReportResponse,
    PayrollReportResponse,
    AttritionReportResponse,
    WorkforceStabilityReportResponse,
)

from app.services.reports import (
    generate_workforce_report,
    generate_attendance_report,
    generate_leave_report,
    generate_payroll_report,
    generate_attrition_report,
    generate_workforce_stability_report,
)


router = APIRouter(
    prefix="/reports",
    tags=["Reports & Export"],
)


def check_management_access(current_user: User):
    role = (
        current_user.role.value
        if hasattr(current_user.role, "value")
        else str(current_user.role)
    )

    if role not in {"ADMIN", "HR"}:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only ADMIN or HR users can access reports.",
        )


@router.get(
    "/workforce",
    response_model=WorkforceReportResponse,
)
def workforce_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_management_access(current_user)

    return generate_workforce_report(db)


@router.get(
    "/attendance",
    response_model=AttendanceReportResponse,
)
def attendance_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_management_access(current_user)

    return generate_attendance_report(db)


@router.get(
    "/leave",
    response_model=LeaveReportResponse,
)
def leave_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_management_access(current_user)

    return generate_leave_report(db)


@router.get(
    "/payroll",
    response_model=PayrollReportResponse,
)
def payroll_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_management_access(current_user)

    return generate_payroll_report(db)


@router.get(
    "/attrition",
    response_model=AttritionReportResponse,
)
def attrition_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_management_access(current_user)

    return generate_attrition_report(db)


@router.get(
    "/workforce-stability",
    response_model=WorkforceStabilityReportResponse,
)
def workforce_stability_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_management_access(current_user)

    return generate_workforce_stability_report(db)