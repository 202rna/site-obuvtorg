from dataclasses import dataclass
from typing import Optional
from datetime import datetime


@dataclass
class User:
    """Сущность пользователя."""
    id: Optional[int] = None
    email: str = ""
    hashed_password: str = ""
    role: str = "user"


@dataclass
class Order:
    """Сущность товара
    """
    id: Optional[int] = None
    title: str = ""
    price: float = 0.0
    description: str = ""
    full_description: Optional[str] = None
    image_url: str = ""
    discount: int = 0


@dataclass
class Note:
    """Сущность заметки"""
    id: Optional[int] = None
    title: str = ""
    description: str = ""
    image_url: Optional[str] = None
    created_time: Optional[datetime] = None
