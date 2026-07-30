import {
  useState,
  useEffect,
  useMemo,
  useLayoutEffect,
  useCallback,
} from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";

const MOBILE_TABS = [
  { id: "жен", label: "Женщинам" },
  { id: "муж", label: "Мужчинам" },
  { id: "дет", label: "Для детей" },
];

const PAGE_SIZE = 15;
const SS_KEY = "products_page_state";

const SEASON_KEYWORDS = ["лето", "осень", "зима", "весна", "демисезон"];
const TYPE_KEYWORDS = [
  "кроссовк",
  "кросовк",
  "кед",
  "сандал",
  "босоножк",
  "туфл",
  "лодочк",
  "балетк",
  "сапог",
  "угг",
  "дут",
  "валенк",
  "ботинк",
  "мокасин",
  "лофер",
  "слипон",
  "эспадриль",
  "шлепанец",
  "шлеп",
  "тапк",
  "сабо",
  "топсайдер",
  "пантолет",
  "казак",
  "челси",
  "кросс",
  "сникерс",
  "слиппер",
];
const GENDER_KEYWORDS = ["жен", "муж", "дет"];
const COUNTRY_KEYWORDS = [
  "росси",
  "рф",
  "итал",
  "кита",
  "герман",
  "турци",
  "португал",
  "испан",
  "франци",
  "польш",
  "чех",
  "инди",
  "вьетнам",
  "бразили",
  "аргентин",
  "украин",
  "белорус",
  "казах",
];
const MATERIAL_KEYWORDS = [
  "кож",
  "текстил",
  "замш",
  "нубук",
  "велюр",
  "лак",
  "резин",
  "полиуретан",
  "термополиуретан",
  "тпу",
  "этиленвинилацетат",
  "эва",
  "пвх",
  "нейлон",
  "полиэстер",
  "хлоп",
  "шерст",
  "войлок",
  "фетр",
  "мех",
  "искусствен",
  "натуральн",
];

function normalize(cat) {
  if (!cat) return "";
  return cat.toLowerCase().trim();
}

function classifyCategory(cat) {
  const n = normalize(cat);
  for (const kw of SEASON_KEYWORDS) {
    if (n === kw || n.startsWith(kw)) return "season";
  }
  for (const kw of GENDER_KEYWORDS) {
    if (n.includes(kw)) return "gender";
  }
  for (const kw of COUNTRY_KEYWORDS) {
    if (n.includes(kw)) return "country";
  }
  for (const kw of MATERIAL_KEYWORDS) {
    if (n.includes(kw)) return "material";
  }
  for (const kw of TYPE_KEYWORDS) {
    if (n.includes(kw)) return "type";
  }
  return "other";
}

function displayCategory(cat) {
  if (!cat) return cat;
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

export default function ProductsPage({
  API_URL,
  token,
  userRole,
  discountedOnly = false,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileTab, setMobileTab] = useState("");

  const selectedCategories = searchParams.getAll("category");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const hasActiveFilters = mobileTab !== "" || selectedCategories.length > 0;

  const [seasonOpen, setSeasonOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);

  // Статические категории
  const [staticCategories, setStaticCategories] = useState({
    season: [],
    type: [],
    country: [],
    material: [],
    other: [],
  });

  useEffect(() => {
    let isMounted = true;
    async function initCategories() {
      try {
        // Вызываем наш новый, легковесный эндпоинт
        const response = await fetch(`${API_URL}/categories`);
        const data = await response.json();

        if (isMounted && Array.isArray(data)) {
          const season = [];
          const type = [];
          const country = [];
          const material = [];
          const other = [];

          for (const cat of data) {
            const group = classifyCategory(cat);
            if (group === "gender") continue;
            if (group === "season") season.push(cat);
            else if (group === "type") type.push(cat);
            else if (group === "country") country.push(cat);
            else if (group === "material") material.push(cat);
            else other.push(cat);
          }

          setStaticCategories({
            season: season.sort((a, b) => a.localeCompare(b)),
            type: type.sort((a, b) => a.localeCompare(b)),
            country: country.sort((a, b) => a.localeCompare(b)),
            material: material.sort((a, b) => a.localeCompare(b)),
            other: other.sort((a, b) => a.localeCompare(b)),
          });
        }
      } catch (err) {
        console.error("Ошибка загрузки категорий:", err);
      }
    }
    initCategories();
    return () => {
      isMounted = false;
    };
  }, [API_URL]);

  const savedState = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(SS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.discountedOnly !== discountedOnly) return null;
      return parsed;
    } catch {
      return null;
    }
  }, [discountedOnly]);

  // ОСНОВНАЯ ЗАГРУЗКА ТОВАРОВ — с поддержкой серверной фильтрации
  useEffect(() => {
    async function loadProducts() {
      const isInitial = products.length === 0;
      if (isInitial) {
        setLoading(true);
      } else {
        setIsFetching(true);
      }

      try {
        if (savedState && !hasActiveFilters && !discountedOnly) {
          const ss = savedState;
          setProducts(ss.products || []);
          setHasMore(ss.hasMore !== undefined ? ss.hasMore : true);
          sessionStorage.removeItem(SS_KEY);
          setLoading(false);
          setIsFetching(false);
          return;
        }

        // Определяем, какие категории отправить на бэкенд
        // 1. Создаем словарь перевода ID табов в реальные названия категорий вашей БД
        const tabMapping = {
          жен: "Женщинам", // 👈 Напишите здесь точное имя категории из вашей БД (например "Женщинам" или "женщины")
          муж: "Мужчинам", // 👈 Напишите здесь точное имя категории из вашей БД (например "Мужчинам" или "мужчины")
          дет: "Для детей", // 👈 Напишите здесь точное имя категории из вашей БД (например "Для детей" или "дети")
        };

        // 2. Собираем ВСЕ активные фильтры вместе, чтобы они работали ОДНОВРЕМЕННО
        let targetCategories = [];

        // Если выбран верхний таб (пол) — переводим его и добавляем в массив запроса
        if (mobileTab && tabMapping[mobileTab]) {
          targetCategories.push(tabMapping[mobileTab]);
        }

        // Если выбраны боковые фильтры (страна, материал и т.д.) — добавляем их туда же
        if (selectedCategories && selectedCategories.length > 0) {
          targetCategories = [...targetCategories, ...selectedCategories];
        }

        // Строим чистый URL. Всегда запрашиваем строго PAGE_SIZE (15) элементов!
        let url = `${API_URL}/products?limit=${PAGE_SIZE}`;
        if (discountedOnly) url += "&discounted_only=true";
        for (const cat of targetCategories) {
          url += `&category=${encodeURIComponent(cat)}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (Array.isArray(data)) {
          setProducts(data);
          // Если сервер вернул меньше 15 товаров, значит дальше ничего нет
          setHasMore(data.length >= PAGE_SIZE);
        } else {
          setProducts([]);
          setHasMore(false);
        }
      } catch (err) {
        console.error("Ошибка загрузки товаров:", err);
        setProducts([]);
        setHasMore(false);
      }
      Transformer: {
        setLoading(false);
        setIsFetching(false);
      }
    }

    loadProducts();
    // Добавляем mobileTab и searchParams в зависимости, чтобы перезагружать при кликах
  }, [API_URL, mobileTab, searchParams, discountedOnly]);

  // Сохраняем состояние для кнопки "назад"
  const saveState = useCallback(() => {
    if (hasActiveFilters) return;
    sessionStorage.setItem(
      SS_KEY,
      JSON.stringify({
        products,
        hasMore,
        discountedOnly,
      }),
    );
  }, [products, hasMore, hasActiveFilters, discountedOnly]);

  async function handleLoadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const lastProduct = products[products.length - 1];
      const lastId = lastProduct ? lastProduct.id : 0;

      // Словарь перевода для пагинации
      const tabMapping = {
        жен: "Женщинам",
        муж: "Мужчинам",
        дет: "Для детей",
      };

      let url = `${API_URL}/products?last_id=${lastId}&limit=${PAGE_SIZE}`;
      if (discountedOnly) url += "&discounted_only=true";

      // Собираем массив для кнопки подгрузки
      let targetCategories = [];
      if (mobileTab && tabMapping[mobileTab]) {
        targetCategories.push(tabMapping[mobileTab]);
      }
      if (selectedCategories && selectedCategories.length > 0) {
        targetCategories = [...targetCategories, ...selectedCategories];
      }

      // Добавляем все категории в URL следующей страницы
      for (const cat of targetCategories) {
        url += `&category=${encodeURIComponent(cat)}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setProducts((prev) => [...prev, ...data]);
        setHasMore(data.length >= PAGE_SIZE); // Проверяем, есть ли товары дальше
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Ошибка загрузки следующих товаров:", err);
    } finally {
      setLoadingMore(false);
    }
  }

  useLayoutEffect(() => {
    if (loading) return;
    const savedScroll = sessionStorage.getItem("catalog_scroll");
    if (!savedScroll) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const mainContent = document.querySelector(".mainContent");
        if (mainContent) {
          mainContent.scrollTop = parseInt(savedScroll, 10);
        }
      });
    });
    sessionStorage.removeItem("catalog_scroll");
  }, [loading]);

  useEffect(() => {
    return () => {
      saveState();
    };
  }, [saveState]);

  async function handleDeleteProduct(productId) {
    if (!window.confirm("Вы уверены, что хотите навсегда удалить этот товар?"))
      return;
    try {
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      } else {
        const errorData = await response.json();
        alert(errorData.detail || "Не удалось удалить товар");
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Данные теперь приходят уже чистыми с бэкенда
  const filteredProducts = useMemo(() => {
    return products;
  }, [products]);

  const handleCategoryToggle = (cat) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      const current = newParams.getAll("category");
      const isSelected = current.includes(cat);
      newParams.delete("category");

      if (isSelected) {
        const updated = current.filter((c) => c !== cat);
        updated.forEach((c) => newParams.append("category", c));
      } else {
        current.forEach((c) => newParams.append("category", c));
        newParams.append("category", cat);
      }
      return newParams;
    });
  };

  const handleClearCategories = () => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.delete("category");
      return newParams;
    });
  };

  // Стили (без изменений)
  const sidebarTabStyle = (active) => ({
    display: "block",
    width: "100%",
    padding: "10px 16px",
    border: "none",
    background: active ? "#eef2ff" : "transparent",
    color: active ? "#4f46e5" : "#475569",
    cursor: "pointer",
    fontWeight: active ? 700 : 500,
    fontSize: "14px",
    textAlign: "left",
    fontFamily: '"Inter", "SF Pro Text", system-ui, -apple-system, sans-serif',
    borderRadius: "8px",
    transition: "all 0.2s ease",
    letterSpacing: "0.03em",
    textTransform: "uppercase",
  });

  const sidebarCatStyle = (active) => ({
    display: "block",
    width: "100%",
    padding: "10px 16px",
    border: "none",
    background: active ? "#eef2ff" : "transparent",
    color: active ? "#4f46e5" : "#475569",
    cursor: "pointer",
    fontWeight: active ? 600 : 400,
    fontSize: "13px",
    textAlign: "left",
    fontFamily: '"Inter", "SF Pro Text", system-ui, -apple-system, sans-serif',
    borderRadius: "8px",
    transition: "all 0.2s ease",
    letterSpacing: "0.02em",
  });

  const sidebarGroupStyle = (open) => ({
    display: "block",
    width: "100%",
    padding: "10px 16px",
    border: "none",
    background: open ? "#eef2ff" : "transparent",
    color: open ? "#4f46e5" : "#475569",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "13px",
    textAlign: "left",
    fontFamily: '"Inter", "SF Pro Text", system-ui, -apple-system, sans-serif',
    borderRadius: "8px",
    transition: "all 0.2s ease",
    letterSpacing: "0.03em",
    textTransform: "uppercase",
  });

  const sidebarSubcatStyle = (active) => ({
    display: "block",
    width: "100%",
    padding: "6px 16px 6px 28px",
    border: "none",
    background: active ? "#eef2ff" : "transparent",
    color: active ? "#4f46e5" : "#64748b",
    cursor: "pointer",
    fontWeight: active ? 600 : 400,
    fontSize: "12px",
    textAlign: "left",
    fontFamily: '"Inter", "SF Pro Text", system-ui, -apple-system, sans-serif',
    borderRadius: "6px",
    transition: "all 0.2s ease",
    letterSpacing: "0.01em",
  });

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px 0",
          fontSize: "18px",
          color: "#64748b",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        Загрузка товаров...
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .page-wrapper {
            flex-direction: column !important;
          }
          .desktop-sidebar {
            display: none !important;
          }
          .mobile-tab-bar {
            display: flex !important;
            flex-direction: column;
            position: sticky;
            top: 0;
            z-index: 10;
            background: #fff;
            border-bottom: 1px solid #e2e8f0;
          }
          .mobile-tab-bar .main-tabs {
            display: flex;
            width: 100%;
          }
          .products-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-tab-bar {
            display: none !important;
          }
          .desktop-sidebar {
            display: block !important;
          }
          .products-grid {
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)) !important;
            gap: 24px !important;
          }
        }
      `}</style>
      <div
        className="page-wrapper"
        style={{
          display: "flex",
          minHeight: "100vh",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* МОБИЛЬНЫЕ ТАБЫ */}
        <div className="mobile-tab-bar" style={{ display: "none" }}>
          <div className="main-tabs">
            {MOBILE_TABS.map((tab) => {
              const isActive = mobileTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setMobileTab(isActive ? "" : tab.id)}
                  style={{
                    flex: 1,
                    padding: "10px 4px",
                    border: "none",
                    background: "transparent",
                    color: isActive ? "#4f46e5" : "#9ca3af",
                    fontWeight: isActive ? 600 : 400,
                    fontSize: "13px",
                    cursor: "pointer",
                    fontFamily: '"Inter", "SF Pro Text", system-ui, sans-serif',
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    transition: "all 0.2s",
                    borderBottom: isActive
                      ? "2px solid #4f46e5"
                      : "2px solid transparent",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              width: "100%",
              padding: "4px 0 6px 0",
              gap: "4px",
              justifyContent: "center",
            }}
          >
            {staticCategories.country.length > 0 && (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setCountryOpen(!countryOpen)}
                  style={{
                    padding: "5px 10px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    background: countryOpen ? "#eef2ff" : "#fff",
                    color: countryOpen ? "#4f46e5" : "#475569",
                    fontWeight: countryOpen ? 600 : 400,
                    fontSize: "11px",
                    cursor: "pointer",
                    fontFamily: '"Inter", "SF Pro Text", system-ui, sans-serif',
                    whiteSpace: "nowrap",
                    transition: "all 0.2s",
                  }}
                >
                  {countryOpen ? "▴ " : "▾ "}Страна
                </button>
                {countryOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: "0",
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      zIndex: 20,
                      minWidth: "140px",
                      padding: "4px 0",
                    }}
                  >
                    {staticCategories.country.map((cat) => {
                      const isSelected = selectedCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          onClick={() => handleCategoryToggle(cat)}
                          style={{
                            display: "block",
                            width: "100%",
                            padding: "6px 14px",
                            border: "none",
                            background: isSelected ? "#eef2ff" : "transparent",
                            color: isSelected ? "#4f46e5" : "#475569",
                            fontWeight: isSelected ? 600 : 400,
                            fontSize: "12px",
                            cursor: "pointer",
                            textAlign: "left",
                            fontFamily:
                              '"Inter", "SF Pro Text", system-ui, sans-serif',
                          }}
                        >
                          {displayCategory(cat)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {staticCategories.material.length > 0 && (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setMaterialOpen(!materialOpen)}
                  style={{
                    padding: "5px 10px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    background: materialOpen ? "#eef2ff" : "#fff",
                    color: materialOpen ? "#4f46e5" : "#475569",
                    fontWeight: materialOpen ? 600 : 400,
                    fontSize: "11px",
                    cursor: "pointer",
                    fontFamily: '"Inter", "SF Pro Text", system-ui, sans-serif',
                    whiteSpace: "nowrap",
                    transition: "all 0.2s",
                  }}
                >
                  {materialOpen ? "▴ " : "▾ "}Материал
                </button>
                {materialOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: "0",
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      zIndex: 20,
                      minWidth: "140px",
                      padding: "4px 0",
                    }}
                  >
                    {staticCategories.material.map((cat) => {
                      const isSelected = selectedCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          onClick={() => handleCategoryToggle(cat)}
                          style={{
                            display: "block",
                            width: "100%",
                            padding: "6px 14px",
                            border: "none",
                            background: isSelected ? "#eef2ff" : "transparent",
                            color: isSelected ? "#4f46e5" : "#475569",
                            fontWeight: isSelected ? 600 : 400,
                            fontSize: "12px",
                            cursor: "pointer",
                            textAlign: "left",
                            fontFamily:
                              '"Inter", "SF Pro Text", system-ui, sans-serif',
                          }}
                        >
                          {displayCategory(cat)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {staticCategories.season.length > 0 && (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setSeasonOpen(!seasonOpen)}
                  style={{
                    padding: "5px 10px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    background: seasonOpen ? "#eef2ff" : "#fff",
                    color: seasonOpen ? "#4f46e5" : "#475569",
                    fontWeight: seasonOpen ? 600 : 400,
                    fontSize: "11px",
                    cursor: "pointer",
                    fontFamily: '"Inter", "SF Pro Text", system-ui, sans-serif',
                    whiteSpace: "nowrap",
                    transition: "all 0.2s",
                  }}
                >
                  {seasonOpen ? "▴ " : "▾ "}Сезон
                </button>
                {seasonOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: "0",
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      zIndex: 20,
                      minWidth: "140px",
                      padding: "4px 0",
                    }}
                  >
                    {staticCategories.season.map((cat) => {
                      const isSelected = selectedCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          onClick={() => handleCategoryToggle(cat)}
                          style={{
                            display: "block",
                            width: "100%",
                            padding: "6px 14px",
                            border: "none",
                            background: isSelected ? "#eef2ff" : "transparent",
                            color: isSelected ? "#4f46e5" : "#475569",
                            fontWeight: isSelected ? 600 : 400,
                            fontSize: "12px",
                            cursor: "pointer",
                            textAlign: "left",
                            fontFamily:
                              '"Inter", "SF Pro Text", system-ui, sans-serif',
                          }}
                        >
                          {displayCategory(cat)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {staticCategories.type.length > 0 && (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setTypeOpen(!typeOpen)}
                  style={{
                    padding: "5px 10px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    background: typeOpen ? "#eef2ff" : "#fff",
                    color: typeOpen ? "#4f46e5" : "#475569",
                    fontWeight: typeOpen ? 600 : 400,
                    fontSize: "11px",
                    cursor: "pointer",
                    fontFamily: '"Inter", "SF Pro Text", system-ui, sans-serif',
                    whiteSpace: "nowrap",
                    transition: "all 0.2s",
                  }}
                >
                  {typeOpen ? "▴ " : "▾ "}Вид
                </button>
                {typeOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: "0",
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      zIndex: 20,
                      minWidth: "140px",
                      padding: "4px 0",
                      maxHeight: "250px",
                      overflowY: "auto",
                    }}
                  >
                    {staticCategories.type.map((cat) => {
                      const isSelected = selectedCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          onClick={() => handleCategoryToggle(cat)}
                          style={{
                            display: "block",
                            width: "100%",
                            padding: "6px 14px",
                            border: "none",
                            background: isSelected ? "#eef2ff" : "transparent",
                            color: isSelected ? "#4f46e5" : "#475569",
                            fontWeight: isSelected ? 600 : 400,
                            fontSize: "12px",
                            cursor: "pointer",
                            textAlign: "left",
                            fontFamily:
                              '"Inter", "SF Pro Text", system-ui, sans-serif',
                          }}
                        >
                          {displayCategory(cat)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ДЕСКТОП-САЙДБАР */}
        <aside
          className="desktop-sidebar"
          style={{
            display: "none",
            width: "220px",
            minWidth: "220px",
            padding: "24px 16px",
            borderRight: "1px solid #e2e8f0",
            background: "#fafbfc",
            position: "sticky",
            top: 0,
            height: "100vh",
            overflowY: "auto",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: "12px",
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "12px",
              paddingLeft: "8px",
            }}
          >
            Категории
          </div>
          {MOBILE_TABS.map((tab) => {
            const isActive = mobileTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setMobileTab(isActive ? "" : tab.id)}
                style={sidebarTabStyle(isActive)}
              >
                {tab.label}
              </button>
            );
          })}
          {(staticCategories.season.length > 0 ||
            staticCategories.type.length > 0 ||
            staticCategories.country.length > 0 ||
            staticCategories.material.length > 0 ||
            staticCategories.other.length > 0) && (
            <div
              style={{ margin: "12px 0 8px", borderTop: "1px solid #e2e8f0" }}
            />
          )}

          {staticCategories.country.length > 0 && (
            <div style={{ marginBottom: "4px" }}>
              <button
                onClick={() => setCountryOpen(!countryOpen)}
                style={sidebarGroupStyle(countryOpen)}
              >
                <span style={{ marginRight: "6px" }}>
                  {countryOpen ? "▾" : "▸"}Страна
                </span>
              </button>
              {countryOpen && (
                <div style={{ marginTop: "2px", marginBottom: "4px" }}>
                  {staticCategories.country.map((cat) => {
                    const isSelected = selectedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => handleCategoryToggle(cat)}
                        style={sidebarSubcatStyle(isSelected)}
                      >
                        {displayCategory(cat)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {staticCategories.material.length > 0 && (
            <div style={{ marginBottom: "4px" }}>
              <button
                onClick={() => setMaterialOpen(!materialOpen)}
                style={sidebarGroupStyle(materialOpen)}
              >
                <span style={{ marginRight: "6px" }}>
                  {materialOpen ? "▾" : "▸"}Материал
                </span>
              </button>
              {materialOpen && (
                <div style={{ marginTop: "2px", marginBottom: "4px" }}>
                  {staticCategories.material.map((cat) => {
                    const isSelected = selectedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => handleCategoryToggle(cat)}
                        style={sidebarSubcatStyle(isSelected)}
                      >
                        {displayCategory(cat)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {staticCategories.season.length > 0 && (
            <div style={{ marginBottom: "4px" }}>
              <button
                onClick={() => setSeasonOpen(!seasonOpen)}
                style={sidebarGroupStyle(seasonOpen)}
              >
                <span style={{ marginRight: "6px" }}>
                  {seasonOpen ? "▾" : "▸"}Сезон
                </span>
              </button>
              {seasonOpen && (
                <div style={{ marginTop: "2px", marginBottom: "4px" }}>
                  {staticCategories.season.map((cat) => {
                    const isSelected = selectedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => handleCategoryToggle(cat)}
                        style={sidebarSubcatStyle(isSelected)}
                      >
                        {displayCategory(cat)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {staticCategories.type.length > 0 && (
            <div style={{ marginBottom: "4px" }}>
              <button
                onClick={() => setTypeOpen(!typeOpen)}
                style={sidebarGroupStyle(typeOpen)}
              >
                <span style={{ marginRight: "6px" }}>
                  {typeOpen ? "▾" : "▸"}Вид
                </span>
              </button>
              {typeOpen && (
                <div style={{ marginTop: "2px", marginBottom: "4px" }}>
                  {staticCategories.type.map((cat) => {
                    const isSelected = selectedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => handleCategoryToggle(cat)}
                        style={sidebarSubcatStyle(isSelected)}
                      >
                        {displayCategory(cat)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {staticCategories.other.length > 0 && (
            <>
              {staticCategories.season.length > 0 ||
              staticCategories.type.length > 0 ||
              staticCategories.country.length > 0 ||
              staticCategories.material.length > 0 ? (
                <div
                  style={{
                    margin: "8px 0 8px",
                    borderTop: "1px solid #e2e8f0",
                  }}
                />
              ) : null}
              {staticCategories.other.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryToggle(cat)}
                    style={sidebarCatStyle(isSelected)}
                  >
                    {cat}
                  </button>
                );
              })}
            </>
          )}

          {(mobileTab || selectedCategories.length > 0) && (
            <button
              onClick={() => {
                setMobileTab("");
                handleClearCategories();
                setSeasonOpen(false);
                setTypeOpen(false);
                setCountryOpen(false);
                setMaterialOpen(false);
              }}
              style={{
                display: "block",
                width: "100%",
                marginTop: "16px",
                padding: "8px 16px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                background: "transparent",
                color: "#ef4444",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "12px",
                fontFamily:
                  '"Inter", "SF Pro Text", system-ui, -apple-system, sans-serif',
                transition: "all 0.2s",
              }}
            >
              ✕ Сбросить фильтры
            </button>
          )}
        </aside>

        {/* ОСНОВНОЙ КОНТЕНТ */}
        <main
          className="mainContent"
          style={{
            flex: 1,
            padding: "24px",
            boxSizing: "border-box",
            minWidth: 0,
            position: "relative",
          }}
        >
          {filteredProducts.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                fontSize: "18px",
                color: "#64748b",
              }}
            >
              {discountedOnly
                ? "Нет товаров со скидкой в выбранных категориях"
                : "Товаров не найдено"}
            </div>
          ) : (
            <>
              <div
                className="products-grid"
                style={{
                  display: "grid",
                  marginBottom: "40px",
                  opacity: isFetching ? 0.6 : 1,
                  transition: "opacity 0.2s ease",
                  pointerEvents: isFetching ? "none" : "auto",
                }}
              >
                {filteredProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    token={token}
                    userRole={userRole}
                    onDelete={handleDeleteProduct}
                  />
                ))}
              </div>
              {isFetching && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    background: "rgba(255,255,255,0.85)",
                    padding: "16px 32px",
                    borderRadius: "12px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    fontSize: "16px",
                    fontWeight: 500,
                    color: "#4f46e5",
                    zIndex: 5,
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: "20px",
                      height: "20px",
                      border: "3px solid #e2e8f0",
                      borderTop: "3px solid #4f46e5",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  Обновление...
                </div>
              )}
              {!hasActiveFilters && hasMore && (
                <div style={{ textAlign: "center", marginBottom: "40px" }}>
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    style={{
                      padding: "12px 40px",
                      border: "2px solid #4f46e5",
                      borderRadius: "8px",
                      background: "#fff",
                      color: "#4f46e5",
                      cursor: loadingMore ? "not-allowed" : "pointer",
                      fontWeight: 600,
                      fontSize: "14px",
                      fontFamily:
                        '"Inter", "SF Pro Text", system-ui, -apple-system, sans-serif',
                      transition: "all 0.2s",
                      opacity: loadingMore ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!loadingMore) {
                        e.currentTarget.style.background = "#4f46e5";
                        e.currentTarget.style.color = "#fff";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loadingMore) {
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.color = "#4f46e5";
                      }
                    }}
                  >
                    {loadingMore ? "Загрузка..." : "Показать ещё"}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
