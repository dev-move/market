"""Remove items created by Playwright E2E tests (title starts with 'E2E ').

Usage (from repo root or backend/):
    python scripts/purge_e2e_items.py
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import SessionLocal
from app.models.item import Item


def main() -> None:
    db = SessionLocal()
    try:
        rows = db.query(Item).filter(Item.title.like("E2E %")).all()
        n = len(rows)
        for item in rows:
            db.delete(item)
        db.commit()
        print(f"Deleted {n} item(s) with E2E-prefixed titles.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
