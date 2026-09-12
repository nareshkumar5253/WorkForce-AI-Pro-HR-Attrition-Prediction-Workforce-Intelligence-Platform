from datetime import datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import (
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PayrollStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSED = "PROCESSED"
    PAID = "PAID"


class Payroll(Base):
    __tablename__ = "payrolls"

    __table_args__ = (
        UniqueConstraint(
            "employee_id",
            "payroll_year",
            "payroll_month",
            name="uq_employee_payroll_period",
        ),
    )

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

    payroll_year: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )

    payroll_month: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )

    basic_salary: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    hra: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=0,
        nullable=False,
    )

    allowances: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=0,
        nullable=False,
    )

    bonus: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=0,
        nullable=False,
    )

    deductions: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=0,
        nullable=False,
    )

    gross_salary: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    net_salary: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    status: Mapped[PayrollStatus] = mapped_column(
        SQLEnum(PayrollStatus),
        default=PayrollStatus.PENDING,
        nullable=False,
        index=True,
    )

    payment_date: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    remarks: Mapped[str | None] = mapped_column(
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
        backref="payroll_records",
    )