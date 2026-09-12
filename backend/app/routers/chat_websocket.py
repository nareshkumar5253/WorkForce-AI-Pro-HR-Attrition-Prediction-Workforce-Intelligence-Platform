from datetime import datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError

from app.core.security import decode_token
from app.core.database import SessionLocal
from app.models.chat import ChatConversation, ChatMessage


router = APIRouter(
    tags=["Chat WebSocket"],
)


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, set[WebSocket]] = {}

    async def connect(
        self,
        conversation_id: int,
        websocket: WebSocket,
    ):
        await websocket.accept()

        if conversation_id not in self.active_connections:
            self.active_connections[conversation_id] = set()

        self.active_connections[conversation_id].add(websocket)

    def disconnect(
        self,
        conversation_id: int,
        websocket: WebSocket,
    ):
        connections = self.active_connections.get(conversation_id)

        if not connections:
            return

        connections.discard(websocket)

        if not connections:
            del self.active_connections[conversation_id]

    async def broadcast(
        self,
        conversation_id: int,
        message_data: dict,
    ):
        connections = self.active_connections.get(
            conversation_id,
            set(),
        )

        disconnected = []

        for connection in connections:
            try:
                await connection.send_json(message_data)
            except Exception:
                disconnected.append(connection)

        for connection in disconnected:
            self.disconnect(
                conversation_id,
                connection,
            )


manager = ConnectionManager()


def authenticate_websocket(token: str):
    try:
        payload = decode_token(token)

        if payload.get("type") != "access":
            return None

        user_id = payload.get("sub")

        if not user_id:
            return None

        return int(user_id)

    except (JWTError, ValueError, TypeError):
        return None


def get_conversation(
    db,
    conversation_id: int,
):
    return (
        db.query(ChatConversation)
        .filter(
            ChatConversation.id == conversation_id,
            ChatConversation.is_active.is_(True),
        )
        .first()
    )


@router.websocket(
    "/ws/chat/{conversation_id}"
)
async def chat_websocket(
    websocket: WebSocket,
    conversation_id: int,
):
    token = websocket.query_params.get("token")

    if not token:
        await websocket.close(
            code=1008,
            reason="Authentication token required.",
        )
        return

    user_id = authenticate_websocket(token)

    if not user_id:
        await websocket.close(
            code=1008,
            reason="Invalid authentication token.",
        )
        return

    db = SessionLocal()

    try:
        conversation = get_conversation(
            db,
            conversation_id,
        )

        if not conversation:
            await websocket.close(
                code=1008,
                reason="Conversation not found.",
            )
            return

        if user_id not in (
            conversation.user_one_id,
            conversation.user_two_id,
        ):
            await websocket.close(
                code=1008,
                reason="You do not have access to this conversation.",
            )
            return

        await manager.connect(
            conversation_id,
            websocket,
        )

        await websocket.send_json(
            {
                "type": "connection",
                "message": "Connected to chat successfully.",
                "conversation_id": conversation_id,
                "user_id": user_id,
            }
        )

        while True:
            data = await websocket.receive_json()

            message_text = str(
                data.get("message", "")
            ).strip()

            if not message_text:
                await websocket.send_json(
                    {
                        "type": "error",
                        "message": "Message cannot be empty.",
                    }
                )
                continue

            if len(message_text) > 5000:
                await websocket.send_json(
                    {
                        "type": "error",
                        "message": "Message cannot exceed 5000 characters.",
                    }
                )
                continue

            message = ChatMessage(
                conversation_id=conversation_id,
                sender_id=user_id,
                message=message_text,
                is_read=False,
                is_edited=False,
                is_deleted=False,
            )

            db.add(message)

            conversation.updated_at = datetime.utcnow()

            db.commit()
            db.refresh(message)

            message_data = {
                "type": "message",
                "id": message.id,
                "conversation_id": message.conversation_id,
                "sender_id": message.sender_id,
                "message": message.message,
                "is_read": message.is_read,
                "is_edited": message.is_edited,
                "is_deleted": message.is_deleted,
                "created_at": message.created_at.isoformat(),
                "updated_at": message.updated_at.isoformat(),
            }

            await manager.broadcast(
                conversation_id,
                message_data,
            )

    except WebSocketDisconnect:
        manager.disconnect(
            conversation_id,
            websocket,
        )

    except Exception as exc:
        manager.disconnect(
            conversation_id,
            websocket,
        )

        try:
            await websocket.close(
                code=1011,
                reason="Internal server error.",
            )
        except Exception:
            pass

    finally:
        db.close()