"""MariaDB용 SQLAlchemy 설정."""
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()


def _build_database_url() -> str:
    db_user = os.getenv("DB_USER", "root")
    db_password = os.getenv("DB_PASSWORD", "")
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "3306")
    db_name = os.getenv("DB_NAME", "market")

    return (
        f"mysql+pymysql://{db_user}:{db_password}"
        f"@{db_host}:{db_port}/{db_name}"
    )


DATABASE_URL = _build_database_url()
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

engine = create_engine(
    DATABASE_URL,
    echo=DEBUG,
    pool_pre_ping=True,
    pool_recycle=300,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


class Base(DeclarativeBase):
    """모든 ORM 모델의 공통 Base."""


def get_db():
    """FastAPI dependency용 DB 세션."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
