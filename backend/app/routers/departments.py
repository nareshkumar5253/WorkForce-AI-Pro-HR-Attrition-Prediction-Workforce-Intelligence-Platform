from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    get_current_admin_or_hr,
)
from app.models.department import Department
from app.schemas.department import (
    DepartmentCreate,
    DepartmentResponse,
    DepartmentUpdate,
)


router = APIRouter(
    prefix="/departments",
    tags=["Departments"],
)


@router.post(
    "",
    response_model=DepartmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_department(
    department_data: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_hr),
):

    existing_name = db.query(Department).filter(
        Department.name == department_data.name
    ).first()

    if existing_name:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Department name already exists",
        )

    existing_code = db.query(Department).filter(
        Department.code == department_data.code
    ).first()

    if existing_code:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Department code already exists",
        )

    department = Department(
        name=department_data.name,
        code=department_data.code.upper(),
        description=department_data.description,
    )

    db.add(department)
    db.commit()
    db.refresh(department)

    return department


@router.get(
    "",
    response_model=list[DepartmentResponse],
)
def get_departments(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_hr),
):

    return db.query(Department).order_by(
        Department.id.asc()
    ).all()


@router.get(
    "/{department_id}",
    response_model=DepartmentResponse,
)
def get_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_hr),
):

    department = db.query(Department).filter(
        Department.id == department_id
    ).first()

    if department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    return department


@router.put(
    "/{department_id}",
    response_model=DepartmentResponse,
)
def update_department(
    department_id: int,
    department_data: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_hr),
):

    department = db.query(Department).filter(
        Department.id == department_id
    ).first()

    if department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    update_data = department_data.model_dump(
        exclude_unset=True
    )

    if "name" in update_data:
        existing_name = db.query(Department).filter(
            Department.name == update_data["name"],
            Department.id != department_id,
        ).first()

        if existing_name:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Department name already exists",
            )

    if "code" in update_data:
        update_data["code"] = update_data["code"].upper()

        existing_code = db.query(Department).filter(
            Department.code == update_data["code"],
            Department.id != department_id,
        ).first()

        if existing_code:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Department code already exists",
            )

    for field, value in update_data.items():
        setattr(department, field, value)

    db.commit()
    db.refresh(department)

    return department


@router.delete(
    "/{department_id}",
)
def delete_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_hr),
):

    department = db.query(Department).filter(
        Department.id == department_id
    ).first()

    if department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    department.is_active = False

    db.commit()

    return {
        "message": "Department deactivated successfully",
        "department_id": department_id,
    }