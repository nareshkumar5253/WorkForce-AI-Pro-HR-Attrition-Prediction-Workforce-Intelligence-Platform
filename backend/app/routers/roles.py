from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    get_current_admin_or_hr,
)
from app.models.role import JobRole
from app.schemas.role import (
    JobRoleCreate,
    JobRoleResponse,
    JobRoleUpdate,
)


router = APIRouter(
    prefix="/job-roles",
    tags=["Job Roles"],
)


@router.post(
    "",
    response_model=JobRoleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_job_role(
    role_data: JobRoleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_hr),
):

    existing_code = db.query(JobRole).filter(
        JobRole.code == role_data.code
    ).first()

    if existing_code:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Job role code already exists",
        )

    job_role = JobRole(
        title=role_data.title,
        code=role_data.code.upper(),
        description=role_data.description,
        level=role_data.level,
    )

    db.add(job_role)
    db.commit()
    db.refresh(job_role)

    return job_role


@router.get(
    "",
    response_model=list[JobRoleResponse],
)
def get_job_roles(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_hr),
):

    return db.query(JobRole).order_by(
        JobRole.id.asc()
    ).all()


@router.get(
    "/{role_id}",
    response_model=JobRoleResponse,
)
def get_job_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_hr),
):

    job_role = db.query(JobRole).filter(
        JobRole.id == role_id
    ).first()

    if job_role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job role not found",
        )

    return job_role


@router.put(
    "/{role_id}",
    response_model=JobRoleResponse,
)
def update_job_role(
    role_id: int,
    role_data: JobRoleUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_hr),
):

    job_role = db.query(JobRole).filter(
        JobRole.id == role_id
    ).first()

    if job_role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job role not found",
        )

    update_data = role_data.model_dump(
        exclude_unset=True
    )

    if "code" in update_data:
        update_data["code"] = update_data["code"].upper()

        existing_code = db.query(JobRole).filter(
            JobRole.code == update_data["code"],
            JobRole.id != role_id,
        ).first()

        if existing_code:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Job role code already exists",
            )

    for field, value in update_data.items():
        setattr(job_role, field, value)

    db.commit()
    db.refresh(job_role)

    return job_role


@router.delete(
    "/{role_id}",
)
def delete_job_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_hr),
):

    job_role = db.query(JobRole).filter(
        JobRole.id == role_id
    ).first()

    if job_role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job role not found",
        )

    job_role.is_active = False

    db.commit()

    return {
        "message": "Job role deactivated successfully",
        "role_id": role_id,
    }