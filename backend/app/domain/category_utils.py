"""Классификация категорий товаров для фильтров каталога."""

SEASON_KEYWORDS = ("лето", "осень", "зима", "весна", "демисезон")
TYPE_KEYWORDS = (
    "кроссовк", "кросовк", "кед", "сандал", "босоножк", "туфл", "лодочк",
    "балетк", "сапог", "угг", "дут", "валенк", "ботинк", "мокасин", "лофер",
    "слипон", "эспадриль", "шлепанец", "шлеп", "тапк", "сабо", "топсайдер",
    "пантолет", "казак", "челси", "кросс", "сникерс", "слиппер",
)
GENDER_KEYWORDS = ("жен", "муж", "дет")
COUNTRY_KEYWORDS = (
    "росси", "рф", "итал", "кита", "герман", "турци", "португал", "испан",
    "франци", "польш", "чех", "инди", "вьетнам", "бразили", "аргентин",
    "украин", "беларус", "казах",
)
MATERIAL_KEYWORDS = (
    "кож", "текстил", "замш", "нубук", "велюр", "лак", "резин", "полиуретан",
    "термополиуретан", "тпу", "этиленвинилацетат", "эва", "пвх", "нейлон",
    "полиэстер", "хлоп", "шерст", "войлок", "фетр", "мех", "искусствен", "натуральн",
    "софтшелл"
)


def normalize_category(name: str) -> str:
    return name.lower().strip() if name else ""


def classify_category(name: str) -> str:
    n = normalize_category(name)
    for kw in SEASON_KEYWORDS:
        if n == kw or n.startswith(kw):
            return "season"
    for kw in GENDER_KEYWORDS:
        if kw in n:
            return "gender"
    for kw in COUNTRY_KEYWORDS:
        if kw in n:
            return "country"
    for kw in MATERIAL_KEYWORDS:
        if kw in n:
            return "material"
    for kw in TYPE_KEYWORDS:
        if kw in n:
            return "type"
    return "other"


def group_categories(names: list[str]) -> dict[str, list[str]]:
    season: list[str] = []
    type_: list[str] = []
    country: list[str] = []
    material: list[str] = []
    other: list[str] = []

    for cat in names:
        group = classify_category(cat)
        if group == "gender":
            continue
        if group == "season":
            season.append(cat)
        elif group == "type":
            type_.append(cat)
        elif group == "country":
            country.append(cat)
        elif group == "material":
            material.append(cat)
        else:
            other.append(cat)

    sort_key = lambda x: x.lower()
    return {
        "season": sorted(season, key=sort_key),
        "type": sorted(type_, key=sort_key),
        "country": sorted(country, key=sort_key),
        "material": sorted(material, key=sort_key),
        "other": sorted(other, key=sort_key),
    }
