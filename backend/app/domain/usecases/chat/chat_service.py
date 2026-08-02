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
    model: str = "deepseek-v4-flash",
    base_url: str = "https://api.aitunnel.ru/v1",
) -> dict:
    shop_data = await load_shop_data()
    
    if not shop_data:
        return {
            "content": "Извините не могу Вам ответить, позвоните по телефону +7 (4852) 21-47-55 для консультации.",
            "recommended_product_ids": [],
        }
    
    context_text = json.dumps(shop_data, ensure_ascii=False, indent=2)
    
    # 1. Точка фиксации кэша: Системная инструкция и товары идут первыми без изменений
    full_system_content = f"{SYSTEM_PROMPT}\n\n### АКТУАЛЬНЫЕ ДАННЫЕ МАГАЗИНА (JSON) ###\n{context_text}"
    
    ai_messages = [
        {"role": "system", "content": full_system_content}
    ]
    
    # 2. Берем последние 4 сообщения для памяти (2 вопроса юзера + 2 ответа бота)
    # Этого более чем достаточно для удержания нити разговора
    recent_history = messages[:-1] if len(messages) > 1 else []
    recent_history = recent_history[-4:]
    
    # Форматируем историю в компактный понятный для ИИ вид
    history_lines = []
    for msg in recent_history:
        speaker = "Покупатель" if msg["role"] == "user" else "Консультант"
        history_lines.append(f"{speaker}: {msg['content']}")
    
    history_context = "\n".join(history_lines)
    
    # 3. Передаем историю как предварительный контекст беседы
    if history_context:
        ai_messages.append({
            "role": "user", 
            "content": f"Контекст нашей текущей беседы для справки:\n{history_context}\n\nПожалуйста, учти это при ответе на мой следующий вопрос."
        })
    
    # 4. Передаем самый свежий, текущий вопрос пользователя в самом конце
    last_user_message = messages[-1]
    ai_messages.append({
        "role": "user",
        "content": f"Мой новый вопрос: {last_user_message['content']}"
    })
    
    client = AsyncOpenAI(api_key=api_key, base_url=base_url)
    response = await client.chat.completions.create(
        model=model,
        messages=ai_messages,
        temperature=0.7,
        max_tokens=2000,
    )
    
    raw_text = response.choices.message.content or ""
    product_ids = [int(m) for m in RECOMMEND_PATTERN.findall(raw_text)]
    cleaned_text = raw_text.strip()
    
    return {
        "content": cleaned_text,
        "recommended_product_ids": product_ids,
    }
