from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.task import TaskPriority, TaskStatus


class TaskCreate(BaseModel):
    title: str = Field(
        ...,
        min_length=3,
        max_length=200,
    )

    description: str | None = Field(
        default=None,
        max_length=10000,
    )

    assigned_to: int = Field(
        ...,
        gt=0,
    )

    priority: TaskPriority = TaskPriority.MEDIUM

    due_date: date | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=3,
        max_length=200,
    )

    description: str | None = Field(
        default=None,
        max_length=10000,
    )

    assigned_to: int | None = Field(
        default=None,
        gt=0,
    )

    priority: TaskPriority | None = None

    status: TaskStatus | None = None

    due_date: date | None = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str | None
    assigned_to: int
    created_by: int
    priority: TaskPriority
    status: TaskStatus
    due_date: date | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )