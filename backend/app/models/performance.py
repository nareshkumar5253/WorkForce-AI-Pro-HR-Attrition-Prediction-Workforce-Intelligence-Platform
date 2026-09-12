from datetime import date, datetime
from enum import Enum

from sqlalchemy import (
    Date,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PerformanceReviewStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    COMPLETED = "COMPLETED"


class PerformanceRating(str, Enum):
    EXCEPTIONAL = "EXCEPTIONAL"
    EXCEEDS_EXPECTATIONS = "EXCEEDS_EXPECTATIONS"
    MEETS_EXPECTATIONS = "MEETS_EXPECTATIONS"
    NEEDS_IMPROVEMENT = "NEEDS_IMPROVEMENT"
    UNSATISFACTORY = "UNSATISFACTORY"


class PerformanceReview(Base):
    __tablename__ = "performance_reviews"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )

    employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id"),
        nullable=False,
        index=True,
    )

    reviewer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    review_period_start: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    review_period_end: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    rating: Mapped[PerformanceRating | None] = mapped_column(
        SQLEnum(PerformanceRating),
        nullable=True,
        index=True,
    )

    overall_score: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    goals_achievement: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    productivity_score: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    teamwork_score: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    communication_score: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    strengths: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    areas_for_improvement: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    manager_comments: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    employee_comments: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[PerformanceReviewStatus] = mapped_column(
        SQLEnum(PerformanceReviewStatus),
        default=PerformanceReviewStatus.DRAFT,
        nullable=False,
        index=True,
    )

    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    acknowledged_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    employee = relationship(
        "Employee",
        backref="performance_reviews",
    )

    reviewer = relationship(
        "User",
        backref="performance_reviews_given",
    )