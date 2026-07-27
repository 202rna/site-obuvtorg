"""
Сервис для AI-чата на основе данных магазина.
Использует AI Tunnel (OpenAI-совместимый прокси) для ответов на вопросы пользователей.

История сессии хранится на клиенте (в состоянии React-компонента),
сервер только обрабатывает текущий запрос с переданным контекстом.

Возвращает:
- content: ответ AI с маркерами [RECOMMEND:ID]
- product_ids: список ID рекомендованных товаров
"""
import re
import json
from openai import AsyncOpenAI

from app.domain.usecases.chat.generate_shop_data import load_shop_data


SYSTEM_PROMPT = """Ты — дружелюбный и полезный консультант магазина обуви «Обувьторг» в Ярославле по адресу 
150049, Ярославская область, г. Ярославль, ул. Вспольинское Поле, д. 18.
Рабочие Вторник – Пятница 09:00–17:00, Cб. 09:00–16:00 | Выходные Вс.– Пн.
Твоя задача — помогать покупателям:
1. Отвечать на вопросы о товарах (наличие, размеры, цена, скидки)
2. Рекомендовать подходящую обувь на основе пожеланий пользователя
3. Рассказывать об акциях и новостях магазина
4. Консультировать по адресу, времени работы, контактам

ВАЖНЫЕ ПРАВИЛА:
- Отвечай ТОЛЬКО на основе данных из предоставленного JSON-контекста
- Если в данных нет информации по вопросу, скажи, что не знаешь, и предложи позвонить в магазин
- Будь вежливым и приветливым
- Отвечай на русском языке
- Если пользователь спрашивает о конкретном товаре, дай краткую информацию

### ФОРМАТ РЕКОМЕНДАЦИЙ ТОВАРОВ И ОТВЕТА НА ФОТО ###
Когда ты рекомендуешь товары или пользователь просит фото, ты ДОЛЖЕН для каждого товара 
вставить в текст маркер [RECOMMEND:ID], где ID — ID товара из данных магазина.

- НИКОГДА не пиши Markdown-ссылки на картинки (не используй ![]()).
- Всю работу по отображению фото берет на себя интерфейс, который увидит маркер [RECOMMEND:ID].

Пример правильного ответа (покажи фото):
"Вот фотографии интересующих вас кроссовок: [RECOMMEND:5] [RECOMMEND:12]"

Пример правильного ответа (рекомендация):
"Могу предложить вам следующие кроссовки для бега: [RECOMMEND:5]
[RECOMMEND:12]
[RECOMMEND:7]

Все эти модели отлично подходят для ваших целей."

ВАЖНО:
- Маркер [RECOMMEND:ID] ставь прямо в текст.
- Можно рекомендовать до 3-4 товаров за один ответ.
- Если в данных нет информации о товаре, скажи, что информации нет, и пригласи в магазин.

Ниже представлены актуальные данные о магазине, товарах и новостях.
"""

# Регулярка для поиска маркеров [RECOMMEND:ID]
RECOMMEND_PATTERN = re.compile(r'\[RECOMMEND:(\d+)\]')


async def get_ai_answer(
    messages: list[dict],
    api_key: str,
    model: str = "gpt-4o-mini",
    base_url: str = "https://api.aitunnel.ru/v1",
) -> dict:
    """Получает ответ от AI (AI Tunnel) на основе данных магазина.
    
    Возвращает словарь:
    {
        "content": str,        # ответ AI с маркерами [RECOMMEND:ID]
        "recommended_product_ids": list[int]  # ID рекомендованных товаров
    }
    
    Args:
        messages: Список сообщений диалога [{"role": "user"/"assistant", "content": "..."}].
        api_key: Ключ API AI Tunnel.
        model: Модель.
        base_url: Базовый URL AI Tunnel сервера.
    
    Returns:
        dict: {"content": str, "recommended_product_ids": list[int]}.
    """
    shop_data = await load_shop_data()
    
    if not shop_data:
        return {
            "content": "Извините не могу Вам ответить, позвоните по телефону +7 (4852) 21-47-55 для консультации.",
            "recommended_product_ids": [],
        }
    
    # Создаем контекст с данными о магазине
    context_text = json.dumps(shop_data, ensure_ascii=False, indent=2)
    
    # Формируем сообщения для AI
    ai_messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "system", "content": f"Актуальные данные магазина (JSON):\n\n{context_text}"},
    ]
    
    # Добавляем историю сообщений (передана с клиента)
    for msg in messages:
        ai_messages.append({
            "role": msg["role"],
            "content": msg["content"],
        })
    
    client = AsyncOpenAI(api_key=api_key, base_url=base_url)
    response = await client.chat.completions.create(
        model=model,
        messages=ai_messages,
        temperature=0.7,
        max_tokens=2000,
    )
    
    raw_text = response.choices[0].message.content or ""
    
    # 1. Находим все ID товаров
    product_ids = [int(m) for m in RECOMMEND_PATTERN.findall(raw_text)]
    
    # 2. ВАЖНОЕ ИЗМЕНЕНИЕ: Не удаляем маркеры из текста!
    # Возвращаем текст как есть, чтобы фронтенд сам заменил [RECOMMEND:ID] на <img>
    cleaned_text = raw_text.strip()
    
    return {
        "content": cleaned_text,
        "recommended_product_ids": product_ids,
    }