import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { marked } from "marked";

const styles = {
  container: {
    maxWidth: "800px",
    margin: "20px auto", // уменьшен отступ для мобильных
    padding: "0 16px", // чуть меньше боковых отступов
    fontFamily: "system-ui, -apple-system, sans-serif",
    boxSizing: "border-box",
  },
  imageContainer: {
    width: "100%",
    height: "auto", // автоподбор высоты
    aspectRatio: "4 / 3", // соотношение сторон (можно заменить на 1/1)
    maxHeight: "400px", // ограничение на больших экранах
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px",
    overflow: "hidden",
    border: "1px solid #f1f5f9",
    padding: "16px",
    boxSizing: "border-box",
  },
  image: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
  },
  title: {
    fontSize: "28px", // чуть меньше для мобильных
    fontWeight: "700",
    marginBottom: "10px",
    color: "#0f172a",
    letterSpacing: "-0.5px",
  },
  price: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "16px",
  },
  description: {
    fontSize: "16px",
    lineHeight: "1.7",
    color: "#475569",
    marginBottom: "20px",
  },
  fullDescription: {
    fontSize: "15px",
    lineHeight: "1.8",
    color: "#1e293b",
    borderTop: "1px solid #e2e8f0",
    paddingTop: "20px",
    marginTop: "20px",
  },
  btn: {
    padding: "14px 36px",
    fontSize: "15px",
    fontWeight: "600",
    color: "#fff",
    backgroundColor: "#10b981",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
    textAlign: "center",
    boxSizing: "border-box",
    width: "100%", // на мобильных кнопка растягивается (управляется через контейнер)
  },
  btnSuccessPulse: {
    backgroundColor: "#059669",
    transform: "scale(1.05)",
    boxShadow: "0 0 20px rgba(5, 150, 105, 0.6)",
  },
  btnDisabled: {
    backgroundColor: "#64748b",
    cursor: "default",
    boxShadow: "none",
    transform: "scale(1)",
  },
  btnDelete: {
    padding: "14px 36px",
    fontSize: "15px",
    fontWeight: "600",
    color: "#ef4444",
    backgroundColor: "rgba(239, 68, 68, 0.06)",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    textAlign: "center",
    boxSizing: "border-box",
    width: "100%",
  },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    marginBottom: "20px",
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#ffffff",
    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
    border: "none",
    borderRadius: "30px",
    cursor: "pointer",
    textDecoration: "none",
    boxShadow: "0 4px 14px rgba(124, 58, 237, 0.3)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  },
};

export default function ProductPage({
  API_URL,
  addToCart = () => {},
  token,
  cart = [],
}) {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isJustAdded, setIsJustAdded] = useState(false);
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 600);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const cartItems = Array.isArray(cart) ? cart : [];

  useEffect(() => {
    let isMounted = true;

    async function fetchProduct() {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/products/${productId}`);
        const data = await response.json();

        if (!isMounted) return;

        if (response.ok) {
          console.log("ДАННЫЕ ОТ СЕРВЕРА:", data);
          setProduct(data);
        } else {
          setError(data.detail || "Товар не найден");
        }
      } catch (err) {
        if (isMounted) setError("Ошибка загрузки товара");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (productId) {
      fetchProduct();
    }

    return () => {
      isMounted = false;
    };
  }, [API_URL, productId]);

  const isProductArray = Array.isArray(product);
  const id = isProductArray ? product[0] : product?.id;
  const title = isProductArray ? product[1] : product?.title;
  const price = isProductArray ? product[2] : product?.price;
  const description = isProductArray ? product[3] : product?.description;
  const imageUrl = isProductArray
    ? product[4]
    : product?.image_url || product?.imageUrl;
  const fullDescription = isProductArray
    ? product[5]
    : product?.full_description || product?.fullDescription;

  const finalImageUrl = imageUrl || "/placeholder.png";

  const isInCart = id
    ? cartItems.some((item) => String(item.id) === String(id))
    : false;

  async function handleDeleteProduct(targetId) {
    if (
      !targetId ||
      !window.confirm("Вы уверены, что хотите навсегда удалить этот товар?")
    )
      return;
    try {
      const response = await fetch(`${API_URL}/products/${targetId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        navigate(-1);
      } else {
        const errorData = await response.json();
        alert(errorData.detail || "Не удалось удалить товар");
      }
    } catch (err) {
      console.error(err);
      alert("Произошла ошибка при удалении");
    }
  }

  const handleAddToCart = (itemData) => {
    if (isInCart) return;

    setIsJustAdded(true);
    addToCart(itemData);

    setTimeout(() => {
      setIsJustAdded(false);
    }, 800);
  };

  const handleGoToDrive = () => {
    navigate("/how-to-drive");
  };

  if (loading) {
    return (
      <div
        style={{ ...styles.container, textAlign: "center", padding: "40px" }}
      >
        <h2>Загрузка товара...</h2>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={styles.container}>
        <div style={styles.backBtn} onClick={() => navigate(-1)}>
          ← Назад к списку
        </div>
        <div style={{ color: "#ef4444", fontSize: "18px", fontWeight: "600" }}>
          ⚠️ {error || "Товар не найден или передан в неверном формате"}
        </div>
      </div>
    );
  }

  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  const formattedHtml = fullDescription ? marked.parse(fullDescription) : "";

  let currentBtnStyle = { ...styles.btn };
  if (isInCart) {
    currentBtnStyle = { ...styles.btn, ...styles.btnDisabled };
  } else if (isJustAdded) {
    currentBtnStyle = { ...styles.btn, ...styles.btnSuccessPulse };
  }

  const buttonContainerStyle = {
    marginTop: "30px",
    display: "flex",
    gap: "12px",
    flexDirection: isMobile ? "column" : "row",
    alignItems: isMobile ? "stretch" : "center",
    flexWrap: "wrap",
  };

  // каждая кнопка занимает всю ширину на мобильных, иначе авто
  const singleButtonStyle = {
    width: isMobile ? "100%" : "auto",
    flex: isMobile ? "1 1 100%" : "0 1 auto",
  };

  return (
    <div style={styles.container}>
      <div
        style={styles.backBtn}
        onClick={() => navigate(-1)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow =
            "0 6px 20px rgba(124, 58, 237, 0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow =
            "0 4px 14px rgba(124, 58, 237, 0.3)";
        }}
      >
        ← Назад к списку
      </div>

      <div style={styles.imageContainer}>
        <img
          src={finalImageUrl}
          alt={title || "Товар"}
          style={styles.image}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/placeholder.png";
          }}
        />
      </div>

      <h1 style={styles.title}>{title || "Без названия"}</h1>

      <div style={styles.price}>
        {price != null
          ? Number(price).toLocaleString("ru-RU")
          : "Цена не указана"}{" "}
        ₽
      </div>

      <div style={styles.description}>{description || ""}</div>

      {fullDescription && (
        <div style={styles.fullDescription}>
          <h3>Подробное описание</h3>
          <div dangerouslySetInnerHTML={{ __html: formattedHtml }} />
        </div>
      )}

      <div style={buttonContainerStyle}>
        <button
          style={{ ...styles.btn, ...singleButtonStyle }}
          onClick={handleGoToDrive}
        >
          Купить
        </button>

        {token && (
          <>
            <button
              style={{ ...currentBtnStyle, ...singleButtonStyle }}
              disabled={isInCart || isJustAdded}
              onClick={() => handleAddToCart({ id, title, price, imageUrl })}
            >
              {isInCart
                ? "В корзине"
                : isJustAdded
                  ? "Добавлено!"
                  : "В корзину"}
            </button>

            <button
              style={{ ...styles.btnDelete, ...singleButtonStyle }}
              onClick={() => handleDeleteProduct(id)}
            >
              Удалить товар
            </button>
          </>
        )}
      </div>
    </div>
  );
}
