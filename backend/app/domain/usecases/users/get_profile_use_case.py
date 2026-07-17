from app.domain.entities import User
from app.domain.ports import UserRepositoryPort


class GetProfileUseCase:
    """Получение профиля текущего вошедшего пользователя."""
    def __init__(self, user_repo: UserRepositoryPort):
        self.user_repo = user_repo

    async def execute(self, user_id: int) -> User:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError("Пользователь не найден")
        return user
