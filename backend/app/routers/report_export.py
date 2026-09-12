from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User

from app.services.report_export import (
    export_workforce_report,
    export_attendance_report,
    export_leave_report,
    export_payroll_report,
    export_attrition_report,
)


router = APIRouter(
    prefix="/reports/export",
    tags=["Reports & Export"],
)


def check_management_access(current_user: User):
    role = (
        current_user.role.value
        if hasattr(current_user.role, "value")
        else str(current_user.role)
    )

    if role not in {"ADMIN", "HR"}:
        raise HTTPException(
            status_code=403,
            detail="Only ADMIN or HR users can export reports.",
        )


def create_download_response(
    file_data,
    filename: str,
    media_type: str,
):
    return StreamingResponse(
        file_data,
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        },
    )


@router.get("/workforce")
def export_workforce(
    format: str = "csv",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_management_access(current_user)

    try:
        file_data, filename, media_type = export_workforce_report(
            db,
            format,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    return create_download_response(
        file_data,
        filename,
        media_type,
    )


@router.get("/attendance")
def export_attendance(
    format: str = "csv",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_management_access(current_user)

    try:
        file_data, filename, media_type = export_attendance_report(
            db,
            format,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    return create_download_response(
        file_data,
        filename,
        media_type,
    )


@router.get("/leave")
def export_leave(
    format: str = "csv",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_management_access(current_user)

    try:
        file_data, filename, media_type = export_leave_report(
            db,
            format,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    return create_download_response(
        file_data,
        filename,
        media_type,
    )


@router.get("/payroll")
def export_payroll(
    format: str = "csv",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_management_access(current_user)

    try:
        file_data, filename, media_type = export_payroll_report(
            db,
            format,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    return create_download_response(
        file_data,
        filename,
        media_type,
    )


@router.get("/attrition")
def export_attrition(
    format: str = "csv",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_management_access(current_user)

    try:
        file_data, filename, media_type = export_attrition_report(
            db,
            format,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    return create_download_response(
        file_data,
        filename,
        media_type,
    )