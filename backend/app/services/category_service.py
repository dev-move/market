from sqlalchemy.orm import Session

from app.models.category import Category


class CategoryService:
    @staticmethod
    def _serialize(category: Category, children_map: dict[int | None, list[Category]]) -> dict:
        return {
            "id": category.id,
            "name": category.name,
            "parent_id": category.parent_id,
            "created_at": category.created_at,
            "children": [
                CategoryService._serialize(child, children_map)
                for child in children_map.get(category.id, [])
            ],
        }

    @staticmethod
    def get_tree(db: Session) -> list[dict]:
        categories = db.query(Category).order_by(Category.id.asc()).all()
        children_map: dict[int | None, list[Category]] = {}

        for category in categories:
            children_map.setdefault(category.parent_id, []).append(category)

        roots = children_map.get(None, [])
        return [CategoryService._serialize(category, children_map) for category in roots]

    @staticmethod
    def get_by_id(db: Session, category_id: int) -> Category | None:
        return db.query(Category).filter(Category.id == category_id).first()

    @staticmethod
    def create(db: Session, *, name: str, parent_id: int | None = None) -> Category:
        normalized_name = name.strip()
        if not normalized_name:
            raise ValueError("카테고리 이름을 입력해주세요")

        if parent_id is not None:
            parent = db.query(Category).filter(Category.id == parent_id).first()
            if not parent:
                raise ValueError("상위 카테고리를 찾을 수 없습니다")

        category = Category(name=normalized_name, parent_id=parent_id)
        db.add(category)
        db.commit()
        db.refresh(category)
        return category
