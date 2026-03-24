from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest

from app.services.auth_service import AuthService


def build_mock_session(user):
    session = MagicMock()
    query = session.query.return_value
    filtered = query.filter.return_value
    filtered.first.return_value = user
    return session


def test_login_returns_tokens_and_user_summary():
    user = SimpleNamespace(
        id=7,
        email="buyer@example.com",
        password_hash="$hashed-password",
        nickname="buyer",
        region_id=3,
    )
    db = build_mock_session(user)

    with patch("app.services.auth_service.verify_password", return_value=True):
        result = AuthService.login(db, "buyer@example.com", "plain-password")

    assert result["token_type"] == "bearer"
    assert "access_token" in result
    assert "refresh_token" in result
    assert result["user"]["id"] == 7
    assert result["user"]["nickname"] == "buyer"


def test_login_raises_for_invalid_credentials():
    db = build_mock_session(None)

    with pytest.raises(ValueError) as exc_info:
        AuthService.login(db, "missing@example.com", "plain-password")

    assert str(exc_info.value) == "이메일 또는 비밀번호가 올바르지 않습니다"
