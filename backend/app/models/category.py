from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, String, func
from sqlalchemy.orm import relationship
from app.database import Base


class Category(Base):
    """트리 구조 카테고리 모델."""
    __tablename__ = "categories"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    parent_id = Column(BigInteger, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    parent = relationship("Category", remote_side=[id], back_populates="children")
    children = relationship("Category", back_populates="parent")
    items = relationship("Item", back_populates="category")
