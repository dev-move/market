from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship
from app.database import Base


class Item(Base):
    """items 테이블 모델."""
    __tablename__ = "items"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    region_id = Column(Integer, ForeignKey("regions.id", ondelete="RESTRICT"), nullable=False)
    category_id = Column(BigInteger, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=True)
    title = Column(String(100), nullable=False)
    description = Column(Text)
    price = Column(Integer, nullable=False, default=0)
    status = Column(String(20), nullable=False, default="selling")
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="items", foreign_keys=[user_id])
    region = relationship("Region", back_populates="items", foreign_keys=[region_id])
    category = relationship("Category", back_populates="items", foreign_keys=[category_id])
    images = relationship(
        "ItemImage",
        back_populates="item",
        cascade="all, delete-orphan",
        order_by="ItemImage.created_at",
    )
    favorites = relationship("Favorite", back_populates="item", cascade="all, delete-orphan")
    chat_rooms = relationship("ChatRoom", back_populates="item", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="item", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="item", cascade="all, delete-orphan")

    @property
    def region_name(self) -> str | None:
        if not self.region:
            return None
        return f"{self.region.city} {self.region.district} {self.region.dong}"

    @property
    def category_name(self) -> str | None:
        if not self.category:
            return None
        return self.category.name

    @property
    def seller_nickname(self) -> str | None:
        if not self.user:
            return None
        return self.user.nickname

    @property
    def thumbnail_url(self) -> str | None:
        if not self.images:
            return None
        return self.images[0].image_url
