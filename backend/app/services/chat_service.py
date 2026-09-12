from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.chat import ChatConversation, ChatMessage
from app.models.user import User


# ============================================================
# GET OR CREATE CONVERSATION
# ============================================================

def get_or_create_conversation(
    db: Session,
    current_user_id: int,
    other_user_id: int,
):
    # --------------------------------------------------------
    # Prevent chatting with yourself
    # --------------------------------------------------------

    if current_user_id == other_user_id:
        raise HTTPException(
            status_code=400,
            detail="You cannot start a conversation with yourself.",
        )

    # --------------------------------------------------------
    # Check other user
    # --------------------------------------------------------

    other_user = (
        db.query(User)
        .filter(User.id == other_user_id)
        .first()
    )

    if not other_user:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    if not other_user.is_active:
        raise HTTPException(
            status_code=400,
            detail="The selected user is inactive.",
        )

    # --------------------------------------------------------
    # Find existing conversation
    # --------------------------------------------------------

    conversation = (
        db.query(ChatConversation)
        .filter(
            ChatConversation.is_active.is_(True),
            or_(
                (
                    ChatConversation.user_one_id
                    == current_user_id
                )
                & (
                    ChatConversation.user_two_id
                    == other_user_id
                ),
                (
                    ChatConversation.user_one_id
                    == other_user_id
                )
                & (
                    ChatConversation.user_two_id
                    == current_user_id
                ),
            ),
        )
        .first()
    )

    if conversation:
        return conversation

    # --------------------------------------------------------
    # Store user IDs in consistent order
    # --------------------------------------------------------

    user_one_id = min(
        current_user_id,
        other_user_id,
    )

    user_two_id = max(
        current_user_id,
        other_user_id,
    )

    conversation = ChatConversation(
        user_one_id=user_one_id,
        user_two_id=user_two_id,
        is_active=True,
    )

    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return conversation


# ============================================================
# GET USER CONVERSATIONS
# ============================================================

def get_user_conversations(
    db: Session,
    user_id: int,
):
    return (
        db.query(ChatConversation)
        .filter(
            ChatConversation.is_active.is_(True),
            or_(
                ChatConversation.user_one_id == user_id,
                ChatConversation.user_two_id == user_id,
            ),
        )
        .order_by(
            ChatConversation.updated_at.desc()
        )
        .all()
    )


# ============================================================
# GET CONVERSATION
# ============================================================

def get_conversation(
    db: Session,
    conversation_id: int,
    user_id: int,
):
    conversation = (
        db.query(ChatConversation)
        .filter(
            ChatConversation.id == conversation_id,
            ChatConversation.is_active.is_(True),
        )
        .first()
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found.",
        )

    # --------------------------------------------------------
    # Verify user belongs to conversation
    # --------------------------------------------------------

    if user_id not in (
        conversation.user_one_id,
        conversation.user_two_id,
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this conversation.",
        )

    return conversation


# ============================================================
# SEND MESSAGE
# ============================================================

def send_message(
    db: Session,
    conversation_id: int,
    sender_id: int,
    message_text: str,
):
    conversation = get_conversation(
        db,
        conversation_id,
        sender_id,
    )

    message_text = message_text.strip()

    if not message_text:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty.",
        )

    message = ChatMessage(
        conversation_id=conversation.id,
        sender_id=sender_id,
        message=message_text,
        is_read=False,
        is_edited=False,
        is_deleted=False,
    )

    db.add(message)

    conversation.updated_at = __import__(
        "datetime"
    ).datetime.utcnow()

    db.commit()
    db.refresh(message)

    return message


# ============================================================
# GET MESSAGES
# ============================================================

def get_conversation_messages(
    db: Session,
    conversation_id: int,
    user_id: int,
):
    get_conversation(
        db,
        conversation_id,
        user_id,
    )

    return (
        db.query(ChatMessage)
        .filter(
            ChatMessage.conversation_id == conversation_id
        )
        .order_by(
            ChatMessage.created_at.asc()
        )
        .all()
    )


# ============================================================
# EDIT MESSAGE
# ============================================================

def update_message(
    db: Session,
    message_id: int,
    user_id: int,
    new_message: str,
):
    message = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.id == message_id
        )
        .first()
    )

    if not message:
        raise HTTPException(
            status_code=404,
            detail="Message not found.",
        )

    if message.sender_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="You can only edit your own messages.",
        )

    if message.is_deleted:
        raise HTTPException(
            status_code=400,
            detail="Deleted messages cannot be edited.",
        )

    new_message = new_message.strip()

    if not new_message:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty.",
        )

    message.message = new_message
    message.is_edited = True

    db.commit()
    db.refresh(message)

    return message


# ============================================================
# DELETE MESSAGE
# ============================================================

def delete_message(
    db: Session,
    message_id: int,
    user_id: int,
):
    message = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.id == message_id
        )
        .first()
    )

    if not message:
        raise HTTPException(
            status_code=404,
            detail="Message not found.",
        )

    if message.sender_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="You can only delete your own messages.",
        )

    if message.is_deleted:
        raise HTTPException(
            status_code=400,
            detail="Message is already deleted.",
        )

    message.message = "This message was deleted."
    message.is_deleted = True

    db.commit()
    db.refresh(message)

    return message


# ============================================================
# MARK MESSAGE AS READ
# ============================================================

def mark_message_as_read(
    db: Session,
    message_id: int,
    user_id: int,
):
    message = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.id == message_id
        )
        .first()
    )

    if not message:
        raise HTTPException(
            status_code=404,
            detail="Message not found.",
        )

    conversation = get_conversation(
        db,
        message.conversation_id,
        user_id,
    )

    if message.sender_id == user_id:
        return message

    message.is_read = True

    db.commit()
    db.refresh(message)

    return message


# ============================================================
# GET UNREAD MESSAGE COUNT
# ============================================================

def get_unread_message_count(
    db: Session,
    user_id: int,
):
    count = (
        db.query(ChatMessage)
        .join(
            ChatConversation,
            ChatMessage.conversation_id
            == ChatConversation.id,
        )
        .filter(
            ChatMessage.sender_id != user_id,
            ChatMessage.is_read.is_(False),
            ChatConversation.is_active.is_(True),
            or_(
                ChatConversation.user_one_id == user_id,
                ChatConversation.user_two_id == user_id,
            ),
        )
        .count()
    )

    return count