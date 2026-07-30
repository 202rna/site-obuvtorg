import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
} from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";

const MOBILE_TABS = [
  { id: "жен", label: "Женщинам" },
  { id: "муж", label: "Мужчинам" },
  { id: "дет", label: "Для детей" },
];

const PAGE_SIZE = 15;
const EMPTY_FILTERS = {
  season: [],
  type: [],
  country: [],
  material: [],
  other: [],
};

function displayCategory(cat) {
  if (!cat) return cat;
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

function buildProductsQuery({
  lastId,
  limit = PAGE_SIZE,
  discountedOnly,
  gender,
  categories,
}) {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (lastId != null) params.set("last_id", String(lastId));
  if (discountedOnly) params.set("discounted_only", "true");
  if (gender) params.set("gender", gender);
  (categories || []).forEach((cat) => params.append("category", cat));
  return params.toString();
}

export default function ProductsPage({
  API_URL,
  token,
  userRole,
  discountedOnly = false,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const gender = searchParams.get("gender") || "";
  const selectedCategories = searchParams.getAll("category");

  const [filterOptions, setFilterOptions] = useState(EMPTY_FILTERS);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [seasonOpen, setSeasonOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);

  const filterKey = useMemo(
    () =>
      JSON.stringify({
        gender,
        categories: selectedCategories,
        discountedOnly,
      }),
    [gender, selectedCategories, discountedOnly],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadFilters() {
      try {
        const response = await fetch(`${API_URL}/products/filters`);
        if (!response.ok) return;
        const data = await response.json();
        if (isMounted && data && typeof data === "object") {
          setFilterOptions({
            season: data.season || [],
            type: data.type || [],
            country: data.country || [],
            material: data.material || [],
            other: data.other || [],
          });
        }
      } catch (err) {
        console.error("Ошибка загрузки фильтров:", err);
      }
    }

    loadFilters();
    return () => {
      isMounted = false;
    };
  }, [API_URL]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadProducts() {
      setLoading(true);
      setLoadError("");
      try {
        const qs = buildProductsQuery({
          gender,
          categories: selectedCategories,
          discountedOnly,
          limit: PAGE_SIZE,
        });
        const response = await fetch(`${API_URL}/products?${qs}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Не удалось загрузить товары");
        }
        const data = await response.json();
        if (!isMounted) return;
        setProducts(Array.isArray(data.items) ? data.items : []);
        setHasMore(Boolean(data.has_more));
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Ошибка загрузки товаров:", err);
        if (isMounted) {
          setProducts([]);
          setHasMore(false);
          setLoadError("Не удалось загрузить каталог. Попробуйте обновить страницу.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProducts();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [API_URL, filterKey]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || products.length === 0) return;
    setLoadingMore(true);
    try {
      const lastId = products[products.length - 1].id;
      const qs = buildProductsQuery({
        lastId,
        gender,
        categories: selectedCategories,
        discountedOnly,
        limit: PAGE_SIZE,
      });
      const response = await fetch(`${API_URL}/products?${qs}`);
      if (!response.ok) return;
      const data = await response.json();
      const items = Array.isArray(data.items) ? data.items : [];
      if (items.length > 0) {
        setProducts((prev) => [...prev, ...items]);
      }
      setHasMore(Boolean(data.has_more));
    } catch (err) {
      console.error("Ошибка загрузки следующих товаров:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [
    API_URL,
    loadingMore,
    hasMore,
    products,
    gender,
    selectedCategories,
    discountedOnly,
  ]);

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

  const handleGenderToggle = (tabId) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (gender === tabId) {
        newParams.delete("gender");
      } else {
        newParams.set("gender", tabId);
      }
      return newParams;
    });
  };

  const handleCategoryToggle = (cat) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      const current = newParams.getAll("category");
      const isSelected = current.includes(cat);
      newParams.delete("category");

      if (isSelected) {
        current.filter((c) => c !== cat).forEach((c) => newParams.append("category", c));
      } else {
        current.forEach((c) => newParams.append("category", c));
        newParams.append("category", cat);
      }
      return newParams;
    });
  };

  const handleClearFilters = () => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.delete("category");
      newParams.delete("gender");
      return newParams;
    });
    setSeasonOpen(false);
    setTypeOpen(false);
    setCountryOpen(false);
    setMaterialOpen(false);
  };

  const hasActiveFilters = gender !== "" || selectedCategories.length > 0;

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

  const renderFilterGroup = (items, open, setOpen, label) => {
    if (items.length === 0) return null;
    return (
      <div style={{ marginBottom: "4px" }}>
        <button onClick={() => setOpen(!open)} style={sidebarGroupStyle(open)}>
          <span style={{ marginRight: "6px" }}>{open ? "▾" : "▸"}</span>
          {label}
        </button>
        {open && (
          <div style={{ marginTop: "2px", marginBottom: "4px" }}>
            {items.map((cat) => {
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
    );
  };

  const renderMobileFilterDropdown = (items, open, setOpen, label) => {
    if (items.length === 0) return null;
    return (
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            padding: "5px 10px",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            background: open ? "#eef2ff" : "#fff",
            color: open ? "#4f46e5" : "#475569",
            fontWeight: open ? 600 : 400,
            fontSize: "11px",
            cursor: "pointer",
            fontFamily: '"Inter", "SF Pro Text", system-ui, sans-serif',
            whiteSpace: "nowrap",
            transition: "all 0.2s",
          }}
        >
          {open ? "▴ " : "▾ "}
          {label}
        </button>
        {open && (
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
            {items.map((cat) => {
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
                    fontFamily: '"Inter", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  {displayCategory(cat)}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

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
        <div className="mobile-tab-bar" style={{ display: "none" }}>
          <div className="main-tabs">
            {MOBILE_TABS.map((tab) => {
              const isActive = gender === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleGenderToggle(tab.id)}
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
            {renderMobileFilterDropdown(
              filterOptions.country,
              countryOpen,
              setCountryOpen,
              "Страна",
            )}
            {renderMobileFilterDropdown(
              filterOptions.material,
              materialOpen,
              setMaterialOpen,
              "Материал",
            )}
            {renderMobileFilterDropdown(
              filterOptions.season,
              seasonOpen,
              setSeasonOpen,
              "Сезон",
            )}
            {renderMobileFilterDropdown(
              filterOptions.type,
              typeOpen,
              setTypeOpen,
              "Вид",
            )}
          </div>
        </div>

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
            const isActive = gender === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleGenderToggle(tab.id)}
                style={sidebarTabStyle(isActive)}
              >
                {tab.label}
              </button>
            );
          })}
          {(filterOptions.season.length > 0 ||
            filterOptions.type.length > 0 ||
            filterOptions.country.length > 0 ||
            filterOptions.material.length > 0 ||
            filterOptions.other.length > 0) && (
            <div
              style={{ margin: "12px 0 8px", borderTop: "1px solid #e2e8f0" }}
            />
          )}

          {renderFilterGroup(
            filterOptions.country,
            countryOpen,
            setCountryOpen,
            "Страна",
          )}
          {renderFilterGroup(
            filterOptions.material,
            materialOpen,
            setMaterialOpen,
            "Материал",
          )}
          {renderFilterGroup(
            filterOptions.season,
            seasonOpen,
            setSeasonOpen,
            "Сезон",
          )}
          {renderFilterGroup(filterOptions.type, typeOpen, setTypeOpen, "Вид")}

          {filterOptions.other.length > 0 && (
            <>
              <div
                style={{ margin: "8px 0 8px", borderTop: "1px solid #e2e8f0" }}
              />
              {filterOptions.other.map((cat) => {
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

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
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

        <main
          className="mainContent"
          style={{
            flex: 1,
            padding: "24px",
            boxSizing: "border-box",
            minWidth: 0,
          }}
        >
          {loadError ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                fontSize: "18px",
                color: "#ef4444",
              }}
            >
              {loadError}
            </div>
          ) : products.length === 0 ? (
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
                }}
              >
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    token={token}
                    userRole={userRole}
                    onDelete={handleDeleteProduct}
                  />
                ))}
              </div>
              {hasMore && (
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
                  >
                    {loadingMore ? "Загрузка..." : "Показать ещё"}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
