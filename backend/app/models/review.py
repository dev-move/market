from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import relationship

from app.database import Base


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("item_id", "reviewer_id", name="uq_review_item_reviewer"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    item_id = Column(BigInteger, ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    reviewer_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    seller_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    score = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    item = relationship("Item", back_populates="reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="written_reviews")
    seller = relationship("User", foreign_keys=[seller_id], back_populates="received_reviews")
