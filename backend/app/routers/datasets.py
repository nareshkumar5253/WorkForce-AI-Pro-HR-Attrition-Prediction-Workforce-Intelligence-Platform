import json
import os
import uuid

import pandas as pd
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.dataset import Dataset
from app.models.user import User, UserRole
from app.schemas.dataset import (
    DatasetResponse,
    DatasetStatusResponse,
)


router = APIRouter(
    prefix="/datasets",
    tags=["Datasets"],
)


UPLOAD_DIR = "uploads/datasets"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {".csv"}


def require_admin_or_hr(current_user: User):
    if current_user.role not in [
        UserRole.ADMIN,
        UserRole.HR,
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only ADMIN or HR users can manage datasets.",
        )


def get_dataset_or_404(
    dataset_id: int,
    db: Session,
):
    dataset = (
        db.query(Dataset)
        .filter(Dataset.id == dataset_id)
        .first()
    )

    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found.",
        )

    return dataset


@router.post(
    "/upload",
    response_model=DatasetResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_dataset(
    name: str = Form(...),
    description: str | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin_or_hr(current_user)

    # Validate filename
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required.",
        )

    extension = os.path.splitext(
        file.filename
    )[1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are allowed.",
        )

    # Read file
    file_content = await file.read()

    if not file_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size cannot exceed 10 MB.",
        )

    # Validate CSV
    temp_file_path = None

    try:
        os.makedirs(
            UPLOAD_DIR,
            exist_ok=True,
        )

        unique_filename = (
            f"{uuid.uuid4().hex}{extension}"
        )

        temp_file_path = os.path.join(
            UPLOAD_DIR,
            unique_filename,
        )

        with open(
            temp_file_path,
            "wb",
        ) as output_file:
            output_file.write(file_content)

        dataframe = pd.read_csv(
            temp_file_path
        )

    except Exception as exc:
        if temp_file_path and os.path.exists(
            temp_file_path
        ):
            os.remove(temp_file_path)

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid CSV file: {str(exc)}",
        )

    # Validate columns
    if dataframe.empty:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file does not contain any data rows.",
        )

    if len(dataframe.columns) == 0:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file does not contain columns.",
        )

    columns_json = json.dumps(
        dataframe.columns.tolist()
    )

    dataset = Dataset(
        name=name.strip(),
        description=description,
        file_name=file.filename,
        file_path=temp_file_path,
        file_type="text/csv",
        file_size=len(file_content),
        row_count=len(dataframe),
        column_count=len(dataframe.columns),
        columns=columns_json,
        is_active=True,
        uploaded_by=current_user.id,
    )

    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    return dataset


@router.get(
    "",
    response_model=list[DatasetResponse],
)
def list_datasets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    datasets = (
        db.query(Dataset)
        .order_by(
            Dataset.created_at.desc()
        )
        .all()
    )

    return datasets


@router.get(
    "/{dataset_id}",
    response_model=DatasetResponse,
)
def get_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_dataset_or_404(
        dataset_id,
        db,
    )


@router.put(
    "/{dataset_id}",
    response_model=DatasetResponse,
)
def update_dataset(
    dataset_id: int,
    name: str | None = Form(None),
    description: str | None = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin_or_hr(current_user)

    dataset = get_dataset_or_404(
        dataset_id,
        db,
    )

    if name is not None:
        name = name.strip()

        if not name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Dataset name cannot be empty.",
            )

        dataset.name = name

    if description is not None:
        dataset.description = description

    db.commit()
    db.refresh(dataset)

    return dataset


@router.post(
    "/{dataset_id}/activate",
    response_model=DatasetStatusResponse,
)
def activate_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin_or_hr(current_user)

    dataset = get_dataset_or_404(
        dataset_id,
        db,
    )

    dataset.is_active = True

    db.commit()
    db.refresh(dataset)

    return dataset


@router.post(
    "/{dataset_id}/deactivate",
    response_model=DatasetStatusResponse,
)
def deactivate_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin_or_hr(current_user)

    dataset = get_dataset_or_404(
        dataset_id,
        db,
    )

    dataset.is_active = False

    db.commit()
    db.refresh(dataset)

    return dataset


@router.delete(
    "/{dataset_id}",
)
def delete_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin_or_hr(current_user)

    dataset = get_dataset_or_404(
        dataset_id,
        db,
    )

    # Delete physical file
    if dataset.file_path and os.path.exists(
        dataset.file_path
    ):
        os.remove(dataset.file_path)

    db.delete(dataset)
    db.commit()

    return {
        "message": "Dataset deleted successfully.",
        "dataset_id": dataset_id,
    }