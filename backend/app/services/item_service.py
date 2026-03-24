from datetime import datetime
from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.models.category import Category
from app.models.chat import ChatMessage, ChatRoom
from app.models.favorite import Favorite
from app.models.item import Item
from app.models.report import Report
from app.models.region import Region
from app.models.review import Review
from app.models.user import User


class ItemService:
    REPORT_STATUS_VALUES = {"pending", "reviewing", "resolved"}

    @staticmethod
    def _serialize_chat_room(room: ChatRoom, *, user_id: int) -> dict:
        latest_message = room.messages[-1] if room.messages else None
        partner = room.seller if room.buyer_id == user_id else room.buyer

        return {
            "id": room.id,
            "item_id": room.item_id,
            "buyer_id": room.buyer_id,
            "seller_id": room.seller_id,
            "created_at": room.created_at,
            "buyer": room.buyer,
            "seller": room.seller,
            "item_title": room.item.title if room.item else None,
            "item_status": room.item.status if room.item else None,
            "item_thumbnail_url": room.item.thumbnail_url if room.item else None,
            "last_message": latest_message.message if latest_message else None,
            "last_message_at": latest_message.created_at if latest_message else None,
            "partner_nickname": partner.nickname if partner else None,
        }

    @staticmethod
    def create_item(
        db: Session,
        *,
        user_id: int,
        region_id: int,
        category_id: int | None,
        title: str,
        description: str | None,
        price: int,
        status: str,
    ) -> Item:
        if not db.query(Region).filter(Region.id == region_id).first():
            raise ValueError("존재하지 않는 지역입니다")
        if category_id is not None and not db.query(Category).filter(Category.id == category_id).first():
            raise ValueError("존재하지 않는 카테고리입니다")

        item = Item(
            user_id=user_id,
            region_id=region_id,
            category_id=category_id,
            title=title,
            description=description,
            price=price,
            status=status,
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def list_items(
        db: Session,
        *,
        region_id: Optional[int] = None,
        category_id: Optional[int] = None,
        keyword: Optional[str] = None,
        page: int = 1,
        size: int = 20,
    ) -> dict:
        if region_id is not None and not db.query(Region).filter(Region.id == region_id).first():
            raise ValueError("존재하지 않는 지역입니다")
        if category_id is not None and not db.query(Category).filter(Category.id == category_id).first():
            raise ValueError("존재하지 않는 카테고리입니다")

        query = db.query(Item).options(
            joinedload(Item.user),
            joinedload(Item.region),
            joinedload(Item.category),
            joinedload(Item.images),
        )
        if region_id is not None:
            query = query.filter(Item.region_id == region_id)
        if category_id is not None:
            query = query.filter(Item.category_id == category_id)
        if keyword:
            keyword = keyword.strip()
            if keyword:
                search_like = f"%{keyword}%"
                query = query.filter(
                    or_(
                        Item.title.like(search_like),
                        Item.description.like(search_like),
                    )
                )

        if settings.HIDE_E2E_TEST_ITEMS_IN_LIST:
            query = query.filter(~Item.title.like("E2E %"))

        total = query.count()
        items = (
            query.order_by(Item.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
            .all()
        )
        return {"total": total, "page": page, "size": size, "items": items}

    @staticmethod
    def get_item(db: Session, item_id: int) -> Item:
        item = (
            db.query(Item)
            .options(
                joinedload(Item.user),
                joinedload(Item.region),
                joinedload(Item.category),
                joinedload(Item.images),
            )
            .filter(Item.id == item_id)
            .first()
        )
        if not item:
            raise ValueError("존재하지 않는 상품입니다")
        return item

    @staticmethod
    def update_item(
        db: Session,
        *,
        item_id: int,
        user_id: int,
        region_id: int | None = None,
        category_id: int | None = None,
        title: str | None = None,
        description: str | None = None,
        price: int | None = None,
        status: str | None = None,
    ) -> Item:
        item = (
            db.query(Item)
            .options(
                joinedload(Item.user),
                joinedload(Item.region),
                joinedload(Item.category),
                joinedload(Item.images),
            )
            .filter(Item.id == item_id)
            .first()
        )
        if not item:
            raise ValueError("존재하지 않는 상품입니다")
        if item.user_id != user_id:
            raise ValueError("본인 상품만 수정할 수 있습니다")

        if region_id is not None:
            if not db.query(Region).filter(Region.id == region_id).first():
                raise ValueError("존재하지 않는 지역입니다")
            item.region_id = region_id
        if category_id is not None:
            if not db.query(Category).filter(Category.id == category_id).first():
                raise ValueError("존재하지 않는 카테고리입니다")
            item.category_id = category_id
        if title is not None:
            item.title = title
        if description is not None:
            item.description = description
        if price is not None:
            item.price = price
        if status is not None:
            item.status = status

        db.commit()
        db.refresh(item)
        return (
            db.query(Item)
            .options(
                joinedload(Item.user),
                joinedload(Item.region),
                joinedload(Item.category),
                joinedload(Item.images),
            )
            .filter(Item.id == item.id)
            .first()
        )

    @staticmethod
    def add_favorite(db: Session, *, item_id: int, user_id: int) -> Favorite:
        item = db.query(Item).filter(Item.id == item_id).first()
        if not item:
            raise ValueError("존재하지 않는 상품입니다")

        exists = (
            db.query(Favorite)
            .filter(Favorite.user_id == user_id, Favorite.item_id == item_id)
            .first()
        )
        if exists:
            raise ValueError("이미 찜한 상품입니다")

        favorite = Favorite(user_id=user_id, item_id=item_id)
        db.add(favorite)
        db.commit()
        db.refresh(favorite)
        return favorite

    @staticmethod
    def remove_favorite(db: Session, *, item_id: int, user_id: int) -> None:
        favorite = (
            db.query(Favorite)
            .filter(Favorite.user_id == user_id, Favorite.item_id == item_id)
            .first()
        )
        if not favorite:
            raise ValueError("찜하지 않은 상품입니다")

        db.delete(favorite)
        db.commit()

    @staticmethod
    def create_chat_room(db: Session, *, item_id: int, buyer_id: int) -> ChatRoom:
        item = (
            db.query(Item)
            .options(joinedload(Item.user))
            .filter(Item.id == item_id)
            .first()
        )
        if not item:
            raise ValueError("존재하지 않는 상품입니다")
        if item.user_id == buyer_id:
            raise ValueError("판매자는 자신의 상품에 채팅을 시작할 수 없습니다")

        existing_room = (
            db.query(ChatRoom)
            .options(
                joinedload(ChatRoom.buyer),
                joinedload(ChatRoom.seller),
                joinedload(ChatRoom.item).joinedload(Item.images),
                joinedload(ChatRoom.messages).joinedload(ChatMessage.sender),
            )
            .filter(ChatRoom.item_id == item_id, ChatRoom.buyer_id == buyer_id)
            .first()
        )
        if existing_room:
            return existing_room

        chat_room = ChatRoom(
            item_id=item_id,
            buyer_id=buyer_id,
            seller_id=item.user_id,
        )
        db.add(chat_room)
        db.commit()
        db.refresh(chat_room)
        return (
            db.query(ChatRoom)
            .options(
                joinedload(ChatRoom.buyer),
                joinedload(ChatRoom.seller),
                joinedload(ChatRoom.item).joinedload(Item.images),
                joinedload(ChatRoom.messages).joinedload(ChatMessage.sender),
            )
            .filter(ChatRoom.id == chat_room.id)
            .first()
        )

    @staticmethod
    def list_user_chatrooms(db: Session, *, user_id: int) -> list[dict]:
        rooms = (
            db.query(ChatRoom)
            .options(
                joinedload(ChatRoom.buyer),
                joinedload(ChatRoom.seller),
                joinedload(ChatRoom.item).joinedload(Item.images),
                joinedload(ChatRoom.messages).joinedload(ChatMessage.sender),
            )
            .filter(or_(ChatRoom.buyer_id == user_id, ChatRoom.seller_id == user_id))
            .order_by(ChatRoom.created_at.desc())
            .all()
        )
        serialized = [ItemService._serialize_chat_room(room, user_id=user_id) for room in rooms]
        serialized.sort(
            key=lambda room: room["last_message_at"] or room["created_at"],
            reverse=True,
        )
        return serialized

    @staticmethod
    def list_chatroom_messages(db: Session, *, room_id: int, user_id: int) -> list[ChatMessage]:
        room = (
            db.query(ChatRoom)
            .filter(
                ChatRoom.id == room_id,
                or_(ChatRoom.buyer_id == user_id, ChatRoom.seller_id == user_id),
            )
            .first()
        )
        if not room:
            raise ValueError("채팅방을 찾을 수 없습니다")

        return (
            db.query(ChatMessage)
            .options(joinedload(ChatMessage.sender))
            .filter(ChatMessage.room_id == room_id)
            .order_by(ChatMessage.created_at.asc())
            .all()
        )

    @staticmethod
    def list_user_items(db: Session, *, user_id: int) -> list[Item]:
        return (
            db.query(Item)
            .options(
                joinedload(Item.user),
                joinedload(Item.region),
                joinedload(Item.category),
                joinedload(Item.images),
            )
            .filter(Item.user_id == user_id)
            .order_by(Item.created_at.desc())
            .all()
        )

    @staticmethod
    def delete_item(db: Session, *, item_id: int, user_id: int) -> Item:
        item = (
            db.query(Item)
            .options(joinedload(Item.images))
            .filter(Item.id == item_id)
            .first()
        )
        if not item:
            raise ValueError("존재하지 않는 상품입니다")
        if item.user_id != user_id:
            raise ValueError("본인 상품만 삭제할 수 있습니다")

        db.delete(item)
        db.commit()
        return item

    @staticmethod
    def create_review(
        db: Session,
        *,
        item_id: int,
        reviewer_id: int,
        score: int,
        comment: str | None,
    ) -> Review:
        item = db.query(Item).filter(Item.id == item_id).first()
        if not item:
            raise ValueError("존재하지 않는 상품입니다")
        if item.user_id == reviewer_id:
            raise ValueError("본인 상품에는 후기를 남길 수 없습니다")
        if item.status != "sold":
            raise ValueError("판매 완료된 상품에만 후기를 남길 수 있습니다")

        room = (
            db.query(ChatRoom)
            .filter(ChatRoom.item_id == item_id, ChatRoom.buyer_id == reviewer_id)
            .first()
        )
        if not room:
            raise ValueError("거래 채팅 이력이 있는 구매자만 후기를 남길 수 있습니다")

        exists = (
            db.query(Review)
            .filter(Review.item_id == item_id, Review.reviewer_id == reviewer_id)
            .first()
        )
        if exists:
            raise ValueError("이미 후기를 남긴 상품입니다")

        review = Review(
            item_id=item_id,
            reviewer_id=reviewer_id,
            seller_id=item.user_id,
            score=score,
            comment=comment,
        )
        db.add(review)
        db.commit()
        db.refresh(review)
        return review

    @staticmethod
    def list_item_reviews(db: Session, *, item_id: int) -> list[Review]:
        return (
            db.query(Review)
            .filter(Review.item_id == item_id)
            .order_by(Review.created_at.desc())
            .all()
        )

    @staticmethod
    def list_user_reviews(db: Session, *, user_id: int) -> list[dict]:
        reviews = (
            db.query(Review)
            .options(joinedload(Review.item).joinedload(Item.images))
            .filter(Review.reviewer_id == user_id)
            .order_by(Review.created_at.desc())
            .all()
        )
        return [
            {
                "id": review.id,
                "item_id": review.item_id,
                "score": review.score,
                "comment": review.comment,
                "created_at": review.created_at,
                "item_title": review.item.title if review.item else None,
                "item_status": review.item.status if review.item else None,
                "item_thumbnail_url": review.item.thumbnail_url if review.item else None,
            }
            for review in reviews
        ]

    @staticmethod
    def create_report(
        db: Session,
        *,
        item_id: int,
        reporter_id: int,
        reason: str,
        detail: str | None,
    ) -> Report:
        item = db.query(Item).filter(Item.id == item_id).first()
        if not item:
            raise ValueError("존재하지 않는 상품입니다")
        if item.user_id == reporter_id:
            raise ValueError("본인 상품은 신고할 수 없습니다")

        report = Report(
            item_id=item_id,
            reporter_id=reporter_id,
            reason=reason,
            detail=detail,
            status="pending",
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return report

    @staticmethod
    def list_user_reports(db: Session, *, user_id: int) -> list[dict]:
        reports = (
            db.query(Report)
            .options(joinedload(Report.item).joinedload(Item.images))
            .filter(Report.reporter_id == user_id)
            .order_by(Report.created_at.desc())
            .all()
        )
        return [
            {
                "id": report.id,
                "item_id": report.item_id,
                "reason": report.reason,
                "detail": report.detail,
                "status": report.status,
                "admin_note": report.admin_note,
                "reviewed_at": report.reviewed_at,
                "created_at": report.created_at,
                "item_title": report.item.title if report.item else None,
                "item_status": report.item.status if report.item else None,
                "item_thumbnail_url": report.item.thumbnail_url if report.item else None,
            }
            for report in reports
        ]

    @staticmethod
    def list_admin_reports(db: Session) -> list[dict]:
        reports = (
            db.query(Report)
            .options(
                joinedload(Report.item).joinedload(Item.images),
                joinedload(Report.reporter),
            )
            .order_by(Report.created_at.desc())
            .all()
        )
        return [
            {
                "id": report.id,
                "item_id": report.item_id,
                "reporter_id": report.reporter_id,
                "reason": report.reason,
                "detail": report.detail,
                "status": report.status,
                "admin_note": report.admin_note,
                "reviewed_at": report.reviewed_at,
                "created_at": report.created_at,
                "item_title": report.item.title if report.item else None,
                "item_status": report.item.status if report.item else None,
                "item_thumbnail_url": report.item.thumbnail_url if report.item else None,
                "reporter_nickname": report.reporter.nickname if report.reporter else None,
                "reporter_email": report.reporter.email if report.reporter else None,
            }
            for report in reports
        ]

    @staticmethod
    def update_admin_report(
        db: Session,
        *,
        report_id: int,
        status: str,
        admin_note: str | None,
    ) -> dict:
        normalized_status = status.strip().lower()
        if normalized_status not in ItemService.REPORT_STATUS_VALUES:
            raise ValueError("지원하지 않는 신고 처리 상태입니다")

        report = (
            db.query(Report)
            .options(
                joinedload(Report.item).joinedload(Item.images),
                joinedload(Report.reporter),
            )
            .filter(Report.id == report_id)
            .first()
        )
        if not report:
            raise ValueError("존재하지 않는 신고입니다")

        report.status = normalized_status
        report.admin_note = admin_note.strip() if admin_note and admin_note.strip() else None
        report.reviewed_at = None if normalized_status == "pending" else datetime.utcnow()
        db.commit()
        db.refresh(report)

        return {
            "id": report.id,
            "item_id": report.item_id,
            "reporter_id": report.reporter_id,
            "reason": report.reason,
            "detail": report.detail,
            "status": report.status,
            "admin_note": report.admin_note,
            "reviewed_at": report.reviewed_at,
            "created_at": report.created_at,
            "item_title": report.item.title if report.item else None,
            "item_status": report.item.status if report.item else None,
            "item_thumbnail_url": report.item.thumbnail_url if report.item else None,
            "reporter_nickname": report.reporter.nickname if report.reporter else None,
            "reporter_email": report.reporter.email if report.reporter else None,
        }
