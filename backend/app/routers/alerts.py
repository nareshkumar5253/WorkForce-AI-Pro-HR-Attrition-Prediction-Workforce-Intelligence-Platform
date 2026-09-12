from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.ai.risk_engine import calculate_risk_level
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.alert import (
    AlertPriority,
    AlertStatus,
    AlertType,
    HRAlert,
)
from app.models.employee import Employee
from app.models.prediction import AttritionPrediction
from app.models.user import User
from app.schemas.alert import (
    AlertCreate,
    AlertResponse,
    AlertSummaryResponse,
    AlertUpdate,
    AttritionAlertResponse,
)


router = APIRouter(
    prefix="/alerts",
    tags=["Smart Alerts"],
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


def _get_latest_prediction(
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


def _get_user_role(current_user: User) -> str:

    return (
        current_user.role.value
        if hasattr(current_user.role, "value")
        else str(current_user.role)
    )


def _check_management_access(current_user: User):

    allowed_roles = {
        "ADMIN",
        "HR",
    }

    if _get_user_role(current_user) not in allowed_roles:

        raise HTTPException(
            status_code=403,
            detail="Only ADMIN or HR users can manage alerts.",
        )


# ============================================================
# 1. CREATE ALERT
# ============================================================

@router.post(
    "",
    response_model=AlertResponse,
)
def create_alert(
    data: AlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    _check_management_access(current_user)

    # --------------------------------------------------------
    # Validate employee
    # --------------------------------------------------------

    if data.employee_id is not None:

        _get_employee_or_404(
            db,
            data.employee_id,
        )

    # --------------------------------------------------------
    # Validate prediction
    # --------------------------------------------------------

    if data.prediction_id is not None:

        prediction = (
            db.query(AttritionPrediction)
            .filter(
                AttritionPrediction.id
                == data.prediction_id
            )
            .first()
        )

        if not prediction:

            raise HTTPException(
                status_code=404,
                detail="Attrition prediction not found.",
            )

        if (
            data.employee_id is not None
            and prediction.employee_id != data.employee_id
        ):

            raise HTTPException(
                status_code=400,
                detail="Prediction does not belong to this employee.",
            )

    # --------------------------------------------------------
    # Validate priority
    # --------------------------------------------------------

    priority = data.priority.upper()

    allowed_priorities = {
        AlertPriority.LOW,
        AlertPriority.MEDIUM,
        AlertPriority.HIGH,
        AlertPriority.CRITICAL,
    }

    if priority not in allowed_priorities:

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid priority. Allowed values: "
                "LOW, MEDIUM, HIGH, CRITICAL."
            ),
        )

    # --------------------------------------------------------
    # Create alert
    # --------------------------------------------------------

    alert = HRAlert(
        employee_id=data.employee_id,
        prediction_id=data.prediction_id,
        alert_type=data.alert_type.upper(),
        title=data.title,
        message=data.message,
        priority=priority,
        status=AlertStatus.UNREAD,
        created_by=current_user.id,
    )

    db.add(alert)
    db.commit()
    db.refresh(alert)

    return alert


# ============================================================
# 2. LIST ALL ALERTS
# ============================================================

@router.get(
    "",
    response_model=list[AlertResponse],
)
def get_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    _check_management_access(current_user)

    return (
        db.query(HRAlert)
        .order_by(
            HRAlert.created_at.desc()
        )
        .all()
    )


# ============================================================
# 3. GET MY ALERTS
# ============================================================

@router.get(
    "/my",
    response_model=list[AlertResponse],
)
def get_my_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # --------------------------------------------------------
    # ADMIN / HR see all employee alerts
    # --------------------------------------------------------

    role = _get_user_role(current_user)

    if role in {"ADMIN", "HR"}:

        return (
            db.query(HRAlert)
            .order_by(
                HRAlert.created_at.desc()
            )
            .all()
        )

    # --------------------------------------------------------
    # Employee sees alerts related to their employee record
    # --------------------------------------------------------

    employee = (
        db.query(Employee)
        .filter(
            Employee.user_id == current_user.id
        )
        .first()
    )

    if not employee:

        return []

    return (
        db.query(HRAlert)
        .filter(
            HRAlert.employee_id == employee.id
        )
        .order_by(
            HRAlert.created_at.desc()
        )
        .all()
    )


# ============================================================
# 4. GET ALERT SUMMARY
# ============================================================

@router.get(
    "/summary",
    response_model=AlertSummaryResponse,
)
def get_alert_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    _check_management_access(current_user)

    alerts = (
        db.query(HRAlert)
        .all()
    )

    return {
        "total_alerts": len(alerts),

        "unread": sum(
            1
            for alert in alerts
            if alert.status == AlertStatus.UNREAD
        ),

        "read": sum(
            1
            for alert in alerts
            if alert.status == AlertStatus.READ
        ),

        "acknowledged": sum(
            1
            for alert in alerts
            if alert.status == AlertStatus.ACKNOWLEDGED
        ),

        "resolved": sum(
            1
            for alert in alerts
            if alert.status == AlertStatus.RESOLVED
        ),

        "low": sum(
            1
            for alert in alerts
            if alert.priority == AlertPriority.LOW
        ),

        "medium": sum(
            1
            for alert in alerts
            if alert.priority == AlertPriority.MEDIUM
        ),

        "high": sum(
            1
            for alert in alerts
            if alert.priority == AlertPriority.HIGH
        ),

        "critical": sum(
            1
            for alert in alerts
            if alert.priority == AlertPriority.CRITICAL
        ),
    }


# ============================================================
# 5. GENERATE ATTRITION ALERT
# ============================================================

@router.post(
    "/generate-attrition/{employee_id}",
    response_model=AttritionAlertResponse,
)
def generate_attrition_alert(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    _check_management_access(current_user)

    # --------------------------------------------------------
    # Get employee
    # --------------------------------------------------------

    employee = _get_employee_or_404(
        db,
        employee_id,
    )

    # --------------------------------------------------------
    # Get latest prediction
    # --------------------------------------------------------

    prediction = _get_latest_prediction(
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

    # --------------------------------------------------------
    # Only HIGH / CRITICAL risks generate alerts
    # --------------------------------------------------------

    if risk_level not in {
        "HIGH",
        "CRITICAL",
    }:

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
            "priority": "LOW",
            "alert_created": False,
            "alert_id": None,
            "message": (
                "No alert generated because the "
                "employee is not currently high risk."
            ),
        }

    # --------------------------------------------------------
    # Determine priority
    # --------------------------------------------------------

    if risk_level == "CRITICAL":

        priority = AlertPriority.CRITICAL

        title = (
            "Critical Employee Attrition Risk"
        )

        message = (
            f"{employee.first_name} "
            f"{employee.last_name} has a critical "
            f"attrition risk of {probability:.2f}%. "
            "Immediate HR retention intervention is recommended."
        )

    else:

        priority = AlertPriority.HIGH

        title = (
            "High Employee Attrition Risk"
        )

        message = (
            f"{employee.first_name} "
            f"{employee.last_name} has a high "
            f"attrition risk of {probability:.2f}%. "
            "HR review and employee engagement are recommended."
        )

    # --------------------------------------------------------
    # Prevent duplicate active alerts
    # --------------------------------------------------------

    existing_alert = (
        db.query(HRAlert)
        .filter(
            HRAlert.employee_id == employee.id,
            HRAlert.prediction_id == prediction.id,
            HRAlert.alert_type == AlertType.ATTRITION_RISK,
            HRAlert.status.in_([
                AlertStatus.UNREAD,
                AlertStatus.READ,
                AlertStatus.ACKNOWLEDGED,
            ]),
        )
        .first()
    )

    if existing_alert:

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
            "priority": priority,
            "alert_created": False,
            "alert_id": existing_alert.id,
            "message": (
                "An active attrition alert already "
                "exists for this prediction."
            ),
        }

    # --------------------------------------------------------
    # Create new alert
    # --------------------------------------------------------

    alert = HRAlert(
        employee_id=employee.id,
        prediction_id=prediction.id,
        alert_type=AlertType.ATTRITION_RISK,
        title=title,
        message=message,
        priority=priority,
        status=AlertStatus.UNREAD,
        created_by=current_user.id,
    )

    db.add(alert)
    db.commit()
    db.refresh(alert)

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
        "priority": priority,
        "alert_created": True,
        "alert_id": alert.id,
        "message": (
            "Attrition risk alert created successfully."
        ),
    }


# ============================================================
# 6. MARK ALERT AS READ
# ============================================================

@router.post(
    "/{alert_id}/read",
    response_model=AlertResponse,
)
def mark_alert_read(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    alert = (
        db.query(HRAlert)
        .filter(
            HRAlert.id == alert_id
        )
        .first()
    )

    if not alert:

        raise HTTPException(
            status_code=404,
            detail="Alert not found.",
        )

    role = _get_user_role(current_user)

    if role not in {"ADMIN", "HR"}:

        employee = (
            db.query(Employee)
            .filter(
                Employee.user_id == current_user.id
            )
            .first()
        )

        if (
            not employee
            or alert.employee_id != employee.id
        ):

            raise HTTPException(
                status_code=403,
                detail="You do not have access to this alert.",
            )

    if alert.status == AlertStatus.UNREAD:

        alert.status = AlertStatus.READ

        db.commit()
        db.refresh(alert)

    return alert


# ============================================================
# 7. ACKNOWLEDGE ALERT
# ============================================================

@router.post(
    "/{alert_id}/acknowledge",
    response_model=AlertResponse,
)
def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    _check_management_access(current_user)

    alert = (
        db.query(HRAlert)
        .filter(
            HRAlert.id == alert_id
        )
        .first()
    )

    if not alert:

        raise HTTPException(
            status_code=404,
            detail="Alert not found.",
        )

    alert.status = AlertStatus.ACKNOWLEDGED
    alert.acknowledged_by = current_user.id
    alert.acknowledged_at = datetime.utcnow()

    db.commit()
    db.refresh(alert)

    return alert


# ============================================================
# 8. RESOLVE ALERT
# ============================================================

@router.post(
    "/{alert_id}/resolve",
    response_model=AlertResponse,
)
def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    _check_management_access(current_user)

    alert = (
        db.query(HRAlert)
        .filter(
            HRAlert.id == alert_id
        )
        .first()
    )

    if not alert:

        raise HTTPException(
            status_code=404,
            detail="Alert not found.",
        )

    alert.status = AlertStatus.RESOLVED
    alert.resolved_at = datetime.utcnow()

    db.commit()
    db.refresh(alert)

    return alert


# ============================================================
# 9. GET SINGLE ALERT
# ============================================================

@router.get(
    "/{alert_id}",
    response_model=AlertResponse,
)
def get_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    alert = (
        db.query(HRAlert)
        .filter(
            HRAlert.id == alert_id
        )
        .first()
    )

    if not alert:

        raise HTTPException(
            status_code=404,
            detail="Alert not found.",
        )

    role = _get_user_role(current_user)

    if role not in {"ADMIN", "HR"}:

        employee = (
            db.query(Employee)
            .filter(
                Employee.user_id == current_user.id
            )
            .first()
        )

        if (
            not employee
            or alert.employee_id != employee.id
        ):

            raise HTTPException(
                status_code=403,
                detail="You do not have access to this alert.",
            )

    return alert