from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.chat import (
    ConversationCreate,
    ConversationResponse,
    MessageCreate,
    MessageResponse,
    MessageUpdate,
    UnreadMessageCountResponse,
)
from app.services.chat_service import (
    get_or_create_conversation,
    get_user_conversations,
    get_conversation_messages,
    send_message,
    update_message,
    delete_message,
    mark_message_as_read,
    get_unread_message_count,
)


router = APIRouter(
    prefix="/chat",
    tags=["Chat"],
)


# ============================================================
# START / GET ONE-TO-ONE CONVERSATION
# ============================================================

@router.post(
    "/conversations",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_conversation(
    data: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_or_create_conversation(
        db=db,
        current_user_id=current_user.id,
        other_user_id=data.user_id,
    )


# ============================================================
# GET MY CONVERSATIONS
# ============================================================

@router.get(
    "/conversations",
    response_model=list[ConversationResponse],
)
def get_my_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_user_conversations(
        db=db,
        user_id=current_user.id,
    )


# ============================================================
# GET CONVERSATION MESSAGES
# ============================================================

@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=list[MessageResponse],
)
def get_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_conversation_messages(
        db=db,
        conversation_id=conversation_id,
        user_id=current_user.id,
    )


# ============================================================
# SEND MESSAGE
# ============================================================

@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_message(
    conversation_id: int,
    data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return send_message(
        db=db,
        conversation_id=conversation_id,
        sender_id=current_user.id,
        message_text=data.message,
    )


# ============================================================
# EDIT MESSAGE
# ============================================================

@router.put(
    "/messages/{message_id}",
    response_model=MessageResponse,
)
def edit_message(
    message_id: int,
    data: MessageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_message(
        db=db,
        message_id=message_id,
        user_id=current_user.id,
        new_message=data.message,
    )


# ============================================================
# DELETE MESSAGE
# ============================================================

@router.delete(
    "/messages/{message_id}",
    response_model=MessageResponse,
)
def remove_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return delete_message(
        db=db,
        message_id=message_id,
        user_id=current_user.id,
    )


# ============================================================
# MARK MESSAGE AS READ
# ============================================================

@router.post(
    "/messages/{message_id}/read",
    response_model=MessageResponse,
)
def read_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return mark_message_as_read(
        db=db,
        message_id=message_id,
        user_id=current_user.id,
    )


# ============================================================
# GET UNREAD MESSAGE COUNT
# ============================================================

@router.get(
    "/unread-count",
    response_model=UnreadMessageCountResponse,
)
def unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = get_unread_message_count(
        db=db,
        user_id=current_user.id,
    )

    return {
        "unread_count": count,
    }