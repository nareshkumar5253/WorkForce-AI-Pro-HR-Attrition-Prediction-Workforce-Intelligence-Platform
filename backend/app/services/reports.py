from datetime import datetime

from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.models.attendance import Attendance
from app.models.leave import LeaveRequest
from app.models.payroll import Payroll
from app.models.prediction import AttritionPrediction
from app.models.intervention import HRIntervention
from app.models.alert import HRAlert


def generate_workforce_report(db: Session) -> dict:
    employees = db.query(Employee).all()

    active = sum(1 for e in employees if e.employment_status == "ACTIVE")
    on_leave = sum(1 for e in employees if e.employment_status == "ON_LEAVE")
    resigned = sum(1 for e in employees if e.employment_status == "RESIGNED")
    terminated = sum(1 for e in employees if e.employment_status == "TERMINATED")

    department_data = {}

    for employee in employees:
        department_id = employee.department_id

        if department_id not in department_data:
            department_data[department_id] = {
                "department_id": department_id,
                "total_employees": 0,
                "active_employees": 0,
            }

        department_data[department_id]["total_employees"] += 1

        if employee.employment_status == "ACTIVE":
            department_data[department_id]["active_employees"] += 1

    return {
        "report_type": "WORKFORCE",
        "generated_at": datetime.utcnow().isoformat(),
        "total_employees": len(employees),
        "active_employees": active,
        "on_leave": on_leave,
        "resigned": resigned,
        "terminated": terminated,
        "departments": list(department_data.values()),
    }


def generate_attendance_report(db: Session) -> dict:
    records = db.query(Attendance).all()

    total_records = len(records)

    present_days = sum(
        1 for record in records if record.status == "PRESENT"
    )

    late_days = sum(
        1 for record in records if record.status == "LATE"
    )

    half_days = sum(
        1 for record in records if record.status == "HALF_DAY"
    )

    absent_days = sum(
        1 for record in records if record.status == "ABSENT"
    )

    attendance_percentage = 0.0

    if total_records > 0:
        attendance_percentage = round(
            (
                present_days
                + late_days
                + (half_days * 0.5)
            )
            / total_records
            * 100,
            2,
        )

    return {
        "report_type": "ATTENDANCE",
        "generated_at": datetime.utcnow().isoformat(),
        "total_records": total_records,
        "present_days": present_days,
        "late_days": late_days,
        "half_days": half_days,
        "absent_days": absent_days,
        "attendance_percentage": attendance_percentage,
    }


def generate_leave_report(db: Session) -> dict:
    leaves = db.query(LeaveRequest).all()

    def get_status(leave):
        return (
            leave.status.value
            if hasattr(leave.status, "value")
            else str(leave.status)
        )

    return {
        "report_type": "LEAVE",
        "generated_at": datetime.utcnow().isoformat(),
        "total_requests": len(leaves),
        "pending": sum(1 for leave in leaves if get_status(leave) == "PENDING"),
        "approved": sum(1 for leave in leaves if get_status(leave) == "APPROVED"),
        "rejected": sum(1 for leave in leaves if get_status(leave) == "REJECTED"),
        "cancelled": sum(1 for leave in leaves if get_status(leave) == "CANCELLED"),
    }


def generate_payroll_report(db: Session) -> dict:
    payrolls = db.query(Payroll).all()

    total_gross = sum(
        float(payroll.gross_salary or 0)
        for payroll in payrolls
    )

    total_net = sum(
        float(payroll.net_salary or 0)
        for payroll in payrolls
    )

    return {
        "report_type": "PAYROLL",
        "generated_at": datetime.utcnow().isoformat(),
        "total_records": len(payrolls),
        "pending": sum(1 for p in payrolls if p.status == "PENDING"),
        "processed": sum(1 for p in payrolls if p.status == "PROCESSED"),
        "paid": sum(1 for p in payrolls if p.status == "PAID"),
        "total_gross_salary": round(total_gross, 2),
        "total_net_salary": round(total_net, 2),
    }


def generate_attrition_report(db: Session) -> dict:
    predictions = db.query(AttritionPrediction).all()

    latest_predictions = {}

    for prediction in predictions:
        employee_id = prediction.employee_id

        if employee_id is None:
            continue

        if (
            employee_id not in latest_predictions
            or prediction.created_at
            > latest_predictions[employee_id].created_at
        ):
            latest_predictions[employee_id] = prediction

    latest = list(latest_predictions.values())

    low_risk = sum(1 for p in latest if p.risk_level == "LOW")
    medium_risk = sum(1 for p in latest if p.risk_level == "MEDIUM")
    high_risk = sum(1 for p in latest if p.risk_level == "HIGH")
    critical_risk = sum(1 for p in latest if p.risk_level == "CRITICAL")

    average_probability = 0.0

    if latest:
        average_probability = round(
            sum(float(p.attrition_probability) for p in latest)
            / len(latest),
            2,
        )

    return {
        "report_type": "ATTRITION",
        "generated_at": datetime.utcnow().isoformat(),
        "total_employees": db.query(Employee).count(),
        "monitored_employees": len(latest),
        "low_risk": low_risk,
        "medium_risk": medium_risk,
        "high_risk": high_risk,
        "critical_risk": critical_risk,
        "average_attrition_probability": average_probability,
    }


def generate_workforce_stability_report(db: Session) -> dict:
    employees = (
        db.query(Employee)
        .filter(Employee.employment_status == "ACTIVE")
        .all()
    )

    predictions = db.query(AttritionPrediction).all()

    latest_predictions = {}

    for prediction in predictions:
        if prediction.employee_id is None:
            continue

        if (
            prediction.employee_id not in latest_predictions
            or prediction.created_at
            > latest_predictions[prediction.employee_id].created_at
        ):
            latest_predictions[prediction.employee_id] = prediction

    critical = sum(
        1
        for prediction in latest_predictions.values()
        if prediction.risk_level == "CRITICAL"
    )

    high = sum(
        1
        for prediction in latest_predictions.values()
        if prediction.risk_level == "HIGH"
    )

    active_interventions = (
        db.query(HRIntervention)
        .filter(
            HRIntervention.status.in_(
                ["PENDING", "IN_PROGRESS"]
            )
        )
        .count()
    )

    unresolved_alerts = (
        db.query(HRAlert)
        .filter(
            HRAlert.status.in_(
                ["UNREAD", "READ", "ACKNOWLEDGED"]
            )
        )
        .count()
    )

    total_active = len(employees)

    estimated_attrition_rate = 0.0

    if total_active > 0:
        estimated_attrition_rate = round(
            (
                (high + critical)
                / total_active
            )
            * 100,
            2,
        )

    if critical > 0:
        stability_status = "CRITICAL"
    elif high > 0:
        stability_status = "AT_RISK"
    else:
        stability_status = "STABLE"

    return {
        "report_type": "WORKFORCE_STABILITY",
        "generated_at": datetime.utcnow().isoformat(),
        "total_employees": total_active,
        "high_risk_employees": high,
        "critical_risk_employees": critical,
        "active_interventions": active_interventions,
        "unresolved_alerts": unresolved_alerts,
        "estimated_attrition_rate": estimated_attrition_rate,
        "stability_status": stability_status,
    }