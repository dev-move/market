"""DB에 저장된 모든 상품 이미지 URL을 프론트 public 기본 로고로 통일합니다.

Next.js `public/market-logo.png`와 동일한 경로 문자열을 저장합니다.
실행:  python scripts/set_item_images_to_logo.py

환경: backend/.env 의 DB 설정이 로컬 DB를 가리켜야 합니다.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import update

from app.core.database import SessionLocal
from app.models.item_image import ItemImage

LOGO_URL = "/market-logo.png"


def main() -> None:
    db = SessionLocal()
    try:
        result = db.execute(update(ItemImage).values(image_url=LOGO_URL))
        db.commit()
        n = result.rowcount if result.rowcount is not None else 0
        print(f"Updated {n} row(s) in item_images to {LOGO_URL}.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
