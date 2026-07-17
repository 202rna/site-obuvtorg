from app.domain.ports import ProductRepositoryPort


class DeleteProductUseCase:
    """Удаление конкретного товара (Только для администратора).
    """
    def __init__(self, product_repo: ProductRepositoryPort):
        self.product_repo = product_repo

    async def execute(self, user_role: str, product_id: int) -> str | None:
        if user_role != "admin":
            raise PermissionError("У вас нет прав для удаления товаров")
            
        if product_id <= 0:
            raise ValueError("Некорректный ID товара")

        return await self.product_repo.delete(product_id=product_id)
