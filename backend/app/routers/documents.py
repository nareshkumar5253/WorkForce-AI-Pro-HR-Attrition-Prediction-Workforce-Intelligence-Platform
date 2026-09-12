from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    get_current_admin_or_hr,
    get_current_user,
)
from app.models.employee import Employee
from app.models.user import User
from app.schemas.document import DocumentResponse
from app.services.document_service import (
    create_document,
    get_all_documents,
    get_employee_documents,
    get_document_by_id,
)


router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)


@router.post(
    "/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
def upload_document(
    employee_id: int = Form(...),
    document_type: str = Form(...),
    title: str = Form(...),
    description: str | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = (
        db.query(Employee)
        .filter(
            Employee.id == employee_id
        )
        .first()
    )

    if not employee:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=404,
            detail="Employee not found.",
        )

    # Employee can upload only their own documents.
    if current_user.role.value == "EMPLOYEE":
        if employee.user_id != current_user.id:
            from fastapi import HTTPException

            raise HTTPException(
                status_code=403,
                detail="You can only upload documents for yourself.",
            )

    return create_document(
        db=db,
        employee_id=employee_id,
        document_type=document_type,
        title=title,
        description=description,
        file=file,
    )
@router.get(
    "",
    response_model=list[DocumentResponse],
)
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value in {"ADMIN", "HR"}:
        return get_all_documents(db)

    employee = (
        db.query(Employee)
        .filter(
            Employee.user_id == current_user.id
        )
        .first()
    )

    if not employee:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=404,
            detail="Employee profile not found.",
        )

    return get_employee_documents(
        db,
        employee.id,
    )


@router.get(
    "/my",
    response_model=list[DocumentResponse],
)
def list_my_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = (
        db.query(Employee)
        .filter(
            Employee.user_id == current_user.id
        )
        .first()
    )

    if not employee:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=404,
            detail="Employee profile not found.",
        )

    return get_employee_documents(
        db,
        employee.id,
    )


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = get_document_by_id(
        db,
        document_id,
    )

    if current_user.role.value in {"ADMIN", "HR"}:
        return document

    employee = (
        db.query(Employee)
        .filter(
            Employee.user_id == current_user.id
        )
        .first()
    )

    if not employee or document.employee_id != employee.id:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=403,
            detail="You do not have access to this document.",
        )

    return document