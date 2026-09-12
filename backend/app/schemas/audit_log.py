from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AuditLogCreate(BaseModel):
    user_id: int | None = None
    action: str
    module: str
    description: str
    entity_type: str | None = None
    entity_id: int | None = None
    ip_address: str | None = None
    user_agent: str | None = None


class AuditLogResponse(BaseModel):
    id: int
    user_id: int | None
    action: str
    module: str
    description: str
    entity_type: str | None
    entity_id: int | None
    ip_address: str | None
    user_agent: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogSummaryResponse(BaseModel):
    total_logs: int
    create_actions: int
    update_actions: int
    delete_actions: int
    login_actions: int
    other_actions: int