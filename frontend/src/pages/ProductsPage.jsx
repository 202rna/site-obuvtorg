import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";

const MOBILE_TABS = [
  { id: "женская", label: "Женщинам" },
  { id: "мужская", label: "Мужчинам" },
  { id: "для детей", label: "Детям" },
];

export default function ProductsPage({
  API_URL,
  addToCart,
  token,
  userRole,
  cart = [],
  isInLocalCart,
  discountedOnly = false,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileTab, setMobileTab] = useState("");

  const selectedCategories = searchParams.getAll("category");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const categories = useMemo(() => {
    const allCats = discountFiltered.flatMap((p) => p.categories || []);
    const unique = [...new Set(allCats)];
    const priority = ["для детей", "мужская", "женская"];
    const priorityCats = priority.filter((cat) => unique.includes(cat));
    const otherCats = unique
      .filter((cat) => !priority.includes(cat))
      .sort((a, b) => a.localeCompare(b));
    return [...priorityCats, ...otherCats];
  }, [discountFiltered]);

  // Только "другие" категории (не женская, мужская, для детей)
  const otherCategories = useMemo(() => {
    const allCats = discountFiltered.flatMap((p) => p.categories || []);
    const unique = [...new Set(allCats)];
    const priority = ["для детей", "мужская", "женская"];
    return unique
      .filter((cat) => !priority.includes(cat))
      .sort((a, b) => a.localeCompare(b));
  }, [discountFiltered]);

  const filteredProducts = useMemo(() => {
    // Сначала применяем мобильный таб
    let result = discountFiltered;
    if (mobileTab) {
      result = result.filter(
        (p) => p.categories && p.categories.includes(mobileTab)
      );
    }
    // Затем применяем фильтр категорий из URL
    if (selectedCategories.length > 0) {
      result = result.filter(
        (p) =>
          p.categories &&
          p.categories.some((cat) => selectedCategories.includes(cat))
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

  const isInCartCombined = (product) => {
    if (token) {
      return cart.some((item) => String(item.id) === String(product.id));
    }
    return isInLocalCart ? isInLocalCart(product.id) : false;
  };

  // Стили
  const styles = {
    container: {
      width: "100%",
      maxWidth: "100%",
      minHeight: "100vh",
      padding: "0 24px",
      boxSizing: "border-box",
      fontFamily: "system-ui, -apple-system, sans-serif",
    },
    heading: {
      fontSize: "22px",
      fontWeight: "700",
      color: "#12153a",
      margin: "8px 0 24px 0",
    },
    filterWrapper: {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
      marginBottom: "24px",
      padding: "8px 0",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      gap: "32px",
      marginBottom: "40px",
    },
    empty: {
      textAlign: "center",
      padding: "40px 0",
      fontSize: "18px",
      color: "#64748b",
    },
    mobileTabBar: {
      display: "none", // скрыто на десктопе
    },
  };

  const allButtonStyle = {
    padding: "10px 22px",
    borderRadius: "30px",
    border: "none",
    background:
      selectedCategories.length === 0
        ? "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
        : "#f1f5f9",
    color: selectedCategories.length === 0 ? "#fff" : "#475569",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    fontFamily:
      '"Inter", "SF Pro Text", system-ui, -apple-system, sans-serif',
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    outline: "none",
    boxShadow:
      selectedCategories.length === 0
        ? "0 4px 14px rgba(124, 58, 237, 0.3)"
        : "none",
    letterSpacing: "0.06em",
  };

  const filterButtonStyle = (cat) => ({
    padding: "10px 22px",
    borderRadius: "30px",
    border: "none",
    background: selectedCategories.includes(cat)
      ? "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)"
      : "#f1f5f9",
    color: selectedCategories.includes(cat) ? "#fff" : "#475569",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    fontFamily:
      '"Inter", "SF Pro Text", system-ui, -apple-system, sans-serif',
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    outline: "none",
    boxShadow: selectedCategories.includes(cat)
      ? "0 4px 14px rgba(245, 158, 11, 0.3)"
      : "none",
    letterSpacing: "0.06em",
  });

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>Загрузка товаров...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        @media (max-width: 768px) {
          .products-container {
            padding: 0 12px !important;
          }
          .products-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
            margin-bottom: 24px !important;
          }
          .filter-wrapper {
            gap: 6px !important;
            padding: 8px 10px !important;
          }
          .filter-btn {
            font-size: 13px !important;
            padding: 6px 14px !important;
            border-radius: 30px !important;
          }
          .mobile-tab-bar {
            display: flex !important;
            flex-direction: column;
            position: sticky;
            top: 0;
            z-index: 10;
            background: white;
            border-bottom: 1px solid #e2e8f0;
            margin: 0 -24px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
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
            justify-content: stretch;
          }
          .desktop-filters {
            display: none !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-tab-bar {
            display: none !important;
          }
          .desktop-filters {
            display: flex !important;
          }
        }
      `}</style>

      {/* === Мобильные табы (основные + подкатегории) === */}
      <div className="mobile-tab-bar">
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
                  borderBottom: isActive ? "2px solid #4f46e5" : "2px solid transparent",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Подкатегории (помельче, серые) под основными табами */}
        {otherCategories.length > 0 && (
          <div className="sub-tabs">
            {otherCategories.map((cat) => {
              const isSelected = selectedCategories.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryToggle(cat)}
                  style={{
                    flex: 1,
                    padding: "5px 4px",
                    border: "none",
                    background: "transparent",
                    color: isSelected ? "#64748b" : "#cbd5e1",
                    fontWeight: isSelected ? 500 : 400,
                    fontSize: "10px",
                    cursor: "pointer",
                    fontFamily: '"Inter", "SF Pro Text", system-ui, sans-serif',
                    letterSpacing: "0.02em",
                    textTransform: "uppercase",
                    transition: "all 0.2s",
                    borderBottom: isSelected ? "1.5px solid #94a3b8" : "1.5px solid transparent",
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div
        className="products-container"
        style={styles.container}
      >
        {/* Фильтры — скрываются на мобилках, где табы */}
        {categories.length > 0 && (
          <div
            className="desktop-filters filter-wrapper"
            style={styles.filterWrapper}
          >
            <button
              className="filter-btn"
              style={allButtonStyle}
              onClick={handleClearCategories}
            >
              Все
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                className="filter-btn"
                style={filterButtonStyle(cat)}
                onClick={() => handleCategoryToggle(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <div style={styles.empty}>
            {discountedOnly
              ? "Нет товаров со скидкой в выбранных категориях"
              : "Товаров не найдено"}
          </div>
        ) : (
          <div className="products-grid" style={styles.grid}>
            {filteredProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                isInCart={isInCartCombined(p)}
                onAddToCart={addToCart}
                userRole={userRole}
                token={token}
                onDelete={handleDeleteProduct}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}