from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Text, UniqueConstraint, func
from sqlalchemy.orm import relationship

from app.database import Base


class ChatRoom(Base):
    """상품별 1:1 채팅방 모델."""

    __tablename__ = "chat_rooms"
    __table_args__ = (
        UniqueConstraint("item_id", "buyer_id", name="uq_chat_room_item_buyer"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    item_id = Column(BigInteger, ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    buyer_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    seller_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    item = relationship("Item", back_populates="chat_rooms")
    buyer = relationship("User", foreign_keys=[buyer_id], back_populates="buyer_chat_rooms")
    seller = relationship("User", foreign_keys=[seller_id], back_populates="seller_chat_rooms")
    messages = relationship(
        "ChatMessage",
        back_populates="room",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at",
    )

    @property
    def item_title(self) -> str | None:
        if not self.item:
            return None
        return self.item.title

    @property
    def last_message(self) -> str | None:
        if not self.messages:
            return None
        return self.messages[-1].message

    @property
    def last_message_at(self):
        if not self.messages:
            return None
        return self.messages[-1].created_at


class ChatMessage(Base):
    """채팅 메시지 모델."""

    __tablename__ = "chat_messages"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    room_id = Column(BigInteger, ForeignKey("chat_rooms.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    room = relationship("ChatRoom", back_populates="messages")
    sender = relationship("User", back_populates="chat_messages")
