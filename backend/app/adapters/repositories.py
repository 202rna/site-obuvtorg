from typing import Any, List
from psycopg_pool import AsyncConnectionPool
from app.domain.ports import UserRepositoryPort, ProductRepositoryPort, CartRepositoryPort
from app.domain.entities import User


class PostgresUserRepository(UserRepositoryPort):
    def __init__(self, pool: AsyncConnectionPool[Any]):
        self.pool = pool

    async def get_by_email(self, email: str) -> User | None:
        async with self.pool.connection() as conn:
            async with conn.cursor() as cur:
                
                await cur.execute("SELECT id, email, hashed_password, role FROM users WHERE email = %s", (email,))
                row = await cur.fetchone()
                if not row: return None
                
                return User(id=row[0], email=row[1], hashed_password=row[2], role=row[3])

    async def get_by_id(self, user_id: int) -> User | None:
        async with self.pool.connection() as conn:
            async with conn.cursor() as cur:
                
                await cur.execute("SELECT id, email, hashed_password, role FROM users WHERE id = %s", (user_id,))
                row = await cur.fetchone()
                if not row: return None
                
                return User(id=row[0], email=row[1], hashed_password=row[2], role=row[3])

    async def save(self, user: User) -> User:
        async with self.pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    "INSERT INTO users (email, hashed_password) VALUES (%s, %s) RETURNING id",
                    (user.email, user.hashed_password)
                )
                generated_id = await cur.fetchone()
                if generated_id is None:
                    raise RuntimeError("База данных не вернула ID")
                user.id = generated_id[0]
                return user


class PostgresProductRepository(ProductRepositoryPort):
    def __init__(self, pool: AsyncConnectionPool[Any]):
        self.pool = pool

    async def get_all(self, last_id: int | None, limit: int) -> List[dict]:
        async with self.pool.connection() as conn:
            async with conn.cursor() as cur:
                if last_id is None:
                    
                    await cur.execute(
                        "SELECT id, title, price, description, image_url FROM products ORDER BY id ASC LIMIT %s",
                        (limit,)
                    )
                else:
                    
                    await cur.execute(
                        """
                        SELECT id, title, price, description, image_url 
                        FROM products 
                        WHERE id > %s 
                        ORDER BY id ASC 
                        LIMIT %s
                        """,
                        (last_id, limit)
                    )
                
                rows = await cur.fetchall()
                
                products = []
                for row in rows:
                    products.append({
                        "id": row[0],
                        "title": row[1],
                        "price": float(row[2]),
                        "description": row[3],
                        "image_url": row[4]
                    })
                return products

    async def save(self, title: str, price: float, description: str, image_url: str) -> dict:
        async with self.pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    INSERT INTO products (title, price, description, image_url)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, title, price, description, image_url
                    """,
                    (title, price, description, image_url)
                )
                row = await cur.fetchone()
                if not row:
                    raise RuntimeError("Не удалось сохранить товар")
                return {"id": row[0], "title": row[1], "price": float(row[2]), "description": row[3], "image_url": row[4]}

        
    
    async def delete(self, product_id: int) -> str | None:
        async with self.pool.connection() as conn:
            async with conn.cursor() as cur:
                
                await cur.execute("DELETE FROM products WHERE id = %s RETURNING image_url", (product_id,))
                row = await cur.fetchone()
                if row:
                    return row[0]  
                return None



class PostgresCartRepository(CartRepositoryPort):
    def __init__(self, pool: AsyncConnectionPool[Any]):
        self.pool = pool

    async def add(self, user_id: int, product_id: int) -> bool:
        async with self.pool.connection() as conn:
            async with conn.cursor() as cur:
                try:
                    
                    await cur.execute(
                        """
                        INSERT INTO cart_items (user_id, product_id) 
                        VALUES (%s, %s) 
                        ON CONFLICT (user_id, product_id) DO NOTHING
                        RETURNING id
                        """,
                        (user_id, product_id)
                    )
                    row = await cur.fetchone()
                    return row is not None
                except Exception:
                    return False

    async def get_user_cart(self, user_id: int) -> List[dict]:
        async with self.pool.connection() as conn:
            async with conn.cursor() as cur:
                
                await cur.execute(
                    """
                    SELECT p.id, p.title, p.price, p.description, p.image_url 
                    FROM cart_items c
                    JOIN products p ON c.product_id = p.id
                    WHERE c.user_id = %s
                    ORDER BY c.created_at DESC
                    """,
                    (user_id,)
                )
                rows = await cur.fetchall()
                return [{"id": r[0], "title": r[1], "price": float(r[2]), "description": r[3], "image_url": r[4]} for r in rows]

    async def clear(self, user_id: int) -> None:
        async with self.pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute("DELETE FROM cart_items WHERE user_id = %s", (user_id,))
