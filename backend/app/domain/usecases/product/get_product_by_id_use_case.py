from app.domain.ports import ProductRepositoryPort


class GetProductByIdUseCase:
    def __init__(self, product_repo: ProductRepositoryPort) -> None:
        self.product_repo = product_repo
        
    async def execute(self, product_id: int) -> dict | None:
        return await self.product_repo.get_by_id(product_id=product_id)
