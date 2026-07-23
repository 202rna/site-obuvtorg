from app.domain.ports import ProductRepositoryPort


class AddProductUseCase:
    """Добавление нового товара (Только для Админов)."""
    def __init__(self, product_repo: ProductRepositoryPort):
        self.product_repo = product_repo

    async def execute(
        self,
        user_role: str,
        title: str,
        price: float,
        description: str,
        image_urls: list[str],
        full_description: str | None = None,
        discount: int = 0,
        categories: list[str] | None = None,
        sizes: list[int] | None = None,
    ) -> dict:
        if user_role != "admin":
            raise PermissionError("У вас нет прав для добавления товаров")

        if not title or price <= 0:
            raise ValueError("Некорректные данные товара")

        if discount < 0 or discount > 100:
            raise ValueError("Скидка должна быть от 0 до 100%")

        if not image_urls:
            raise ValueError("Нужно добавить хотя бы одно изображение")

        normalized_image_urls = [url.strip() for url in image_urls if str(url).strip()]
        if not normalized_image_urls:
            raise ValueError("Ссылки изображений пустые")

        normalized_categories: list[str] = []
        if categories is not None:
            normalized_categories = [c.strip() for c in categories if str(c).strip()]

        normalized_sizes: list[int] = []
        if sizes is not None:
            normalized_sizes = [int(size) for size in sizes]
            if any(size <= 0 for size in normalized_sizes):
                raise ValueError("Размеры должны быть положительными числами")

        return await self.product_repo.save(
            title=title,
            price=price,
            description=description,
            image_urls=normalized_image_urls,
            full_description=full_description,
            discount=discount,
            categories=normalized_categories,
            sizes=normalized_sizes,
        )
