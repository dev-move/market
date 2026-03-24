from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ItemImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    item_id: int
    image_url: str
    created_at: datetime


class ItemAuthorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    nickname: str
    region_id: int | None = None
    created_at: datetime


class ItemCreate(BaseModel):
    region_id: int
    category_id: int | None = None
    title: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    price: int = Field(..., ge=0)
    status: str = Field(default="selling", max_length=20)


class ItemUpdate(BaseModel):
    region_id: int | None = None
    category_id: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    price: int | None = Field(default=None, ge=0)
    status: str | None = Field(default=None, max_length=20)


class ItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    region_id: int
    category_id: int | None = None
    title: str
    description: str | None = None
    price: int
    status: str
    created_at: datetime
    region_name: str | None = None
    category_name: str | None = None
    seller_nickname: str | None = None
    thumbnail_url: str | None = None


class ItemDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    region_id: int
    category_id: int | None = None
    title: str
    description: str | None = None
    price: int
    status: str
    created_at: datetime
    region_name: str | None = None
    category_name: str | None = None
    seller_nickname: str | None = None
    thumbnail_url: str | None = None
    user: ItemAuthorResponse
    images: list[ItemImageResponse] = []
