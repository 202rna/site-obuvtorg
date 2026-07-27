"""
Сервис для ежедневной генерации файла shop_data.json
со всеми товарами (со скидками, размерами, категориями) и новостями магазина.
"""
import json
import os
from datetime import datetime, timezone
from app.domain.ports import ProductRepositoryPort, NoteRepositoryPort


SHOP_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "static", "shop_data.json")


async def generate_shop_data(
    product_repo: ProductRepositoryPort,
    note_repo: NoteRepositoryPort,
) -> dict:
    """Генерирует актуальный shop_data.json со всеми товарами и заметками.
    
    Returns:
        dict: Сгенерированные данные.
    """
    # Получаем все товары
    all_products = await product_repo.get_all(last_id=None, limit=9999)
    
    # Получаем все заметки (новости)
    all_notes = await note_repo.get_all(last_id=None, limit=9999)
    
    # Форматируем товары для удобства AI
    products_formatted = []
    for p in all_products:
        product_entry = {
            "id": p["id"],
            "title": p["title"],
            "price": p["price"],
            "final_price": round(p["price"] * (1 - (p.get("discount", 0) or 0) / 100)),
            "discount": p.get("discount", 0) or 0,
            "description": p.get("description", ""),
            "full_description": p.get("full_description", ""),
            "sizes": p.get("sizes", []),
            "categories": p.get("categories", []),
            "image_url": p.get("image_url") or "",
            "image_urls": p.get("image_urls", []),
            "product_url": f"/products/{p['id']}",
        }
        products_formatted.append(product_entry)
    
    # Форматируем заметки
    notes_formatted = []
    for n in all_notes:
        note_entry = {
            "id": n["id"],
            "title": n.get("title", ""),
            "description": n.get("description", ""),
            "image_url": n.get("image_url", ""),
            "created_time": str(n.get("created_time", "")),
            "note_url": f"/note/{n['id']}",
        }
        notes_formatted.append(note_entry)
    
    # Собираем всю информацию о магазине
    shop_data = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "shop_name": "ООО ФИРМА ОБУВЬТОРГ",
        "shop_address": "150049, Ярославская область, г. Ярославль, ул. Вспольинское Поле, д. 18",
        "shop_phone": "+7 (4852) 21-47-55",
        "working_hours": "Вт. – Пт. 09:00–17:00, Сб. 09:00–16:00 | Вс.– Пн. выходной",
        "products_count": len(products_formatted),
        "products": products_formatted,
        "news_count": len(notes_formatted),
        "news": notes_formatted,
    }
    
    # Сохраняем в файл
    os.makedirs(os.path.dirname(SHOP_DATA_PATH), exist_ok=True)
    with open(SHOP_DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(shop_data, f, ensure_ascii=False, indent=2)
    
    return shop_data


async def load_shop_data() -> dict | None:
    """Загружает shop_data.json из файла.
    
    Returns:
        dict | None: Данные магазина или None, если файла нет.
    """
    if not os.path.exists(SHOP_DATA_PATH):
        return None
    try:
        with open(SHOP_DATA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return None