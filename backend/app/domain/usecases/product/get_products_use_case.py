from app.domain.ports import ProductRepositoryPort


class GetProductsUseCase:
    """Получение каталога товаров."""
    def __init__(self, product_repo: ProductRepositoryPort):
        self.product_repo = product_repo

    async def execute(self, last_id: int | None = None, limit: int = 6, discounted_only: bool = False) -> list:
        if limit < 1 or limit > 100:
            limit = 6  

        return await self.product_repo.get_all(
            last_id=last_id,
            limit=limit,
            discounted_only=discounted_only,
        )
