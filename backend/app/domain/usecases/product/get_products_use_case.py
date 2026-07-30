from app.domain.ports import ProductRepositoryPort

DEFAULT_PAGE_SIZE = 15
MAX_PAGE_SIZE = 50


class GetProductsUseCase:
    """Получение каталога товаров."""

    def __init__(self, product_repo: ProductRepositoryPort):
        self.product_repo = product_repo

    async def execute(
        self,
        last_id: int | None = None,
        limit: int = DEFAULT_PAGE_SIZE,
        discounted_only: bool = False,
        gender: str | None = None,
        categories: list[str] | None = None,
    ) -> dict:
        if limit < 1:
            limit = DEFAULT_PAGE_SIZE
        if limit > MAX_PAGE_SIZE:
            limit = MAX_PAGE_SIZE

        normalized_gender = gender.strip() if gender and gender.strip() else None
        normalized_categories = [
            c.strip() for c in (categories or []) if c and str(c).strip()
        ]

        items = await self.product_repo.get_all(
            last_id=last_id,
            limit=limit + 1,
            discounted_only=discounted_only,
            gender=normalized_gender,
            categories=normalized_categories or None,
        )

        has_more = len(items) > limit
        if has_more:
            items = items[:limit]

        return {"items": items, "has_more": has_more}
