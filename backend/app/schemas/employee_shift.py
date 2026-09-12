from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class EmployeeShiftCreate(BaseModel):

    employee_id: int = Field(
        ...,
        gt=0,
    )

    shift_id: int = Field(
        ...,
        gt=0,
    )

    effective_from: date

    effective_to: date | None = None


class EmployeeShiftUpdate(BaseModel):

    shift_id: int | None = Field(
        default=None,
        gt=0,
    )

    effective_from: date | None = None

    effective_to: date | None = None

    is_active: bool | None = None


class EmployeeShiftResponse(BaseModel):

    id: int
    employee_id: int
    shift_id: int
    effective_from: date
    effective_to: date | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )