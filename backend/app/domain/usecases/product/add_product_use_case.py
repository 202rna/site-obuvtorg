from app.domain.ports import ProductRepositoryPort


class AddProductUseCase:
    """Добавление нового товара (Только для Админов)."""
    def __init__(self, product_repo: ProductRepositoryPort):
        self.product_repo = product_repo

    async def execute(self, user_role: str, title: str, price: float, description: str, image_url: str) -> dict:
        if user_role != "admin":
            raise PermissionError("У вас нет прав для добавления товаров")

        if not title or price <= 0:
            raise ValueError("Некорректные данные товара")

        return await self.product_repo.save(
            title=title, 
            price=price, 
            description=description, 
            image_url=image_url
        )
