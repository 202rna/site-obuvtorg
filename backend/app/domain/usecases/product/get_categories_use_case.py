from app.domain.ports import ProductRepositoryPort


class GetCategoriesUseCase:
    def __init__(self, product_repo: ProductRepositoryPort):
        # Используйте вашу аннотацию типа для репозитория
        self.product_repo = product_repo

    async def execute(self) -> list[str]:
        return await self.product_repo.get_all_categories()
