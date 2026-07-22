from app.domain.ports import ProductRepositoryPort


class UpdateProductUseCase:
    """Частичное обновление товара (только для администратора)."""

    def __init__(self, product_repo: ProductRepositoryPort) -> None:
        self.product_repo = product_repo

    async def execute(self, user_role: str, product_id: int, fields_to_update: dict) -> bool:
        if user_role != "admin":
            raise PermissionError("Доступно только администратору.")

        if not fields_to_update:
            return True

        if "price" in fields_to_update and fields_to_update["price"] is not None:
            if float(fields_to_update["price"]) <= 0:
                raise ValueError("Цена должна быть больше нуля")

        if "discount" in fields_to_update and fields_to_update["discount"] is not None:
            discount = int(fields_to_update["discount"])
            if discount < 0 or discount > 100:
                raise ValueError("Скидка должна быть от 0 до 100%")
            fields_to_update["discount"] = discount

        if "title" in fields_to_update and fields_to_update["title"] is not None:
            if not str(fields_to_update["title"]).strip():
                raise ValueError("Название не может быть пустым")

        return await self.product_repo.update(product_id, **fields_to_update)
