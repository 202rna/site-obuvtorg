import os
from dotenv import load_dotenv
from psycopg_pool import AsyncConnectionPool
from typing import Any

load_dotenv()



DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST", "postgres_db")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "my_clean_app")


DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"


db_pool = AsyncConnectionPool[Any](conninfo=DATABASE_URL, open=False)
