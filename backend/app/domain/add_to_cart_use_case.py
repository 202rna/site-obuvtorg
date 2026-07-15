from app.domain.ports import CartRepositoryPort

class AddToCartUseCase:
    """Добавление товара в корзину (Только для авторизованных пользователей).
    """
    def __init__(self, cart_repo: CartRepositoryPort):
        self.cart_repo = cart_repo

    async def execute(self, user_id: int, product_id: int) -> bool:
        if user_id <= 0 or product_id <= 0:
            raise ValueError("Некорректный ID пользователя или товара")
        return await self.cart_repo.add(user_id=user_id, product_id=product_id)
