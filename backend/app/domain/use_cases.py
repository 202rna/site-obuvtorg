from app.domain.entities import User
from app.domain.ports import UserRepositoryPort, PasswordHasherPort

class RegisterUserUseCase:
    """Регистрация нового пользователя.
    """
    
    def __init__(self, user_repo: UserRepositoryPort, hasher: PasswordHasherPort):
        self.user_repo = user_repo
        self.hasher = hasher

    async def execute(self, email: str, raw_password: str) -> User:
        existing_user = await self.user_repo.get_by_email(email)
        if existing_user:
            raise ValueError("Пользователь с таким email уже существует")

        hashed_pwd = self.hasher.hash(raw_password)
        new_user = User(email=email, hashed_password=hashed_pwd)
        saved_user = await self.user_repo.save(new_user)
        
        return saved_user
