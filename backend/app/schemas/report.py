from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReportCreate(BaseModel):
    reason: str = Field(..., min_length=1, max_length=100)
    detail: str | None = Field(default=None, max_length=500)


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    item_id: int
    reporter_id: int
    reason: str
    detail: str | None = None
    status: str
    admin_note: str | None = None
    reviewed_at: datetime | None = None
    created_at: datetime


class MyReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    item_id: int
    reason: str
    detail: str | None = None
    status: str
    admin_note: str | None = None
    reviewed_at: datetime | None = None
    created_at: datetime
    item_title: str | None = None
    item_status: str | None = None
    item_thumbnail_url: str | None = None


class AdminReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    item_id: int
    reporter_id: int
    reason: str
    detail: str | None = None
    status: str
    admin_note: str | None = None
    reviewed_at: datetime | None = None
    created_at: datetime
    item_title: str | None = None
    item_status: str | None = None
    item_thumbnail_url: str | None = None
    reporter_nickname: str | None = None
    reporter_email: str | None = None


class AdminReportUpdate(BaseModel):
    status: str = Field(..., min_length=1, max_length=20)
    admin_note: str | None = Field(default=None, max_length=1000)
