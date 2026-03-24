from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ChatUserSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nickname: str


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    room_id: int
    sender_id: int
    message: str
    created_at: datetime
    sender: ChatUserSummary


class ChatRoomResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    item_id: int
    buyer_id: int
    seller_id: int
    created_at: datetime
    buyer: ChatUserSummary
    seller: ChatUserSummary
    item_title: str | None = None
    item_status: str | None = None
    item_thumbnail_url: str | None = None
    last_message: str | None = None
    last_message_at: datetime | None = None
    partner_nickname: str | None = None
