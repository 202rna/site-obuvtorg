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
        image_url: str,
        full_description: str | None = None,
        discount: int = 0,
    ) -> dict:
        if user_role != "admin":
            raise PermissionError("У вас нет прав для добавления товаров")

        if not title or price <= 0:
            raise ValueError("Некорректные данные товара")

        if discount < 0 or discount > 100:
            raise ValueError("Скидка должна быть от 0 до 100%")

        return await self.product_repo.save(
            title=title,
            price=price,
            description=description,
            image_url=image_url,
            full_description=full_description,
            discount=discount,
        )
