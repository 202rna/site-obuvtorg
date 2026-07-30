from app.domain.ports import ProductRepositoryPort


class GetProductsUseCase:
    """Получение каталога товаров."""
    def __init__(self, product_repo: ProductRepositoryPort):
        self.product_repo = product_repo

    async def execute(self, last_id: int | None = None, limit: int = 30, discounted_only: bool = False) -> list:
        if limit < 1:
            limit = 30
        if limit > 999:
            limit = 999

        return await self.product_repo.get_all(
            last_id=last_id,
            limit=limit,
            discounted_only=discounted_only,
        )
