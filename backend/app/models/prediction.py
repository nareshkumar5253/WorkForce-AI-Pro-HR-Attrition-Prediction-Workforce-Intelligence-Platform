from datetime import datetime

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AttritionPrediction(Base):
    __tablename__ = "attrition_predictions"

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

    dataset_id: Mapped[int | None] = mapped_column(
        ForeignKey("datasets.id"),
        nullable=True,
        index=True,
    )

    prediction: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    attrition_probability: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    risk_level: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
    )

    model_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    input_data: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    employee = relationship(
        "Employee",
        backref="attrition_predictions",
    )

    dataset = relationship(
        "Dataset",
        backref="attrition_predictions",
    )