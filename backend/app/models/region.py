from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base


class Region(Base):
    """지역/동네 (시/구/동)"""
    __tablename__ = "regions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    city = Column(String(20), nullable=False)
    district = Column(String(20), nullable=False)
    dong = Column(String(30), nullable=False)
    code = Column(String(10), unique=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    # regions 1 --- N items (상품 등록 동네)
    items = relationship("Item", back_populates="region")
