from app.domain.ports import ProductRepositoryPort


class MoveProductToDiscount:
    """Отправка товаров в таблицу уцененных товаров с возможно новой ценой."""
    def __init__(self, product_repo: ProductRepositoryPort):
        self.product_repo = product_repo

    async def execute(self, product_id: int, product_discount: int) -> bool:
        product = await self.product_repo.get_by_id(product_id=product_id)
        if product is not None:
            product_price = product["price"]
            return await self.product_repo.move_to_discounted(
                product_id=product_id,
                new_price=(product_price * (100 - product_discount) + 50) // 100
            )
        return False
