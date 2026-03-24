"""Bootstrap repeatable dev data for local development.

Usage:
    python scripts/bootstrap_dev_data.py
    python scripts/bootstrap_dev_data.py --with-items
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import SessionLocal
from app.models.category import Category
from app.models.item import Item
from app.models.region import Region
from app.models.user import User


REGION_SEEDS = [
    ("서울", "강남구", "역삼동", "1168064000"),
    ("서울", "강동구", "천호동", "1174068500"),
    ("서울", "강북구", "수유동", "1130553500"),
    ("서울", "강서구", "화곡동", "1150061100"),
    ("서울", "관악구", "봉천동", "1162058500"),
    ("서울", "마포구", "망원동", "1144069000"),
    ("서울", "서초구", "서초동", "1165051000"),
    ("서울", "성동구", "성수동", "1120055000"),
    ("서울", "송파구", "잠실동", "1171065000"),
    ("서울", "영등포구", "여의도동", "1156054000"),
]

CATEGORY_SEEDS = {
    "디지털기기": ["스마트폰", "노트북"],
    "생활가전": ["주방가전"],
    "가구/인테리어": ["수납/선반"],
    "생활/주방": ["주방용품"],
    "유아동": [],
    "패션/잡화": ["여성잡화"],
}

ITEM_SEEDS = [
    ("아이폰 13 미드나이트 128GB", "생활기스 조금 있지만 기능 이상 없고 배터리 성능 양호합니다.", 520000, "selling", "스마트폰"),
    ("그램 14인치 노트북", "재택근무용으로 쓰던 노트북입니다. 충전기 포함.", 680000, "selling", "노트북"),
    ("에어프라이어 5L", "이사로 정리합니다. 사용감 적고 깨끗해요.", 45000, "reserved", "주방가전"),
    ("원목 3단 선반", "거실에 두고 쓰던 선반입니다. 직접 가져가셔야 해요.", 30000, "selling", "수납/선반"),
    ("스테인리스 냄비 세트", "신혼 때 잠깐 쓰고 보관만 했습니다.", 25000, "sold", "주방용품"),
    ("가죽 미니백", "선물 받았는데 스타일이 안 맞아 판매합니다.", 39000, "selling", "여성잡화"),
]


def ensure_regions(session) -> int:
    created = 0
    for city, district, dong, code in REGION_SEEDS:
        exists = session.query(Region).filter(Region.code == code).first()
        if not exists:
            exists = (
                session.query(Region)
                .filter(
                    Region.city == city,
                    Region.district == district,
                    Region.dong == dong,
                )
                .first()
            )
        if exists:
            continue
        session.add(Region(city=city, district=district, dong=dong, code=code))
        created += 1
    return created


def ensure_categories(session) -> tuple[int, dict[str, int]]:
    created = 0
    category_ids: dict[str, int] = {}

    for root_name, children in CATEGORY_SEEDS.items():
        root = (
            session.query(Category)
            .filter(Category.name == root_name, Category.parent_id.is_(None))
            .first()
        )
        if not root:
            root = Category(name=root_name, parent_id=None)
            session.add(root)
            session.flush()
            created += 1
        category_ids[root_name] = int(root.id)

        for child_name in children:
            child = (
                session.query(Category)
                .filter(Category.name == child_name, Category.parent_id == root.id)
                .first()
            )
            if not child:
                child = Category(name=child_name, parent_id=root.id)
                session.add(child)
                session.flush()
                created += 1
            category_ids[child_name] = int(child.id)

    return created, category_ids


def ensure_items(session, category_ids: dict[str, int]) -> int:
    if session.query(Item).count() > 0:
        return 0

    users = session.query(User).order_by(User.id.asc()).all()
    if not users:
        return 0

    created = 0
    for index, (title, description, price, status, category_name) in enumerate(ITEM_SEEDS):
        user = users[index % len(users)]
        region_id = user.region_id or 1
        category_id = category_ids.get(category_name)
        session.add(
            Item(
                user_id=user.id,
                region_id=region_id,
                category_id=category_id,
                title=title,
                description=description,
                price=price,
                status=status,
            )
        )
        created += 1
    return created


def main() -> None:
    parser = argparse.ArgumentParser(description="Bootstrap repeatable dev data.")
    parser.add_argument(
        "--with-items",
        action="store_true",
        help="Also create demo items if the items table is empty.",
    )
    args = parser.parse_args()

    session = SessionLocal()
    try:
        created_regions = ensure_regions(session)
        created_categories, category_ids = ensure_categories(session)
        created_items = ensure_items(session, category_ids) if args.with_items else 0
        session.commit()
    finally:
        session.close()

    print(
        "bootstrap complete:",
        {
            "regions_created": created_regions,
            "categories_created": created_categories,
            "items_created": created_items,
        },
    )


if __name__ == "__main__":
    main()
