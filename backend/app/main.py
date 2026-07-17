from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles


from app.infrastructure.database import db_pool
from app.infrastructure.crypto import BcryptPasswordHasher
from app.infrastructure.jwt_provider import JwtTokenProvider


from app.adapters.repositories import PostgresUserRepository, PostgresProductRepository, PostgresCartRepository
from app.adapters.controllers import create_user_router


from app.domain.usecases.users.register_use_cases import RegisterUserUseCase
from app.domain.usecases.users.login_use_case import LoginUserUseCase
from app.domain.usecases.users.get_profile_use_case import GetProfileUseCase
from app.domain.usecases.product.get_products_use_case import GetProductsUseCase
from app.domain.usecases.product.add_product_use_case import AddProductUseCase
from app.domain.usecases.cart.add_to_cart_use_case import AddToCartUseCase
from app.domain.usecases.cart.get_cart_use_case import GetCartUseCase
from app.domain.usecases.cart.clear_cart_use_case import ClearCartUseCase
from app.domain.usecases.product.delete_product_use_case import DeleteProductUseCase


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db_pool.open()
    yield
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


register_use_case = RegisterUserUseCase(user_repo=user_repository, hasher=hasher)
login_use_case = LoginUserUseCase(user_repo=user_repository, hasher=hasher, token_provider=token_provider)
get_profile_use_case = GetProfileUseCase(user_repo=user_repository)
get_products_use_case = GetProductsUseCase(product_repo=product_repository)
add_product_use_case = AddProductUseCase(product_repo=product_repository)
delete_product_use_case = DeleteProductUseCase(product_repo=product_repository)
add_to_cart_use_case = AddToCartUseCase(cart_repo=cart_repository)
get_cart_use_case = GetCartUseCase(cart_repo=cart_repository)
clear_cart_use_case = ClearCartUseCase(cart_repo=cart_repository)


user_router = create_user_router(
    register_use_case=register_use_case,
    login_use_case=login_use_case,
    get_profile_use_case=get_profile_use_case,
    get_products_use_case=get_products_use_case,
    add_product_use_case=add_product_use_case,
    delete_product_use_case=delete_product_use_case,
    add_to_cart_use_case=add_to_cart_use_case,  
    get_cart_use_case=get_cart_use_case,        
    clear_cart_use_case=clear_cart_use_case,    
    token_provider=token_provider,
)

app.include_router(user_router, prefix="/api")
