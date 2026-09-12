from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DatasetBase(BaseModel):
    name: str
    description: str | None = None


class DatasetResponse(BaseModel):
    id: int
    name: str
    description: str | None

    file_name: str
    file_path: str
    file_type: str
    file_size: int

    row_count: int
    column_count: int
    columns: str | None

    is_active: bool
    uploaded_by: int | None

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class DatasetStatusResponse(BaseModel):
    id: int
    name: str
    is_active: bool

    model_config = ConfigDict(
        from_attributes=True
    )