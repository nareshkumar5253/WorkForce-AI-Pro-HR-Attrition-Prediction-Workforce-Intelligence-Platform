from __future__ import annotations

from datetime import date, timedelta
from typing import Any

import pandas as pd
from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.models.prediction import AttritionPrediction
from app.utils.enums import EmploymentStatus


def _active_employee_count(db: Session) -> int:
    return (
        db.query(Employee)
        .filter(Employee.employment_status == EmploymentStatus.ACTIVE)
        .count()
    )


def _total_employee_count(db: Session) -> int:
    return db.query(Employee).count()


def _critical_risk_count(db: Session) -> int:
    predictions = (
        db.query(AttritionPrediction)
        .order_by(AttritionPrediction.created_at.desc())
        .all()
    )

    latest_by_employee: dict[int, AttritionPrediction] = {}

    for prediction in predictions:
        if prediction.employee_id is None:
            continue

        if prediction.employee_id not in latest_by_employee:
            latest_by_employee[prediction.employee_id] = prediction

    count = 0

    for prediction in latest_by_employee.values():
        probability = float(prediction.attrition_probability)

        if probability >= 85:
            count += 1

    return count


def _high_risk_count(db: Session) -> int:
    predictions = (
        db.query(AttritionPrediction)
        .order_by(AttritionPrediction.created_at.desc())
        .all()
    )

    latest_by_employee: dict[int, AttritionPrediction] = {}

    for prediction in predictions:
        if prediction.employee_id is None:
            continue

        if prediction.employee_id not in latest_by_employee:
            latest_by_employee[prediction.employee_id] = prediction

    count = 0

    for prediction in latest_by_employee.values():
        probability = float(prediction.attrition_probability)

        if 70 <= probability < 85:
            count += 1

    return count


def calculate_workforce_forecast(
    db: Session,
    horizon_days: int,
) -> dict[str, Any]:
    """
    Generate a simple workforce forecast using current workforce
    and latest employee attrition predictions.

    This is intentionally designed as a reliable baseline forecasting
    engine before introducing more advanced time-series models.
    """

    if horizon_days not in {7, 30, 90}:
        raise ValueError("Forecast horizon must be 7, 30, or 90 days.")

    total_employees = _total_employee_count(db)
    active_employees = _active_employee_count(db)

    critical_risk = _critical_risk_count(db)
    high_risk = _high_risk_count(db)

    total_monitored = critical_risk + high_risk

    if active_employees > 0:
        estimated_attrition_rate = min(
            total_monitored / active_employees,
            1.0,
        )
    else:
        estimated_attrition_rate = 0.0

    # Convert current risk exposure into a projected attrition estimate.
    #
    # The estimate is deliberately conservative because a risk prediction
    # does not mean the employee will definitely leave.
    if horizon_days == 7:
        horizon_factor = 0.15
    elif horizon_days == 30:
        horizon_factor = 0.35
    else:
        horizon_factor = 0.70

    projected_attrition = round(
        active_employees * estimated_attrition_rate * horizon_factor,
        2,
    )

    projected_headcount = round(
        max(active_employees - projected_attrition, 0),
        2,
    )

    staffing_gap = round(
        active_employees - projected_headcount,
        2,
    )

    forecast_date = date.today() + timedelta(days=horizon_days)

    if projected_attrition == 0:
        trend = "STABLE"
    elif projected_attrition <= max(active_employees * 0.05, 1):
        trend = "SLIGHT_DECLINE"
    else:
        trend = "DECLINING"

    return {
        "forecast_horizon_days": horizon_days,
        "forecast_date": forecast_date.isoformat(),
        "current_total_employees": total_employees,
        "current_active_employees": active_employees,
        "high_risk_employees": high_risk,
        "critical_risk_employees": critical_risk,
        "total_high_or_critical_risk": total_monitored,
        "estimated_attrition_rate": round(
            estimated_attrition_rate * 100,
            2,
        ),
        "projected_attrition": projected_attrition,
        "projected_headcount": projected_headcount,
        "projected_staffing_gap": staffing_gap,
        "trend": trend,
        "confidence": "BASELINE",
        "model": "Risk-Based Workforce Forecast",
    }


def calculate_attrition_forecast(
    db: Session,
    horizon_days: int,
) -> dict[str, Any]:
    """
    Forecast expected employee attrition based on the latest
    stored attrition predictions.
    """

    if horizon_days not in {7, 30, 90}:
        raise ValueError("Forecast horizon must be 7, 30, or 90 days.")

    active_employees = _active_employee_count(db)

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

    probabilities = [
        float(prediction.attrition_probability)
        for prediction in latest_by_employee.values()
    ]

    if probabilities:
        average_probability = sum(probabilities) / len(probabilities)
    else:
        average_probability = 0.0

    high_risk_count = sum(
        1 for probability in probabilities if probability >= 70
    )

    critical_risk_count = sum(
        1 for probability in probabilities if probability >= 85
    )

    if horizon_days == 7:
        horizon_factor = 0.15
    elif horizon_days == 30:
        horizon_factor = 0.35
    else:
        horizon_factor = 0.70

    projected_attrition = round(
        active_employees
        * (average_probability / 100)
        * horizon_factor,
        2,
    )

    projected_attrition = min(
        projected_attrition,
        float(active_employees),
    )

    if average_probability >= 70:
        risk_trend = "HIGH"
    elif average_probability >= 40:
        risk_trend = "MEDIUM"
    else:
        risk_trend = "LOW"

    return {
        "forecast_horizon_days": horizon_days,
        "forecast_date": (
            date.today() + timedelta(days=horizon_days)
        ).isoformat(),
        "active_employees": active_employees,
        "monitored_employees": len(probabilities),
        "average_attrition_probability": round(
            average_probability,
            2,
        ),
        "high_risk_employees": high_risk_count,
        "critical_risk_employees": critical_risk_count,
        "projected_attrition": projected_attrition,
        "projected_remaining_workforce": round(
            max(active_employees - projected_attrition, 0),
            2,
        ),
        "risk_trend": risk_trend,
        "confidence": (
            "MEDIUM"
            if len(probabilities) >= 10
            else "LOW"
        ),
        "model": "Risk-Based Attrition Forecast",
    }


def calculate_forecast_summary(db: Session) -> dict[str, Any]:
    """
    Generate a combined workforce forecasting summary.
    """

    forecasts = {}

    for horizon in [7, 30, 90]:
        forecasts[f"{horizon}_days"] = calculate_workforce_forecast(
            db,
            horizon,
        )

    attrition_forecasts = {}

    for horizon in [7, 30, 90]:
        attrition_forecasts[f"{horizon}_days"] = (
            calculate_attrition_forecast(
                db,
                horizon,
            )
        )

    return {
        "generated_on": date.today().isoformat(),
        "workforce_forecast": forecasts,
        "attrition_forecast": attrition_forecasts,
    }