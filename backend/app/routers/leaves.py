from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    get_current_admin_or_hr,
    get_current_user,
)
from app.models.employee import Employee
from app.models.notification import NotificationType
from app.models.leave import (
    LeaveRequest,
    LeaveRequestStatus,
    LeaveType,
)
from app.schemas.leave import (
    LeaveRequestCreate,
    LeaveRequestResponse,
    LeaveRequestReview,
    LeaveTypeCreate,
    LeaveTypeResponse,
    LeaveTypeUpdate,
)
from app.services.audit_log import create_audit_log
from app.services.notification_service import create_notification


# ============================================================
# LEAVE TYPE ROUTER
# ============================================================

router = APIRouter(
    prefix="/leave-types",
    tags=["Leave Types"],
)


# ============================================================
# CREATE LEAVE TYPE
# ADMIN / HR ONLY
# ============================================================

@router.post(
    "",
    response_model=LeaveTypeResponse,
    status_code=201,
)
def create_leave_type(
    leave_type_data: LeaveTypeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_hr),
):
    existing_name = (
        db.query(LeaveType)
        .filter(
            LeaveType.name == leave_type_data.name
        )
        .first()
    )

    if existing_name:
        raise HTTPException(
            status_code=400,
            detail="Leave type with this name already exists.",
        )

    existing_code = (
        db.query(LeaveType)
        .filter(
            LeaveType.code == leave_type_data.code
        )
        .first()
    )

    if existing_code:
        raise HTTPException(
            status_code=400,
            detail="Leave type with this code already exists.",
        )

    leave_type = LeaveType(
        name=leave_type_data.name,
        code=leave_type_data.code,
        description=leave_type_data.description,
        default_days=leave_type_data.default_days,
        is_active=True,
    )

    db.add(leave_type)
    db.commit()
    db.refresh(leave_type)

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CREATE",
        module="LEAVE_TYPES",
        description=(
            f"Leave type {leave_type.code} "
            f"was created successfully."
        ),
        entity_type="LEAVE_TYPE",
        entity_id=leave_type.id,
    )

    return leave_type


# ============================================================
# LIST LEAVE TYPES
# ALL AUTHENTICATED USERS
# ============================================================

@router.get(
    "",
    response_model=list[LeaveTypeResponse],
)
def list_leave_types(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(LeaveType)

    if active_only:
        query = query.filter(
            LeaveType.is_active.is_(True)
        )

    return (
        query
        .order_by(LeaveType.id.asc())
        .all()
    )


# ============================================================
# GET LEAVE TYPE
# ALL AUTHENTICATED USERS
# ============================================================

@router.get(
    "/{leave_type_id}",
    response_model=LeaveTypeResponse,
)
def get_leave_type(
    leave_type_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    leave_type = (
        db.query(LeaveType)
        .filter(
            LeaveType.id == leave_type_id
        )
        .first()
    )

    if not leave_type:
        raise HTTPException(
            status_code=404,
            detail="Leave type not found.",
        )

    return leave_type


# ============================================================
# UPDATE LEAVE TYPE
# ADMIN / HR ONLY
# ============================================================

@router.put(
    "/{leave_type_id}",
    response_model=LeaveTypeResponse,
)
def update_leave_type(
    leave_type_id: int,
    leave_type_data: LeaveTypeUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_hr),
):
    leave_type = (
        db.query(LeaveType)
        .filter(
            LeaveType.id == leave_type_id
        )
        .first()
    )

    if not leave_type:
        raise HTTPException(
            status_code=404,
            detail="Leave type not found.",
        )

    if leave_type_data.name is not None:
        existing_name = (
            db.query(LeaveType)
            .filter(
                LeaveType.name == leave_type_data.name,
                LeaveType.id != leave_type_id,
            )
            .first()
        )

        if existing_name:
            raise HTTPException(
                status_code=400,
                detail="Another leave type with this name already exists.",
            )

        leave_type.name = leave_type_data.name

    if leave_type_data.code is not None:
        existing_code = (
            db.query(LeaveType)
            .filter(
                LeaveType.code == leave_type_data.code,
                LeaveType.id != leave_type_id,
            )
            .first()
        )

        if existing_code:
            raise HTTPException(
                status_code=400,
                detail="Another leave type with this code already exists.",
            )

        leave_type.code = leave_type_data.code

    if leave_type_data.description is not None:
        leave_type.description = leave_type_data.description

    if leave_type_data.default_days is not None:
        leave_type.default_days = leave_type_data.default_days

    if leave_type_data.is_active is not None:
        leave_type.is_active = leave_type_data.is_active

    db.commit()
    db.refresh(leave_type)

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="UPDATE",
        module="LEAVE_TYPES",
        description=(
            f"Leave type {leave_type.code} "
            f"was updated successfully."
        ),
        entity_type="LEAVE_TYPE",
        entity_id=leave_type.id,
    )

    return leave_type


# ============================================================
# DELETE / DEACTIVATE LEAVE TYPE
# ADMIN / HR ONLY
# ============================================================

@router.delete(
    "/{leave_type_id}",
    response_model=LeaveTypeResponse,
)
def deactivate_leave_type(
    leave_type_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_hr),
):
    leave_type = (
        db.query(LeaveType)
        .filter(
            LeaveType.id == leave_type_id
        )
        .first()
    )

    if not leave_type:
        raise HTTPException(
            status_code=404,
            detail="Leave type not found.",
        )

    leave_type.is_active = False

    db.commit()
    db.refresh(leave_type)

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="DELETE",
        module="LEAVE_TYPES",
        description=(
            f"Leave type {leave_type.code} "
            f"was deactivated successfully."
        ),
        entity_type="LEAVE_TYPE",
        entity_id=leave_type.id,
    )

    return leave_type


# ============================================================
# LEAVE REQUEST ROUTER
# ============================================================

leave_router = APIRouter(
    prefix="/leaves",
    tags=["Leaves"],
)


# ============================================================
# HELPER
# ============================================================

def get_employee_for_user(
    db: Session,
    user_id: int,
) -> Employee:
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


# ============================================================
# CREATE LEAVE REQUEST
# ============================================================

@leave_router.post(
    "",
    response_model=LeaveRequestResponse,
    status_code=201,
)
def create_leave_request(
    leave_data: LeaveRequestCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    employee = get_employee_for_user(
        db,
        current_user.id,
    )

    if leave_data.start_date > leave_data.end_date:
        raise HTTPException(
            status_code=400,
            detail="Start date cannot be after end date.",
        )

    leave_type = (
        db.query(LeaveType)
        .filter(
            LeaveType.id == leave_data.leave_type_id,
            LeaveType.is_active.is_(True),
        )
        .first()
    )

    if not leave_type:
        raise HTTPException(
            status_code=404,
            detail="Active leave type not found.",
        )

    total_days = (
        leave_data.end_date - leave_data.start_date
    ).days + 1

    overlapping_request = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.employee_id == employee.id,
            LeaveRequest.status.in_(
                [
                    LeaveRequestStatus.PENDING,
                    LeaveRequestStatus.APPROVED,
                ]
            ),
            LeaveRequest.start_date <= leave_data.end_date,
            LeaveRequest.end_date >= leave_data.start_date,
        )
        .first()
    )

    if overlapping_request:
        raise HTTPException(
            status_code=400,
            detail=(
                "You already have a pending or approved leave "
                "request overlapping these dates."
            ),
        )

    leave_request = LeaveRequest(
        employee_id=employee.id,
        leave_type_id=leave_data.leave_type_id,
        start_date=leave_data.start_date,
        end_date=leave_data.end_date,
        total_days=total_days,
        reason=leave_data.reason,
        status=LeaveRequestStatus.PENDING,
    )

    db.add(leave_request)
    db.commit()
    db.refresh(leave_request)

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CREATE",
        module="LEAVES",
        description=(
            f"Leave request {leave_request.id} "
            f"was created successfully for employee "
            f"{employee.employee_code}."
        ),
        entity_type="LEAVE_REQUEST",
        entity_id=leave_request.id,
    )

    return leave_request


# ============================================================
# GET MY LEAVE REQUESTS
# ============================================================

@leave_router.get(
    "/my",
    response_model=list[LeaveRequestResponse],
)
def get_my_leave_requests(
    status: LeaveRequestStatus | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    employee = get_employee_for_user(
        db,
        current_user.id,
    )

    query = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.employee_id == employee.id
        )
    )

    if status:
        query = query.filter(
            LeaveRequest.status == status
        )

    if start_date:
        query = query.filter(
            LeaveRequest.end_date >= start_date
        )

    if end_date:
        query = query.filter(
            LeaveRequest.start_date <= end_date
        )

    return (
        query
        .order_by(LeaveRequest.created_at.desc())
        .all()
    )


# ============================================================
# GET LEAVE REQUEST BY ID
# ============================================================

@leave_router.get(
    "/{leave_id}",
    response_model=LeaveRequestResponse,
)
def get_leave_request(
    leave_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    leave_request = (
        db.query(LeaveRequest)
        .filter(LeaveRequest.id == leave_id)
        .first()
    )

    if not leave_request:
        raise HTTPException(
            status_code=404,
            detail="Leave request not found.",
        )

    if current_user.role.value in ["ADMIN", "HR"]:
        return leave_request

    current_employee = get_employee_for_user(
        db,
        current_user.id,
    )

    if leave_request.employee_id == current_employee.id:
        return leave_request

    if current_user.role.value == "MANAGER":
        requested_employee = (
            db.query(Employee)
            .filter(
                Employee.id == leave_request.employee_id
            )
            .first()
        )

        if (
            requested_employee
            and requested_employee.manager_id
            == current_employee.id
        ):
            return leave_request

    raise HTTPException(
        status_code=403,
        detail="You do not have permission to access this leave request.",
    )


# ============================================================
# APPROVE LEAVE REQUEST
# ============================================================

@leave_router.post(
    "/{leave_id}/approve",
    response_model=LeaveRequestResponse,
)
def approve_leave_request(
    leave_id: int,
    review_data: LeaveRequestReview | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    leave_request = (
        db.query(LeaveRequest)
        .filter(LeaveRequest.id == leave_id)
        .first()
    )

    if not leave_request:
        raise HTTPException(
            status_code=404,
            detail="Leave request not found.",
        )

    if leave_request.status != LeaveRequestStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail="Only pending leave requests can be approved.",
        )

    if current_user.role.value in ["ADMIN", "HR"]:
        allowed = True

    elif current_user.role.value == "MANAGER":
        current_employee = get_employee_for_user(
            db,
            current_user.id,
        )

        requested_employee = (
            db.query(Employee)
            .filter(
                Employee.id == leave_request.employee_id
            )
            .first()
        )

        allowed = (
            requested_employee is not None
            and requested_employee.manager_id
            == current_employee.id
        )

    else:
        allowed = False

    if not allowed:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to approve this leave request.",
        )

    leave_request.status = LeaveRequestStatus.APPROVED
    leave_request.reviewer_id = current_user.id
    leave_request.reviewer_remarks = (
        review_data.reviewer_remarks
        if review_data
        else None
    )
    leave_request.reviewed_at = datetime.utcnow()

    create_notification(
        db=db,
        user_id=leave_request.employee.user_id,
        title="Leave Approved",
        message=(
            f"Your leave request from "
            f"{leave_request.start_date} to "
            f"{leave_request.end_date} "
            f"has been approved."
        ),
        notification_type=NotificationType.SUCCESS,
    )

    db.commit()
    db.refresh(leave_request)

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="APPROVE",
        module="LEAVES",
        description=(
            f"Leave request {leave_request.id} "
            f"was approved successfully."
        ),
        entity_type="LEAVE_REQUEST",
        entity_id=leave_request.id,
    )

    return leave_request


# ============================================================
# REJECT LEAVE REQUEST
# ============================================================

@leave_router.post(
    "/{leave_id}/reject",
    response_model=LeaveRequestResponse,
)
def reject_leave_request(
    leave_id: int,
    review_data: LeaveRequestReview | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    leave_request = (
        db.query(LeaveRequest)
        .filter(LeaveRequest.id == leave_id)
        .first()
    )

    if not leave_request:
        raise HTTPException(
            status_code=404,
            detail="Leave request not found.",
        )

    if leave_request.status != LeaveRequestStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail="Only pending leave requests can be rejected.",
        )

    if current_user.role.value in ["ADMIN", "HR"]:
        allowed = True

    elif current_user.role.value == "MANAGER":
        current_employee = get_employee_for_user(
            db,
            current_user.id,
        )

        requested_employee = (
            db.query(Employee)
            .filter(
                Employee.id == leave_request.employee_id
            )
            .first()
        )

        allowed = (
            requested_employee is not None
            and requested_employee.manager_id
            == current_employee.id
        )

    else:
        allowed = False

    if not allowed:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to reject this leave request.",
        )

    leave_request.status = LeaveRequestStatus.REJECTED
    leave_request.reviewer_id = current_user.id
    leave_request.reviewer_remarks = (
        review_data.reviewer_remarks
        if review_data
        else None
    )
    leave_request.reviewed_at = datetime.utcnow()

    remarks_text = (
        leave_request.reviewer_remarks
        or "No additional remarks provided."
    )

    create_notification(
        db=db,
        user_id=leave_request.employee.user_id,
        title="Leave Rejected",
        message=(
            f"Your leave request from "
            f"{leave_request.start_date} to "
            f"{leave_request.end_date} "
            f"has been rejected. "
            f"Remarks: {remarks_text}"
        ),
        notification_type=NotificationType.WARNING,
    )

    db.commit()
    db.refresh(leave_request)

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="REJECT",
        module="LEAVES",
        description=(
            f"Leave request {leave_request.id} "
            f"was rejected successfully."
        ),
        entity_type="LEAVE_REQUEST",
        entity_id=leave_request.id,
    )

    return leave_request


# ============================================================
# CANCEL LEAVE REQUEST
# ============================================================

@leave_router.post(
    "/{leave_id}/cancel",
    response_model=LeaveRequestResponse,
)
def cancel_leave_request(
    leave_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    leave_request = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.id == leave_id
        )
        .first()
    )

    if not leave_request:
        raise HTTPException(
            status_code=404,
            detail="Leave request not found.",
        )

    employee = get_employee_for_user(
        db,
        current_user.id,
    )

    if leave_request.employee_id != employee.id:
        raise HTTPException(
            status_code=403,
            detail="You can only cancel your own leave request.",
        )

    if leave_request.status not in [
        LeaveRequestStatus.PENDING,
        LeaveRequestStatus.APPROVED,
    ]:
        raise HTTPException(
            status_code=400,
            detail=(
                "Only pending or approved leave requests "
                "can be cancelled."
            ),
        )

    leave_request.status = LeaveRequestStatus.CANCELLED

    db.commit()
    db.refresh(leave_request)

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CANCEL",
        module="LEAVES",
        description=(
            f"Leave request {leave_request.id} "
            f"was cancelled successfully."
        ),
        entity_type="LEAVE_REQUEST",
        entity_id=leave_request.id,
    )

    return leave_request