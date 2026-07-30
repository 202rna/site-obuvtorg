from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel


import shutil
import os
import uuid

from app.domain.usecases.note.create_note_use_case import CreateNoteUseCase
from app.domain.usecases.note.delete_note_use_case import DeleteNoteUseCase
from app.domain.usecases.note.update_note_use_case import UpdateNoteUseCase
from app.domain.usecases.note.get_one_by_id_use_case import GetOneNoteByIdUseCase
from app.domain.usecases.note.get_all_use_case import GetAllNotesUseCase

from app.domain.usecases.users.register_use_cases import RegisterUserUseCase
from app.domain.usecases.users.login_use_case import LoginUserUseCase
from app.domain.usecases.users.get_profile_use_case import GetProfileUseCase

from app.domain.usecases.product.get_products_use_case import GetProductsUseCase  
from app.domain.usecases.product.get_product_filters_use_case import GetProductFiltersUseCase
from app.domain.usecases.product.add_product_use_case import AddProductUseCase
from app.domain.usecases.product.delete_product_use_case import DeleteProductUseCase
from app.domain.usecases.product.get_product_by_id_use_case import GetProductByIdUseCase
from app.domain.usecases.product.update_product_use_case import UpdateProductUseCase

from app.domain.usecases.cart.add_to_cart_use_case import AddToCartUseCase
from app.domain.usecases.cart.get_cart_use_case import GetCartUseCase
from app.domain.usecases.cart.clear_cart_use_case import ClearCartUseCase

from app.domain.ports import TokenProviderPort, ProductRepositoryPort
from app.domain.usecases.chat.chat_service import get_ai_answer
from app.domain.usecases.chat.generate_shop_data import generate_shop_data, load_shop_data
from fastapi.responses import Response
from app.domain.entities import User
from pydantic import BaseModel
import os


security = HTTPBearer()


def _save_upload_file(file: UploadFile) -> str:
    filename_str = file.filename or "image.jpg"
    file_extension = filename_str.split(".")[-1] if "." in filename_str else "jpg"
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    upload_dir = os.path.join("app", "static", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, unique_filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return f"/static/uploads/{unique_filename}"

class UserRegisterSchema(BaseModel):
    email: str
    password: str


class UserLoginSchema(BaseModel):
    email: str
    password: str


class UserSchema(BaseModel):
    email: str
    password: str


class ProductCreateSchema(BaseModel):
    title: str
    price: float
    description: str
    image_url: str


class NoteUpdateSchema(BaseModel):
    title: str | None = None
    description: str | None = None
    image_url: str | None = None


class ProductUpdateSchema(BaseModel):
    title: str | None = None
    price: float | None = None
    description: str | None = None
    full_description: str | None = None
    discount: int | None = None
    image_urls: list[str] | None = None
    categories: list[str] | None = None
    sizes: list[int] | None = None


def create_user_router(
    get_product_by_id_use_case: GetProductByIdUseCase,
    get_one_note_use_case: GetOneNoteByIdUseCase,
    get_all_notes_use_case: GetAllNotesUseCase,
    create_note_use_case: CreateNoteUseCase,
    delete_note_use_case: DeleteNoteUseCase,
    update_note_use_case: UpdateNoteUseCase,
    register_use_case: RegisterUserUseCase,
    login_use_case: LoginUserUseCase,
    get_profile_use_case: GetProfileUseCase,
    get_products_use_case: GetProductsUseCase,
    get_product_filters_use_case: GetProductFiltersUseCase,
    add_product_use_case: AddProductUseCase,
    delete_product_use_case: DeleteProductUseCase,
    update_product_use_case: UpdateProductUseCase,
    add_to_cart_use_case: AddToCartUseCase,
    get_cart_use_case: GetCartUseCase,
    clear_cart_use_case: ClearCartUseCase,
    token_provider: TokenProviderPort
) -> APIRouter:

    router = APIRouter()

    async def get_current_user(cred: HTTPAuthorizationCredentials = Depends(security)) -> User:
        """Аутентификация пользователя"""
        user_id = token_provider.decode_access_token(cred.credentials)
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Невалидный токен")
        user = await get_profile_use_case.execute(user_id=user_id)
        return user

    @router.post("/register", status_code=status.HTTP_201_CREATED)
    async def register(data: UserSchema):
        """        Регистрация нового пользователя.
        Принимает email/nikname и пароль, проверяет уникальность email/nikname
        в базе данных, хэширует пароль и создает новую учетную запись.
    
        Args:
            data (UserSchema): данные для регистрации (nickname и password)

        Raises:
            HTTPException: 400 Bad Request

        Returns:
            dict: JSON с nickname / email созданного пользователя и сообщением о регистрации 
        """
        try:
            user = await register_use_case.execute(email=data.email, raw_password=data.password)
            return {"email": user.email, "message": "Пользователь успешно зарегистрирован"}
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @router.post("/login", status_code=status.HTTP_200_OK)
    async def login(data: UserSchema):
        """Аутентификация пользователя и выдача JWT-токена.
        Принимает email и пароль, проверяет их корректность в базе данных
        и возвращает Access-токен для доступа к защищенным эндпоинтам.
        
        Args:
            data (UserSchema): nickname и password пользователя.

        Raises:
            HTTPException: 401 Unauthorized, если неверные данные пароль/логин

        Returns:
            dict: Токен доступа и его тип.
        """
        try:
            token = await login_use_case.execute(email=data.email, raw_password=data.password)
            return {"access_token": token, "token_type": "bearer"}
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    @router.get("/me", status_code=status.HTTP_200_OK)
    async def get_me(current_user: User = Depends(get_current_user)):
        """Получение профиля текущего пользователя.
        Маршнут защищен JWT-токеном.

        Args:
            current_user (User, optional): Объект пользователя. Defaults to Depends(get_current_user).

        Returns:
            _type_: Данные профиля (id, nickname, role) и сообщение.
        """
        return {
            "id": current_user.id,
            "email": current_user.email,
            "role": current_user.role,  
            "message": "Доступ разрешен. Это ваш закрытый профиль."
        }

    @router.get("/products/filters", status_code=status.HTTP_200_OK)
    async def get_product_filters():
        """Доступные фильтры каталога (сезон, вид, страна, материал)."""
        try:
            return await get_product_filters_use_case.execute()
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Ошибка загрузки фильтров",
            )

    @router.get("/products", status_code=status.HTTP_200_OK)
    async def get_products(
        last_id: int | None = None,
        limit: int = 15,
        discounted_only: bool = False,
        gender: str | None = None,
        category: list[str] = Query(default=[]),
    ):
        """Получение списка продуктов с пагинацией и фильтрацией.

        Args:
            last_id: курсор пагинации.
            limit: размер страницы (макс. 50).
            discounted_only: только товары со скидкой.
            gender: фильтр по полу (жен / муж / дет).
            category: фильтр по категориям (можно передать несколько).
        """
        try:
            return await get_products_use_case.execute(
                last_id=last_id,
                limit=limit,
                discounted_only=discounted_only,
                gender=gender,
                categories=category,
            )
        except Exception:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ошибка загрузки товаров")

    @router.get("/products/{product_id}", status_code=status.HTTP_200_OK)
    async def get_product_by_id(product_id: int):
        if product_id <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID товара должен быть положительным числом"
            )
        try:
            product = await get_product_by_id_use_case.execute(product_id=product_id)
        except Exception as e:
            print(f"Ошибка при получении товара: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Внутренняя ошибка сервера"
            )
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Товар с указанным ID не найден"
            )
        return product
    
    @router.post("/products", status_code=status.HTTP_201_CREATED)
    async def add_product(
        title: str = Form(...),
        price: float = Form(...),
        description: str = Form(...),
        files: list[UploadFile] = File(...),
        current_user: User = Depends(get_current_user),
        full_description: str = Form(None),
        discount: int = Form(0),
        categories: str = Form(""),
        sizes: str = Form(""),
    ):
        """Принимает описание товара от пользователя. Регирует товар в бд и 
        сохраняет его в локальное статическое хранинилище.

        Args:
            title (str, optional): Название.
            price (float, optional): Цена.
            description (str, optional): Описание.
            file (UploadFile, optional): Фото товара.
            current_user (User, optional): Пользовательл.
            discount (int): Скидка в процентах (0–100).

        Raises:
            HTTPException: 403 Frbidden, у пользователя не достаточно прав.
            HTTPException: 500 Internal Server Error.

        Returns:
            dict: Данные созданного товара.
        """
        try:
            if not files:
                raise ValueError("Нужно загрузить хотя бы одно изображение")

            image_urls = [_save_upload_file(file) for file in files if file and file.filename]
            if not image_urls:
                raise ValueError("Нужно загрузить хотя бы одно изображение")

            parsed_categories = [c.strip() for c in categories.split(",") if c.strip()]
            parsed_sizes = [int(s.strip()) for s in sizes.split(",") if s.strip()] if sizes.strip() else []
            
            new_product = await add_product_use_case.execute(
                user_role=current_user.role,
                title=title,
                price=float(price),
                description=description,
                image_urls=image_urls,
                full_description=full_description,
                discount=int(discount or 0),
                categories=parsed_categories,
                sizes=parsed_sizes,
            )
            return new_product

        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ошибка загрузки файла")

    @router.patch("/products/{product_id}", status_code=status.HTTP_200_OK)
    async def update_product(
        product_id: int,
        data: ProductUpdateSchema,
        current_user: User = Depends(get_current_user),
    ):
        """Частичное обновление товара (цена, описание, скидка и др.). Только admin."""
        try:
            update_data = data.model_dump(exclude_unset=True)
            if not update_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Нет полей для обновления",
                )
            success = await update_product_use_case.execute(
                user_role=current_user.role,
                product_id=product_id,
                fields_to_update=update_data,
            )
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Товар не найден",
                )
            return {"message": "Товар успешно обновлён"}
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ошибка обновления товара")

    @router.put("/products/{product_id}/images", status_code=status.HTTP_200_OK)
    async def replace_product_images(
        product_id: int,
        files: list[UploadFile] = File(...),
        current_user: User = Depends(get_current_user),
    ):
        """Заменить все изображения товара (только admin).

        Принимает multipart/form-data с полем files (можно несколько).
        Сохраняет файлы в static/uploads, обновляет image_urls и image_url (primary) в БД.
        Старые изображения (локальные /static/uploads/...) удаляются с диска.
        """
        try:
            # проверим, что товар существует и получим список старых изображений
            existing = await get_product_by_id_use_case.execute(product_id=product_id)
            if existing is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Товар не найден")

            old_urls = existing.get("image_urls") if isinstance(existing, dict) else None
            if not isinstance(old_urls, list):
                old_urls = []

            if not files:
                raise ValueError("Нужно загрузить хотя бы одно изображение")

            new_urls = [_save_upload_file(file) for file in files if file and file.filename]
            if not new_urls:
                raise ValueError("Нужно загрузить хотя бы одно изображение")

            success = await update_product_use_case.execute(
                user_role=current_user.role,
                product_id=product_id,
                fields_to_update={"image_urls": new_urls},
            )
            if not success:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Товар не найден")

            # удаляем старые локальные файлы (если были)
            for image_url in old_urls:
                if not isinstance(image_url, str):
                    continue
                if not image_url.startswith("/static/uploads/"):
                    continue
                filename = image_url.split("/")[-1]
                file_path = os.path.join("app", "static", "uploads", filename)
                if os.path.exists(file_path):
                    try:
                        os.remove(file_path)
                    except Exception:
                        # не валим запрос из-за проблем с удалением файла
                        pass

            return {"message": "Изображения обновлены", "image_urls": new_urls}

        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ошибка обновления изображений")

    
    @router.get("/cart", status_code=status.HTTP_200_OK)
    async def get_cart(current_user: User = Depends(get_current_user)):
        """Получение списка товаров в конзине пользователя.

        Args:
            current_user (User, optional): Авторизованный пользователь.

        Raises:
            HTTPException: 401 Unauthorized, если идентификатор пользователя не найден.
            HTTPException: 500 Internal Server Error, если произошел сбой.

        Returns:
            list: Список товаро в корзине.
        """
        
        if current_user.id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Пользователь не найден")
            
        try:
            return await get_cart_use_case.execute(user_id=current_user.id)
        except Exception:
            raise HTTPException(status_code=500, detail="Ошибка получения корзины")

    @router.post("/cart/{product_id}", status_code=status.HTTP_200_OK)
    async def add_to_cart(product_id: int, current_user: User = Depends(get_current_user)):
        """Добавление товара в корзину пользователя.

        Args:  
            product_id (int): Идентификатор товара.
            current_user (User, optional): Авторизованный пользователь.

        Raises:
            HTTPException: 401 Unauthorized, если не найден идентификатор пользователя.
            HTTPException: 500 internal Server Error, сбой при сохранении в БД.

        Returns:
            dict: Статус операции.
        """
        if current_user.id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Пользователь не найден")
            
        try:
            success = await add_to_cart_use_case.execute(user_id=current_user.id, product_id=product_id)
            return {"success": success, "message": "Товар добавлен в корзину базы данных"}
        except Exception:
            raise HTTPException(status_code=500, detail="Ошибка добавления в корзину")

    @router.delete("/cart", status_code=status.HTTP_200_OK)
    async def clear_cart(current_user: User = Depends(get_current_user)):
        """Удаление всех товаров из корзины пользователя.   

        Args:
            current_user (User, optional): Авторизованый пользователь.

        Raises:
            HTTPException: 500 Internal Server Error, если сбой работе с БД.

        Returns:
            dict: Статус операции.
        """
        if current_user.id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Пользователь не найден")
            
        try:
            await clear_cart_use_case.execute(user_id=current_user.id)
            return {"message": "Корзина успешно очищена в БД"}
        except Exception:
            raise HTTPException(status_code=500, detail="Ошибка очистки корзины")

    @router.delete("/products/{product_id}", status_code=status.HTTP_200_OK)
    async def delete_product(product_id: int, current_user: User = Depends(get_current_user)):
        """Удаление конкретного товара. Доступно только с правами админимтратора.

        Args:
            product_id (int): Идентификатор товара.
            current_user (User, optional): Авторизованный пользователь.

        Raises:
            HTTPException: 404 Not Found, если товар с таким ID отсутствует в БД.
            HTTPException: 403 Forbidden, если у пользователя недостаточно прав 
            HTTPException: 500 Internal Server Error, если произошел системный сбой.

        Returns:
            dict: Флаг операции и сообщение.
        """
        try:
            image_urls = await delete_product_use_case.execute(
                user_role=current_user.role,
                product_id=product_id
            )
            if not image_urls:
                raise HTTPException(status_code=404, detail="Товар не найден в базе")
            for image_url in image_urls:
                filename = image_url.split("/")[-1]
                file_path = os.path.join("app", "static", "uploads", filename)
                if os.path.exists(file_path):
                    os.remove(file_path)
            return {"success": True, "message": "Товар удален из БД, файл стерт с диска!"}
            
        except PermissionError as e:
            raise HTTPException(status_code=403, detail=str(e))
        except Exception as e:
            print(f"Ошибка удаления: {e}")
            raise HTTPException(status_code=500, detail="Ошибка удаления товара")

    @router.post("/note", status_code=status.HTTP_200_OK)
    async def create_note(
        title: str = Form(...),
        description: str = Form(...),
        file: UploadFile = File(None),
        current_user: User = Depends(get_current_user)
    ):
        """Содание заметки (note)

        Args:
            title (str, optional): Название/Заголовок. Defaults to Form(...).
            description (str, optional): Содержание основное. Defaults to Form(...).
            file (UploadFile, optional): Изображение. Defaults to File(None).
            current_user (User, optional): Текущий пользователь. Defaults to Depends(get_current_user).

        Raises:
            HTTPException: HTTP_403_FORBIDDEN недостаточно прав.
            HTTPException: HTTP_500_INTERNAL_SERVER_ERROR

        Returns:
            bool: Статус операции.
        """        
        try:
            image_url = None
            if file and file.filename:
                filename_str = file.filename
                file_extension = filename_str.split(".")[-1] if "." in filename_str else "jpg"
                unique_filename = f"{uuid.uuid4()}.{file_extension}"
                upload_dir = os.path.join("app", "static", "uploads")
                os.makedirs(upload_dir, exist_ok=True)
                
                file_path = os.path.join(upload_dir, unique_filename)
                with open(file_path, "wb") as buffer:
                        shutil.copyfileobj(file.file, buffer)
                    
                static_folder_path = "/static/uploads/"
                image_url = static_folder_path + unique_filename
                
            new_note = await create_note_use_case.execute(
                    user_role=current_user.role,
                    title=title,
                    description=description,
                    image_url=image_url
                )
            if not new_note:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return new_note

        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ошибка загрузки файла")

    @router.delete("/note/{note_id}", status_code=status.HTTP_200_OK)
    async def delete_note(note_id: int, current_user: User = Depends(get_current_user)):
        try:
            return await delete_note_use_case.execute(user_role=current_user.role, id=note_id)
        except PermissionError as e:
            raise HTTPException(status_code=403, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @router.patch("/note/{note_id}", status_code=status.HTTP_200_OK)
    async def update_note(note_id: int, data: NoteUpdateSchema, current_user: User = Depends(get_current_user)):
        try:
            update_data = data.model_dump(exclude_unset=True)
            if not update_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            success = await update_note_use_case.execute(user_role=current_user.role, id=note_id, field_to_update=update_data)
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                )
            return {"message": "Заметка успешно обновлена"}        
        except PermissionError as e:
            raise HTTPException(status_code=403, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
        
    @router.get("/note/{note_id}", status_code=status.HTTP_200_OK)
    async def get_one_note(note_id: int):
        try:
            return await get_one_note_use_case.execute(note_id=note_id)
        except Exception:
            raise HTTPException(status_code=500, detail="Ошибка получения заметки.")

    @router.post("/admin/refresh-shop-data", status_code=status.HTTP_200_OK)
    async def admin_refresh_shop_data(
        current_user: User = Depends(get_current_user),
    ):
        """Принудительное обновление данных магазина для AI-подбора. Только admin."""
        if current_user.role != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Недостаточно прав")
        try:
            from app.domain.usecases.chat.generate_shop_data import generate_shop_data
            from app.adapters.repositories import PostgresProductRepository, PostgresNoteRepository
            from app.infrastructure.database import db_pool
            product_repo = PostgresProductRepository(db_pool)
            note_repo = PostgresNoteRepository(db_pool)
            result = await generate_shop_data(product_repo=product_repo, note_repo=note_repo)
            return {
                "status": "ok",
                "message": "Данные магазина обновлены",
                "products_count": result.get("products_count", 0),
                "news_count": result.get("news_count", 0),
                "generated_at": result.get("generated_at"),
            }
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @router.get("/notes", status_code=status.HTTP_200_OK)
    async def get_notes(last_id: int | None = None, limit: int = 30):
        """Получение списка заметок

        Args:
            last_id (int | None, optional): ID последней записи просмотренной. Defaults to None.
            limit (int, optional): Количество заметок на странице. Defaults to 30.

        Raises:
            HTTPException: 500 Internal Server Error, сбой при обращении к бд.

        Returns:
            list: Список товаров.
        """
        try:
            return await get_all_notes_use_case.execute(last_id=last_id, limit=limit)
        except Exception:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ошибка загрузки заметок.")

    return router


def create_sitemap_router(
    product_repository: ProductRepositoryPort,
) -> APIRouter:
    """Фабрика роутера для sitemap.xml."""
    router = APIRouter()

    @router.get("/sitemap.xml", include_in_schema=False)
    async def sitemap():
        """Генерация sitemap.xml для поисковых систем."""
        base_url = "https://xn----9sbdf5cdoog5g.xn--p1ai"

        static_pages = [
            {"loc": base_url, "priority": "1.0", "changefreq": "daily"},
            {"loc": f"{base_url}/discount", "priority": "0.8", "changefreq": "daily"},
            {"loc": f"{base_url}/how-to-drive", "priority": "0.6", "changefreq": "weekly"},
            {"loc": f"{base_url}/notes", "priority": "0.5", "changefreq": "weekly"},
        ]

        product_ids = await product_repository.get_all_ids()

        urls = []
        for page in static_pages:
            urls.append(f"""  <url>
    <loc>{page['loc']}</loc>
    <priority>{page['priority']}</priority>
    <changefreq>{page['changefreq']}</changefreq>
  </url>""")

        for pid in product_ids:
            urls.append(f"""  <url>
    <loc>{base_url}/products/{pid}</loc>
    <priority>0.9</priority>
    <changefreq>weekly</changefreq>
  </url>""")

        xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{chr(10).join(urls)}
</urlset>"""

        return Response(content=xml, media_type="application/xml")

    return router


class ChatMessageSchema(BaseModel):
    """Схема одного сообщения чата."""
    role: str
    content: str


class ChatRequestSchema(BaseModel):
    """Схема запроса к AI-чату."""
    messages: list[ChatMessageSchema]


def create_chat_router() -> APIRouter:
    """Фабрика роутера для AI-чата."""
    router = APIRouter()

    @router.post("/chat", status_code=status.HTTP_200_OK)
    async def chat(data: ChatRequestSchema):
        """Отправка сообщения в AI-чат консультант магазина.
        
        Принимает массив сообщений (историю диалога) с клиента.
        Последнее сообщение должно быть от user — на него AI ответит.
        Сервер не хранит историю в БД, она хранится в состоянии React на клиенте.
        
        Если AI рекомендует товары (с маркерами [RECOMMEND:ID]),
        возвращает их данные (фото, цена, название, ссылка) для отображения карточек.
        
        Args:
            data: Объект с полем messages — массив {role, content}.
        
        Returns:
            dict: {
                "role": "assistant",
                "content": str,  # ответ AI (текст)
                "recommended_products": list[dict]  # данные рекомендованных товаров
            }
        """
        ai_api_key = os.getenv("AI_TUNNEL_API_KEY")
        ai_model = os.getenv("AI_TUNNEL_MODEL", "gpt-4o-mini")
        ai_base_url = os.getenv("AI_TUNNEL_BASE_URL", "https://api.aitunnel.ru/v1")
        
        print(f"[CHAT DEBUG] AI_TUNNEL_API_KEY={'***' if ai_api_key else 'NOT SET'}")
        print(f"[CHAT DEBUG] AI_TUNNEL_MODEL={ai_model}")
        print(f"[CHAT DEBUG] AI_TUNNEL_BASE_URL={ai_base_url}")
        
        if not ai_api_key:
            print("[CHAT DEBUG] AI_TUNNEL_API_KEY is NOT SET - returning fallback message")
            return {
                "role": "assistant",
                "content": "Извините, AI-консультант временно не настроен. Пожалуйста, позвоните нам по телефону +7 (4852) 21-47-55.",
                "recommended_products": [],
            }
        
        try:
            messages_dict = [{"role": m.role, "content": m.content} for m in data.messages]
            result = await get_ai_answer(
                messages=messages_dict,
                api_key=ai_api_key,
                model=ai_model,
                base_url=ai_base_url,
            )
            
            # Загружаем данные магазина, чтобы получить инфу о рекомендованных товарах
            shop_data = await load_shop_data()
            recommended_products = []
            
            for pid in result.get("recommended_product_ids", []):
                if shop_data and "products" in shop_data:
                    for p in shop_data["products"]:
                        if p["id"] == pid:
                            # Берём первую картинку для карточки
                            image_url = ""
                            if isinstance(p.get("image_urls"), list) and len(p["image_urls"]) > 0:
                                image_url = p["image_urls"][0]
                            elif p.get("image_url"):
                                image_url = p["image_url"]
                            
                            recommended_products.append({
                                "id": p["id"],
                                "title": p["title"],
                                "price": p["price"],
                                "final_price": p.get("final_price", p["price"]),
                                "discount": p.get("discount", 0),
                                "image_url": image_url,
                                "product_url": f"/products/{p['id']}",
                            })
                            break
            
            return {
                "role": "assistant",
                "content": result["content"],
                "recommended_products": recommended_products,
            }
        except Exception as e:
            print(f"Ошибка AI-чата: {e}")
            return {
                "role": "assistant",
                "content": "Извините, произошла ошибка при обработке запроса. Пожалуйста, попробуйте позже или позвоните нам по телефону +7 (4852) 21-47-55.",
                "recommended_products": [],
            }

    return router
