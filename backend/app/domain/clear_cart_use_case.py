from app.domain.ports import CartRepositoryPort

class ClearCartUseCase:
    """Удаление всех товаров из корзины."""
    def __init__(self, cart_repo: CartRepositoryPort):
        self.cart_repo = cart_repo

    async def execute(self, user_id: int) -> None:
        if user_id <= 0:
            raise ValueError("Некорректный ID пользователя")
        await self.cart_repo.clear(user_id=user_id)
