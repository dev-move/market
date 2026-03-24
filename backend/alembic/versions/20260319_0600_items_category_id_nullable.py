"""Make items.category_id nullable.

Revision ID: 20260319_0600
Revises: 20260318_1710
Create Date: 2026-03-19 06:00:00

"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260319_0600"
down_revision = "20260318_1710"
branch_labels = None
depends_on = None


def _get_column_type(bind, table_name: str, column_name: str) -> str:
    inspector = sa.inspect(bind)
    cols = inspector.get_columns(table_name)
    for col in cols:
        if col["name"] == column_name:
            type_name = str(col["type"]).upper()
            return "BIGINT" if "BIGINT" in type_name else "INT"
    return "BIGINT"


def upgrade() -> None:
    bind = op.get_bind()
    col_type = _get_column_type(bind, "items", "category_id")
    op.execute(f"ALTER TABLE items MODIFY COLUMN category_id {col_type} NULL")


def downgrade() -> None:
    bind = op.get_bind()
    col_type = _get_column_type(bind, "items", "category_id")
    op.execute(f"ALTER TABLE items MODIFY COLUMN category_id {col_type} NOT NULL")
