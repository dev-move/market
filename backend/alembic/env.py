"""Alembic 마이그레이션 환경. app.database / app.config 사용 (MariaDB)."""
from logging.config import fileConfig

from sqlalchemy import pool
from alembic import context

from app.config import settings
from app.database import Base

# 모델을 import 해야 Base.metadata에 테이블이 등록됨
from app.models import (
    Category,
    ChatMessage,
    ChatRoom,
    Favorite,
    Item,
    ItemImage,
    Region,
    Report,
    Review,
    User,
)

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """오프라인 모드: URL만 사용, Connection 사용 안 함."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """온라인 모드: Engine 생성 후 연결."""
    connectable = context.config.attributes.get("connection", None)
    if connectable is None:
        from sqlalchemy import create_engine
        connectable = create_engine(
            config.get_main_option("sqlalchemy.url"),
            poolclass=pool.NullPool,
        )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
