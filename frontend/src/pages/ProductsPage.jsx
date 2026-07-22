import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const PRODUCTS_LIMIT = 30;

  function productsUrl(lastId) {
    const params = new URLSearchParams({ limit: String(PRODUCTS_LIMIT) });
    if (lastId) params.set("last_id", String(lastId));
    if (discountedOnly) params.set("discounted_only", "true");
    return `${API_URL}/products?${params.toString()}`;
  }

  async function loadMoreProducts() {
    if (loading || !hasMore) return;
    setLoading(true);
    const lastId =
      products.length > 0 ? products[products.length - 1].id : null;
    try {
      const response = await fetch(productsUrl(lastId));
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
      setProducts([]);
      setHasMore(true);
      try {
        const response = await fetch(productsUrl(null));
        const initialProducts = await response.json();
        // #region agent log
        fetch(
          "http://127.0.0.1:7387/ingest/6c7cf841-34a1-48fd-8972-fd7dd2a3fdc7",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Debug-Session-Id": "3f641e",
            },
            body: JSON.stringify({
              sessionId: "3f641e",
              runId: "post-fix",
              hypothesisId: "D,E",
              location: "ProductsPage.jsx:loadInitialProducts",
              message: "products list response",
              data: {
                discountedOnly,
                url: productsUrl(null),
                status: response.status,
                ok: response.ok,
                count: Array.isArray(initialProducts)
                  ? initialProducts.length
                  : null,
                items: Array.isArray(initialProducts)
                  ? initialProducts.map((p) => ({
                      id: p.id,
                      title: p.title,
                      discount: p.discount,
                      hasDiscountKey: Object.prototype.hasOwnProperty.call(
                        p,
                        "discount",
                      ),
                    }))
                  : null,
              },
              timestamp: Date.now(),
            }),
          },
        ).catch(() => {});
        // #endregion
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
  }, [API_URL, discountedOnly]);

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
      color: "#0f172a",
      margin: "8px 0 24px 0",
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
    oldPrice: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#94a3b8",
      textDecoration: "line-through",
      marginRight: "8px",
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

      <div className="products-container" style={styles.container}>
        {discountedOnly && <h2 style={styles.heading}></h2>}

        {!loading && products.length === 0 && (
          <p
            style={{ color: "#64748b", textAlign: "center", marginTop: "40px" }}
          >
            {discountedOnly
              ? "Пока нет товаров со скидкой"
              : "Каталог пока пуст"}
          </p>
        )}

        <div className="products-grid" style={styles.grid}>
          {products.map((p) => {
            const isInCart = cart.some(
              (item) => String(item.id) === String(p.id),
            );
            const discount = p.discount || 0;
            const finalPrice = getFinalPrice(p.price, discount);

            return (
              <div
                key={p.id}
                className="product-card"
                style={{ ...styles.card, cursor: "pointer" }}
                onClick={() => navigate(`/products/${p.id}`)}
              >
                {discount > 0 && <span style={styles.badge}>-{discount}%</span>}
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
            ></p>
          )}
        </div>
      </div>
    </div>
  );
}
