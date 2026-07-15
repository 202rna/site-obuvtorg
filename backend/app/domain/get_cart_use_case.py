from app.domain.ports import CartRepositoryPort

class GetCartUseCase:
    """Получение товаров в корзине конкретного пользователя.
    """
    def __init__(self, cart_repo: CartRepositoryPort):
        self.cart_repo = cart_repo

    async def execute(self, user_id: int) -> list:
        if user_id <= 0:
            raise ValueError("Некорректный ID пользователя")
        return await self.cart_repo.get_user_cart(user_id=user_id)
