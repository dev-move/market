from datetime import datetime
from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.main import app
from app.routers.deps import get_current_user
from app.services.auth_service import AuthService
from app.services.item_service import ItemService


def _dummy_current_user():
    return SimpleNamespace(
        id=2,
        email="buyer@example.com",
        nickname="buyer",
        region_id=7,
    )


def _build_client():
    app.dependency_overrides[get_current_user] = _dummy_current_user
    return TestClient(app)


def _clear_overrides():
    app.dependency_overrides.clear()


def test_login_route_smoke(monkeypatch):
    client = _build_client()
    try:
        monkeypatch.setattr(
            AuthService,
            "login",
            lambda db, username, password: {
                "access_token": "access-token",
                "refresh_token": "refresh-token",
                "token_type": "bearer",
                "user": {
                    "id": 2,
                    "username": username,
                    "email": "buyer@example.com",
                    "nickname": "buyer",
                    "full_name": "구매자",
                    "region_id": 7,
                },
            },
        )

        response = client.post(
            "/api/v1/users/login",
            json={"username": "buyer1", "password": "plain-password"},
        )
    finally:
        _clear_overrides()

    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"


def test_list_items_route_smoke(monkeypatch):
    client = _build_client()
    now = datetime.now()
    try:
        monkeypatch.setattr(
            ItemService,
            "list_items",
            lambda db, **kwargs: {
                "total": 1,
                "page": 1,
                "size": 20,
                "items": [
                    SimpleNamespace(
                        id=1,
                        user_id=1,
                        region_id=7,
                        category_id=3,
                        title="테스트 상품",
                        description="설명",
                        price=1000,
                        status="selling",
                        created_at=now,
                        region_name="서울 강동구 천호동",
                        category_name="스마트폰",
                        seller_nickname="seller",
                        thumbnail_url=None,
                    )
                ],
            },
        )

        response = client.get("/api/v1/items")
    finally:
        _clear_overrides()

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["title"] == "테스트 상품"


def test_create_chat_room_route_smoke(monkeypatch):
    client = _build_client()
    now = datetime.now()
    try:
        monkeypatch.setattr(
            ItemService,
            "create_chat_room",
            lambda db, item_id, buyer_id: {
                "id": 10,
                "item_id": item_id,
                "buyer_id": buyer_id,
                "seller_id": 1,
                "created_at": now,
                "buyer": {"id": buyer_id, "nickname": "buyer"},
                "seller": {"id": 1, "nickname": "seller"},
                "item_title": "테스트 상품",
                "item_status": "selling",
                "item_thumbnail_url": None,
                "last_message": None,
                "last_message_at": None,
                "partner_nickname": "seller",
            },
        )

        response = client.post("/api/v1/items/1/chat")
    finally:
        _clear_overrides()

    assert response.status_code == 201
    assert response.json()["item_id"] == 1


def test_list_item_reviews_route_smoke(monkeypatch):
    client = _build_client()
    now = datetime.now()
    try:
        monkeypatch.setattr(
            ItemService,
            "list_item_reviews",
            lambda db, item_id: [
                SimpleNamespace(
                    id=1,
                    item_id=item_id,
                    reviewer_id=2,
                    seller_id=1,
                    score=5,
                    comment="좋아요",
                    created_at=now,
                )
            ],
        )

        response = client.get("/api/v1/items/1/reviews")
    finally:
        _clear_overrides()

    assert response.status_code == 200
    assert response.json()[0]["score"] == 5


def test_create_report_route_smoke(monkeypatch):
    client = _build_client()
    now = datetime.now()
    try:
        monkeypatch.setattr(
            ItemService,
            "create_report",
            lambda db, item_id, reporter_id, reason, detail: SimpleNamespace(
                id=1,
                item_id=item_id,
                reporter_id=reporter_id,
                reason=reason,
                detail=detail,
                status="pending",
                admin_note=None,
                reviewed_at=None,
                created_at=now,
            ),
        )

        response = client.post(
            "/api/v1/items/1/reports",
            json={"reason": "허위 정보", "detail": "내용이 실제와 다릅니다."},
        )
    finally:
        _clear_overrides()

    assert response.status_code == 201
    assert response.json()["status"] == "pending"
