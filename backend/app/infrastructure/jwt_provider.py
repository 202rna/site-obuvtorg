import os
import jwt
from datetime import datetime, timedelta, timezone
from app.domain.ports import TokenProviderPort


class JwtTokenProvider(TokenProviderPort):
    """Реализация порта генерации и валидации токенов с PyJWT."""
    def __init__(self):
        self.secret_key = os.getenv("JWT_SECRET")
        if not self.secret_key:
            raise RuntimeError("Переменная окружения JWT_SECRET не задана!")

    def create_access_token(self, user_id: int, expires_minutes: int = 60) -> str:
        """Создание JWT токена доступа для пользователя.

        Args:
            user_id (int): Идентификатор пользователя.
            expires_minutes (int, optional): Время действия токена. Defaults to 60.

        Returns:
            str: Зашифрованния строка сгенерированного токена JWT.
        """
        expire_time = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
        payload = {"user_id": user_id, "exp": expire_time}
        token_string = jwt.encode(payload, self.secret_key, algorithm="HS256")  
        return token_string

    def decode_access_token(self, token: str) -> int | None:
        """Расшифровыает и проверяет токен.

        Args:
            token (str): Токен пользователя для проверки.

        Returns:
            int | None: Если проверка успешна то ID пользователя, иначе - None.
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=["HS256"])  
            return payload.get("user_id")
        except jwt.PyJWTError:
            return None
