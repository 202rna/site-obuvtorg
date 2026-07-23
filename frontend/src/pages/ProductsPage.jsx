import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getFinalPrice, formatPrice } from "../utils/price";

export default function ProductsPage({
  API_URL,
  addToCart,
  token,
  userRole,
  cart = [],
  discountedOnly = false,
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCategories = searchParams.getAll("category");

  const [products, setProducts] = useState([]);
  const [imageIndexMap, setImageIndexMap] = useState({});
  const [loading, setLoading] = useState(true);

  // ------ Для свайпа ------
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (productId, imagesLength) => (e) => {
    touchEndX.current = e.changedTouches[0].screenX;
    handleSwipe(productId, imagesLength);
  };

  const handleSwipe = (productId, imagesLength) => {
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50; // минимальное расстояние для свайпа
    if (Math.abs(diff) < minSwipeDistance) return;

    if (diff > 0) {
      // свайп влево → следующее изображение
      showNextImage(productId, imagesLength, null);
    } else {
      // свайп вправо → предыдущее
      showPrevImage(productId, imagesLength, null);
    }
  };
  // --------------------------

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

  function getProductImages(product) {
    const fromArray = Array.isArray(product.image_urls)
      ? product.image_urls.filter(Boolean)
      : [];
    if (fromArray.length > 0) return fromArray;
    if (product.image_url) return [product.image_url];
    return ["/placeholder.png"];
  }

  function showPrevImage(productId, imageCount, e) {
    if (e) e.stopPropagation();
    setImageIndexMap((prev) => {
      const current = prev[productId] || 0;
      const next = (current - 1 + imageCount) % imageCount;
      return { ...prev, [productId]: next };
    });
  }

  function showNextImage(productId, imageCount, e) {
    if (e) e.stopPropagation();
    setImageIndexMap((prev) => {
      const current = prev[productId] || 0;
      const next = (current + 1) % imageCount;
      return { ...prev, [productId]: next };
    });
  }

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

  const filteredProducts = useMemo(() => {
    if (selectedCategories.length === 0) return discountFiltered;
    return discountFiltered.filter(
      (p) =>
        p.categories &&
        p.categories.some((cat) => selectedCategories.includes(cat)),
    );
  }, [discountFiltered, selectedCategories]);

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
    card: {
      backgroundColor: "rgba(255, 255, 255, 0.75)",
      backdropFilter: "blur(8px)",
      borderRadius: "20px",
      overflow: "hidden",
      boxShadow: "0 4px 30px rgba(0, 0, 0, 0.03)",
      border: "1px solid rgba(255, 255, 255, 0.6)",
      display: "flex",
      flexDirection: "column",
      position: "relative",
    },
    badge: {
      position: "absolute",
      top: "12px",
      right: "12px",
      backgroundColor: "#dc2626",
      color: "#fff",
      fontSize: "12px",
      fontWeight: "700",
      padding: "4px 10px",
      borderRadius: "8px",
      zIndex: 1,
    },
    imgContainer: {
      width: "100%",
      height: "240px",
      backgroundColor: "#ffffff",
      padding: "20px",
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderBottom: "1px solid #f1f5f9",
      position: "relative",
      touchAction: "pan-y", // разрешаем вертикальный скролл, но ловим горизонтальный свайп
    },
    img: { maxWidth: "100%", maxHeight: "100%", objectFit: "contain" },
    sliderBtn: {
      position: "absolute",
      top: "50%",
      transform: "translateY(-50%)",
      width: "28px",
      height: "28px",
      borderRadius: "50%",
      border: "none",
      backgroundColor: "rgba(15, 23, 42, 0.55)",
      color: "#fff",
      cursor: "pointer",
      zIndex: 2,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "700",
    },
    sliderLeft: { left: "8px" },
    sliderRight: { right: "8px" },
    sliderCounter: {
      position: "absolute",
      bottom: "8px",
      right: "10px",
      backgroundColor: "rgba(15, 23, 42, 0.65)",
      color: "#fff",
      fontSize: "11px",
      fontWeight: "600",
      padding: "2px 6px",
      borderRadius: "8px",
      zIndex: 2,
    },
    content: {
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      flexGrow: 1,
    },
    title: {
      margin: "0 0 8px 0",
      fontSize: "19px",
      fontWeight: "700",
      color: "#0f172a",
      letterSpacing: "-0.3px",
    },
    desc: {
      fontSize: "14px",
      color: "#475569",
      margin: "0 0 24px 0",
      flexGrow: 1,
      lineHeight: "1.6",
    },
    // sizesWrap и sizeBox удалены, так как размеры убраны
    price: {
      fontSize: "24px",
      fontWeight: "800",
      color: "#0f172a",
      marginBottom: "20px",
    },
    oldPrice: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#94a3b8",
      textDecoration: "line-through",
      marginRight: "8px",
    },
    buyBtn: {
      padding: "14px",
      fontSize: "14px",
      fontWeight: "600",
      color: "#ffffff",
      border: "none",
      borderRadius: "12px",
      cursor: "pointer",
      width: "100%",
    },
    deleteBtn: {
      padding: "12px",
      fontSize: "14px",
      fontWeight: "600",
      color: "#ef4444",
      backgroundColor: "rgba(239, 68, 68, 0.06)",
      border: "none",
      borderRadius: "12px",
      cursor: "pointer",
      width: "100%",
      marginTop: "12px",
    },
    empty: {
      textAlign: "center",
      padding: "40px 0",
      fontSize: "18px",
      color: "#64748b",
    },
  };

  const allButtonStyle = {
    padding: "8px 18px",
    borderRadius: "30px",
    border: "1px solid #4f46e5",
    background: selectedCategories.length === 0 ? "#4f46e5" : "#f1f5f9",
    color: selectedCategories.length === 0 ? "#fff" : "#1e293b",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    transition: "all 0.2s ease",
    outline: "none",
  };

  const filterButtonStyle = (cat) => ({
    padding: "8px 18px",
    borderRadius: "30px",
    border: "1px solid #f7f7f7",
    background: selectedCategories.includes(cat) ? "#d66d16" : "#f1f5f9",
    color: selectedCategories.includes(cat) ? "#fff" : "#1e293b",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    transition: "all 0.2s ease",
    outline: "none",
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
        @media (max-width: 600px) {
          .products-container {
            padding: 0 12px !important;
          }
          .products-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
            margin-bottom: 24px !important;
          }
          .product-card {
            border-radius: 14px !important;
          }
          .product-img-container {
            height: 140px !important;
            padding: 10px !important;
          }
          .product-content {
            padding: 12px !important;
          }
          .product-title {
            font-size: 14px !important;
            margin-bottom: 4px !important;
          }
          .product-desc {
            font-size: 12px !important;
            margin-bottom: 12px !important;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .product-price {
            font-size: 16px !important;
            margin-bottom: 12px !important;
          }
          .product-buy-btn, .product-delete-btn {
            padding: 10px 6px !important;
            font-size: 12px !important;
            border-radius: 8px !important;
          }
          .filter-wrapper {
            gap: 4px !important;
            padding: 8px 10px !important;
          }
          .filter-btn {
            font-size: 12px !important;
            padding: 4px 12px !important;
          }
        }
      `}</style>

      <div className="products-container" style={styles.container}>
        {discountedOnly && <h2 style={styles.heading}>Товары со скидкой</h2>}

        {categories.length > 0 && (
          <div className="filter-wrapper" style={styles.filterWrapper}>
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
            {filteredProducts.map((p) => {
              const isInCart = cart.some(
                (item) => String(item.id) === String(p.id),
              );
              const discount = p.discount || 0;
              const finalPrice = getFinalPrice(p.price, discount);
              const images = getProductImages(p);
              const currentImageIndex = imageIndexMap[p.id] || 0;
              const currentImage =
                images[currentImageIndex] || "/placeholder.png";

              return (
                <div
                  key={p.id}
                  className="product-card"
                  style={{ ...styles.card, cursor: "pointer" }}
                  onClick={() => navigate(`/products/${p.id}`)}
                >
                  {discount > 0 && (
                    <span style={styles.badge}>-{discount}%</span>
                  )}
                  <div
                    className="product-img-container"
                    style={styles.imgContainer}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd(p.id, images.length)}
                  >
                    {images.length > 1 && (
                      <>
                        <button
                          style={{ ...styles.sliderBtn, ...styles.sliderLeft }}
                          onClick={(e) => showPrevImage(p.id, images.length, e)}
                        >
                          ‹
                        </button>
                        <button
                          style={{
                            ...styles.sliderBtn,
                            ...styles.sliderRight,
                          }}
                          onClick={(e) => showNextImage(p.id, images.length, e)}
                        >
                          ›
                        </button>
                        <span style={styles.sliderCounter}>
                          {currentImageIndex + 1}/{images.length}
                        </span>
                      </>
                    )}
                    <img src={currentImage} alt={p.title} style={styles.img} />
                  </div>
                  <div className="product-content" style={styles.content}>
                    <h4 className="product-title" style={styles.title}>
                      {p.title}
                    </h4>
                    <p className="product-desc" style={styles.desc}>
                      {p.description}
                    </p>

                    {/* Блок размеров УДАЛЁН */}

                    <div className="product-price" style={styles.price}>
                      {discount > 0 && (
                        <span style={styles.oldPrice}>
                          {formatPrice(p.price)} ₽
                        </span>
                      )}
                      {formatPrice(finalPrice)} ₽
                    </div>

                    {token && (
                      <button
                        className="product-buy-btn"
                        style={{
                          ...styles.buyBtn,
                          backgroundColor: isInCart ? "#64748b" : "#10b981",
                          cursor: isInCart ? "default" : "pointer",
                          boxShadow: isInCart
                            ? "none"
                            : "0 4px 12px rgba(16, 185, 129, 0.15)",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isInCart) addToCart(p);
                        }}
                        disabled={isInCart}
                      >
                        {isInCart ? "✓ В корзине" : "🛒 В корзину"}
                      </button>
                    )}

                    {token && userRole === "admin" && (
                      <button
                        className="product-delete-btn"
                        style={styles.deleteBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProduct(p.id);
                        }}
                      >
                        🗑️ Удалить
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
