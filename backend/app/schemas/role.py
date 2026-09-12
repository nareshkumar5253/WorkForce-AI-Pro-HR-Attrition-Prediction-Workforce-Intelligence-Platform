from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class JobRoleCreate(BaseModel):
    title: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    code: str = Field(
        ...,
        min_length=2,
        max_length=30,
    )

    description: str | None = Field(
        default=None,
        max_length=1000,
    )

    level: str | None = Field(
        default=None,
        max_length=50,
    )


class JobRoleUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    code: str | None = Field(
        default=None,
        min_length=2,
        max_length=30,
    )

    description: str | None = Field(
        default=None,
        max_length=1000,
    )

    level: str | None = Field(
        default=None,
        max_length=50,
    )

    is_active: bool | None = None


class JobRoleResponse(BaseModel):
    id: int
    title: str
    code: str
    description: str | None
    level: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )