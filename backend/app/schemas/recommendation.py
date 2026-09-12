from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.recommendation import (
    RecommendationPriority,
    RecommendationStatus,
    RecommendationType,
)


class RecommendationCreate(BaseModel):
    employee_id: int = Field(..., gt=0)

    recommendation_type: RecommendationType

    priority: RecommendationPriority = (
        RecommendationPriority.MEDIUM
    )

    title: str = Field(
        ...,
        min_length=3,
        max_length=255,
    )

    recommendation: str = Field(
        ...,
        min_length=3,
        max_length=10000,
    )

    reason: str | None = Field(
        default=None,
        max_length=10000,
    )


class RecommendationUpdate(BaseModel):
    priority: RecommendationPriority | None = None

    title: str | None = Field(
        default=None,
        min_length=3,
        max_length=255,
    )

    recommendation: str | None = Field(
        default=None,
        min_length=3,
        max_length=10000,
    )

    reason: str | None = Field(
        default=None,
        max_length=10000,
    )

    status: RecommendationStatus | None = None


class RecommendationResponse(BaseModel):
    id: int
    employee_id: int

    recommendation_type: RecommendationType
    priority: RecommendationPriority

    title: str
    recommendation: str
    reason: str | None

    status: RecommendationStatus
    generated_by: str

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class RecommendationSummaryResponse(BaseModel):
    total_recommendations: int

    new_recommendations: int
    reviewed_recommendations: int
    accepted_recommendations: int
    implemented_recommendations: int
    dismissed_recommendations: int

    low_priority: int
    medium_priority: int
    high_priority: int
    urgent_priority: int