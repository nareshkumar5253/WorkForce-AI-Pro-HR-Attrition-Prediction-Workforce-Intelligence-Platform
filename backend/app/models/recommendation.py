from datetime import datetime
from enum import Enum

from sqlalchemy import (
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class RecommendationPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class RecommendationStatus(str, Enum):
    NEW = "NEW"
    REVIEWED = "REVIEWED"
    ACCEPTED = "ACCEPTED"
    IMPLEMENTED = "IMPLEMENTED"
    DISMISSED = "DISMISSED"


class RecommendationType(str, Enum):
    RETENTION = "RETENTION"
    PERFORMANCE = "PERFORMANCE"
    ATTENDANCE = "ATTENDANCE"
    WORKLOAD = "WORKLOAD"
    CAREER_DEVELOPMENT = "CAREER_DEVELOPMENT"
    ENGAGEMENT = "ENGAGEMENT"
    MANAGER_ACTION = "MANAGER_ACTION"


class AIRecommendation(Base):
    __tablename__ = "ai_recommendations"

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

    recommendation_type: Mapped[RecommendationType] = mapped_column(
        SQLEnum(RecommendationType),
        nullable=False,
        index=True,
    )

    priority: Mapped[RecommendationPriority] = mapped_column(
        SQLEnum(RecommendationPriority),
        default=RecommendationPriority.MEDIUM,
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    recommendation: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[RecommendationStatus] = mapped_column(
        SQLEnum(RecommendationStatus),
        default=RecommendationStatus.NEW,
        nullable=False,
        index=True,
    )

    generated_by: Mapped[str] = mapped_column(
        String(100),
        default="AI_RULE_ENGINE",
        nullable=False,
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
        backref="ai_recommendations",
    )