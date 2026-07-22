from typing import Any, List
from psycopg_pool import AsyncConnectionPool
from app.domain.ports import UserRepositoryPort, ProductRepositoryPort, CartRepositoryPort, NoteRepositoryPort
from app.domain.entities import User
from app.domain.ports import MissingType
from datetime import datetime, timezone
from fastapi import HTTPException, status


Missing = MissingType()


class PostgresUserRepository(UserRepositoryPort):
    """Репозиторий для управления данными пользователей в PostgreSQL
    ( сохранение, обновление, удаление и поиск пользователей в базе данных ).
    """
    
    def __init__(self, pool: AsyncConnectionPool[Any]):
        """Иницилизирует репозиторий.

        Args:
            pool (AsyncConnectionPool[Any]): Пул соединений с БД.
        """
        self.pool = pool

    async def get_by_email(self, email: str) -> User | None:
        """Получение пользователя из БД по email

        Args:
            email (str): Пользовательский е-мэил

        Returns:
            User | None: Пользователь найден возвращает User, иначе - None
        """
        async with self.pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute("SELECT id, email, hashed_password, role FROM users WHERE email = %s", (email,))
                row = await cur.fetchone()
                if not row: return None
                
                return User(id=row[0], email=row[1], hashed_password=row[2], role=row[3])

    async def get_by_id(self, user_id: int) -> User | None:
        """Получение пользователя из БД по ID

        Args:
            user_id (int): Пользовательский идентификатор

        Returns:
            User | None: Пользователь найдет возвращает User, иначе - None
        """
        async with self.pool.connection() as conn:
            async with conn.cursor() as cur:
                
                await cur.execute("SELECT id, email, hashed_password, role FROM users WHERE id = %s", (user_id,))
                row = await cur.fetchone()
                if not row: return None
                
                return User(id=row[0], email=row[1], hashed_password=row[2], role=row[3])

    async def save(self, user: User) -> User:
        """Сохранение пользователя в БД.

        Args:
            user (User): Объект пользователя

        Raises:
            RuntimeError: Поле ID пользователя в БД Null.

        Returns:
            User: Пользователь с присвоеным ID, который вернула БД.
        """
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
    """Получение  в БД продуктов из таблицы product.

    Args:
        ProductRepositoryPort (_type_): _description_
    """
    def __init__(self, pool: AsyncConnectionPool[Any]):
        self.pool = pool

    def _row_to_product(self, row) -> dict:
        return {
            "id": row[0],
            "title": row[1],
            "price": float(row[2]),
            "description": row[3],
            "image_url": row[4],
            "full_description": row[5] if len(row) > 5 else None,
            "discount": int(row[6]) if len(row) > 6 and row[6] is not None else 0,
        }

    async def get_all(self, last_id: int | None, limit: int, discounted_only: bool = False) -> List[dict]:
        
        async with self.pool.connection() as conn:
            async with conn.cursor() as cur:
                discount_filter = "discount > 0"
                if last_id is None:
                    if discounted_only:
                        await cur.execute(
                            f"""
                            SELECT id, title, price, description, image_url, full_description, discount
                            FROM products
                            WHERE {discount_filter}
                            ORDER BY id ASC
                            LIMIT %s
                            """,
                            (limit,)
                        )
                    else:
                        await cur.execute(
                            """
                            SELECT id, title, price, description, image_url, full_description, discount
                            FROM products
                            ORDER BY id ASC
                            LIMIT %s
                            """,
                            (limit,)
                        )
                else:
                    if discounted_only:
                        await cur.execute(
                            f"""
                            SELECT id, title, price, description, image_url, full_description, discount
                            FROM products
                            WHERE id > %s AND {discount_filter}
                            ORDER BY id ASC
                            LIMIT %s
                            """,
                            (last_id, limit)
                        )
                    else:
                        await cur.execute(
                            """
                            SELECT id, title, price, description, image_url, full_description, discount
                            FROM products
                            ORDER BY id ASC
                            LIMIT %s
                            """,
                            (limit,)
                        )
                
                rows = await cur.fetchall()
                return [self._row_to_product(row) for row in rows]

    async def save(self, title: str, price: float, description: str, image_url: str, full_description: str | None = None, discount: int = 0) -> dict:
        """Сохранение в БД товара.

        Args:
            title (str): Название.
            price (float): Цена.
            description (str): Описание (короткое).
            image_url (str): Адрес изображения.
            full_description (str): Подробное описание.
            discount (int): Скидка в процентах (0–100).
        """
        async with self.pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    INSERT INTO products (title, price, description, image_url, full_description, discount)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id, title, price, description, image_url, full_description, discount
                    """,
                    (title, price, description, image_url, full_description, discount)
                )
                row = await cur.fetchone()
                if not row:
                    raise RuntimeError("Не удалось сохранить товар")
                return self._row_to_product(row)
    
    async def delete(self, product_id: int) -> str | None:
        """Удаление конкретного товара по ID из БД таблицы products.

        Args:
            product_id (int): Идентификатор удаляемого товара.

        Returns:
            str | None: Если товар существовал в таблице то его image_url для последующего удаления файла. Иначе - None.
        """
        async with self.pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute("DELETE FROM products WHERE id = %s RETURNING image_url", (product_id,))
                row = await cur.fetchone()
                if row:
                    return row[0]  
                return None

    async def update(
        self,
        product_id: int,
        title: str | MissingType = Missing,
        price: float | MissingType = Missing,
        description: str | MissingType = Missing,
        full_description: str | None | MissingType = Missing,
        discount: int | MissingType = Missing,
    ) -> bool:
        update_fields = []
        query_args = []

        if title is not Missing:
            update_fields.append("title = %s")
            query_args.append(title)
        if price is not Missing:
            update_fields.append("price = %s")
            query_args.append(price)
        if description is not Missing:
            update_fields.append("description = %s")
            query_args.append(description)
        if full_description is not Missing:
            update_fields.append("full_description = %s")
            query_args.append(full_description)
        if discount is not Missing:
            update_fields.append("discount = %s")
            query_args.append(discount)

        if not update_fields:
            return True

        query_args.append(product_id)
        sql_query = f"""
            UPDATE products
            SET {", ".join(update_fields)}
            WHERE id = %s
            RETURNING id
        """
        async with self.pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(sql_query, query_args)
                row = await cur.fetchone()
                return row is not None
    
    async def get_by_id(self, product_id: int) -> dict | None:
        async with self.pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    SELECT id, title, price, description, image_url, full_description, discount
                    FROM products
                    WHERE id = %s
                    """,
                    (product_id,)
                )
                row = await cur.fetchone()
                if row is None:
                    return None
                return self._row_to_product(row)
            
class PostgresCartRepository(CartRepositoryPort):
    """Реализует добавление товара в корзину пользователя.

    Args:
        CartRepositoryPort (interface): Порт репозитория корзины.
    """
    def __init__(self, pool: AsyncConnectionPool[Any]) -> None:
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
                    SELECT p.id, p.title, p.price, p.description, p.image_url, p.discount
                    FROM cart_items c
                    JOIN products p ON c.product_id = p.id
                    WHERE c.user_id = %s
                    ORDER BY c.created_at DESC
                    """,
                    (user_id,)
                )
                rows = await cur.fetchall()
                return [
                    {
                        "id": r[0],
                        "title": r[1],
                        "price": float(r[2]),
                        "description": r[3],
                        "image_url": r[4],
                        "discount": int(r[5]) if r[5] is not None else 0,
                    }
                    for r in rows
                ]

    async def clear(self, user_id: int) -> None:
        """Очистка полная корзины пользователя по ID.

        Args:
            user_id (int): Идентификатор пользователя, из чьей корзины все удаляется.
        """
        
        async with self.pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute("DELETE FROM cart_items WHERE user_id = %s", (user_id,))


class PostgresNoteRepository(NoteRepositoryPort):
    def __init__(self, pool: AsyncConnectionPool[Any]) -> None:
        self.pool = pool
    
    async def add(self, created_time: datetime, title: str, description: str, image_url: str | None = None) -> bool:
        try:
            async with self.pool.connection() as conn:
                async with conn.cursor() as cur:
                    await cur.execute(
                        """
                        INSERT INTO notes (title, description, image_url, created_time) 
                        VALUES (%s, %s, %s, %s)
                        """,
                        (title, description, image_url, created_time)
                    )
                    await conn.commit() 
                    return True
        except Exception:
            return False

    async def delete(self, note_id: int) -> str | None | bool:
        try:
            async with self.pool.connection() as conn:
                async with conn.cursor() as cur:
                    await cur.execute(
                        """
                        DELETE FROM notes
                        WHERE id = %s
                        RETURNING image_url
                        """,
                        (note_id,)
                    )
                    row = await cur.fetchone()
                    
                    if row is None:
                        return False
                    return row[0]
        except Exception as e:
            return False
    
    async def update(
        self,
        created_time: datetime,
        note_id: int, 
        title: str | MissingType = Missing, 
        description: str | MissingType = Missing, 
        image_url: str | None | MissingType = Missing
    ) -> str | None | bool:
        """Обновление таблицы notes тех записей которые были переданы в виде словаря.
        В словаре только поля и записи которые изменились. None означает не отсутствие поля
        а то что его занулили/начистили. Могут изменить описание и изображение удалить. image_url 
        будет None и нужно его в БД убрать. Остальные поля Missing значения примут.

        Args:
            note_id (int): Идентификатор записи.
            title (str | MissingType, optional): Заголовок. Defaults to Missing.
            description (str | MissingType, optional): Описание. Defaults to Missing.
            image_url (str | None | MissingType, optional): Адрес изображения. Defaults to Missing.

        Returns:
            str | None | bool: Если str - то это адрес старого изображения чтобы удалить его из БД.
            None - если запись корректна изменена но изображения старого не было. True - 
            все поля успешно изменены. False - где-то ошибка или что то недопустипое.
        """        
        try:
            update_fields = list()
            query_args = list()
            
            if title is not Missing:
                update_fields.append("title = %s")
                query_args.append(title)
            
            if description is not Missing:
                update_fields.append("description = %s")
                query_args.append(description)
            
            if image_url is not Missing:
                update_fields.append("image_url = %s")
                query_args.append(image_url)
            
            if not update_fields:
                return True
            
            query_args.append(created_time)
            update_fields.append("created_time = %s")
            
            fields_for_updating_sql = ",".join(update_fields)
            query_args.append(note_id)
            sql_query = f""" 
                UPDATE notes
                SET {fields_for_updating_sql}
                WHERE id = %s
                RETURNING image_url
            """
            async with self.pool.connection() as conn:
                async with conn.cursor() as cur:
                    await cur.execute(sql_query, query_args)
                    row = await cur.fetchone()
                    if row is None:
                        return False    # Если нет такой строки вообще с этим id
                    return row[0]   # Или строчку или None если поле в БД равно Null
        except Exception:
            return False

    async def get_all(self, last_id: int | None, limit: int) -> List[dict]:
        """Постраничное получение всех заметок.

        Args:
            last_id (int | None): Идентификатор последней заметки.
            limit (int): Количество заметок на стринице.

        Returns:
            List[dict]: Список из словарей. Каждый словарь содержит поля для Note.
        """        
        try:
            async with self.pool.connection() as conn:
                async with conn.cursor() as cur:
                    if last_id is None:
                        await cur.execute(
                            "SELECT id, title, description, image_url, created_time FROM notes ORDER BY id DESC LIMIT %s",
                            (limit,)
                        )
                    else:
                        await cur.execute(
                            """
                            SELECT id, title, description, image_url, created_time
                            FROM notes
                            WHERE id > %s
                            ORDER BY id DESC
                            LIMIT %s
                            """,
                            (last_id, limit)
                        )
                    
                    rows = await cur.fetchall()

                    notes = []
                    for row in rows:
                        notes.append({
                            "id": row[0],
                            "title": row[1],
                            "description": row[2],
                            "image_url": row[3],
                            "created_time": row[4]
                        })
                    return notes
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Проблемы с подключением к БД."
            )
            
    async def get_one(self, note_id: int) -> dict:
        """Получение заметки одной по идентификатору.
        Args:
            note_id (int): ID заметки.

        Raises:
            HTTPException: 500 Ошибка получения данных или подключения к БД.

        Returns:
            dict: Словарь с данными заметки.
        """        
        row = None
        try:
            async with self.pool.connection() as conn:
                async with conn.cursor() as cur:
                    await cur.execute(
                        """
                        SELECT id, title, description, image_url, created_time
                        FROM notes
                        WHERE id = %s
                        """,
                        (note_id,)
                    )
                    row = await cur.fetchone()
        except Exception:
            HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Проблемы с подключением к БД."
        )
        if row is None:
            raise HTTPException(status_code=500, detail="Ошибка БД")
        
        return {
            "id": row[0],
            "title": row[1],
            "description": row[2],
            "image_url": row[3],
            "created_time": row[4]
        }
