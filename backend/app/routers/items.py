from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.routers.deps import get_current_user
from app.models.item import Item
from app.models.item_image import ItemImage
from app.models.user import User
from app.schemas.report import ReportCreate, ReportResponse
from app.schemas.chat import ChatRoomResponse
from app.schemas.review import ReviewCreate, ReviewResponse
from app.schemas.item import ItemCreate, ItemDetailResponse, ItemImageResponse, ItemResponse, ItemUpdate
from app.services.item_service import ItemService

router = APIRouter()
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads" / "items"


@router.post("", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(
    body: ItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return ItemService.create_item(
            db,
            user_id=current_user.id,
            region_id=body.region_id,
            category_id=body.category_id,
            title=body.title,
            description=body.description,
            price=body.price,
            status=body.status,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("")
def list_items(
    region_id: Optional[int] = Query(default=None),
    category_id: Optional[int] = Query(default=None),
    q: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=50),
    db: Session = Depends(get_db),
):
    try:
        result = ItemService.list_items(
            db,
            region_id=region_id,
            category_id=category_id,
            keyword=q,
            page=page,
            size=size,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    return {
        "total": result["total"],
        "page": result["page"],
        "size": result["size"],
        "items": [
            ItemResponse.model_validate(item).model_dump(mode="json")
            for item in result["items"]
        ],
    }


@router.get("/{item_id}", response_model=ItemDetailResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    try:
        return ItemService.get_item(db, item_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.put("/{item_id}", response_model=ItemResponse)
def update_item(
    item_id: int,
    body: ItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return ItemService.update_item(
            db,
            item_id=item_id,
            user_id=current_user.id,
            region_id=body.region_id,
            category_id=body.category_id,
            title=body.title,
            description=body.description,
            price=body.price,
            status=body.status,
        )
    except ValueError as exc:
        detail = str(exc)
        if "본인 상품만" in detail:
            raise HTTPException(status_code=403, detail=detail)
        raise HTTPException(status_code=404, detail=detail)


@router.post("/{item_id}/images", response_model=list[ItemImageResponse], status_code=status.HTTP_201_CREATED)
async def upload_item_images(
    item_id: int,
    images: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="존재하지 않는 상품입니다")

    if item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="본인 상품에만 이미지를 업로드할 수 있습니다")

    if not images:
        raise HTTPException(status_code=400, detail="업로드할 이미지가 없습니다")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    saved_images: list[ItemImage] = []
    for image in images:
        if not image.content_type or not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="이미지 파일만 업로드할 수 있습니다")

        extension = Path(image.filename or "").suffix or ".jpg"
        filename = f"{item_id}_{uuid4().hex}{extension}"
        file_path = UPLOAD_DIR / filename
        content = await image.read()
        file_path.write_bytes(content)

        item_image = ItemImage(
            item_id=item_id,
            image_url=f"/uploads/items/{filename}",
        )
        db.add(item_image)
        saved_images.append(item_image)

    db.commit()

    for item_image in saved_images:
        db.refresh(item_image)

    return saved_images


@router.delete("/{item_id}/images/{image_id}")
def delete_item_image(
    item_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="존재하지 않는 상품입니다")

    if item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="본인 상품의 이미지만 삭제할 수 있습니다")

    image = (
        db.query(ItemImage)
        .filter(ItemImage.id == image_id, ItemImage.item_id == item_id)
        .first()
    )
    if not image:
        raise HTTPException(status_code=404, detail="존재하지 않는 이미지입니다")

    filename = Path(image.image_url).name
    file_path = UPLOAD_DIR / filename
    if file_path.exists():
        file_path.unlink()

    db.delete(image)
    db.commit()
    return {"deleted": True}


@router.post("/{item_id}/favorite")
def add_favorite(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        favorite = ItemService.add_favorite(db, item_id=item_id, user_id=current_user.id)
    except ValueError as exc:
        detail = str(exc)
        status_code = 409 if "이미 찜한" in detail else 404
        raise HTTPException(status_code=status_code, detail=detail)

    return {
        "id": favorite.id,
        "user_id": favorite.user_id,
        "item_id": favorite.item_id,
        "created_at": favorite.created_at,
    }


@router.delete("/{item_id}/favorite")
def remove_favorite(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        ItemService.remove_favorite(db, item_id=item_id, user_id=current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    return {"deleted": True}


@router.delete("/{item_id}")
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        ItemService.delete_item(db, item_id=item_id, user_id=current_user.id)
    except ValueError as exc:
        detail = str(exc)
        status_code = 403 if "본인 상품만" in detail else 404
        raise HTTPException(status_code=status_code, detail=detail)

    return {"deleted": True}


@router.get("/{item_id}/reviews", response_model=list[ReviewResponse])
def list_item_reviews(item_id: int, db: Session = Depends(get_db)):
    return ItemService.list_item_reviews(db, item_id=item_id)


@router.post("/{item_id}/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    item_id: int,
    body: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return ItemService.create_review(
            db,
            item_id=item_id,
            reviewer_id=current_user.id,
            score=body.score,
            comment=body.comment,
        )
    except ValueError as exc:
        detail = str(exc)
        status_code = 409 if "이미 후기를" in detail else 400
        raise HTTPException(status_code=status_code, detail=detail)


@router.post("/{item_id}/reports", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    item_id: int,
    body: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return ItemService.create_report(
            db,
            item_id=item_id,
            reporter_id=current_user.id,
            reason=body.reason,
            detail=body.detail,
        )
    except ValueError as exc:
        detail = str(exc)
        status_code = 403 if "본인 상품은" in detail else 404 if "존재하지 않는" in detail else 400
        raise HTTPException(status_code=status_code, detail=detail)


@router.post("/{item_id}/chat", response_model=ChatRoomResponse, status_code=status.HTTP_201_CREATED)
def create_chat_room(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return ItemService.create_chat_room(db, item_id=item_id, buyer_id=current_user.id)
    except ValueError as exc:
        detail = str(exc)
        status_code = 400 if "판매자" in detail else 404
        raise HTTPException(status_code=status_code, detail=detail)
