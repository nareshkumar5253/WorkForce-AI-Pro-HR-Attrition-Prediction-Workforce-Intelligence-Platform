from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.utils.enums import EmploymentStatus


# ============================================================
# DEPARTMENT RESPONSE
# ============================================================

class DepartmentResponse(BaseModel):
    id: int
    name: str
    code: str
    description: str | None = None
    is_active: bool
    created_at: object
    updated_at: object

    model_config = ConfigDict(
        from_attributes=True,
    )


# ============================================================
# JOB ROLE RESPONSE
# ============================================================

class JobRoleResponse(BaseModel):
    id: int
    title: str
    code: str
    description: str | None = None
    level: str | None = None
    is_active: bool
    created_at: object
    updated_at: object

    model_config = ConfigDict(
        from_attributes=True,
    )


# ============================================================
# MANAGER RESPONSE
# ============================================================

class ManagerResponse(BaseModel):
    id: int
    employee_code: str
    first_name: str
    last_name: str

    model_config = ConfigDict(
        from_attributes=True,
    )


# ============================================================
# EMPLOYEE CREATE
# ============================================================

class EmployeeCreate(BaseModel):
    user_id: int = Field(..., gt=0)

    employee_code: str = Field(
        ...,
        min_length=2,
        max_length=30,
    )

    first_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    last_name: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    phone: str | None = Field(
        default=None,
        max_length=20,
    )

    date_of_birth: date | None = None

    gender: str | None = Field(
        default=None,
        max_length=20,
    )

    address: str | None = Field(
        default=None,
        max_length=500,
    )

    city: str | None = Field(
        default=None,
        max_length=100,
    )

    state: str | None = Field(
        default=None,
        max_length=100,
    )

    country: str | None = Field(
        default=None,
        max_length=100,
    )

    joining_date: date

    department_id: int = Field(
        ...,
        gt=0,
    )

    job_role_id: int = Field(
        ...,
        gt=0,
    )

    manager_id: int | None = Field(
        default=None,
        gt=0,
    )

    salary: Decimal | None = Field(
        default=None,
        ge=0,
    )

    employment_status: EmploymentStatus = EmploymentStatus.ACTIVE


# ============================================================
# EMPLOYEE UPDATE
# ============================================================

class EmployeeUpdate(BaseModel):
    first_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    last_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    phone: str | None = Field(
        default=None,
        max_length=20,
    )

    date_of_birth: date | None = None

    gender: str | None = Field(
        default=None,
        max_length=20,
    )

    address: str | None = Field(
        default=None,
        max_length=500,
    )

    city: str | None = Field(
        default=None,
        max_length=100,
    )

    state: str | None = Field(
        default=None,
        max_length=100,
    )

    country: str | None = Field(
        default=None,
        max_length=100,
    )

    joining_date: date | None = None

    department_id: int | None = Field(
        default=None,
        gt=0,
    )

    job_role_id: int | None = Field(
        default=None,
        gt=0,
    )

    manager_id: int | None = Field(
        default=None,
        gt=0,
    )

    salary: Decimal | None = Field(
        default=None,
        ge=0,
    )

    employment_status: EmploymentStatus | None = None


# ============================================================
# EMPLOYEE RESPONSE
# ============================================================

class EmployeeResponse(BaseModel):
    id: int
    employee_code: str
    user_id: int

    first_name: str
    last_name: str

    phone: str | None
    date_of_birth: date | None
    gender: str | None

    address: str | None
    city: str | None
    state: str | None
    country: str | None

    joining_date: date

    department_id: int
    job_role_id: int
    manager_id: int | None

    # Related objects
    department: DepartmentResponse | None = None
    job_role: JobRoleResponse | None = None
    manager: ManagerResponse | None = None

    salary: Decimal | None

    employment_status: EmploymentStatus

    resignation_date: date | None
    termination_date: date | None

    created_at: object
    updated_at: object

    model_config = ConfigDict(
        from_attributes=True,
    )


# ============================================================
# EMPLOYEE PAGINATION RESPONSE
# ============================================================

class EmployeePaginationResponse(BaseModel):
    items: list[EmployeeResponse]

    total: int
    page: int
    page_size: int
    total_pages: int