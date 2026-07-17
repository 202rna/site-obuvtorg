from abc import ABC, abstractmethod
from app.domain.entities import User

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

    
class ProductRepositoryPort(ABC):
    """Интерфейс для управления сущностями товаров"""
    @abstractmethod
    async def get_all(self, last_id: int | None, limit: int) -> list:
        """Получение товаров по курсору."""
        pass

    @abstractmethod
    async def save(self, title: str, price: float, description: str, image_url: str) -> dict:
        """Сохранить новый товар в базу данных."""
        pass

    @abstractmethod
    async def delete(self, product_id: int) -> str | None:
        """Удалить товар из БД и вернуть URL его картинки."""
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
    async def add(self, title: str, description: str, image_url: str | None = None) -> bool:
        """Добавление заметки"""
        pass
    
    @abstractmethod
    async def delete(self, note_id: int) -> str | None | bool:
        """Удаление заметки по ID."""
        pass
    
    @abstractmethod
    async def update(self, note_id: int, title: str | None = None, description: str | None = None, image_url: str | None = None) -> str | None | bool:
        """Изменение названия/содержимого/фотографии заметки"""
        pass
