from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import relationship

from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    item_id = Column(BigInteger, ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    reporter_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reason = Column(String(100), nullable=False)
    detail = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="pending")
    admin_note = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    item = relationship("Item", back_populates="reports")
    reporter = relationship("User", back_populates="reports")
