from app.domain.ports import ProductRepositoryPort


class MoveProductToDiscount:
    """Помечает товар как со скидкой (устанавливает discount > 0)."""

    def __init__(self, product_repo: ProductRepositoryPort):
        self.product_repo = product_repo

    async def execute(self, product_id: int, product_discount: int) -> bool:
        if product_discount < 0 or product_discount > 100:
            raise ValueError("Скидка должна быть от 0 до 100%")
        product = await self.product_repo.get_by_id(product_id=product_id)
        if product is None:
            return False
        return await self.product_repo.update(
            product_id=product_id,
            discount=product_discount,
        )
