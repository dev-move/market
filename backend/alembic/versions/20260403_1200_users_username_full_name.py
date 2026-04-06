"""Add username and full_name to users for id login and recovery.

Revision ID: 20260403_1200
Revises: 20260319_0600
Create Date: 2026-04-03 12:00:00

"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260403_1200"
down_revision = "20260319_0600"
branch_labels = None
depends_on = None


def _user_columns(bind) -> set[str]:
    inspector = sa.inspect(bind)
    return {c["name"] for c in inspector.get_columns("users")}


def _has_unique_username_index(bind) -> bool:
    inspector = sa.inspect(bind)
    for idx in inspector.get_indexes("users"):
        if idx.get("unique") and set(idx.get("column_names") or []) == {"username"}:
            return True
    return False


def upgrade() -> None:
    bind = op.get_bind()
    cols = _user_columns(bind)

    if "username" not in cols:
        op.execute("ALTER TABLE users ADD COLUMN username VARCHAR(30) NULL")
    if "full_name" not in cols:
        op.execute("ALTER TABLE users ADD COLUMN full_name VARCHAR(50) NULL")

    op.execute(
        """
        UPDATE users
        SET username = CONCAT('user', id)
        WHERE username IS NULL OR username = ''
        """
    )
    op.execute(
        """
        UPDATE users
        SET full_name = nickname
        WHERE full_name IS NULL OR full_name = ''
        """
    )

    op.execute("ALTER TABLE users MODIFY COLUMN username VARCHAR(30) NOT NULL")
    op.execute("ALTER TABLE users MODIFY COLUMN full_name VARCHAR(50) NOT NULL")

    if not _has_unique_username_index(bind):
        op.create_index("ix_users_username", "users", ["username"], unique=True)


def downgrade() -> None:
    bind = op.get_bind()
    if _has_unique_username_index(bind):
        op.drop_index("ix_users_username", table_name="users")
    cols = _user_columns(bind)
    if "username" in cols:
        op.execute("ALTER TABLE users DROP COLUMN username")
    if "full_name" in cols:
        op.execute("ALTER TABLE users DROP COLUMN full_name")
