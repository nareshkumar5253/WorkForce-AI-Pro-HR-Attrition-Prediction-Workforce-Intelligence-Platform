from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.models.department import Department
from app.utils.enums import EmploymentStatus
from app.models.department import Department
from app.models.role import JobRole

def get_employee_summary(db: Session):
    total_employees = (
        db.query(func.count(Employee.id))
        .scalar()
        or 0
    )

    active_employees = (
        db.query(func.count(Employee.id))
        .filter(
            Employee.employment_status == EmploymentStatus.ACTIVE
        )
        .scalar()
        or 0
    )

    on_leave_employees = (
        db.query(func.count(Employee.id))
        .filter(
            Employee.employment_status == EmploymentStatus.ON_LEAVE
        )
        .scalar()
        or 0
    )

    resigned_employees = (
        db.query(func.count(Employee.id))
        .filter(
            Employee.employment_status == EmploymentStatus.RESIGNED
        )
        .scalar()
        or 0
    )

    terminated_employees = (
        db.query(func.count(Employee.id))
        .filter(
            Employee.employment_status == EmploymentStatus.TERMINATED
        )
        .scalar()
        or 0
    )

    retired_employees = (
        db.query(func.count(Employee.id))
        .filter(
            Employee.employment_status == EmploymentStatus.RETIRED
        )
        .scalar()
        or 0
    )

    return {
        "total_employees": total_employees,
        "active_employees": active_employees,
        "on_leave_employees": on_leave_employees,
        "resigned_employees": resigned_employees,
        "terminated_employees": terminated_employees,
        "retired_employees": retired_employees,
    }


def get_department_wise_employees(db: Session):
    results = (
        db.query(
            Department.id.label("department_id"),
            Department.name.label("department_name"),
            func.count(Employee.id).label("employee_count"),
        )
        .outerjoin(
            Employee,
            Employee.department_id == Department.id,
        )
        .group_by(
            Department.id,
            Department.name,
        )
        .order_by(
            Department.name.asc()
        )
        .all()
    )

    return [
        {
            "department_id": row.department_id,
            "department_name": row.department_name,
            "employee_count": row.employee_count,
        }
        for row in results
    ]


def get_employment_status_summary(db: Session):
    results = (
        db.query(
            Employee.employment_status,
            func.count(Employee.id).label("employee_count"),
        )
        .group_by(
            Employee.employment_status
        )
        .all()
    )

    status_counts = {
        status.value: 0
        for status in EmploymentStatus
    }

    for row in results:
        status_counts[row.employment_status.value] = row.employee_count

    return status_counts

def get_role_wise_employees(db: Session):
    results = (
        db.query(
            JobRole.id.label("role_id"),
            JobRole.title.label("role_title"),
            func.count(Employee.id).label("employee_count"),
        )
        .outerjoin(
            Employee,
            Employee.job_role_id == JobRole.id,
        )
        .group_by(
            JobRole.id,
            JobRole.title,
        )
        .order_by(
            JobRole.title.asc()
        )
        .all()
    )

    return [
        {
            "role_id": row.role_id,
            "role_title": row.role_title,
            "employee_count": row.employee_count,
        }
        for row in results
    ]
def get_workforce_joining_attrition_trend(db: Session):
    joining_results = (
        db.query(
            func.year(Employee.joining_date).label("year"),
            func.month(Employee.joining_date).label("month"),
            func.count(Employee.id).label("joined_count"),
        )
        .group_by(
            func.year(Employee.joining_date),
            func.month(Employee.joining_date),
        )
        .order_by(
            func.year(Employee.joining_date),
            func.month(Employee.joining_date),
        )
        .all()
    )

    attrition_dates = []

    resigned_results = (
        db.query(
            Employee.resignation_date
        )
        .filter(
            Employee.resignation_date.isnot(None)
        )
        .all()
    )

    terminated_results = (
        db.query(
            Employee.termination_date
        )
        .filter(
            Employee.termination_date.isnot(None)
        )
        .all()
    )

    for row in resigned_results:
        attrition_dates.append(row.resignation_date)

    for row in terminated_results:
        attrition_dates.append(row.termination_date)

    attrition_map = {}

    for attrition_date in attrition_dates:
        key = (
            attrition_date.year,
            attrition_date.month,
        )

        attrition_map[key] = (
            attrition_map.get(key, 0) + 1
        )

    trend = []

    joining_map = {
        (row.year, row.month): row.joined_count
        for row in joining_results
    }

    all_keys = set(joining_map.keys()) | set(attrition_map.keys())

    for year, month in sorted(all_keys):
        trend.append(
            {
                "year": year,
                "month": month,
                "joined": joining_map.get(
                    (year, month),
                    0,
                ),
                "attrition": attrition_map.get(
                    (year, month),
                    0,
                ),
            }
        )

    return trend