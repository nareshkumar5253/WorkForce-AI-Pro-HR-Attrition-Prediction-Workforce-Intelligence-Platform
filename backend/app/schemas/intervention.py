from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class InterventionCreate(BaseModel):
    employee_id: int
    prediction_id: int | None = None

    intervention_type: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    title: str = Field(
        ...,
        min_length=2,
        max_length=200,
    )

    description: str | None = None

    recommended_action: str = Field(
        ...,
        min_length=2,
    )

    priority: str = Field(
        default="MEDIUM",
    )

    assigned_to: int | None = None

    notes: str | None = None


class InterventionUpdate(BaseModel):
    status: str | None = None
    priority: str | None = None
    assigned_to: int | None = None
    notes: str | None = None
    description: str | None = None


class InterventionResponse(BaseModel):
    id: int
    employee_id: int
    prediction_id: int | None

    intervention_type: str
    title: str
    description: str | None
    recommended_action: str

    priority: str
    status: str

    assigned_to: int | None
    notes: str | None

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class InterventionRecommendationResponse(BaseModel):
    employee_id: int
    employee_name: str

    attrition_probability: float
    risk_level: str

    priority: str
    recommendations: list[str]


class InterventionSummaryResponse(BaseModel):
    total_interventions: int
    pending: int
    in_progress: int
    completed: int
    cancelled: int
    urgent: int
    high_priority: int