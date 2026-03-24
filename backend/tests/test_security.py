import pytest
from fastapi import HTTPException

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
)


def test_access_token_decodes_as_access_token():
    token = create_access_token({"sub": "1", "email": "user@example.com"})

    payload = decode_access_token(token)

    assert payload["sub"] == "1"
    assert payload["email"] == "user@example.com"
    assert payload["type"] == "access"


def test_refresh_token_is_rejected_by_access_decoder():
    refresh_token = create_refresh_token({"sub": "1"})

    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(refresh_token)

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "액세스 토큰이 필요합니다"


def test_invalid_token_is_rejected():
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token("invalid-token")

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "유효하지 않은 토큰입니다"
