from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel


import shutil
import os
import uuid


from app.domain.usecases.users.register_use_cases import RegisterUserUseCase
from app.domain.usecases.users.login_use_case import LoginUserUseCase
from app.domain.usecases.users.get_profile_use_case import GetProfileUseCase
from app.domain.usecases.product.get_products_use_case import GetProductsUseCase  
from app.domain.usecases.product.add_product_use_case import AddProductUseCase
from app.domain.usecases.cart.add_to_cart_use_case import AddToCartUseCase
from app.domain.usecases.cart.get_cart_use_case import GetCartUseCase
from app.domain.usecases.cart.clear_cart_use_case import ClearCartUseCase
from app.domain.usecases.product.delete_product_use_case import DeleteProductUseCase
from app.domain.ports import TokenProviderPort
from app.domain.entities import User


security = HTTPBearer()

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


def create_user_router(
    register_use_case: RegisterUserUseCase,
    login_use_case: LoginUserUseCase,
    get_profile_use_case: GetProfileUseCase,
    get_products_use_case: GetProductsUseCase,
    add_product_use_case: AddProductUseCase,
    delete_product_use_case: DeleteProductUseCase, 
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


    @router.get("/products", status_code=status.HTTP_200_OK)
    async def get_products(last_id: int | None = None, limit: int = 30):
        """Получение списка продуктов

        Args:
            last_id (int | None, optional): _description_. Defaults to None.
            limit (int, optional): _description_. Defaults to 30.

        Raises:
            HTTPException: 500 Internal Server Error, сбой при обращении к бд.

        Returns:
            list: Список товаров.
        """
        try:
            return await get_products_use_case.execute(last_id=last_id, limit=limit)
        except Exception:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ошибка загрузки товаров")

    @router.post("/products", status_code=status.HTTP_201_CREATED)
    async def add_product(
        title: str = Form(...),
        price: float = Form(...),
        description: str = Form(...),
        file: UploadFile = File(...),
        current_user: User = Depends(get_current_user)
    ):
        """Принимает описание товара от пользователя. Регирует товар в бд и 
        сохраняет его в локальное статическое хранинилище
    

        Args:
            title (str, optional): Название.
            price (float, optional): Цена.
            description (str, optional): Описание.
            file (UploadFile, optional): Фото товара.
            current_user (User, optional): Пользовательл.

        Raises:
            HTTPException: 403 Frbidden, у пользователя не достаточно прав.
            HTTPException: 500 Internal Server Error.

        Returns:
            dict: Данные созданного товара.
        """
        try:
            
            filename_str = file.filename or "image.jpg"
            file_extension = filename_str.split(".")[-1] if "." in filename_str else "jpg"
            unique_filename = f"{uuid.uuid4()}.{file_extension}"
            upload_dir = os.path.join("app", "static", "uploads")
            os.makedirs(upload_dir, exist_ok=True)
            file_path = os.path.join(upload_dir, unique_filename)
    
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            #base_server_url = "http://127.0.0.1:8000"
            static_folder_path = "/static/uploads/"
            #image_url = base_server_url + static_folder_path + unique_filename
            image_url = static_folder_path + unique_filename
            
            new_product = await add_product_use_case.execute(
                user_role=current_user.role,
                title=title,
                price=float(price),
                description=description,
                image_url=image_url
            )
            return new_product

        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        except Exception as e:
            
            print(f"Ошибка загрузки изображения: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ошибка загрузки файла")

    
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
            
            image_url = await delete_product_use_case.execute(
                user_role=current_user.role,
                product_id=product_id
            )
            
            if not image_url:
                raise HTTPException(status_code=404, detail="Товар не найден в базе")
            
            
            
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

    return router
