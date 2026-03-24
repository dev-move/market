from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, String, func
from sqlalchemy.orm import relationship
from app.database import Base


class ItemImage(Base):
    """상품 이미지 (items 1-N)"""
    __tablename__ = "item_images"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    item_id = Column(BigInteger, ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String(500), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    item = relationship("Item", back_populates="images")
