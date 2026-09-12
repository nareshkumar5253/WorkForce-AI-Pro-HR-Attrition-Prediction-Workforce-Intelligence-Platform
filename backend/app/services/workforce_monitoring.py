from datetime import datetime

from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.employee import Employee
from app.models.prediction import AttritionPrediction
from app.models.workforce_monitor import WorkforceMonitor, WorkforceStatus
from app.ai.risk_engine import calculate_risk_level


def get_employee_status(
    db: Session,
    employee: Employee,
) -> str:
    """
    Determine the employee's current workforce status
    using today's attendance record.
    """

    today = datetime.utcnow().date()

    attendance = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == employee.id,
            Attendance.attendance_date == today,
        )
        .order_by(Attendance.id.desc())
        .first()
    )

    if attendance is None:
        return WorkforceStatus.OFFLINE

    if attendance.check_out is not None:
        return WorkforceStatus.OFFLINE

    if attendance.check_in is None:
        return WorkforceStatus.ABSENT

    if attendance.status == "LATE":
        return WorkforceStatus.LATE

    return WorkforceStatus.PRESENT


def get_latest_prediction(
    db: Session,
    employee_id: int,
):
    return (
        db.query(AttritionPrediction)
        .filter(
            AttritionPrediction.employee_id == employee_id
        )
        .order_by(AttritionPrediction.created_at.desc())
        .first()
    )


def build_live_employee_status(
    db: Session,
    employee: Employee,
) -> dict:
    """
    Build the live workforce monitoring information
    for a single employee.
    """

    status = get_employee_status(db, employee)

    attendance = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == employee.id,
            Attendance.attendance_date == datetime.utcnow().date(),
        )
        .order_by(Attendance.id.desc())
        .first()
    )

    prediction = get_latest_prediction(
        db,
        employee.id,
    )

    attrition_probability = None
    risk_level = None

    if prediction:
        attrition_probability = round(
            float(prediction.attrition_probability),
            2,
        )

        risk_level = calculate_risk_level(
            attrition_probability
        )

    return {
        "employee_id": employee.id,
        "employee_name": (
            f"{employee.first_name} {employee.last_name}"
        ),
        "status": status,
        "check_in_time": (
            attendance.check_in
            if attendance
            else None
        ),
        "check_out_time": (
            attendance.check_out
            if attendance
            else None
        ),
        "last_activity": (
            attendance.updated_at
            if attendance
            else None
        ),
        "attrition_probability": attrition_probability,
        "risk_level": risk_level,
    }


def get_live_workforce(
    db: Session,
) -> list[dict]:
    """
    Return live monitoring information
    for all active employees.
    """

    employees = (
        db.query(Employee)
        .filter(
            Employee.employment_status == "ACTIVE"
        )
        .order_by(Employee.id)
        .all()
    )

    return [
        build_live_employee_status(
            db,
            employee,
        )
        for employee in employees
    ]


def get_workforce_summary(
    db: Session,
) -> dict:
    """
    Generate real-time workforce statistics.
    """

    employees = (
        db.query(Employee)
        .filter(
            Employee.employment_status == "ACTIVE"
        )
        .all()
    )

    total_employees = len(employees)

    summary = {
        "total_employees": total_employees,
        "active": 0,
        "present": 0,
        "late": 0,
        "absent": 0,
        "on_leave": 0,
        "offline": 0,
        "high_risk": 0,
        "critical_risk": 0,
    }

    for employee in employees:
        data = build_live_employee_status(
            db,
            employee,
        )

        status = data["status"]
        risk_level = data["risk_level"]

        if status == WorkforceStatus.PRESENT:
            summary["present"] += 1
            summary["active"] += 1

        elif status == WorkforceStatus.LATE:
            summary["late"] += 1
            summary["active"] += 1

        elif status == WorkforceStatus.ABSENT:
            summary["absent"] += 1

        elif status == WorkforceStatus.ON_LEAVE:
            summary["on_leave"] += 1

        elif status == WorkforceStatus.OFFLINE:
            summary["offline"] += 1

        if risk_level == "HIGH":
            summary["high_risk"] += 1

        elif risk_level == "CRITICAL":
            summary["critical_risk"] += 1

    return summary