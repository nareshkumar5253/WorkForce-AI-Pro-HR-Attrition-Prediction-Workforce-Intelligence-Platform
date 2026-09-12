from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.payroll import PayrollStatus


class PayrollCreate(BaseModel):
    employee_id: int = Field(..., gt=0)

    payroll_year: int = Field(
        ...,
        ge=2000,
        le=2100,
    )

    payroll_month: int = Field(
        ...,
        ge=1,
        le=12,
    )

    basic_salary: Decimal = Field(
        ...,
        ge=0,
        decimal_places=2,
    )

    hra: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        decimal_places=2,
    )

    allowances: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        decimal_places=2,
    )

    bonus: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        decimal_places=2,
    )

    deductions: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        decimal_places=2,
    )

    remarks: str | None = Field(
        default=None,
        max_length=5000,
    )


class PayrollUpdate(BaseModel):
    basic_salary: Decimal | None = Field(
        default=None,
        ge=0,
        decimal_places=2,
    )

    hra: Decimal | None = Field(
        default=None,
        ge=0,
        decimal_places=2,
    )

    allowances: Decimal | None = Field(
        default=None,
        ge=0,
        decimal_places=2,
    )

    bonus: Decimal | None = Field(
        default=None,
        ge=0,
        decimal_places=2,
    )

    deductions: Decimal | None = Field(
        default=None,
        ge=0,
        decimal_places=2,
    )

    status: PayrollStatus | None = None

    payment_date: datetime | None = None

    remarks: str | None = Field(
        default=None,
        max_length=5000,
    )


class PayrollResponse(BaseModel):
    id: int
    employee_id: int

    payroll_year: int
    payroll_month: int

    basic_salary: Decimal
    hra: Decimal
    allowances: Decimal
    bonus: Decimal
    deductions: Decimal

    gross_salary: Decimal
    net_salary: Decimal

    status: PayrollStatus

    payment_date: datetime | None
    remarks: str | None

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )