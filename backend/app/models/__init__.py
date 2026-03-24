"""ERD 기반 SQLAlchemy 모델 (MariaDB)

테이블: users, regions, categories, items, item_images, favorites, chat_rooms, chat_messages
"""
from app.database import Base
from app.models.user import User
from app.models.region import Region
from app.models.category import Category
from app.models.item import Item
from app.models.item_image import ItemImage
from app.models.favorite import Favorite
from app.models.chat import ChatMessage, ChatRoom
from app.models.review import Review
from app.models.report import Report

__all__ = [
    "Base",
    "User",
    "Region",
    "Category",
    "Item",
    "ItemImage",
    "Favorite",
    "ChatRoom",
    "ChatMessage",
    "Review",
    "Report",
]
