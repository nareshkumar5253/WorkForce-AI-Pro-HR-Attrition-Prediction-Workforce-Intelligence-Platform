from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.leave import LeaveTypeCode
from app.models.leave import LeaveRequestStatus

class LeaveTypeCreate(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    code: LeaveTypeCode

    description: str | None = Field(
        default=None,
        max_length=2000,
    )

    default_days: int = Field(
        default=0,
        ge=0,
        le=365,
    )


class LeaveTypeUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    code: LeaveTypeCode | None = None

    description: str | None = Field(
        default=None,
        max_length=2000,
    )

    default_days: int | None = Field(
        default=None,
        ge=0,
        le=365,
    )

    is_active: bool | None = None


class LeaveTypeResponse(BaseModel):
    id: int
    name: str
    code: LeaveTypeCode
    description: str | None
    default_days: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.leave import LeaveRequestStatus


class LeaveRequestCreate(BaseModel):
    leave_type_id: int = Field(..., gt=0)
    start_date: date
    end_date: date
    reason: str = Field(..., min_length=3, max_length=5000)


class LeaveRequestReview(BaseModel):
    reviewer_remarks: str | None = Field(
        default=None,
        max_length=5000,
    )


class LeaveRequestResponse(BaseModel):
    id: int
    employee_id: int
    leave_type_id: int

    start_date: date
    end_date: date
    total_days: int

    reason: str

    status: LeaveRequestStatus

    reviewer_id: int | None
    reviewer_remarks: str | None
    reviewed_at: datetime | None

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)