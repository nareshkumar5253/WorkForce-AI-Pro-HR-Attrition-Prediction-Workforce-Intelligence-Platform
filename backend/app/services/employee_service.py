from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.department import Department
from app.models.employee import Employee
from app.models.role import JobRole
from app.models.user import User
from app.schemas.employee import EmployeeCreate, EmployeeUpdate


def create_employee(
    db: Session,
    employee_data: EmployeeCreate,
) -> Employee:

    # Check user
    user = db.query(User).filter(
        User.id == employee_data.user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Check whether user already has employee profile
    existing_employee = db.query(Employee).filter(
        Employee.user_id == employee_data.user_id
    ).first()

    if existing_employee:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Employee profile already exists for this user",
        )

    # Check employee code
    existing_code = db.query(Employee).filter(
        Employee.employee_code == employee_data.employee_code
    ).first()

    if existing_code:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Employee code already exists",
        )

    # Check department
    department = db.query(Department).filter(
        Department.id == employee_data.department_id
    ).first()

    if department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    if not department.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department is inactive",
        )

    # Check job role
    job_role = db.query(JobRole).filter(
        JobRole.id == employee_data.job_role_id
    ).first()

    if job_role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job role not found",
        )

    if not job_role.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job role is inactive",
        )

    # Check manager if provided
    if employee_data.manager_id is not None:

        manager = db.query(Employee).filter(
            Employee.id == employee_data.manager_id
        ).first()

        if manager is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Manager employee not found",
            )

        if manager.employment_status.value != "ACTIVE":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Manager is not an active employee",
            )

    employee = Employee(
        user_id=employee_data.user_id,
        employee_code=employee_data.employee_code.upper(),
        first_name=employee_data.first_name,
        last_name=employee_data.last_name,
        phone=employee_data.phone,
        date_of_birth=employee_data.date_of_birth,
        gender=employee_data.gender,
        address=employee_data.address,
        city=employee_data.city,
        state=employee_data.state,
        country=employee_data.country,
        joining_date=employee_data.joining_date,
        department_id=employee_data.department_id,
        job_role_id=employee_data.job_role_id,
        manager_id=employee_data.manager_id,
        salary=employee_data.salary,
        employment_status=employee_data.employment_status,
    )

    db.add(employee)
    db.commit()
    db.refresh(employee)

    return employee


def get_employee(
    db: Session,
    employee_id: int,
) -> Employee:

    employee = db.query(Employee).filter(
        Employee.id == employee_id
    ).first()

    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    return employee


def get_employee_by_user_id(
    db: Session,
    user_id: int,
) -> Employee:

    employee = db.query(Employee).filter(
        Employee.user_id == user_id
    ).first()

    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee profile not found",
        )

    return employee


# ============================================================
# LIST / ADVANCED SEARCH EMPLOYEES
# ============================================================

def list_employees(
    db: Session,
    search: str | None = None,
    department_id: int | None = None,
    job_role_id: int | None = None,
    employment_status: str | None = None,
    city: str | None = None,
    state: str | None = None,
    gender: str | None = None,
    joining_date_from: date | None = None,
    joining_date_to: date | None = None,
    salary_min: float | None = None,
    salary_max: float | None = None,
    page: int = 1,
    page_size: int = 20,
):

    # --------------------------------------------------------
    # Validate pagination
    # --------------------------------------------------------

    if page < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Page must be greater than or equal to 1",
        )

    if page_size < 1 or page_size > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Page size must be between 1 and 100",
        )

    # --------------------------------------------------------
    # Validate date range
    # --------------------------------------------------------

    if (
        joining_date_from is not None
        and joining_date_to is not None
        and joining_date_from > joining_date_to
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="joining_date_from cannot be later than joining_date_to",
        )

    # --------------------------------------------------------
    # Validate salary range
    # --------------------------------------------------------

    if (
        salary_min is not None
        and salary_max is not None
        and salary_min > salary_max
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="salary_min cannot be greater than salary_max",
        )

    # --------------------------------------------------------
    # Base query
    # --------------------------------------------------------

    query = db.query(Employee)

    # --------------------------------------------------------
    # General search
    # --------------------------------------------------------

    if search:
        search_value = f"%{search.strip()}%"

        query = query.filter(
            (Employee.first_name.ilike(search_value))
            | (Employee.last_name.ilike(search_value))
            | (
                (
                    Employee.first_name
                    + " "
                    + Employee.last_name
                ).ilike(search_value)
            )
            | (Employee.employee_code.ilike(search_value))
            | (Employee.phone.ilike(search_value))
        )

    # --------------------------------------------------------
    # Department filter
    # --------------------------------------------------------

    if department_id is not None:
        query = query.filter(
            Employee.department_id == department_id
        )

    # --------------------------------------------------------
    # Job role filter
    # --------------------------------------------------------

    if job_role_id is not None:
        query = query.filter(
            Employee.job_role_id == job_role_id
        )

    # --------------------------------------------------------
    # Employment status filter
    # --------------------------------------------------------

    if employment_status is not None:
        query = query.filter(
            Employee.employment_status == employment_status
        )

    # --------------------------------------------------------
    # City filter
    # --------------------------------------------------------

    if city:
        query = query.filter(
            Employee.city.ilike(
                f"%{city.strip()}%"
            )
        )

    # --------------------------------------------------------
    # State filter
    # --------------------------------------------------------

    if state:
        query = query.filter(
            Employee.state.ilike(
                f"%{state.strip()}%"
            )
        )

    # --------------------------------------------------------
    # Gender filter
    # --------------------------------------------------------

    if gender:
        query = query.filter(
            Employee.gender.ilike(
                f"%{gender.strip()}%"
            )
        )

    # --------------------------------------------------------
    # Joining date range
    # --------------------------------------------------------

    if joining_date_from is not None:
        query = query.filter(
            Employee.joining_date >= joining_date_from
        )

    if joining_date_to is not None:
        query = query.filter(
            Employee.joining_date <= joining_date_to
        )

    # --------------------------------------------------------
    # Salary range
    # --------------------------------------------------------

    if salary_min is not None:
        query = query.filter(
            Employee.salary >= salary_min
        )

    if salary_max is not None:
        query = query.filter(
            Employee.salary <= salary_max
        )

    # --------------------------------------------------------
    # Total records BEFORE pagination
    # --------------------------------------------------------

    total = query.count()

    # --------------------------------------------------------
    # Pagination
    # --------------------------------------------------------

    offset = (page - 1) * page_size

    employees = (
        query
        .order_by(Employee.id.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    # --------------------------------------------------------
    # Pagination metadata
    # --------------------------------------------------------

    total_pages = (
        (total + page_size - 1) // page_size
        if total > 0
        else 0
    )

    return {
        "items": employees,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def update_employee(
    db: Session,
    employee_id: int,
    employee_data: EmployeeUpdate,
) -> Employee:

    employee = get_employee(
        db,
        employee_id,
    )

    update_data = employee_data.model_dump(
        exclude_unset=True
    )

    # Validate department
    if "department_id" in update_data:

        department = db.query(Department).filter(
            Department.id == update_data["department_id"]
        ).first()

        if department is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found",
            )

        if not department.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Department is inactive",
            )

    # Validate job role
    if "job_role_id" in update_data:

        job_role = db.query(JobRole).filter(
            JobRole.id == update_data["job_role_id"]
        ).first()

        if job_role is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job role not found",
            )

        if not job_role.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job role is inactive",
            )

    # Validate manager
    if "manager_id" in update_data:

        manager_id = update_data["manager_id"]

        if manager_id is not None:

            if manager_id == employee_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Employee cannot be their own manager",
                )

            manager = db.query(Employee).filter(
                Employee.id == manager_id
            ).first()

            if manager is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Manager employee not found",
                )

    for field, value in update_data.items():
        setattr(employee, field, value)

    db.commit()
    db.refresh(employee)

    return employee


def deactivate_employee(
    db: Session,
    employee_id: int,
) -> Employee:

    employee = get_employee(
        db,
        employee_id,
    )

    employee.employment_status = "TERMINATED"

    db.commit()
    db.refresh(employee)

    return employee