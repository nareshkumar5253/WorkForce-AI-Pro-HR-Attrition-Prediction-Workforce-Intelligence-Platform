from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.employee import Employee
from app.models.user import User
from app.schemas.workforce_monitor import (
    WorkforceLiveStatusResponse,
    WorkforceMonitoringSummaryResponse,
)
from app.services.workforce_monitoring import (
    build_live_employee_status,
    get_live_workforce,
    get_workforce_summary,
)


router = APIRouter(
    prefix="/workforce-monitoring",
    tags=["Real-Time Workforce Monitoring"],
)


def _get_user_role(current_user: User) -> str:
    return (
        current_user.role.value
        if hasattr(current_user.role, "value")
        else str(current_user.role)
    )


def _check_management_access(current_user: User):
    allowed_roles = {
        "ADMIN",
        "HR",
    }

    if _get_user_role(current_user) not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only ADMIN or HR users can access workforce monitoring.",
        )


# ============================================================
# 1. LIVE WORKFORCE STATUS
# ============================================================

@router.get(
    "/live",
    response_model=list[WorkforceLiveStatusResponse],
)
def get_live_workforce_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_management_access(current_user)

    return get_live_workforce(db)


# ============================================================
# 2. WORKFORCE MONITORING SUMMARY
# ============================================================

@router.get(
    "/summary",
    response_model=WorkforceMonitoringSummaryResponse,
)
def get_monitoring_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_management_access(current_user)

    return get_workforce_summary(db)


# ============================================================
# 3. SINGLE EMPLOYEE LIVE STATUS
# ============================================================

@router.get(
    "/employee/{employee_id}",
    response_model=WorkforceLiveStatusResponse,
)
def get_employee_live_status(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_management_access(current_user)

    employee = (
        db.query(Employee)
        .filter(Employee.id == employee_id)
        .first()
    )

    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found.",
        )

    return build_live_employee_status(
        db,
        employee,
    )