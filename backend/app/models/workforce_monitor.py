from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class WorkforceStatus:
    ACTIVE = "ACTIVE"
    PRESENT = "PRESENT"
    LATE = "LATE"
    ABSENT = "ABSENT"
    ON_LEAVE = "ON_LEAVE"
    OFFLINE = "OFFLINE"


class WorkforceMonitor(Base):
    __tablename__ = "workforce_monitoring"

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

    attendance_id: Mapped[int | None] = mapped_column(
        ForeignKey("attendance.id"),
        nullable=True,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        index=True,
    )

    check_in_time: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    check_out_time: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    last_activity: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    location: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    device_info: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
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
        backref="workforce_monitoring",
    )