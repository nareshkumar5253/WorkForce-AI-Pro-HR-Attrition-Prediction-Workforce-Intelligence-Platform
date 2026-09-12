from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.ai.risk_engine import calculate_risk_level
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.employee import Employee
from app.models.intervention import (
    HRIntervention,
    InterventionPriority,
    InterventionStatus,
)
from app.models.prediction import AttritionPrediction
from app.models.user import User
from app.schemas.intervention import (
    InterventionCreate,
    InterventionRecommendationResponse,
    InterventionResponse,
    InterventionSummaryResponse,
    InterventionUpdate,
)


router = APIRouter(
    prefix="/interventions",
    tags=["HR Interventions"],
)


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def _get_employee_or_404(
    db: Session,
    employee_id: int,
) -> Employee:

    employee = (
        db.query(Employee)
        .filter(Employee.id == employee_id)
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found.",
        )

    return employee


def _get_prediction(
    db: Session,
    employee_id: int,
) -> AttritionPrediction | None:

    return (
        db.query(AttritionPrediction)
        .filter(
            AttritionPrediction.employee_id == employee_id
        )
        .order_by(
            AttritionPrediction.created_at.desc()
        )
        .first()
    )


def _check_management_access(current_user: User):

    allowed_roles = {"ADMIN", "HR"}

    user_role = (
        current_user.role.value
        if hasattr(current_user.role, "value")
        else str(current_user.role)
    )

    if user_role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail="Only ADMIN or HR users can manage HR interventions.",
        )


# ============================================================
# 1. CREATE INTERVENTION
# ============================================================

@router.post(
    "",
    response_model=InterventionResponse,
)
def create_intervention(
    data: InterventionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    _check_management_access(current_user)

    employee = _get_employee_or_404(
        db,
        data.employee_id,
    )

    prediction = None

    if data.prediction_id is not None:

        prediction = (
            db.query(AttritionPrediction)
            .filter(
                AttritionPrediction.id == data.prediction_id
            )
            .first()
        )

        if not prediction:
            raise HTTPException(
                status_code=404,
                detail="Attrition prediction not found.",
            )

        if prediction.employee_id != employee.id:
            raise HTTPException(
                status_code=400,
                detail="Prediction does not belong to this employee.",
            )

    else:

        prediction = _get_prediction(
            db,
            data.employee_id,
        )

    if data.assigned_to is not None:

        assigned_user = (
            db.query(User)
            .filter(User.id == data.assigned_to)
            .first()
        )

        if not assigned_user:
            raise HTTPException(
                status_code=404,
                detail="Assigned user not found.",
            )

    intervention = HRIntervention(
        employee_id=employee.id,
        prediction_id=(
            prediction.id
            if prediction
            else None
        ),
        intervention_type=data.intervention_type,
        title=data.title,
        description=data.description,
        recommended_action=data.recommended_action,
        priority=data.priority.upper(),
        status=InterventionStatus.PENDING,
        assigned_to=data.assigned_to,
        notes=data.notes,
    )

    db.add(intervention)
    db.commit()
    db.refresh(intervention)

    return intervention


# ============================================================
# 2. LIST ALL INTERVENTIONS
# ============================================================

@router.get(
    "",
    response_model=list[InterventionResponse],
)
def get_interventions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    _check_management_access(current_user)

    return (
        db.query(HRIntervention)
        .order_by(
            HRIntervention.created_at.desc()
        )
        .all()
    )


# ============================================================
# 3. AI INTERVENTION RECOMMENDATIONS FOR EMPLOYEE
# ============================================================

@router.get(
    "/recommendations/{employee_id}",
    response_model=InterventionRecommendationResponse,
)
def get_intervention_recommendations(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    _check_management_access(current_user)

    employee = _get_employee_or_404(
        db,
        employee_id,
    )

    prediction = _get_prediction(
        db,
        employee_id,
    )

    if not prediction:
        raise HTTPException(
            status_code=404,
            detail=(
                "No attrition prediction found "
                "for this employee."
            ),
        )

    probability = float(
        prediction.attrition_probability
    )

    risk_level = calculate_risk_level(
        probability
    )

    recommendations = []

    if risk_level == "CRITICAL":

        recommendations.extend([
            "Schedule an immediate HR retention discussion.",
            "Review the employee's workload and overtime.",
            "Discuss job satisfaction and workplace concerns.",
            "Review work-life balance and workload distribution.",
            "Discuss career growth and promotion opportunities.",
            "Review compensation and benefits.",
        ])

    elif risk_level == "HIGH":

        recommendations.extend([
            "Schedule an HR discussion with the employee.",
            "Review workload and overtime patterns.",
            "Check job satisfaction and engagement.",
            "Discuss career growth opportunities.",
            "Review compensation and benefits.",
        ])

    elif risk_level == "MEDIUM":

        recommendations.extend([
            "Monitor employee engagement regularly.",
            "Review job satisfaction during the next one-to-one.",
            "Check workload and work-life balance.",
            "Provide career development opportunities.",
        ])

    else:

        recommendations.extend([
            "Continue regular employee engagement.",
            "Maintain healthy workload and work-life balance.",
            "Continue periodic performance discussions.",
        ])

    return {
        "employee_id": employee.id,
        "employee_name": (
            f"{employee.first_name} "
            f"{employee.last_name}"
        ),
        "attrition_probability": round(
            probability,
            2,
        ),
        "risk_level": risk_level,
        "priority": (
            "URGENT"
            if risk_level == "CRITICAL"
            else "HIGH"
            if risk_level == "HIGH"
            else "MEDIUM"
            if risk_level == "MEDIUM"
            else "LOW"
        ),
        "recommendations": recommendations,
    }


# ============================================================
# 4. HIGH-RISK EMPLOYEE RECOMMENDATIONS
# ============================================================

@router.get(
    "/recommendations",
    response_model=list[InterventionRecommendationResponse],
)
def get_high_risk_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    _check_management_access(current_user)

    employees = (
        db.query(Employee)
        .filter(
            Employee.employment_status == "ACTIVE"
        )
        .all()
    )

    result = []

    for employee in employees:

        prediction = _get_prediction(
            db,
            employee.id,
        )

        if not prediction:
            continue

        probability = float(
            prediction.attrition_probability
        )

        if probability < 70:
            continue

        risk_level = calculate_risk_level(
            probability
        )

        if risk_level == "CRITICAL":

            priority = "URGENT"

            recommendations = [
                "Schedule immediate HR retention discussion.",
                "Review workload and overtime.",
                "Address job satisfaction concerns.",
                "Review work-life balance.",
                "Discuss career growth and compensation.",
            ]

        else:

            priority = "HIGH"

            recommendations = [
                "Schedule an HR check-in.",
                "Review workload and overtime.",
                "Monitor employee engagement.",
                "Discuss career development.",
            ]

        result.append(
            {
                "employee_id": employee.id,
                "employee_name": (
                    f"{employee.first_name} "
                    f"{employee.last_name}"
                ),
                "attrition_probability": round(
                    probability,
                    2,
                ),
                "risk_level": risk_level,
                "priority": priority,
                "recommendations": recommendations,
            }
        )

    result.sort(
        key=lambda item: item[
            "attrition_probability"
        ],
        reverse=True,
    )

    return result


# ============================================================
# 5. INTERVENTION SUMMARY
# ============================================================

@router.get(
    "/analytics/summary",
    response_model=InterventionSummaryResponse,
)
def get_intervention_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    _check_management_access(current_user)

    interventions = (
        db.query(HRIntervention)
        .all()
    )

    return {
        "total_interventions": len(
            interventions
        ),
        "pending": sum(
            1
            for item in interventions
            if item.status
            == InterventionStatus.PENDING
        ),
        "in_progress": sum(
            1
            for item in interventions
            if item.status
            == InterventionStatus.IN_PROGRESS
        ),
        "completed": sum(
            1
            for item in interventions
            if item.status
            == InterventionStatus.COMPLETED
        ),
        "cancelled": sum(
            1
            for item in interventions
            if item.status
            == InterventionStatus.CANCELLED
        ),
        "urgent": sum(
            1
            for item in interventions
            if item.priority
            == InterventionPriority.URGENT
        ),
        "high_priority": sum(
            1
            for item in interventions
            if item.priority
            == InterventionPriority.HIGH
        ),
    }


# ============================================================
# 6. EMPLOYEE INTERVENTION HISTORY
# ============================================================

@router.get(
    "/employee/{employee_id}",
    response_model=list[InterventionResponse],
)
def get_employee_interventions(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    _check_management_access(current_user)

    _get_employee_or_404(
        db,
        employee_id,
    )

    return (
        db.query(HRIntervention)
        .filter(
            HRIntervention.employee_id == employee_id
        )
        .order_by(
            HRIntervention.created_at.desc()
        )
        .all()
    )


# ============================================================
# 7. GET SINGLE INTERVENTION
# ============================================================

@router.get(
    "/{intervention_id}",
    response_model=InterventionResponse,
)
def get_intervention(
    intervention_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    _check_management_access(current_user)

    intervention = (
        db.query(HRIntervention)
        .filter(
            HRIntervention.id == intervention_id
        )
        .first()
    )

    if not intervention:
        raise HTTPException(
            status_code=404,
            detail="Intervention not found.",
        )

    return intervention


# ============================================================
# 8. UPDATE INTERVENTION
# ============================================================

@router.put(
    "/{intervention_id}",
    response_model=InterventionResponse,
)
def update_intervention(
    intervention_id: int,
    data: InterventionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    _check_management_access(current_user)

    intervention = (
        db.query(HRIntervention)
        .filter(
            HRIntervention.id == intervention_id
        )
        .first()
    )

    if not intervention:
        raise HTTPException(
            status_code=404,
            detail="Intervention not found.",
        )

    # --------------------------------------------------------
    # UPDATE STATUS
    # --------------------------------------------------------

    if data.status is not None:

        allowed_statuses = {
            InterventionStatus.PENDING,
            InterventionStatus.IN_PROGRESS,
            InterventionStatus.COMPLETED,
            InterventionStatus.CANCELLED,
        }

        new_status = data.status.upper()

        if new_status not in allowed_statuses:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid status. Allowed values: "
                    "PENDING, IN_PROGRESS, COMPLETED, CANCELLED."
                ),
            )

        intervention.status = new_status

    # --------------------------------------------------------
    # UPDATE PRIORITY
    # --------------------------------------------------------

    if data.priority is not None:

        allowed_priorities = {
            InterventionPriority.LOW,
            InterventionPriority.MEDIUM,
            InterventionPriority.HIGH,
            InterventionPriority.URGENT,
        }

        new_priority = data.priority.upper()

        if new_priority not in allowed_priorities:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid priority. Allowed values: "
                    "LOW, MEDIUM, HIGH, URGENT."
                ),
            )

        intervention.priority = new_priority

    # --------------------------------------------------------
    # UPDATE ASSIGNED USER
    # --------------------------------------------------------

    if data.assigned_to is not None:

        assigned_user = (
            db.query(User)
            .filter(User.id == data.assigned_to)
            .first()
        )

        if not assigned_user:
            raise HTTPException(
                status_code=404,
                detail="Assigned user not found.",
            )

        intervention.assigned_to = data.assigned_to

    # --------------------------------------------------------
    # UPDATE NOTES
    # --------------------------------------------------------

    if data.notes is not None:
        intervention.notes = data.notes

    # --------------------------------------------------------
    # UPDATE DESCRIPTION
    # --------------------------------------------------------

    if data.description is not None:
        intervention.description = data.description

    db.commit()
    db.refresh(intervention)

    return intervention