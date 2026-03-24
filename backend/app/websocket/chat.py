import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status

from app.core.security import decode_access_token
from app.database import SessionLocal
from app.models.chat import ChatMessage, ChatRoom
from app.models.user import User

router = APIRouter()


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(self, room_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.setdefault(room_id, []).append(websocket)

    def disconnect(self, room_id: int, websocket: WebSocket) -> None:
        room_connections = self.active_connections.get(room_id, [])
        if websocket in room_connections:
            room_connections.remove(websocket)
        if not room_connections and room_id in self.active_connections:
            del self.active_connections[room_id]

    async def broadcast(self, room_id: int, message: dict) -> None:
        for connection in self.active_connections.get(room_id, []):
            await connection.send_json(message)


manager = ConnectionManager()


def _extract_message(raw_text: str) -> str:
    try:
        payload = json.loads(raw_text)
    except json.JSONDecodeError:
        return raw_text.strip()

    if isinstance(payload, dict):
        return str(payload.get("message", "")).strip()
    return raw_text.strip()


@router.websocket("/ws/chat/{room_id}")
async def chat_websocket(websocket: WebSocket, room_id: int):
    token = websocket.query_params.get("token")
    if not token:
        authorization = websocket.headers.get("authorization", "")
        if authorization.lower().startswith("bearer "):
            token = authorization.split(" ", 1)[1].strip()

    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="인증이 필요합니다")
        return

    db = SessionLocal()
    try:
        try:
            payload = decode_access_token(token)
        except Exception:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="유효하지 않은 토큰입니다")
            return

        user = db.query(User).filter(User.id == int(payload["sub"])).first()
        room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()

        if not user or not room:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="채팅방 또는 사용자를 찾을 수 없습니다")
            return

        if user.id not in {room.buyer_id, room.seller_id}:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="채팅방 참여 권한이 없습니다")
            return

        await manager.connect(room_id, websocket)

        await manager.broadcast(
            room_id,
            {
                "type": "system",
                "room_id": room_id,
                "message": f"{user.nickname} joined",
                "user_id": user.id,
            },
        )

        while True:
            raw_text = await websocket.receive_text()
            message_text = _extract_message(raw_text)
            if not message_text:
                continue

            chat_message = ChatMessage(
                room_id=room_id,
                sender_id=user.id,
                message=message_text,
            )
            db.add(chat_message)
            db.commit()
            db.refresh(chat_message)

            await manager.broadcast(
                room_id,
                {
                    "type": "message",
                    "id": chat_message.id,
                    "room_id": room_id,
                    "sender_id": user.id,
                    "sender_nickname": user.nickname,
                    "message": chat_message.message,
                    "created_at": chat_message.created_at.isoformat() if chat_message.created_at else None,
                },
            )

    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)
    finally:
        db.close()
