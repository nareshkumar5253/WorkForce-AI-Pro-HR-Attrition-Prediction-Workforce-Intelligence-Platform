from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit_log import (
    AuditLogResponse,
    AuditLogSummaryResponse,
)
from app.services.audit_log import (
    get_audit_logs,
    get_audit_log_summary,
)


router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs & Activity Tracking"],
)


def _get_user_role(current_user: User) -> str:
    return (
        current_user.role.value
        if hasattr(current_user.role, "value")
        else str(current_user.role)
    )


def _check_management_access(current_user: User):
    allowed_roles = {"ADMIN", "HR"}

    if _get_user_role(current_user) not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only ADMIN or HR users can access audit logs.",
        )


@router.get(
    "",
    response_model=list[AuditLogResponse],
)
def list_audit_logs(
    user_id: int | None = None,
    action: str | None = None,
    module: str | None = None,
    entity_type: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_management_access(current_user)

    return get_audit_logs(
        db=db,
        user_id=user_id,
        action=action,
        module=module,
        entity_type=entity_type,
    )


@router.get(
    "/summary",
    response_model=AuditLogSummaryResponse,
)
def audit_log_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_management_access(current_user)

    return get_audit_log_summary(db)


@router.get(
    "/{audit_log_id}",
    response_model=AuditLogResponse,
)
def get_audit_log(
    audit_log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_management_access(current_user)

    audit_log = (
        db.query(AuditLog)
        .filter(AuditLog.id == audit_log_id)
        .first()
    )

    if audit_log is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit log not found.",
        )

    return audit_log