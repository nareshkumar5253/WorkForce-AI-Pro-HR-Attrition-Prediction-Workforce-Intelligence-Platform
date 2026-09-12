from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.performance import (
    PerformanceRating,
    PerformanceReviewStatus,
)


class PerformanceReviewCreate(BaseModel):
    employee_id: int = Field(..., gt=0)

    review_period_start: date
    review_period_end: date

    rating: PerformanceRating | None = None

    overall_score: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    goals_achievement: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    productivity_score: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    teamwork_score: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    communication_score: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    strengths: str | None = Field(
        default=None,
        max_length=10000,
    )

    areas_for_improvement: str | None = Field(
        default=None,
        max_length=10000,
    )

    manager_comments: str | None = Field(
        default=None,
        max_length=10000,
    )


class PerformanceReviewUpdate(BaseModel):
    rating: PerformanceRating | None = None

    overall_score: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    goals_achievement: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    productivity_score: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    teamwork_score: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    communication_score: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    strengths: str | None = Field(
        default=None,
        max_length=10000,
    )

    areas_for_improvement: str | None = Field(
        default=None,
        max_length=10000,
    )

    manager_comments: str | None = Field(
        default=None,
        max_length=10000,
    )

    employee_comments: str | None = Field(
        default=None,
        max_length=10000,
    )

    status: PerformanceReviewStatus | None = None


class PerformanceReviewResponse(BaseModel):
    id: int
    employee_id: int
    reviewer_id: int

    review_period_start: date
    review_period_end: date

    rating: PerformanceRating | None

    overall_score: float | None
    goals_achievement: float | None
    productivity_score: float | None
    teamwork_score: float | None
    communication_score: float | None

    strengths: str | None
    areas_for_improvement: str | None
    manager_comments: str | None
    employee_comments: str | None

    status: PerformanceReviewStatus

    reviewed_at: datetime | None
    acknowledged_at: datetime | None

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PerformanceAnalyticsSummaryResponse(BaseModel):
    total_reviews: int
    draft_reviews: int
    submitted_reviews: int
    acknowledged_reviews: int
    completed_reviews: int
    average_overall_score: float | None
    average_goals_achievement: float | None
    average_productivity_score: float | None
    average_teamwork_score: float | None
    average_communication_score: float | None


class PerformanceRatingDistributionResponse(BaseModel):
    rating: PerformanceRating
    count: int


class PerformanceStatusDistributionResponse(BaseModel):
    status: PerformanceReviewStatus
    count: int


class DepartmentPerformanceResponse(BaseModel):
    department_id: int
    department_name: str
    total_reviews: int
    average_overall_score: float | None
    completed_reviews: int


class EmployeePerformanceAnalyticsResponse(BaseModel):
    employee_id: int
    employee_name: str
    total_reviews: int
    completed_reviews: int
    average_overall_score: float | None
    average_goals_achievement: float | None
    average_productivity_score: float | None
    average_teamwork_score: float | None
    average_communication_score: float | None
    latest_rating: PerformanceRating | None
    latest_status: PerformanceReviewStatus | None