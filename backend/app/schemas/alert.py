from datetime import datetime

from pydantic import BaseModel, ConfigDict


# ============================================================
# CREATE ALERT
# ============================================================

class AlertCreate(BaseModel):
    employee_id: int | None = None
    prediction_id: int | None = None

    alert_type: str
    title: str
    message: str

    priority: str = "MEDIUM"


# ============================================================
# UPDATE ALERT
# ============================================================

class AlertUpdate(BaseModel):
    status: str | None = None


# ============================================================
# ALERT RESPONSE
# ============================================================

class AlertResponse(BaseModel):
    id: int

    employee_id: int | None
    prediction_id: int | None

    alert_type: str
    title: str
    message: str

    priority: str
    status: str

    created_by: int | None
    acknowledged_by: int | None

    acknowledged_at: datetime | None
    resolved_at: datetime | None

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


# ============================================================
# ALERT SUMMARY
# ============================================================

class AlertSummaryResponse(BaseModel):
    total_alerts: int
    unread: int
    read: int
    acknowledged: int
    resolved: int

    low: int
    medium: int
    high: int
    critical: int


# ============================================================
# ATTRITION ALERT GENERATION RESPONSE
# ============================================================

class AttritionAlertResponse(BaseModel):
    employee_id: int
    employee_name: str

    attrition_probability: float
    risk_level: str
    priority: str

    alert_created: bool
    alert_id: int | None

    message: str