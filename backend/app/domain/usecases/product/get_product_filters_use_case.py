from app.domain.ports import ProductRepositoryPort
from app.domain.category_utils import group_categories


class GetProductFiltersUseCase:
    """Получение доступных фильтров каталога."""

    def __init__(self, product_repo: ProductRepositoryPort):
        self.product_repo = product_repo

    async def execute(self) -> dict:
        names = await self.product_repo.get_all_category_names()
        return group_categories(names)
