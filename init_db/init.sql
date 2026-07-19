-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY
    , email VARCHAR(150) NOT NULL UNIQUE
    , hashed_password VARCHAR(255) NOT NULL
    , role VARCHAR(20) DEFAULT 'user'
);

-- Таблица товаров
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY
    , title VARCHAR(150) NOT NULL
    , price NUMERIC(10, 2) NOT NULL
    , description TEXT
    , image_url TEXT
    , full_description TEXT
);

-- Таблица уцененных товаров
CREATE TABLE IF NOT EXISTS discount_products (
    id SERIAL PRIMARY KEY
    , title VARCHAR(150) NOT NULL
    , price NUMERIC(10, 2) NOT NULL
    , description TEXT
    , full_description TEXT
    , image_url TEXT
    , discount INT DEFAULT 0
);

-- Таблица корзины
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY
    , user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
    , product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE
    , created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    , CONSTRAINT unique_user_product UNIQUE (user_id, product_id)
);

-- Таблица заметок
CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY
    , title VARCHAR(150) NOT NULL
    , description TEXT NOT NULL
    , image_url TEXT
    , created_time TIMESTAMP
);


INSERT INTO users (email, hashed_password, role) 
VALUES (
    'admin', 
    '$2a$12$ISyT.C5HBqz6OYESqP9RV.y996NdHV8ETL7rDgP.KROmDj8BGDice', 
    'admin'
)