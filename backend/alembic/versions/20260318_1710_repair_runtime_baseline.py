"""Repair runtime baseline for legacy MariaDB state.

Revision ID: 20260318_1710
Revises:
Create Date: 2026-03-18 17:10:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260318_1710"
down_revision = None
branch_labels = None
depends_on = None


def _inspector(bind):
    return sa.inspect(bind)


def _has_table(bind, table_name: str) -> bool:
    return table_name in _inspector(bind).get_table_names()


def _get_columns(bind, table_name: str) -> dict[str, dict]:
    if not _has_table(bind, table_name):
        return {}
    return {column["name"]: column for column in _inspector(bind).get_columns(table_name)}


def _has_column(bind, table_name: str, column_name: str) -> bool:
    return column_name in _get_columns(bind, table_name)


def _integer_type_sql(bind, table_name: str, column_name: str = "id") -> str:
    column = _get_columns(bind, table_name).get(column_name)
    if not column:
        return "BIGINT"
    type_name = str(column["type"]).upper()
    return "BIGINT" if "BIGINT" in type_name else "INT"


def _ensure_column(bind, table_name: str, column_name: str, ddl: str) -> None:
    if not _has_column(bind, table_name, column_name):
        op.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {ddl}")


def _ensure_users_compatibility(bind) -> None:
    region_type = _integer_type_sql(bind, "regions")

    _ensure_column(bind, "users", "password", "VARCHAR(255) NULL")
    _ensure_column(bind, "users", "password_hash", "VARCHAR(255) NULL")
    _ensure_column(bind, "users", "region_id", f"{region_type} NULL")

    if _has_column(bind, "users", "password") and _has_column(bind, "users", "password_hash"):
        op.execute(
            """
            UPDATE users
            SET password_hash = COALESCE(NULLIF(password_hash, ''), password)
            WHERE password_hash IS NULL OR password_hash = ''
            """
        )
        op.execute(
            """
            UPDATE users
            SET password = COALESCE(NULLIF(password, ''), password_hash)
            WHERE password IS NULL OR password = ''
            """
        )


def _create_support_table_if_missing(bind, table_name: str, sql: str) -> None:
    if not _has_table(bind, table_name):
        op.execute(sql)


def upgrade() -> None:
    bind = op.get_bind()
    user_id_type = _integer_type_sql(bind, "users")
    item_id_type = _integer_type_sql(bind, "items")
    region_id_type = _integer_type_sql(bind, "regions")
    category_id_type = _integer_type_sql(bind, "categories")

    _ensure_users_compatibility(bind)

    _ensure_column(bind, "items", "status", "VARCHAR(20) NOT NULL DEFAULT 'selling'")
    _ensure_column(bind, "items", "category_id", f"{category_id_type} NULL")
    _ensure_column(bind, "items", "region_id", f"{region_id_type} NOT NULL")

    _create_support_table_if_missing(
        bind,
        "item_images",
        f"""
        CREATE TABLE item_images (
            id {item_id_type} AUTO_INCREMENT PRIMARY KEY,
            item_id {item_id_type} NOT NULL,
            image_url VARCHAR(500) NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
    )
    _create_support_table_if_missing(
        bind,
        "favorites",
        f"""
        CREATE TABLE favorites (
            id {item_id_type} AUTO_INCREMENT PRIMARY KEY,
            user_id {user_id_type} NOT NULL,
            item_id {item_id_type} NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_favorite_user_item (user_id, item_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
    )
    _create_support_table_if_missing(
        bind,
        "chat_rooms",
        f"""
        CREATE TABLE chat_rooms (
            id {item_id_type} AUTO_INCREMENT PRIMARY KEY,
            item_id {item_id_type} NOT NULL,
            buyer_id {user_id_type} NOT NULL,
            seller_id {user_id_type} NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_chat_room_item_buyer (item_id, buyer_id),
            FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
            FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
    )
    _create_support_table_if_missing(
        bind,
        "chat_messages",
        f"""
        CREATE TABLE chat_messages (
            id {item_id_type} AUTO_INCREMENT PRIMARY KEY,
            room_id {item_id_type} NOT NULL,
            sender_id {user_id_type} NOT NULL,
            message TEXT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
            FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
    )
    _create_support_table_if_missing(
        bind,
        "reviews",
        f"""
        CREATE TABLE reviews (
            id {item_id_type} AUTO_INCREMENT PRIMARY KEY,
            item_id {item_id_type} NOT NULL,
            reviewer_id {user_id_type} NOT NULL,
            seller_id {user_id_type} NOT NULL,
            score INT NOT NULL,
            comment TEXT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_review_item_reviewer (item_id, reviewer_id),
            FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
            FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
    )
    _create_support_table_if_missing(
        bind,
        "reports",
        f"""
        CREATE TABLE reports (
            id {item_id_type} AUTO_INCREMENT PRIMARY KEY,
            item_id {item_id_type} NOT NULL,
            reporter_id {user_id_type} NOT NULL,
            reason VARCHAR(100) NOT NULL,
            detail TEXT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            admin_note TEXT NULL,
            reviewed_at DATETIME NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
            FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
    )

    _ensure_column(bind, "reports", "status", "VARCHAR(20) NOT NULL DEFAULT 'pending'")
    _ensure_column(bind, "reports", "admin_note", "TEXT NULL")
    _ensure_column(bind, "reports", "reviewed_at", "DATETIME NULL")


def downgrade() -> None:
    # This repair migration intentionally leaves runtime-compatible schema in place.
    pass
