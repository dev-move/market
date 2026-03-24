from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReviewCreate(BaseModel):
    score: int = Field(..., ge=1, le=5)
    comment: str | None = Field(default=None, max_length=500)


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    item_id: int
    reviewer_id: int
    seller_id: int
    score: int
    comment: str | None = None
    created_at: datetime


class MyReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    item_id: int
    score: int
    comment: str | None = None
    created_at: datetime
    item_title: str | None = None
    item_status: str | None = None
    item_thumbnail_url: str | None = None
