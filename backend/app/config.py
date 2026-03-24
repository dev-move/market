"""환경 설정 로더."""
import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    def __init__(self) -> None:
        self.APP_NAME = os.getenv("APP_NAME", "Market")
        self.DB_HOST = os.getenv("DB_HOST", "localhost")
        self.DB_PORT = os.getenv("DB_PORT", "3306")
        self.DB_USER = os.getenv("DB_USER", "root")
        self.DB_PASSWORD = os.getenv("DB_PASSWORD", "")
        self.DB_NAME = os.getenv("DB_NAME", "market")

        self.DATABASE_URL = os.getenv(
            "DATABASE_URL",
            (
                f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
                f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            ),
        )

        self.JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")

        # 기존 코드 호환용
        self.SECRET_KEY = self.JWT_SECRET
        self.DEBUG = os.getenv("DEBUG", "false").lower() == "true"
        # Playwright E2E가 남긴 "E2E …" 제목 상품을 GET /items 목록에서 숨김 (DEBUG일 때 기본 on)
        self.HIDE_E2E_TEST_ITEMS_IN_LIST = os.getenv(
            "HIDE_E2E_TEST_ITEMS_IN_LIST",
            "true" if self.DEBUG else "false",
        ).lower() in {"1", "true", "yes"}
        self.ACCESS_TOKEN_EXPIRE_MINUTES = int(
            os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
        )
        self.REFRESH_TOKEN_EXPIRE_DAYS = int(
            os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7")
        )
        self.ADMIN_EMAILS = [
            email.strip().lower()
            for email in os.getenv("ADMIN_EMAILS", "").split(",")
            if email.strip()
        ]


settings = Settings()
