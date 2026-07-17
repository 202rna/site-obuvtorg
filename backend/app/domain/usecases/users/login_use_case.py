from app.domain.ports import UserRepositoryPort, PasswordHasherPort, TokenProviderPort


class LoginUserUseCase:
    """Вход пользователя в систему (Аутентификация)."""
    def __init__(
        self,
        user_repo: UserRepositoryPort, 
        hasher: PasswordHasherPort, 
        token_provider: TokenProviderPort
    ):
        self.user_repo = user_repo  
        self.hasher = hasher    
        self.token_provider = token_provider

    async def execute(self, email: str, raw_password: str) -> str:
        user = await self.user_repo.get_by_email(email)
        if not user:
            raise ValueError("Неверный email или пароль")

        is_password_correct = self.hasher.verify(raw_password, user.hashed_password)
        if not is_password_correct:
            raise ValueError("Неверный email или пароль")
        if user.id is None:
            raise RuntimeError("Критическая ошибка: у пользователя нет ID")

        token = self.token_provider.create_access_token(user_id=user.id)
        
        return token
