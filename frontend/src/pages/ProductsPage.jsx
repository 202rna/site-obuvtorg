import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";

const MOBILE_TABS = [
  { id: "жен", label: "Женщинам" },
  { id: "муж", label: "Мужчинам" },
  { id: "дет", label: "Для детей" },
];

// Ключевые слова сезона
const SEASON_KEYWORDS = ["лето", "осень", "зима", "весна", "демисезон"];

// Ключевые слова видов обуви (поиск по подстроке — без привязки к опечаткам)
const TYPE_KEYWORDS = [
  "кроссовк", "кросовк",
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
  "шлепанец", "шлеп",
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

// Ключевые слова пола (поиск по подстроке)
const GENDER_KEYWORDS = ["жен", "муж", "дет"];

// Ключевые слова стран
const COUNTRY_KEYWORDS = [
  "росси", "рф",
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

// Ключевые слова материалов
const MATERIAL_KEYWORDS = [
  "кож",
  "текстил",
  "замш",
  "нубук",
  "велюр",
  "лак",
  "резин",
  "полиуретан",
  "термополиуретан", "тпу",
  "этиленвинилацетат", "эва",
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

  const [seasonOpen, setSeasonOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);

  useEffect(() => {
    async function loadAllProducts() {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/products?limit=999`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Ошибка загрузки товаров:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    loadAllProducts();
  }, [API_URL]);

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

  // --- Фильтрация ---
  const discountFiltered = useMemo(() => {
    if (!discountedOnly) return products;
    return products.filter((p) => (p.discount || 0) > 0);
  }, [products, discountedOnly]);

  // Разделяем категории по группам
  const { seasonCategories, typeCategories, countryCategories, materialCategories, otherCategories } = useMemo(() => {
    const allCats = discountFiltered.flatMap((p) => p.categories || []);
    const unique = [...new Set(allCats)];
    const season = [];
    const type = [];
    const country = [];
    const material = [];
    const other = [];
    for (const cat of unique) {
      const group = classifyCategory(cat);
      if (group === "gender") continue; // половые — отдельные кнопки
      if (group === "season") season.push(cat);
      else if (group === "type") type.push(cat);
      else if (group === "country") country.push(cat);
      else if (group === "material") material.push(cat);
      else other.push(cat);
    }
    return {
      seasonCategories: season.sort((a, b) => a.localeCompare(b)),
      typeCategories: type.sort((a, b) => a.localeCompare(b)),
      countryCategories: country.sort((a, b) => a.localeCompare(b)),
      materialCategories: material.sort((a, b) => a.localeCompare(b)),
      otherCategories: other.sort((a, b) => a.localeCompare(b)),
    };
  }, [discountFiltered]);

  const filteredProducts = useMemo(() => {
    let result = discountFiltered;
    if (mobileTab) {
      result = result.filter(
        (p) => p.categories && p.categories.some((c) => normalize(c).includes(mobileTab)),
      );
    }
    if (selectedCategories.length > 0) {
      result = result.filter(
        (p) =>
          p.categories &&
          p.categories.some((cat) => selectedCategories.includes(cat)),
      );
    }
    return result;
  }, [discountFiltered, selectedCategories, mobileTab]);

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

  // Стили
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
          .mobile-tab-bar .sub-tabs {
            display: flex;
            flex-wrap: wrap;
            width: 100%;
            padding: 2px 0 6px 0;
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
        {/* ========== МОБИЛЬНЫЕ ТАБЫ ========== */}
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

          {/* Мобильные выпадающие категории: Страна, Материал, Сезон, Вид */}
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
            {countryCategories.length > 0 && (
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
                  {countryOpen ? "▴ " : "▾ "}
                  Страна
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
                    {countryCategories.map((cat) => {
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
                          {displayCategory(cat)} {isSelected && "✓"}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {materialCategories.length > 0 && (
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
                  {materialOpen ? "▴ " : "▾ "}
                  Материал
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
                    {materialCategories.map((cat) => {
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
                          {displayCategory(cat)} {isSelected && "✓"}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {seasonCategories.length > 0 && (
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
                  {seasonOpen ? "▴ " : "▾ "}
                  Сезон
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
                    {seasonCategories.map((cat) => {
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
                          {displayCategory(cat)} {isSelected && "✓"}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {typeCategories.length > 0 && (
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
                  {typeOpen ? "▴ " : "▾ "}
                  Вид
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
                    }}
                  >
                    {typeCategories.map((cat) => {
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
                          {displayCategory(cat)} {isSelected && "✓"}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ========== ДЕСКТОП-САЙДБАР ========== */}
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

          {/* Основные табы: Женщинам / Мужчинам / Детям */}
          {MOBILE_TABS.map((tab) => {
            const isActive = mobileTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setMobileTab(isActive ? "" : tab.id)}
                style={sidebarTabStyle(isActive)}
              >
                {tab.label} {isActive && "✓"}
              </button>
            );
          })}

          {/* Разделитель */}
          {(seasonCategories.length > 0 ||
            typeCategories.length > 0 ||
            countryCategories.length > 0 ||
            materialCategories.length > 0 ||
            otherCategories.length > 0) && (
            <div
              style={{ margin: "12px 0 8px", borderTop: "1px solid #e2e8f0" }}
            />
          )}

          {/* ===== СТРАНА (выпадающее меню) ===== */}
          {countryCategories.length > 0 && (
            <div style={{ marginBottom: "4px" }}>
              <button
                onClick={() => setCountryOpen(!countryOpen)}
                style={sidebarGroupStyle(countryOpen)}
              >
                <span style={{ marginRight: "6px" }}>
                  {countryOpen ? "▾" : "▸"}
                </span>
                Страна
              </button>
              {countryOpen && (
                <div style={{ marginTop: "2px", marginBottom: "4px" }}>
                  {countryCategories.map((cat) => {
                    const isSelected = selectedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => handleCategoryToggle(cat)}
                        style={sidebarSubcatStyle(isSelected)}
                      >
                        {displayCategory(cat)} {isSelected && "✓"}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===== МАТЕРИАЛ (выпадающее меню) ===== */}
          {materialCategories.length > 0 && (
            <div style={{ marginBottom: "4px" }}>
              <button
                onClick={() => setMaterialOpen(!materialOpen)}
                style={sidebarGroupStyle(materialOpen)}
              >
                <span style={{ marginRight: "6px" }}>
                  {materialOpen ? "▾" : "▸"}
                </span>
                Материал
              </button>
              {materialOpen && (
                <div style={{ marginTop: "2px", marginBottom: "4px" }}>
                  {materialCategories.map((cat) => {
                    const isSelected = selectedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => handleCategoryToggle(cat)}
                        style={sidebarSubcatStyle(isSelected)}
                      >
                        {displayCategory(cat)} {isSelected && "✓"}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===== СЕЗОН (выпадающее меню) ===== */}
          {seasonCategories.length > 0 && (
            <div style={{ marginBottom: "4px" }}>
              <button
                onClick={() => setSeasonOpen(!seasonOpen)}
                style={sidebarGroupStyle(seasonOpen)}
              >
                <span style={{ marginRight: "6px" }}>
                  {seasonOpen ? "▾" : "▸"}
                </span>
                Сезон
              </button>
              {seasonOpen && (
                <div style={{ marginTop: "2px", marginBottom: "4px" }}>
                  {seasonCategories.map((cat) => {
                    const isSelected = selectedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => handleCategoryToggle(cat)}
                        style={sidebarSubcatStyle(isSelected)}
                      >
                        {displayCategory(cat)} {isSelected && "✓"}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===== ВИД (выпадающее меню) ===== */}
          {typeCategories.length > 0 && (
            <div style={{ marginBottom: "4px" }}>
              <button
                onClick={() => setTypeOpen(!typeOpen)}
                style={sidebarGroupStyle(typeOpen)}
              >
                <span style={{ marginRight: "6px" }}>
                  {typeOpen ? "▾" : "▸"}
                </span>
                Вид
              </button>
              {typeOpen && (
                <div style={{ marginTop: "2px", marginBottom: "4px" }}>
                  {typeCategories.map((cat) => {
                    const isSelected = selectedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => handleCategoryToggle(cat)}
                        style={sidebarSubcatStyle(isSelected)}
                      >
                        {displayCategory(cat)} {isSelected && "✓"}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===== ОСТАЛЬНЫЕ КАТЕГОРИИ (как раньше) ===== */}
          {otherCategories.length > 0 && (
            <>
              {seasonCategories.length > 0 ||
              typeCategories.length > 0 ||
              countryCategories.length > 0 ||
              materialCategories.length > 0 ? (
                <div
                  style={{
                    margin: "8px 0 8px",
                    borderTop: "1px solid #e2e8f0",
                  }}
                />
              ) : null}
              {otherCategories.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryToggle(cat)}
                    style={sidebarCatStyle(isSelected)}
                  >
                    {cat} {isSelected && "✓"}
                  </button>
                );
              })}
            </>
          )}

          {/* Кнопка сброса фильтров */}
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

        {/* ========== ОСНОВНОЙ КОНТЕНТ ========== */}
        <main
          style={{
            flex: 1,
            padding: "24px",
            boxSizing: "border-box",
            minWidth: 0,
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
            <div
              className="products-grid"
              style={{
                display: "grid",
                marginBottom: "40px",
              }}
            >
              {filteredProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  userRole={userRole}
                  token={token}
                  onDelete={handleDeleteProduct}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}