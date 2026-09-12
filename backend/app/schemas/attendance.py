
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# ADMIN / HR — CREATE ATTENDANCE
# ============================================================

class AttendanceCreate(BaseModel):

    employee_id: int = Field(
        ...,
        gt=0,
    )

    attendance_date: date

    remarks: str | None = Field(
        default=None,
        max_length=1000,
    )


# ============================================================
# EMPLOYEE — CHECK IN
# ============================================================

class AttendanceCheckIn(BaseModel):

    attendance_date: date | None = None

    # Allows you to specify the check-in date and time.
    # Example:
    # "2026-09-11T09:00:00"
    check_in: datetime | None = None

    remarks: str | None = Field(
        default=None,
        max_length=1000,
    )


# ============================================================
# EMPLOYEE — CHECK OUT
# ============================================================

class AttendanceCheckOut(BaseModel):

    # Allows you to specify the check-out date and time.
    # Example:
    # "2026-09-11T18:00:00"
    check_out: datetime | None = None

    remarks: str | None = Field(
        default=None,
        max_length=1000,
    )


# ============================================================
# ATTENDANCE — UPDATE
# ============================================================

class AttendanceUpdate(BaseModel):

    attendance_date: date | None = None

    check_in: datetime | None = None

    check_out: datetime | None = None

    status: str | None = Field(
        default=None,
        max_length=30,
    )

    working_hours: float | None = Field(
        default=None,
        ge=0,
        le=24,
    )

    late_minutes: int | None = Field(
        default=None,
        ge=0,
    )

    remarks: str | None = Field(
        default=None,
        max_length=1000,
    )


# ============================================================
# ATTENDANCE RESPONSE
# ============================================================

class AttendanceResponse(BaseModel):

    id: int

    employee_id: int

    attendance_date: date

    check_in: datetime | None

    check_out: datetime | None

    status: str

    working_hours: float | None

    late_minutes: int

    remarks: str | None

    created_at: datetime

    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


# ============================================================
# ATTENDANCE ANALYTICS RESPONSE
# ============================================================

class AttendanceAnalyticsResponse(BaseModel):

    employee_id: int | None = None

    start_date: date

    end_date: date

    total_records: int

    present_days: int

    late_days: int

    half_days: int

    absent_days: int

    attendance_percentage: float

    total_working_hours: float

    average_working_hours: float

    model_config = ConfigDict(
        from_attributes=True,
    )
