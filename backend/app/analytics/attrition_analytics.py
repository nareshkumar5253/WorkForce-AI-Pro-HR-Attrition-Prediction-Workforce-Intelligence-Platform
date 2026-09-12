from __future__ import annotations

import json
from collections import defaultdict
from typing import Any

from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.models.prediction import AttritionPrediction


def _get_latest_predictions(db: Session) -> list[AttritionPrediction]:
    """
    Return only the latest attrition prediction for each employee.
    """

    predictions = (
        db.query(AttritionPrediction)
        .filter(AttritionPrediction.employee_id.isnot(None))
        .order_by(AttritionPrediction.created_at.desc())
        .all()
    )

    latest_by_employee: dict[int, AttritionPrediction] = {}

    for prediction in predictions:
        employee_id = prediction.employee_id

        if employee_id is None:
            continue

        if employee_id not in latest_by_employee:
            latest_by_employee[employee_id] = prediction

    return list(latest_by_employee.values())


def _risk_level(probability: float) -> str:
    """
    Convert attrition probability into workforce risk level.
    """

    probability = float(probability)

    if probability >= 85:
        return "CRITICAL"

    if probability >= 70:
        return "HIGH"

    if probability >= 40:
        return "MEDIUM"

    return "LOW"


def _parse_input_data(prediction: AttritionPrediction) -> dict[str, Any]:
    """
    Safely parse stored prediction input data.
    """

    if not prediction.input_data:
        return {}

    try:
        data = json.loads(prediction.input_data)

        if isinstance(data, dict):
            return data

    except (json.JSONDecodeError, TypeError):
        pass

    return {}


# ============================================================
# 1. ATTRITION OVERVIEW
# ============================================================

def get_attrition_overview(db: Session) -> dict[str, Any]:
    predictions = _get_latest_predictions(db)

    total_employees = db.query(Employee).count()

    monitored_employees = len(predictions)

    high_risk = 0
    critical_risk = 0
    medium_risk = 0
    low_risk = 0

    probabilities = []

    for prediction in predictions:
        probability = float(prediction.attrition_probability)

        probabilities.append(probability)

        level = _risk_level(probability)

        if level == "CRITICAL":
            critical_risk += 1
        elif level == "HIGH":
            high_risk += 1
        elif level == "MEDIUM":
            medium_risk += 1
        else:
            low_risk += 1

    average_probability = (
        sum(probabilities) / len(probabilities)
        if probabilities
        else 0
    )

    return {
        "total_employees": total_employees,
        "monitored_employees": monitored_employees,
        "unmonitored_employees": max(
            total_employees - monitored_employees,
            0,
        ),
        "average_attrition_probability": round(
            average_probability,
            2,
        ),
        "low_risk": low_risk,
        "medium_risk": medium_risk,
        "high_risk": high_risk,
        "critical_risk": critical_risk,
        "total_high_or_critical": high_risk + critical_risk,
    }


# ============================================================
# 2. RISK DISTRIBUTION
# ============================================================

def get_attrition_risk_distribution(
    db: Session,
) -> list[dict[str, Any]]:
    predictions = _get_latest_predictions(db)

    distribution = {
        "LOW": 0,
        "MEDIUM": 0,
        "HIGH": 0,
        "CRITICAL": 0,
    }

    for prediction in predictions:
        level = _risk_level(
            float(prediction.attrition_probability)
        )

        distribution[level] += 1

    return [
        {
            "risk_level": level,
            "employee_count": count,
        }
        for level, count in distribution.items()
    ]


# ============================================================
# 3. RISK BY DEPARTMENT
# ============================================================

def get_attrition_by_department(
    db: Session,
) -> list[dict[str, Any]]:
    predictions = _get_latest_predictions(db)

    department_data: dict[str, list[float]] = defaultdict(list)

    for prediction in predictions:
        employee = prediction.employee

        if not employee:
            continue

        department_name = (
            employee.department.name
            if employee.department
            else "Unknown"
        )

        department_data[department_name].append(
            float(prediction.attrition_probability)
        )

    result = []

    for department, probabilities in department_data.items():
        average_probability = (
            sum(probabilities) / len(probabilities)
            if probabilities
            else 0
        )

        high_or_critical = sum(
            1
            for probability in probabilities
            if probability >= 70
        )

        result.append(
            {
                "department": department,
                "employee_count": len(probabilities),
                "average_attrition_probability": round(
                    average_probability,
                    2,
                ),
                "high_or_critical_risk": high_or_critical,
                "risk_level": _risk_level(
                    average_probability
                ),
            }
        )

    result.sort(
        key=lambda item: item["average_attrition_probability"],
        reverse=True,
    )

    return result


# ============================================================
# 4. RISK BY JOB ROLE
# ============================================================

def get_attrition_by_role(
    db: Session,
) -> list[dict[str, Any]]:
    predictions = _get_latest_predictions(db)

    role_data: dict[str, list[float]] = defaultdict(list)

    for prediction in predictions:
        employee = prediction.employee

        if not employee:
            continue

        role_name = (
            employee.job_role.title
            if employee.job_role
            else "Unknown"
        )

        role_data[role_name].append(
            float(prediction.attrition_probability)
        )

    result = []

    for role, probabilities in role_data.items():
        average_probability = (
            sum(probabilities) / len(probabilities)
            if probabilities
            else 0
        )

        high_or_critical = sum(
            1
            for probability in probabilities
            if probability >= 70
        )

        result.append(
            {
                "job_role": role,
                "employee_count": len(probabilities),
                "average_attrition_probability": round(
                    average_probability,
                    2,
                ),
                "high_or_critical_risk": high_or_critical,
                "risk_level": _risk_level(
                    average_probability
                ),
            }
        )

    result.sort(
        key=lambda item: item["average_attrition_probability"],
        reverse=True,
    )

    return result


# ============================================================
# 5. TOP RISK FACTORS
# ============================================================

def get_attrition_risk_factors(
    db: Session,
) -> list[dict[str, Any]]:
    predictions = _get_latest_predictions(db)

    factor_counts: dict[str, int] = defaultdict(int)

    for prediction in predictions:
        employee_data = _parse_input_data(prediction)

        overtime = employee_data.get(
            "Overtime",
            employee_data.get("overtime"),
        )

        if str(overtime).strip().lower() in {
            "yes",
            "y",
            "true",
            "1",
        }:
            factor_counts["Frequent overtime"] += 1

        job_satisfaction = employee_data.get(
            "Job Sat.",
            employee_data.get(
                "job_sat",
                employee_data.get("job_satisfaction"),
            ),
        )

        if job_satisfaction is not None:
            try:
                if float(job_satisfaction) <= 2:
                    factor_counts["Low job satisfaction"] += 1
            except (TypeError, ValueError):
                pass

        work_life = employee_data.get(
            "Work-Life",
            employee_data.get(
                "work_life",
                employee_data.get("work_life_balance"),
            ),
        )

        if work_life is not None:
            try:
                if float(work_life) <= 2:
                    factor_counts["Poor work-life balance"] += 1
            except (TypeError, ValueError):
                pass

        performance = employee_data.get(
            "Performance",
            employee_data.get("performance"),
        )

        if performance is not None:
            try:
                if float(performance) <= 2:
                    factor_counts["Low performance"] += 1
            except (TypeError, ValueError):
                pass

        attendance_rate = employee_data.get(
            "Attendance Rate",
            employee_data.get("attendance_rate"),
        )

        if attendance_rate is not None:
            try:
                if float(attendance_rate) < 75:
                    factor_counts["Low attendance"] += 1
            except (TypeError, ValueError):
                pass

    result = [
        {
            "factor": factor,
            "employee_count": count,
        }
        for factor, count in factor_counts.items()
    ]

    result.sort(
        key=lambda item: item["employee_count"],
        reverse=True,
    )

    return result


# ============================================================
# 6. HIGH-RISK EMPLOYEES
# ============================================================

def get_attrition_high_risk_employees(
    db: Session,
) -> list[dict[str, Any]]:
    predictions = _get_latest_predictions(db)

    result = []

    for prediction in predictions:
        probability = float(
            prediction.attrition_probability
        )

        if probability < 70:
            continue

        employee = prediction.employee

        if not employee:
            continue

        result.append(
            {
                "employee_id": employee.id,
                "employee_code": employee.employee_code,
                "employee_name": (
                    f"{employee.first_name} "
                    f"{employee.last_name}"
                ),
                "department": (
                    employee.department.name
                    if employee.department
                    else None
                ),
                "job_role": (
                    employee.job_role.title
                    if employee.job_role
                    else None
                ),
                "attrition_probability": round(
                    probability,
                    2,
                ),
                "risk_level": _risk_level(probability),
                "model_name": prediction.model_name,
                "prediction_id": prediction.id,
                "created_at": prediction.created_at,
            }
        )

    result.sort(
        key=lambda item: item["attrition_probability"],
        reverse=True,
    )

    return result


# ============================================================
# 7. COMPLETE ATTRITION DASHBOARD
# ============================================================

def get_attrition_dashboard(
    db: Session,
) -> dict[str, Any]:
    return {
        "overview": get_attrition_overview(db),
        "risk_distribution": get_attrition_risk_distribution(db),
        "by_department": get_attrition_by_department(db),
        "by_role": get_attrition_by_role(db),
        "risk_factors": get_attrition_risk_factors(db),
        "high_risk_employees": get_attrition_high_risk_employees(
            db
        ),
    }