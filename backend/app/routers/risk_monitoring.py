from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.ai.risk_engine import (
    calculate_risk_level,
    calculate_risk_score,
    generate_risk_summary,
)
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.employee import Employee
from app.models.prediction import AttritionPrediction
from app.models.user import User


router = APIRouter(
    prefix="/risk-monitoring",
    tags=["Employee Risk Monitoring"],
)


def build_employee_risk(
    employee: Employee,
    prediction: AttritionPrediction,
):
    """
    Build a workforce risk profile for one employee.
    """

    probability = float(
        prediction.attrition_probability
    )

    # Extract additional HR indicators from the
    # prediction input data when available.
    attendance_rate = None
    overtime = None
    job_satisfaction = None
    work_life_balance = None
    performance = None

    if prediction.input_data:
        try:
            import json

            input_data = json.loads(
                prediction.input_data
            )

            def get_value(*keys):
                for key in keys:
                    if key in input_data:
                        return input_data[key]
                return None

            attendance_rate = get_value(
                "attendance_rate",
                "Attendance Rate",
            )

            overtime = get_value(
                "Overtime",
            )

            job_satisfaction = get_value(
                "Job Sat.",
                "job_sat",
                "job_satisfaction",
            )

            work_life_balance = get_value(
                "Work-Life",
                "work_life",
                "work_life_balance",
            )

            performance = get_value(
                "Performance",
                "performance",
            )

        except Exception:
            pass

    risk_result = calculate_risk_score(
        attrition_probability=probability,
        attendance_rate=attendance_rate,
        overtime=overtime,
        job_satisfaction=job_satisfaction,
        work_life_balance=work_life_balance,
        performance=performance,
    )

    summary = generate_risk_summary(
        risk_score=risk_result["risk_score"],
        risk_level=risk_result["risk_level"],
        risk_factors=risk_result["risk_factors"],
    )

    return {
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
        "employment_status": (
            employee.employment_status.value
            if hasattr(
                employee.employment_status,
                "value",
            )
            else str(employee.employment_status)
        ),
        "attrition_prediction_id": prediction.id,
        "attrition_probability": probability,
        "prediction": prediction.prediction,
        "model_name": prediction.model_name,
        "risk_score": risk_result["risk_score"],
        "risk_level": risk_result["risk_level"],
        "risk_factors": risk_result["risk_factors"],
        "summary": summary,
        "created_at": prediction.created_at,
    }


def get_latest_prediction(
    employee_id: int,
    db: Session,
):
    return (
        db.query(AttritionPrediction)
        .filter(
            AttritionPrediction.employee_id
            == employee_id
        )
        .order_by(
            AttritionPrediction.created_at.desc()
        )
        .first()
    )


@router.get("")
def get_all_employee_risks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get the latest AI risk profile for every employee
    who has an attrition prediction.
    """

    employees = (
        db.query(Employee)
        .order_by(Employee.id.asc())
        .all()
    )

    results = []

    for employee in employees:
        prediction = get_latest_prediction(
            employee.id,
            db,
        )

        if prediction:
            results.append(
                build_employee_risk(
                    employee,
                    prediction,
                )
            )

    return {
        "total_employees": len(results),
        "employees": results,
    }


@router.get("/high-risk")
def get_high_risk_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get employees whose calculated risk is HIGH or CRITICAL.
    """

    employees = (
        db.query(Employee)
        .order_by(Employee.id.asc())
        .all()
    )

    results = []

    for employee in employees:
        prediction = get_latest_prediction(
            employee.id,
            db,
        )

        if not prediction:
            continue

        risk = build_employee_risk(
            employee,
            prediction,
        )

        if risk["risk_level"] in {
            "HIGH",
            "CRITICAL",
        }:
            results.append(risk)

    return {
        "total_high_risk": len(results),
        "employees": results,
    }


@router.get("/employee/{employee_id}")
def get_employee_risk(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get the latest workforce risk profile
    for one employee.
    """

    employee = (
        db.query(Employee)
        .filter(
            Employee.id == employee_id
        )
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found.",
        )

    prediction = get_latest_prediction(
        employee_id,
        db,
    )

    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "No attrition prediction found "
                "for this employee."
            ),
        )

    return build_employee_risk(
        employee,
        prediction,
    )


@router.get("/summary")
def get_risk_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get organization-wide workforce risk summary.
    """

    employees = (
        db.query(Employee)
        .all()
    )

    counts = {
        "LOW": 0,
        "MEDIUM": 0,
        "HIGH": 0,
        "CRITICAL": 0,
    }

    total = 0

    for employee in employees:
        prediction = get_latest_prediction(
            employee.id,
            db,
        )

        if not prediction:
            continue

        risk = build_employee_risk(
            employee,
            prediction,
        )

        level = risk["risk_level"]

        if level in counts:
            counts[level] += 1

        total += 1

    return {
        "total_monitored_employees": total,
        "low_risk": counts["LOW"],
        "medium_risk": counts["MEDIUM"],
        "high_risk": counts["HIGH"],
        "critical_risk": counts["CRITICAL"],
        "total_high_or_critical": (
            counts["HIGH"]
            + counts["CRITICAL"]
        ),
    }