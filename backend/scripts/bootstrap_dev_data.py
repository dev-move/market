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


# 행정표준코드가 있는 행 + 아래 PAIR_EXTRA_DONGS 가 합쳐져 DB에만 적재됩니다 (가입 시 신규 생성 없음).
REGION_CORE: list[tuple[str, str, str, str]] = [
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
    ("경기", "성남시분당구", "정자동", "4113510300"),
    ("경기", "수원시영통구", "영통동", "4111710100"),
    ("경기", "고양시일산동구", "마두동", "4128510600"),
    ("경기", "부천시원미구", "중동", "4119210800"),
    ("경기", "용인시기흥구", "보정동", "4146110300"),
    ("인천", "연수구", "송도동", "2818510600"),
    ("인천", "남동구", "구월동", "2820010100"),
    ("부산", "해운대구", "우1동", "2635010100"),
    ("부산", "부산진구", "전포동", "2623010100"),
    ("대구", "수성구", "범어동", "2726010200"),
    ("대구", "중구", "동인동", "2711010100"),
    ("광주", "서구", "치평동", "2914010400"),
    ("대전", "유성구", "봉명동", "3023012200"),
    ("울산", "남구", "삼산동", "3114010100"),
    ("세종특별자치시", "세종시", "보람동", "3611010300"),
    ("강원특별자치도", "춘천시", "효자동", "4211010100"),
    ("강원특별자치도", "원주시", "무실동", "4213010100"),
    ("충북", "청주시상당구", "용담산성동", "4311110400"),
    ("충북", "청주시흥덕구", "가경동", "4311310100"),
    ("충남", "천안시동남구", "신부동", "4413110400"),
    ("충남", "천안시서북구", "성정동", "4413310500"),
    ("전북특별자치도", "전주시완산구", "효자동", "4511111400"),
    ("전북특별자치도", "군산시", "나운동", "4513010100"),
    ("전남", "목포시", "상동", "4611010100"),
    ("전남", "여수시", "학동", "4613010100"),
    ("경북", "포항시북구", "두호동", "4711310100"),
    ("경북", "경주시", "황남동", "4713010100"),
    ("경남", "창원시성산구", "중앙동", "4817010100"),
    ("경남", "김해시", "장유동", "4825010100"),
    ("제주특별자치도", "제주시", "연동", "5011010100"),
    ("제주특별자치도", "서귀포시", "서귀동", "5013010100"),
]

# REGION_CORE 의 (시·도, 구)마다 추가로 넣을 읍·면·동. code 는 아래에서 900001001 부터 순번 부여.
PAIR_EXTRA_DONGS: dict[tuple[str, str], list[str]] = {
    ("서울", "강남구"): ["논현동", "대치동", "삼성동", "청담동", "개포동", "신사동"],
    ("서울", "강동구"): ["길동", "둔촌동", "암사동", "고덕동", "명일동"],
    ("서울", "강북구"): ["미아동", "번동", "우이동", "삼양동"],
    ("서울", "강서구"): ["등촌동", "염창동", "방화동", "마곡동"],
    ("서울", "관악구"): ["신림동", "남현동", "서원동", "은천동"],
    ("서울", "마포구"): ["합정동", "상수동", "연남동", "공덕동"],
    ("서울", "서초구"): ["반포동", "잠원동", "방배동", "양재동"],
    ("서울", "성동구"): ["행당동", "마장동", "옥수동", "금호동"],
    ("서울", "송파구"): ["문정동", "가락동", "방이동", "오금동"],
    ("서울", "영등포구"): ["당산동", "도림동", "대림동", "신길동"],
    ("경기", "성남시분당구"): ["수내동", "야탑동", "이매동", "판교동", "서현동"],
    ("경기", "수원시영통구"): ["망포동", "원천동", "광교동", "태장동"],
    ("경기", "고양시일산동구"): ["백석동", "마두동", "식사동", "중산동"],
    ("경기", "부천시원미구"): ["상동", "삼정동", "역곡동", "춘의동"],
    ("경기", "용인시기흥구"): ["구갈동", "상갈동", "영덕동", "마북동"],
    ("인천", "연수구"): ["옥련동", "선학동", "청학동", "동춘동"],
    ("인천", "남동구"): ["간석동", "만수동", "논현동", "서창동"],
    ("부산", "해운대구"): ["재송동", "우2동", "중동", "송정동"],
    ("부산", "부산진구"): ["범전동", "부전동", "양정동", "연지동"],
    ("대구", "수성구"): ["만촌동", "황금동", "지산동", "범물동"],
    ("대구", "중구"): ["삼덕동", "대신동", "남산동", "대봉동"],
    ("광주", "서구"): ["풍암동", "유덕동", "상무동", "치평동"],
    ("대전", "유성구"): ["지족동", "노은동", "관평동", "구암동"],
    ("울산", "남구"): ["달동", "삼산동", "무거동", "옥동"],
    ("세종특별자치시", "세종시"): ["도담동", "아름동", "한솔동", "종촌동"],
    ("강원특별자치도", "춘천시"): ["석사동", "퇴계동", "후평동", "신북읍"],
    ("강원특별자치도", "원주시"): ["단계동", "무실동", "일산동", "태장동"],
    ("충북", "청주시상당구"): ["용암동", "금천동", "율량동", "죽림동"],
    ("충북", "청주시흥덕구"): ["복대동", "봉명동", "송정동", "강내동"],
    ("충남", "천안시동남구"): ["쌍용동", "청당동", "유량동", "목천읍"],
    ("충남", "천안시서북구"): ["불당동", "백석동", "두정동", "성환읍"],
    ("전북특별자치도", "전주시완산구"): ["서신동", "평화동", "중화산동", "삼천동"],
    ("전북특별자치도", "군산시"): ["소룡동", "미원동", "해망동", "조촌동"],
    ("전남", "목포시"): ["하당동", "연산동", "옥암동", "상동"],
    ("전남", "여수시"): ["돌산읍", "웅천동", "국동", "문수동"],
    ("경북", "포항시북구"): ["장성동", "죽도동", "대흥동", "흥해읍"],
    ("경북", "경주시"): ["보문동", "황오동", "안강읍", "건천읍"],
    ("경남", "창원시성산구"): ["사파동", "가음정동", "성주동", "웅남동"],
    ("경남", "김해시"): ["율하동", "삼계동", "한림면", "진영읍"],
    ("제주특별자치도", "제주시"): ["노형동", "이도동", "화북동", "애월읍"],
    ("제주특별자치도", "서귀포시"): ["중문동", "대정읍", "남원읍", "성산읍"],
}


def _build_region_seeds() -> list[tuple[str, str, str, str]]:
    rows = list(REGION_CORE)
    seen = {(c, d, g) for c, d, g, _ in rows}
    code_i = 900_001_001
    for (city, dist), extras in PAIR_EXTRA_DONGS.items():
        for dong in extras:
            if (city, dist, dong) in seen:
                continue
            rows.append((city, dist, dong, str(code_i)))
            code_i += 1
            seen.add((city, dist, dong))
    return rows


REGION_SEEDS = _build_region_seeds()

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
