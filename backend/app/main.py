import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter, HTTPException, status
from pydantic import BaseModel
import httpx
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.infrastructure.database import db_pool
from app.infrastructure.crypto import BcryptPasswordHasher
from app.infrastructure.jwt_provider import JwtTokenProvider

from app.adapters.repositories import PostgresUserRepository, PostgresProductRepository, PostgresCartRepository, PostgresNoteRepository
from app.adapters.controllers import create_user_router, create_sitemap_router
from app.domain.usecases.chat.generate_shop_data import generate_shop_data, load_shop_data
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import logging

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()

from app.domain.usecases.users.register_use_cases import RegisterUserUseCase
from app.domain.usecases.users.login_use_case import LoginUserUseCase
from app.domain.usecases.users.get_profile_use_case import GetProfileUseCase
from app.domain.usecases.product.get_products_use_case import GetProductsUseCase
from app.domain.usecases.product.add_product_use_case import AddProductUseCase
from app.domain.usecases.cart.add_to_cart_use_case import AddToCartUseCase
from app.domain.usecases.cart.get_cart_use_case import GetCartUseCase
from app.domain.usecases.cart.clear_cart_use_case import ClearCartUseCase
from app.domain.usecases.product.delete_product_use_case import DeleteProductUseCase
from app.domain.usecases.note.create_note_use_case import CreateNoteUseCase
from app.domain.usecases.note.delete_note_use_case import DeleteNoteUseCase
from app.domain.usecases.note.update_note_use_case import UpdateNoteUseCase
from app.domain.usecases.note.get_all_use_case import GetAllNotesUseCase
from app.domain.usecases.note.get_one_by_id_use_case import GetOneNoteByIdUseCase
from app.domain.usecases.product.get_product_by_id_use_case import GetProductByIdUseCase
from app.domain.usecases.product.update_product_use_case import UpdateProductUseCase


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db_pool.open()
    
    scheduler.add_job(
        generate_shop_data,
        kwargs={"product_repo": product_repository, "note_repo": note_repository},
        trigger="cron",
        hour=0,
        minute=0,
        id="daily_shop_data_generation",
        name="Ежедневная генерация данных магазина",
        replace_existing=True,
    )
    scheduler.start()
    
    # Генерируем данные при первом запуске (если файла ещё нет)
    existing_data = await load_shop_data()
    if existing_data is None:
        logger.info("Генерирую данные магазина при первом запуске...")
        await generate_shop_data(product_repo=product_repository, note_repo=note_repository)
    else:
        logger.info(f"Данные магазина уже существуют (от {existing_data.get('generated_at', 'неизвестно')})")
    
    yield
    
    scheduler.shutdown(wait=False)
    await db_pool.close()


app = FastAPI(lifespan=lifespan)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

@app.middleware("http")
async def add_production_secure_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-XSS-Protection"] = "1; mode=block"  
    response.headers["X-Frame-Options"] = "DENY"            
    response.headers["X-Content-Type-Options"] = "nosniff"  
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains" 
    
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


hasher = BcryptPasswordHasher()
token_provider = JwtTokenProvider()


user_repository = PostgresUserRepository(db_pool)
product_repository = PostgresProductRepository(db_pool)
cart_repository = PostgresCartRepository(db_pool)  
note_repository = PostgresNoteRepository(db_pool)

get_all_notes_use_case = GetAllNotesUseCase(note_repo=note_repository)
get_one_note_by_id_use_case = GetOneNoteByIdUseCase(note_repo=note_repository)
create_note_use_case = CreateNoteUseCase(note_repo=note_repository)
update_note_use_case = UpdateNoteUseCase(note_repo=note_repository)
delete_note_use_case = DeleteNoteUseCase(note_repo=note_repository)
register_use_case = RegisterUserUseCase(user_repo=user_repository, hasher=hasher)
login_use_case = LoginUserUseCase(user_repo=user_repository, hasher=hasher, token_provider=token_provider)
get_profile_use_case = GetProfileUseCase(user_repo=user_repository)
get_products_use_case = GetProductsUseCase(product_repo=product_repository)
add_product_use_case = AddProductUseCase(product_repo=product_repository)
get_product_by_id_use_case = GetProductByIdUseCase(product_repo=product_repository)
delete_product_use_case = DeleteProductUseCase(product_repo=product_repository)
update_product_use_case = UpdateProductUseCase(product_repo=product_repository)
add_to_cart_use_case = AddToCartUseCase(cart_repo=cart_repository)
get_cart_use_case = GetCartUseCase(cart_repo=cart_repository)
clear_cart_use_case = ClearCartUseCase(cart_repo=cart_repository)


user_router = create_user_router(
    get_product_by_id_use_case=get_product_by_id_use_case,
    get_all_notes_use_case=get_all_notes_use_case,
    get_one_note_use_case=get_one_note_by_id_use_case,
    create_note_use_case=create_note_use_case,
    update_note_use_case=update_note_use_case,
    delete_note_use_case=delete_note_use_case,
    register_use_case=register_use_case,
    login_use_case=login_use_case,
    get_profile_use_case=get_profile_use_case,
    get_products_use_case=get_products_use_case,
    add_product_use_case=add_product_use_case,
    delete_product_use_case=delete_product_use_case,
    update_product_use_case=update_product_use_case,
    add_to_cart_use_case=add_to_cart_use_case,  
    get_cart_use_case=get_cart_use_case,        
    clear_cart_use_case=clear_cart_use_case,    
    token_provider=token_provider,
)

app.include_router(user_router, prefix="/api")

sitemap_router = create_sitemap_router(product_repository=product_repository)
app.include_router(sitemap_router)

from app.adapters.controllers import create_chat_router
chat_router = create_chat_router()
app.include_router(chat_router, prefix="/api")


# Создаём отдельный роутер для управления данными магазина
shop_data_router = APIRouter(prefix="/api/shop-data", tags=["shop-data"])


@shop_data_router.post("/regenerate", status_code=status.HTTP_200_OK)
async def regenerate_shop_data():
    """Принудительная регенерация данных магазина (скидки, размеры, новости).
    
    Вызывается вручную, если нужно обновить данные вне расписания.
    """
    try:
        result = await generate_shop_data(product_repo=product_repository, note_repo=note_repository)
        return {
            "success": True,
            "message": "Данные магазина успешно сгенерированы",
            "products_count": result.get("products_count", 0),
            "news_count": result.get("news_count", 0),
            "generated_at": result.get("generated_at"),
        }
    except Exception as e:
        logger.error(f"Ошибка генерации данных магазина: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка генерации данных: {str(e)}",
        )


@shop_data_router.get("", status_code=status.HTTP_200_OK)
async def get_shop_data():
    """Получение текущих данных магазина (товары, скидки, размеры, новости).
    
    Возвращает свежесгенерированные данные для использования в AI-чате.
    """
    try:
        data = await load_shop_data()
        if data is None:
            return {
                "success": False,
                "message": "Данные магазина ещё не сгенерированы. Вызовите POST /api/shop-data/regenerate для генерации.",
                "data": None,
            }
        return {
            "success": True,
            "data": data,
        }
    except Exception as e:
        logger.error(f"Ошибка загрузки данных магазина: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка загрузки данных: {str(e)}",
        )


app.include_router(shop_data_router)


# ===== Captcha‑gate / Yandex SmartCaptcha =====

CAPTCHA_SECRET_KEY = os.getenv("SMARTCAPTCHA_SERVER_KEY", "")


class CaptchaVerifyRequest(BaseModel):
    token: str


captcha_router = APIRouter(prefix="/api", tags=["captcha"])


@captcha_router.post("/verify-gate-captcha", status_code=status.HTTP_200_OK)
async def verify_gate_captcha(body: CaptchaVerifyRequest):
    """Проверяет токен Яндекс SmartCaptcha через серверный API.
    
    Тело запроса: { "token": "токен_от_фронтенда" }
    Ответ:        { "success": true/false }
    """
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                "https://smartcaptcha.yandexcloud.net/validate",
                data={
                    "secret": CAPTCHA_SECRET_KEY,
                    "token": body.token,
                },
            )
            result = resp.json()
            # API Яндекса возвращает { "status": "ok", "host": "...", ... }
            # или { "status": "failed", ... }
            success = result.get("status") == "ok"
            return {"success": success}
    except Exception as e:
        logger.error(f"Captcha verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Ошибка проверки капчи на стороне сервера",
        )


app.include_router(captcha_router)