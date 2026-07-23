from abc import ABC, abstractmethod
from app.domain.entities import User
from datetime import datetime, timezone


class UserRepositoryPort(ABC):
    """Интерфейс для управление сущностью пользователь."""
    @abstractmethod
    async def get_by_email(self, email: str) -> User | None:
        """Получение пользователя по логину."""
        pass

    @abstractmethod
    async def get_by_id(self, user_id: int) -> User | None:
        """Найти пользователя по его уникальному ID."""
        pass

    @abstractmethod
    async def save(self, user: User) -> User:
        """Сохранение пользователя."""
        pass


class PasswordHasherPort(ABC):
    """Интерфейс для хэширования и проверки паролей."""
    @abstractmethod
    def hash(self, password: str) -> str:
        """Создание хэша для пароля."""
        pass

    @abstractmethod
    def verify(self, raw_password: str, hashed_password: str) -> bool:
        """Проверить, соответствует ли сырой пароль хэшу."""
        pass


class TokenProviderPort(ABC):
    """Интерфейс для генерации и проверки токенов доступа"""
    @abstractmethod
    def create_access_token(self, user_id: int, expires_minutes: int = 60) -> str:
        """Создание токена."""
        pass

    @abstractmethod
    def decode_access_token(self, token: str) -> int | None:
        """
        Расшифровать токен и вернуть user_id.
        Если токен невалидный или протух —> вернуть None.
        """
        pass


class MissingType:
    """Класс-заглушка:  «поле стерли» None / «поле не передали» Missing."""
    pass


class ProductRepositoryPort(ABC):
    """Интерфейс для управления товарами"""
    @abstractmethod
    async def get_all(self, last_id: int | None, limit: int, discounted_only: bool = False) -> list:
        """Получение товаров по курсору. discounted_only=True — только с discount > 0."""
        pass

    @abstractmethod
    async def save(
        self,
        title: str,
        price: float,
        description: str,
        image_urls: list[str],
        full_description: str | None,
        discount: int = 0,
        categories: list[str] | None = None,
        sizes: list[int] | None = None,
    ) -> dict:
        """Сохранить новый товар в базу данных."""
        pass

    @abstractmethod
    async def delete(self, product_id: int) -> list[str]:
        """Удалить товар из БД и вернуть URL его картинок."""
        pass

    @abstractmethod
    async def update(
        self,
        product_id: int,
        title: str | MissingType = MissingType(),
        price: float | MissingType = MissingType(),
        description: str | MissingType = MissingType(),
        full_description: str | None | MissingType = MissingType(),
        discount: int | MissingType = MissingType(),
        image_urls: list[str] | MissingType = MissingType(),
        categories: list[str] | MissingType = MissingType(),
        sizes: list[int] | MissingType = MissingType(),
    ) -> bool:
        """Частичное обновление товара."""
        pass
    
    @abstractmethod
    async def get_by_id(self, product_id: int) -> dict | None:
        pass


class CartRepositoryPort(ABC):
    """Интерфейс управления корзиной в базе данных."""
    @abstractmethod
    async def add(self, user_id: int, product_id: int) -> bool:
        """Добавить товар в корзину."""
        pass

    @abstractmethod
    async def get_user_cart(self, user_id: int) -> list:
        """Получить все товары из корзины пользователя с ценами."""
        pass

    @abstractmethod
    async def clear(self, user_id: int) -> None:
        """Очистить корзину пользователя."""
        pass


class NoteRepositoryPort(ABC):
    @abstractmethod
    async def add(self, created_time: datetime, title: str, description: str, image_url: str | None = None) -> bool:
        """Добавление заметки"""
        pass
    
    @abstractmethod
    async def delete(self, note_id: int) -> str | None | bool:
        """Удаление заметки по ID."""
        pass
    
    @abstractmethod
    async def update(
        self,
        created_time: datetime,
        note_id: int, 
        title: str | MissingType = MissingType(), 
        description: str | MissingType = MissingType(), 
        image_url: str | None | MissingType = MissingType()
        ) -> str | None | bool:
        """Изменение названия/содержимого/фотографии заметки"""
        pass
    
    @abstractmethod
    async def get_all(self, last_id: int | None, limit: int) -> list:
        """Получение заметок по курсору."""
        pass
    
    @abstractmethod
    async def get_one(self, note_id: int) -> dict:
        """Получение конкретной заметки для чтения."""
        pass
