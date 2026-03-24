from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.deps import get_admin_user
from app.schemas.report import AdminReportResponse, AdminReportUpdate
from app.services.item_service import ItemService

router = APIRouter()


@router.get("/reports", response_model=list[AdminReportResponse])
def list_reports(
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    return ItemService.list_admin_reports(db)


@router.patch("/reports/{report_id}", response_model=AdminReportResponse)
def update_report(
    report_id: int,
    body: AdminReportUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    try:
        return ItemService.update_admin_report(
            db,
            report_id=report_id,
            status=body.status,
            admin_note=body.admin_note,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
