import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ProductsPage({
  API_URL,
  addToCart,
  token,
  userRole,
  cart = [],
}) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const PRODUCTS_LIMIT = 30;

  async function loadMoreProducts() {
    if (loading || !hasMore) return;
    setLoading(true);
    const lastId = products.length > 0 ? products[products.length - 1].id : "";
    try {
      const response = await fetch(
        `${API_URL}/products?last_id=${lastId}&limit=${PRODUCTS_LIMIT}`,
      );
      const newProducts = await response.json();
      if (response.ok) {
        setProducts((prev) => [...prev, ...newProducts]);
        if (newProducts.length < PRODUCTS_LIMIT) setHasMore(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  useEffect(() => {
    async function loadInitialProducts() {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_URL}/products?limit=${PRODUCTS_LIMIT}`,
        );
        const initialProducts = await response.json();
        if (response.ok) {
          setProducts(initialProducts);
          if (initialProducts.length < PRODUCTS_LIMIT) setHasMore(false);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialProducts();
  }, [API_URL]);

  const styles = {
    container: {
      width: "100%",
      maxWidth: "100%",
      minHeight: "100vh",
      padding: "0 24px",
      boxSizing: "border-box",
      fontFamily: "system-ui, -apple-system, sans-serif",
    },
    grid: {
      display: "grid",
      // Базовая настройка для десктопа (минимум 280px на карточку)
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
    },
    img: { maxWidth: "100%", maxHeight: "100%", objectFit: "contain" },
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
    price: {
      fontSize: "24px",
      fontWeight: "800",
      color: "#0f172a",
      marginBottom: "20px",
    },
    btnMore: {
      padding: "14px 36px",
      fontSize: "15px",
      fontWeight: "600",
      color: "#ffffff",
      backgroundColor: "#4f46e5",
      border: "none",
      borderRadius: "12px",
      cursor: "pointer",
      marginTop: "20px",
      boxShadow: "0 4px 14px rgba(79, 70, 229, 0.2)",
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
  };

  return (
    <div style={styles.container}>
      {/* Добавляем стили для мобильных устройств */}
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
        }
      `}</style>

      {/* Применяем классы для медиазапросов */}
      <div className="products-container" style={styles.container}>
        <div className="products-grid" style={styles.grid}>
          {products.map((p) => {
            const isInCart = cart.some(
              (item) => String(item.id) === String(p.id),
            );

            return (
              <div
                key={p.id}
                className="product-card"
                style={{ ...styles.card, cursor: "pointer" }}
                onClick={() => navigate(`/products/${p.id}`)} // переход на страницу товара
              >
                <div
                  className="product-img-container"
                  style={styles.imgContainer}
                >
                  <img src={p.image_url} alt={p.title} style={styles.img} />
                </div>
                <div className="product-content" style={styles.content}>
                  <h4 className="product-title" style={styles.title}>
                    {p.title}
                  </h4>
                  <p className="product-desc" style={styles.desc}>
                    {p.description}
                  </p>
                  <div className="product-price" style={styles.price}>
                    {p.price.toLocaleString("ru-RU")} ₽
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
                        e.stopPropagation(); // предотвращаем переход по карточке
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
                        e.stopPropagation(); // предотвращаем переход
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

        <div style={{ textAlign: "center", paddingBottom: "80px" }}>
          {hasMore ? (
            <button
              style={styles.btnMore}
              onClick={loadMoreProducts}
              disabled={loading}
            >
              {loading ? "Загрузка..." : "Показать еще товары"}
            </button>
          ) : (
            <p
              style={{
                color: "#64748b",
                fontStyle: "italic",
                marginTop: "40px",
              }}
            >
              Вы посмотрели все доступные товары 🎉
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
