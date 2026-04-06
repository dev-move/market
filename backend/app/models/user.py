from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    """users 테이블 모델."""
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    username = Column(String(30), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    full_name = Column(String(50), nullable=False)
    password_legacy = Column("password", String(255), nullable=True)
    password_hash = Column(String(255), nullable=False)
    nickname = Column(String(30), unique=True, nullable=False)
    region_id = Column(Integer, ForeignKey("regions.id", ondelete="SET NULL"))
    created_at = Column(DateTime, server_default=func.now())

    region = relationship("Region")
    items = relationship(
        "Item",
        back_populates="user",
        foreign_keys="Item.user_id",
        cascade="all, delete-orphan",
    )
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    buyer_chat_rooms = relationship(
        "ChatRoom",
        foreign_keys="ChatRoom.buyer_id",
        back_populates="buyer",
        cascade="all, delete-orphan",
    )
    seller_chat_rooms = relationship(
        "ChatRoom",
        foreign_keys="ChatRoom.seller_id",
        back_populates="seller",
        cascade="all, delete-orphan",
    )
    chat_messages = relationship(
        "ChatMessage",
        foreign_keys="ChatMessage.sender_id",
        back_populates="sender",
        cascade="all, delete-orphan",
    )
    written_reviews = relationship(
        "Review",
        foreign_keys="Review.reviewer_id",
        back_populates="reviewer",
        cascade="all, delete-orphan",
    )
    received_reviews = relationship(
        "Review",
        foreign_keys="Review.seller_id",
        back_populates="seller",
        cascade="all, delete-orphan",
    )
    reports = relationship(
        "Report",
        foreign_keys="Report.reporter_id",
        back_populates="reporter",
        cascade="all, delete-orphan",
    )

    @property
    def password(self) -> str:
        return self.password_hash or self.password_legacy or ""

    @password.setter
    def password(self, value: str) -> None:
        self.password_hash = value
        self.password_legacy = value
