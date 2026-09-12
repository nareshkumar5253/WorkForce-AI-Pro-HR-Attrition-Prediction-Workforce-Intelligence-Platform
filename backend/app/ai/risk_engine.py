from typing import Any


def calculate_risk_level(attrition_probability: float) -> str:
    """
    Convert attrition probability into a workforce risk level.
    """

    probability = float(attrition_probability)

    if probability >= 85:
        return "CRITICAL"

    if probability >= 70:
        return "HIGH"

    if probability >= 40:
        return "MEDIUM"

    return "LOW"


def calculate_risk_score(
    attrition_probability: float,
    attendance_rate: float | None = None,
    overtime: str | None = None,
    job_satisfaction: float | None = None,
    work_life_balance: float | None = None,
    performance: float | None = None,
) -> dict[str, Any]:
    """
    Calculate an employee workforce risk score using
    attrition probability and additional HR indicators.
    """

    probability = float(attrition_probability)

    # Start with the ML attrition probability.
    score = probability

    factors = []

    # Attendance risk
    if attendance_rate is not None:
        attendance_rate = float(attendance_rate)

        if attendance_rate < 60:
            score += 10
            factors.append("Very low attendance")

        elif attendance_rate < 75:
            score += 5
            factors.append("Low attendance")

    # Overtime risk
    if overtime is not None:
        overtime_value = str(overtime).strip().lower()

        if overtime_value in {
            "yes",
            "y",
            "true",
            "1",
        }:
            score += 5
            factors.append("Frequent overtime")

    # Job satisfaction risk
    if job_satisfaction is not None:
        satisfaction = float(job_satisfaction)

        if satisfaction <= 1:
            score += 8
            factors.append("Very low job satisfaction")

        elif satisfaction <= 2:
            score += 4
            factors.append("Low job satisfaction")

    # Work-life balance risk
    if work_life_balance is not None:
        work_life = float(work_life_balance)

        if work_life <= 1:
            score += 8
            factors.append("Very poor work-life balance")

        elif work_life <= 2:
            score += 4
            factors.append("Poor work-life balance")

    # Performance risk
    if performance is not None:
        performance_value = float(performance)

        if performance_value <= 1:
            score += 5
            factors.append("Very low performance")

        elif performance_value <= 2:
            score += 3
            factors.append("Low performance")

    # Keep score within 0–100.
    score = min(max(score, 0), 100)

    if score >= 85:
        risk_level = "CRITICAL"

    elif score >= 70:
        risk_level = "HIGH"

    elif score >= 40:
        risk_level = "MEDIUM"

    else:
        risk_level = "LOW"

    return {
        "risk_score": round(score, 2),
        "risk_level": risk_level,
        "risk_factors": factors,
    }


def generate_risk_summary(
    risk_score: float,
    risk_level: str,
    risk_factors: list[str],
) -> str:
    """
    Generate a human-readable HR risk summary.
    """

    if risk_level == "CRITICAL":
        message = (
            "Critical attrition risk detected. "
            "Immediate HR intervention is recommended."
        )

    elif risk_level == "HIGH":
        message = (
            "High attrition risk detected. "
            "HR should review this employee and consider an intervention."
        )

    elif risk_level == "MEDIUM":
        message = (
            "Moderate attrition risk detected. "
            "The employee should be monitored regularly."
        )

    else:
        message = (
            "Low attrition risk detected. "
            "No immediate intervention is required."
        )

    if risk_factors:
        message += (
            " Key risk factors: "
            + ", ".join(risk_factors)
            + "."
        )

    return message