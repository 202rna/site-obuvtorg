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

        if "image_urls" in fields_to_update:
            image_urls = fields_to_update["image_urls"]
            if not isinstance(image_urls, list):
                raise ValueError("image_urls должен быть массивом")
            normalized_image_urls = [str(url).strip() for url in image_urls if str(url).strip()]
            if not normalized_image_urls:
                raise ValueError("Нужно оставить хотя бы одно изображение")
            fields_to_update["image_urls"] = normalized_image_urls

        if "categories" in fields_to_update:
            categories = fields_to_update["categories"]
            if not isinstance(categories, list):
                raise ValueError("categories должен быть массивом")
            fields_to_update["categories"] = [str(c).strip() for c in categories if str(c).strip()]

        if "sizes" in fields_to_update:
            sizes = fields_to_update["sizes"]
            if not isinstance(sizes, list):
                raise ValueError("sizes должен быть массивом")
            normalized_sizes = [int(size) for size in sizes]
            if any(size <= 0 for size in normalized_sizes):
                raise ValueError("Размеры должны быть положительными числами")
            fields_to_update["sizes"] = normalized_sizes

        return await self.product_repo.update(product_id, **fields_to_update)
