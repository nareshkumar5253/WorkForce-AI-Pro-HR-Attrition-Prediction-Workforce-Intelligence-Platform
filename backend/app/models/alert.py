from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AlertType:
    ATTRITION_RISK = "ATTRITION_RISK"
    ATTENDANCE = "ATTENDANCE"
    LEAVE = "LEAVE"
    PAYROLL = "PAYROLL"
    WORKFORCE = "WORKFORCE"
    SYSTEM = "SYSTEM"


class AlertPriority:
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AlertStatus:
    UNREAD = "UNREAD"
    READ = "READ"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"


class HRAlert(Base):
    __tablename__ = "hr_alerts"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )

    employee_id: Mapped[int | None] = mapped_column(
        ForeignKey("employees.id"),
        nullable=True,
        index=True,
    )

    prediction_id: Mapped[int | None] = mapped_column(
        ForeignKey("attrition_predictions.id"),
        nullable=True,
        index=True,
    )

    alert_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    priority: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default=AlertStatus.UNREAD,
        nullable=False,
        index=True,
    )

    created_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    acknowledged_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    acknowledged_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    resolved_at: Mapped[datetime | None] = mapped_column(
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
        backref="hr_alerts",
    )

    prediction = relationship(
        "AttritionPrediction",
        backref="hr_alerts",
    )

    creator = relationship(
        "User",
        foreign_keys=[created_by],
        backref="created_hr_alerts",
    )

    acknowledger = relationship(
        "User",
        foreign_keys=[acknowledged_by],
        backref="acknowledged_hr_alerts",
    )