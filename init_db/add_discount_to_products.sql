-- Миграция для уже существующей БД:
-- docker compose exec db psql -U <user> -d <db> -f /docker-entrypoint-initdb.d/add_discount_to_products.sql
-- или выполнить вручную:
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount INT DEFAULT 0;
