from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    get_current_admin_hr_manager,
    get_current_admin_or_hr,
    get_current_user,
)
from app.models.user import User
from app.schemas.employee import (
    EmployeeCreate,
    EmployeePaginationResponse,
    EmployeeResponse,
    EmployeeUpdate,
)
from app.services.audit_log import create_audit_log
from app.services.employee_service import (
    create_employee,
    deactivate_employee,
    get_employee,
    get_employee_by_user_id,
    list_employees,
    update_employee,
)


router = APIRouter(
    prefix="/employees",
    tags=["Employees"],
)


# ============================================================
# CREATE EMPLOYEE
# ============================================================

@router.post(
    "",
    response_model=EmployeeResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_employee_endpoint(
    employee_data: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_admin_or_hr
    ),
):

    employee = create_employee(
        db,
        employee_data,
    )

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CREATE",
        module="EMPLOYEES",
        description=(
            f"Employee {employee.employee_code} "
            f"was created successfully."
        ),
        entity_type="EMPLOYEE",
        entity_id=employee.id,
    )

    return employee


# ============================================================
# ADVANCED SEARCH & FILTER EMPLOYEES
# ============================================================

@router.get(
    "",
    response_model=EmployeePaginationResponse,
)
def get_all_employees(
    search: str | None = Query(
        default=None,
        description=(
            "Search by first name, last name, "
            "full name, employee code, or phone"
        ),
    ),
    department_id: int | None = Query(
        default=None,
        gt=0,
        description="Filter by department ID",
    ),
    job_role_id: int | None = Query(
        default=None,
        gt=0,
        description="Filter by job role ID",
    ),
    employment_status: str | None = Query(
        default=None,
        description="Filter by employment status",
    ),
    city: str | None = Query(
        default=None,
        description="Filter by city",
    ),
    state: str | None = Query(
        default=None,
        description="Filter by state",
    ),
    gender: str | None = Query(
        default=None,
        description="Filter by gender",
    ),
    joining_date_from: date | None = Query(
        default=None,
        description="Filter employees joining on or after this date",
    ),
    joining_date_to: date | None = Query(
        default=None,
        description="Filter employees joining on or before this date",
    ),
    salary_min: float | None = Query(
        default=None,
        ge=0,
        description="Minimum salary",
    ),
    salary_max: float | None = Query(
        default=None,
        ge=0,
        description="Maximum salary",
    ),
    page: int = Query(
        default=1,
        ge=1,
        description="Page number",
    ),
    page_size: int = Query(
        default=20,
        ge=1,
        le=100,
        description="Number of employees per page",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_admin_hr_manager
    ),
):

    return list_employees(
        db=db,
        search=search,
        department_id=department_id,
        job_role_id=job_role_id,
        employment_status=employment_status,
        city=city,
        state=state,
        gender=gender,
        joining_date_from=joining_date_from,
        joining_date_to=joining_date_to,
        salary_min=salary_min,
        salary_max=salary_max,
        page=page,
        page_size=page_size,
    )


# ============================================================
# GET MY EMPLOYEE PROFILE
# ============================================================

@router.get(
    "/me",
    response_model=EmployeeResponse,
)
def get_my_employee_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    return get_employee_by_user_id(
        db,
        current_user.id,
    )


# ============================================================
# GET EMPLOYEE BY ID
# ============================================================

@router.get(
    "/{employee_id}",
    response_model=EmployeeResponse,
)
def get_employee_endpoint(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_admin_hr_manager
    ),
):

    return get_employee(
        db,
        employee_id,
    )


# ============================================================
# UPDATE EMPLOYEE
# ============================================================

@router.put(
    "/{employee_id}",
    response_model=EmployeeResponse,
)
def update_employee_endpoint(
    employee_id: int,
    employee_data: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_admin_or_hr
    ),
):

    employee = update_employee(
        db,
        employee_id,
        employee_data,
    )

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="UPDATE",
        module="EMPLOYEES",
        description=(
            f"Employee {employee.employee_code} "
            f"was updated successfully."
        ),
        entity_type="EMPLOYEE",
        entity_id=employee.id,
    )

    return employee


# ============================================================
# DEACTIVATE EMPLOYEE
# ============================================================

@router.delete(
    "/{employee_id}",
)
def deactivate_employee_endpoint(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_admin_or_hr
    ),
):

    employee = deactivate_employee(
        db,
        employee_id,
    )

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="DELETE",
        module="EMPLOYEES",
        description=(
            f"Employee {employee.employee_code} "
            f"was deactivated successfully."
        ),
        entity_type="EMPLOYEE",
        entity_id=employee.id,
    )

    return {
        "message": "Employee deactivated successfully",
        "employee_id": employee_id,
    }