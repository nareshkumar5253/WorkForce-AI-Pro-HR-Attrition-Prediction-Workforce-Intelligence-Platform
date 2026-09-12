import os
import uuid

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.models.document import EmployeeDocument
from app.models.employee import Employee


UPLOAD_DIR = os.path.join(
    "uploads",
    "documents",
)

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".doc",
    ".docx",
    ".jpg",
    ".jpeg",
    ".png",
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def ensure_upload_directory():
    os.makedirs(
        UPLOAD_DIR,
        exist_ok=True,
    )


def validate_file_extension(filename: str):
    extension = os.path.splitext(filename)[1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported file type. "
                "Allowed: PDF, DOC, DOCX, JPG, JPEG, PNG."
            ),
        )

    return extension


def create_document(
    db: Session,
    employee_id: int,
    document_type: str,
    title: str,
    description: str | None,
    file: UploadFile,
):
    employee = (
        db.query(Employee)
        .filter(
            Employee.id == employee_id
        )
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found.",
        )

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="File name is required.",
        )

    extension = validate_file_extension(
        file.filename
    )

    ensure_upload_directory()

    file_content = file.file.read()

    file_size = len(file_content)

    if file_size == 0:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty.",
        )

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size cannot exceed 10 MB.",
        )

    unique_filename = (
        f"{uuid.uuid4().hex}{extension}"
    )

    file_path = os.path.join(
        UPLOAD_DIR,
        unique_filename,
    )

    with open(file_path, "wb") as buffer:
        buffer.write(file_content)

    document = EmployeeDocument(
        employee_id=employee_id,
        document_type=document_type.strip(),
        title=title.strip(),
        description=(
            description.strip()
            if description
            else None
        ),
        file_name=file.filename,
        file_path=file_path,
        file_type=(
            file.content_type
            or "application/octet-stream"
        ),
        file_size=file_size,
        is_active=True,
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return document
def get_all_documents(
    db: Session,
):
    return (
        db.query(EmployeeDocument)
        .filter(
            EmployeeDocument.is_active.is_(True)
        )
        .order_by(
            EmployeeDocument.created_at.desc()
        )
        .all()
    )


def get_employee_documents(
    db: Session,
    employee_id: int,
):
    return (
        db.query(EmployeeDocument)
        .filter(
            EmployeeDocument.employee_id == employee_id,
            EmployeeDocument.is_active.is_(True),
        )
        .order_by(
            EmployeeDocument.created_at.desc()
        )
        .all()
    )


def get_document_by_id(
    db: Session,
    document_id: int,
):
    document = (
        db.query(EmployeeDocument)
        .filter(
            EmployeeDocument.id == document_id,
            EmployeeDocument.is_active.is_(True),
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found.",
        )

    return document