from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.routers.deps import get_admin_user
from app.schemas.category import CategoryCreate
from app.services.category_service import CategoryService

router = APIRouter()


@router.get("")
def get_categories(db: Session = Depends(get_db)):
    return CategoryService.get_tree(db)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_category(
    body: CategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    try:
        return CategoryService.create(db, name=body.name, parent_id=body.parent_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
