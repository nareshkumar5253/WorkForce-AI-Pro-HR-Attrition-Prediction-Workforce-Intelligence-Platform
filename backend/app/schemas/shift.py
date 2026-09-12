from datetime import datetime, time

from pydantic import BaseModel, ConfigDict, Field


class ShiftCreate(BaseModel):

    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    code: str = Field(
        ...,
        min_length=2,
        max_length=30,
    )

    start_time: time

    end_time: time

    grace_minutes: int = Field(
        default=15,
        ge=0,
        le=120,
    )

    description: str | None = Field(
        default=None,
        max_length=1000,
    )


class ShiftUpdate(BaseModel):

    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    code: str | None = Field(
        default=None,
        min_length=2,
        max_length=30,
    )

    start_time: time | None = None

    end_time: time | None = None

    grace_minutes: int | None = Field(
        default=None,
        ge=0,
        le=120,
    )

    description: str | None = Field(
        default=None,
        max_length=1000,
    )

    is_active: bool | None = None


class ShiftResponse(BaseModel):

    id: int
    name: str
    code: str
    start_time: time
    end_time: time
    grace_minutes: int
    description: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )