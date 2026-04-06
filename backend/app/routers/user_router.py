from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.favorite import Favorite
from app.models.item import Item
from app.models.user import User
from app.routers.deps import get_current_user
from app.schemas.chat import ChatMessageResponse, ChatRoomResponse
from app.schemas.item import ItemResponse
from app.schemas.report import MyReportResponse
from app.schemas.review import MyReviewResponse
from app.schemas.user import (
    UserLogin,
    UserRecoverPassword,
    UserRecoverUsername,
    UserSignup,
)
from app.services.auth_service import AuthService
from app.services.item_service import ItemService

router = APIRouter()


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(body: UserSignup, db: Session = Depends(get_db)):
    try:
        user = AuthService.register(
            db,
            username=body.username.strip().lower(),
            email=str(body.email),
            password=body.password,
            nickname=body.nickname,
            full_name=body.full_name,
            region_id=body.region_id,
        )
    except ValueError as exc:
        detail = str(exc)
        status_code = 404 if "존재하지 않는 지역" in detail else 400
        raise HTTPException(status_code=status_code, detail=detail)

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "nickname": user.nickname,
        "full_name": user.full_name,
        "region_id": user.region_id,
        "created_at": user.created_at,
    }


@router.post("/login")
def login(body: UserLogin, db: Session = Depends(get_db)):
    try:
        return AuthService.login(db, body.username, body.password)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        )


@router.post("/recover/username")
def recover_username(body: UserRecoverUsername, db: Session = Depends(get_db)):
    username = AuthService.find_username(db, str(body.email), body.full_name)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="일치하는 회원 정보를 찾을 수 없습니다",
        )
    return {"username": username}


@router.post("/recover/password")
def recover_password(body: UserRecoverPassword, db: Session = Depends(get_db)):
    ok = AuthService.reset_password_if_verified(
        db,
        username=body.username,
        full_name=body.full_name,
        email=str(body.email),
        new_password=body.new_password,
    )
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="일치하는 회원 정보를 찾을 수 없습니다",
        )
    return {"ok": True}


@router.get("/me/favorites", response_model=list[ItemResponse])
def get_my_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = (
        db.query(Item)
        .options(
            joinedload(Item.user),
            joinedload(Item.region),
            joinedload(Item.category),
            joinedload(Item.images),
        )
        .join(Favorite, Favorite.item_id == Item.id)
        .filter(Favorite.user_id == current_user.id)
        .order_by(Favorite.created_at.desc())
        .all()
    )
    return items


@router.get("/me/items", response_model=list[ItemResponse])
def get_my_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ItemService.list_user_items(db, user_id=current_user.id)


@router.get("/me/chatrooms", response_model=list[ChatRoomResponse])
def get_my_chatrooms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ItemService.list_user_chatrooms(db, user_id=current_user.id)


@router.get("/me/chatrooms/{room_id}/messages", response_model=list[ChatMessageResponse])
def get_chatroom_messages(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return ItemService.list_chatroom_messages(
            db,
            room_id=room_id,
            user_id=current_user.id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/me/reviews", response_model=list[MyReviewResponse])
def get_my_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ItemService.list_user_reviews(db, user_id=current_user.id)


@router.get("/me/reports", response_model=list[MyReportResponse])
def get_my_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ItemService.list_user_reports(db, user_id=current_user.id)
