from __future__ import annotations

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import SQLAlchemyError

from app.database import SessionLocal
from app.main import app
from app.models.category import Category
from app.models.chat import ChatMessage, ChatRoom
from app.models.favorite import Favorite
from app.models.item import Item
from app.models.item_image import ItemImage
from app.models.region import Region
from app.models.report import Report
from app.models.review import Review
from app.models.user import User


def _cleanup_test_rows(prefix: str) -> None:
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.email.like(f"{prefix}%")).all()
        user_ids = [int(user.id) for user in users]
        items = db.query(Item).filter(Item.title.like(f"{prefix}%")).all()
        item_ids = [int(item.id) for item in items]

        room_ids: list[int] = []
        if item_ids:
            room_ids.extend(
                int(room_id)
                for (room_id,) in db.query(ChatRoom.id).filter(ChatRoom.item_id.in_(item_ids)).all()
            )
            db.query(ItemImage).filter(ItemImage.item_id.in_(item_ids)).delete(synchronize_session=False)
            db.query(Favorite).filter(Favorite.item_id.in_(item_ids)).delete(synchronize_session=False)
            db.query(Review).filter(Review.item_id.in_(item_ids)).delete(synchronize_session=False)
            db.query(Report).filter(Report.item_id.in_(item_ids)).delete(synchronize_session=False)

        if user_ids:
            room_ids.extend(
                int(room_id)
                for (room_id,) in db.query(ChatRoom.id).filter(
                    (ChatRoom.buyer_id.in_(user_ids)) | (ChatRoom.seller_id.in_(user_ids))
                ).all()
            )
            db.query(Review).filter(
                (Review.reviewer_id.in_(user_ids)) | (Review.seller_id.in_(user_ids))
            ).delete(synchronize_session=False)
            db.query(Report).filter(Report.reporter_id.in_(user_ids)).delete(synchronize_session=False)
            db.query(Favorite).filter(Favorite.user_id.in_(user_ids)).delete(synchronize_session=False)

        room_ids = sorted(set(room_ids))
        if room_ids:
            db.query(ChatMessage).filter(ChatMessage.room_id.in_(room_ids)).delete(synchronize_session=False)
            db.query(ChatRoom).filter(ChatRoom.id.in_(room_ids)).delete(synchronize_session=False)

        if item_ids:
            db.query(Item).filter(Item.id.in_(item_ids)).delete(synchronize_session=False)
        if user_ids:
            db.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)

        db.commit()
    finally:
        db.close()


@pytest.fixture
def integration_context():
    prefix = f"it_{uuid4().hex[:8]}"
    db = SessionLocal()
    try:
        region = db.query(Region).order_by(Region.id.asc()).first()
        category = db.query(Category).order_by(Category.id.asc()).first()
    except SQLAlchemyError as exc:
        db.close()
        pytest.skip(f"MariaDB integration DB unavailable: {exc}")
    finally:
        if db.is_active:
            db.close()

    if not region or not category:
        pytest.skip("Reference seed data missing for integration test")

    client = TestClient(app)
    try:
        yield {
            "client": client,
            "prefix": prefix,
            "region_id": int(region.id),
            "category_id": int(category.id),
        }
    finally:
        _cleanup_test_rows(prefix)


def _signup_and_login(
    client: TestClient,
    *,
    username: str,
    email: str,
    nickname: str,
    full_name: str,
    region_id: int,
) -> str:
    password = "password123"
    signup_response = client.post(
        "/api/v1/users/signup",
        json={
            "username": username,
            "password": password,
            "password_confirm": password,
            "email": email,
            "nickname": nickname,
            "full_name": full_name,
            "region_id": region_id,
        },
    )
    assert signup_response.status_code == 201, signup_response.text

    login_response = client.post(
        "/api/v1/users/login",
        json={"username": username, "password": password},
    )
    assert login_response.status_code == 200, login_response.text
    return str(login_response.json()["access_token"])


def test_reference_endpoints_return_seeded_rows_real_db(integration_context):
    client = integration_context["client"]

    regions_response = client.get("/api/v1/regions")
    categories_response = client.get("/api/v1/categories")
    items_response = client.get("/api/v1/items")

    assert regions_response.status_code == 200
    assert len(regions_response.json()) > 0
    assert categories_response.status_code == 200
    assert len(categories_response.json()) > 0
    assert items_response.status_code == 200
    assert "items" in items_response.json()


def test_real_db_user_item_chat_review_report_flow(integration_context):
    client = integration_context["client"]
    prefix = integration_context["prefix"]
    region_id = integration_context["region_id"]
    category_id = integration_context["category_id"]

    slug = prefix.replace("_", "")[-12:]
    seller_token = _signup_and_login(
        client,
        username=f"sell{slug}",
        email=f"{prefix}_seller@example.com",
        nickname=f"{prefix[:12]}seller",
        full_name="판매자",
        region_id=region_id,
    )
    buyer_token = _signup_and_login(
        client,
        username=f"buy{slug}",
        email=f"{prefix}_buyer@example.com",
        nickname=f"{prefix[:12]}buyer",
        full_name="구매자",
        region_id=region_id,
    )

    seller_headers = {"Authorization": f"Bearer {seller_token}"}
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

    create_item_response = client.post(
        "/api/v1/items",
        json={
            "region_id": region_id,
            "category_id": category_id,
            "title": f"{prefix} item",
            "description": "integration test item",
            "price": 12345,
            "status": "selling",
        },
        headers=seller_headers,
    )
    assert create_item_response.status_code == 201, create_item_response.text
    item_id = int(create_item_response.json()["id"])

    list_items_response = client.get(f"/api/v1/items?q={prefix}")
    assert list_items_response.status_code == 200
    assert any(item["id"] == item_id for item in list_items_response.json()["items"])

    create_room_response = client.post(f"/api/v1/items/{item_id}/chat", headers=buyer_headers)
    assert create_room_response.status_code == 201, create_room_response.text
    room_id = int(create_room_response.json()["id"])

    buyer_rooms_response = client.get("/api/v1/users/me/chatrooms", headers=buyer_headers)
    assert buyer_rooms_response.status_code == 200
    assert any(room["id"] == room_id for room in buyer_rooms_response.json())

    with client.websocket_connect(f"/ws/chat/{room_id}?token={buyer_token}") as websocket:
        joined_event = websocket.receive_json()
        assert joined_event["type"] == "system"
        websocket.send_text('{"message":"integration hello"}')
        message_event = websocket.receive_json()
        assert message_event["type"] == "message"
        assert message_event["message"] == "integration hello"

    buyer_messages_response = client.get(
        f"/api/v1/users/me/chatrooms/{room_id}/messages",
        headers=buyer_headers,
    )
    assert buyer_messages_response.status_code == 200
    assert any(message["message"] == "integration hello" for message in buyer_messages_response.json())

    update_item_response = client.put(
        f"/api/v1/items/{item_id}",
        json={"status": "sold"},
        headers=seller_headers,
    )
    assert update_item_response.status_code == 200, update_item_response.text
    assert update_item_response.json()["status"] == "sold"

    create_review_response = client.post(
        f"/api/v1/items/{item_id}/reviews",
        json={"score": 5, "comment": "great trade"},
        headers=buyer_headers,
    )
    assert create_review_response.status_code == 201, create_review_response.text

    create_report_response = client.post(
        f"/api/v1/items/{item_id}/reports",
        json={"reason": "허위 정보", "detail": "integration report"},
        headers=buyer_headers,
    )
    assert create_report_response.status_code == 201, create_report_response.text
    assert create_report_response.json()["status"] == "pending"

    my_reviews_response = client.get("/api/v1/users/me/reviews", headers=buyer_headers)
    my_reports_response = client.get("/api/v1/users/me/reports", headers=buyer_headers)

    assert my_reviews_response.status_code == 200
    assert any(review["item_id"] == item_id for review in my_reviews_response.json())
    assert my_reports_response.status_code == 200
    assert any(report["item_id"] == item_id for report in my_reports_response.json())
