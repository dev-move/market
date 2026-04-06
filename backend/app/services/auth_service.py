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
        username: str,
        email: str,
        password: str,
        nickname: str,
        full_name: str,
        region_id: int | None = None,
    ) -> User:
        username_key = username.strip().lower()
        if db.query(User).filter(User.username == username_key).first():
            raise ValueError("이미 사용 중인 아이디입니다")
        if db.query(User).filter(User.email == email).first():
            raise ValueError("이미 사용 중인 이메일입니다")
        if db.query(User).filter(User.nickname == nickname).first():
            raise ValueError("이미 사용 중인 닉네임입니다")
        if region_id is not None and not db.query(Region).filter(Region.id == region_id).first():
            raise ValueError("존재하지 않는 지역입니다")

        hashed_password = hash_password(password)
        name_clean = full_name.strip()

        user = User(
            username=username_key,
            email=email,
            full_name=name_clean,
            nickname=nickname,
            region_id=region_id,
            password_hash=hashed_password,
        )
        user.password = hashed_password
        user.password_legacy = hashed_password
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def login(db: Session, username: str, password: str) -> dict:
        key = username.strip().lower()
        user = db.query(User).filter(User.username == key).first()
        stored_password = user.password_hash or user.password_legacy if user else None
        if not user or not stored_password:
            raise ValueError("아이디 또는 비밀번호가 올바르지 않습니다")

        password_matches = (
            verify_password(password, stored_password)
            if stored_password.startswith("$")
            else password == stored_password
        )
        if not password_matches:
            raise ValueError("아이디 또는 비밀번호가 올바르지 않습니다")

        return {
            "access_token": create_access_token({"sub": str(user.id), "email": user.email}),
            "refresh_token": create_refresh_token({"sub": str(user.id)}),
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "nickname": user.nickname,
                "full_name": user.full_name,
                "region_id": user.region_id,
            },
        }

    @staticmethod
    def find_username(db: Session, email: str, full_name: str) -> str | None:
        name_clean = full_name.strip()
        user = (
            db.query(User)
            .filter(User.email == email, User.full_name == name_clean)
            .first()
        )
        return user.username if user else None

    @staticmethod
    def reset_password_if_verified(
        db: Session,
        username: str,
        full_name: str,
        email: str,
        new_password: str,
    ) -> bool:
        key = username.strip().lower()
        name_clean = full_name.strip()
        user = (
            db.query(User)
            .filter(
                User.username == key,
                User.email == email,
                User.full_name == name_clean,
            )
            .first()
        )
        if not user:
            return False

        hashed = hash_password(new_password)
        user.password_hash = hashed
        user.password_legacy = hashed
        db.add(user)
        db.commit()
        return True
