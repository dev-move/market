from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CategoryTreeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    parent_id: int | None = None
    created_at: datetime
    children: list["CategoryTreeResponse"] = []


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    parent_id: int | None = None
