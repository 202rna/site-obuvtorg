import bcrypt
from app.domain.ports import PasswordHasherPort

class BcryptPasswordHasher(PasswordHasherPort):
    """Реализация порта шифрования."""
    
    def hash(self, password: str) -> str:
        """Хэширование пароля."""
        
        pwd_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(pwd_bytes, salt)
        return hashed.decode('utf-8')

    def verify(self, raw_password: str, hashed_password: str) -> bool:
        """Проверка соответствует ли сырой пароль хэшу из базы данных."""
        
        raw_bytes = raw_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        
        return bcrypt.checkpw(raw_bytes, hashed_bytes)
