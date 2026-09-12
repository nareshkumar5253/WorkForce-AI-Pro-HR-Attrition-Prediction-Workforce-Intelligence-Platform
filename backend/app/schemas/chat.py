from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# CREATE CONVERSATION
# ============================================================

class ConversationCreate(BaseModel):
    user_id: int = Field(..., gt=0)


# ============================================================
# CONVERSATION RESPONSE
# ============================================================

class ConversationResponse(BaseModel):
    id: int
    user_one_id: int
    user_two_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# SEND MESSAGE
# ============================================================

class MessageCreate(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=5000,
    )


# ============================================================
# UPDATE MESSAGE
# ============================================================

class MessageUpdate(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=5000,
    )


# ============================================================
# MESSAGE RESPONSE
# ============================================================

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    message: str
    is_read: bool
    is_edited: bool
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# UNREAD MESSAGE COUNT
# ============================================================

class UnreadMessageCountResponse(BaseModel):
    unread_count: int