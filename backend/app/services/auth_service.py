from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.models.region import Region
from app.models.user import User


class AuthService:
    @staticmethod
    def register(
        db: Session,
        email: str,
        password: str,
        nickname: str,
        region_id: int | None = None,
    ) -> User:
        if db.query(User).filter(User.email == email).first():
            raise ValueError("이미 사용 중인 이메일입니다")
        if db.query(User).filter(User.nickname == nickname).first():
            raise ValueError("이미 사용 중인 닉네임입니다")
        if region_id is not None and not db.query(Region).filter(Region.id == region_id).first():
            raise ValueError("존재하지 않는 지역입니다")

        hashed_password = hash_password(password)

        user = User(
            email=email,
            password_hash=hashed_password,
            nickname=nickname,
            region_id=region_id,
        )
        user.password = hashed_password
        user.password_legacy = hashed_password
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def login(db: Session, email: str, password: str) -> dict:
        user = db.query(User).filter(User.email == email).first()
        stored_password = user.password_hash or user.password_legacy if user else None
        if not user or not stored_password:
            raise ValueError("이메일 또는 비밀번호가 올바르지 않습니다")

        password_matches = (
            verify_password(password, stored_password)
            if stored_password.startswith("$")
            else password == stored_password
        )
        if not password_matches:
            raise ValueError("이메일 또는 비밀번호가 올바르지 않습니다")

        return {
            "access_token": create_access_token({"sub": str(user.id), "email": user.email}),
            "refresh_token": create_refresh_token({"sub": str(user.id)}),
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "nickname": user.nickname,
                "region_id": user.region_id,
            },
        }
