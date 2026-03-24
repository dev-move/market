from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.database import Base


class Favorite(Base):
    """관심 상품 (users 1-N, items 1-N, N:N through favorites)"""
    __tablename__ = "favorites"
    __table_args__ = (UniqueConstraint("user_id", "item_id", name="uq_favorite_user_item"),)

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(BigInteger, ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="favorites")
    item = relationship("Item", back_populates="favorites")
