from dataclasses import dataclass
from typing import Optional


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
    image_url: str = ""
