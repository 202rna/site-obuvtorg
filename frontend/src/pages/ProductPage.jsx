import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { marked } from "marked";
import { getFinalPrice, formatPrice } from "../utils/price";

const styles = {
  container: {
    maxWidth: "800px",
    margin: "20px auto",
    padding: "0 16px 80px 16px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    boxSizing: "border-box",
    minHeight: "100vh",
  },
  imageContainer: {
    width: "100%",
    height: "auto",
    aspectRatio: "4 / 3",
    maxHeight: "400px",
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
    position: "relative",
  },
  image: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
  },
  title: {
    fontSize: "28px",
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
  oldPrice: {
    fontSize: "16px",
    fontWeight: "500",
    color: "#94a3b8",
    textDecoration: "line-through",
    marginRight: "10px",
  },
  badge: {
    display: "inline-block",
    backgroundColor: "#dc2626",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "700",
    padding: "4px 10px",
    borderRadius: "8px",
    marginBottom: "12px",
  },
  description: {
    fontSize: "16px",
    lineHeight: "1.7",
    color: "#475569",
    marginBottom: "20px",
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "16px",
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "999px",
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: "600",
    backgroundColor: "#eef2ff",
    color: "#3730a3",
  },
  sizeBox: {
    minWidth: "34px",
    height: "34px",
    borderRadius: "10px",
    backgroundColor: "#4f46e5",
    color: "#fff",
    fontWeight: "700",
    fontSize: "14px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 8px",
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
  },
  btnEdit: {
    padding: "14px 36px",
    fontSize: "15px",
    fontWeight: "600",
    color: "#fff",
    backgroundColor: "#4f46e5",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    textAlign: "center",
    boxSizing: "border-box",
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
  editCard: {
    marginTop: "24px",
    padding: "20px",
    backgroundColor: "#fff",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
  },
  input: {
    width: "100%",
    padding: "12px",
    fontSize: "15px",
    borderRadius: "8px",
    border: "1px solid #d9dce1",
    boxSizing: "border-box",
    marginBottom: "12px",
    outline: "none",
    fontFamily: "inherit",
  },
  textarea: {
    width: "100%",
    padding: "12px",
    fontSize: "15px",
    borderRadius: "8px",
    border: "1px solid #d9dce1",
    boxSizing: "border-box",
    marginBottom: "12px",
    outline: "none",
    fontFamily: "inherit",
    minHeight: "100px",
    resize: "vertical",
  },
  label: {
    display: "block",
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "6px",
    fontWeight: "600",
  },
};

export default function ProductPage({
  API_URL,
  addToCart = () => {},
  token,
  cart = [],
  userRole = "user",
}) {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isJustAdded, setIsJustAdded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [editPrice, setEditPrice] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editFullDescription, setEditFullDescription] = useState("");
  const [editDiscount, setEditDiscount] = useState("0");
  const [editCategories, setEditCategories] = useState("");
  const [editSizes, setEditSizes] = useState("");
  const [editMsg, setEditMsg] = useState({ text: "", isError: false });
  const [saving, setSaving] = useState(false);
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
  const isAdmin = token && userRole === "admin";

  useEffect(() => {
    let isMounted = true;

    async function fetchProduct() {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/products/${productId}`);
        const data = await response.json();

        if (!isMounted) return;

        if (response.ok) {
          setProduct(data);
          setImageIndex(0);
          setEditPrice(String(data.price ?? ""));
          setEditDescription(data.description || "");
          setEditFullDescription(data.full_description || "");
          setEditDiscount(String(data.discount ?? 0));
          setEditCategories(
            (Array.isArray(data.categories) ? data.categories : []).join(", "),
          );
          setEditSizes(
            (Array.isArray(data.sizes) ? data.sizes : []).join(", "),
          );
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

  const id = product?.id;
  const title = product?.title;
  const price = product?.price;
  const description = product?.description;
  const imageUrl = product?.image_url || product?.imageUrl;
  const fullDescription = product?.full_description || product?.fullDescription;
  const discount = product?.discount || 0;
  const finalPrice = getFinalPrice(price, discount);
  const categories = Array.isArray(product?.categories)
    ? product.categories
    : [];
  const sizes = Array.isArray(product?.sizes) ? product.sizes : [];
  const imageUrls =
    Array.isArray(product?.image_urls) && product.image_urls.length > 0
      ? product.image_urls
      : imageUrl
        ? [imageUrl]
        : ["/placeholder.png"];
  const safeImageIndex = Math.min(
    imageIndex,
    Math.max(imageUrls.length - 1, 0),
  );
  const finalImageUrl = imageUrls[safeImageIndex] || "/placeholder.png";

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

  async function handleSaveEdit(e) {
    e.preventDefault();
    setSaving(true);
    setEditMsg({ text: "", isError: false });
    try {
      const parsedCategories = editCategories
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      const parsedSizes = editSizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number)
        .filter((n) => Number.isFinite(n));

      const response = await fetch(`${API_URL}/products/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price: Number(editPrice),
          description: editDescription,
          full_description: editFullDescription,
          discount: Number(editDiscount),
          categories: parsedCategories,
          sizes: parsedSizes,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setProduct((prev) => ({
          ...prev,
          price: Number(editPrice),
          description: editDescription,
          full_description: editFullDescription,
          discount: Number(editDiscount),
          categories: parsedCategories,
          sizes: parsedSizes,
        }));
        setEditMsg({ text: "Товар обновлён", isError: false });
        setEditing(false);
      } else {
        setEditMsg({
          text: data.detail || "Не удалось обновить товар",
          isError: true,
        });
      }
    } catch {
      setEditMsg({ text: "Ошибка сети", isError: true });
    } finally {
      setSaving(false);
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

  const showPrevImage = () => {
    setImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
  };

  const showNextImage = () => {
    setImageIndex((prev) => (prev + 1) % imageUrls.length);
  };

  if (loading) {
    return (
      <div
        style={{
          ...styles.container,
          textAlign: "center",
          padding: "40px 16px",
        }}
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
    marginBottom: "40px",
    display: "flex",
    gap: "12px",
    flexDirection: isMobile ? "column" : "row",
    alignItems: isMobile ? "stretch" : "center",
    flexWrap: "wrap",
  };

  const singleButtonStyle = {
    width: isMobile ? "100%" : "auto",
    flex: isMobile ? "1 1 100%" : "0 1 auto",
  };

  const imageContainerStyle = {
    ...styles.imageContainer,
    maxHeight: isMobile ? "250px" : "400px",
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

      <div style={imageContainerStyle}>
        {imageUrls.length > 1 && (
          <>
            <button
              onClick={showPrevImage}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                border: "none",
                backgroundColor: "rgba(15, 23, 42, 0.55)",
                color: "#fff",
                cursor: "pointer",
                fontWeight: "700",
                zIndex: 2,
              }}
            >
              ‹
            </button>
            <button
              onClick={showNextImage}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                border: "none",
                backgroundColor: "rgba(15, 23, 42, 0.55)",
                color: "#fff",
                cursor: "pointer",
                fontWeight: "700",
                zIndex: 2,
              }}
            >
              ›
            </button>
            <span
              style={{
                position: "absolute",
                right: "14px",
                bottom: "12px",
                backgroundColor: "rgba(15, 23, 42, 0.65)",
                color: "#fff",
                fontSize: "12px",
                fontWeight: "600",
                borderRadius: "8px",
                padding: "2px 8px",
                zIndex: 2,
              }}
            >
              {safeImageIndex + 1}/{imageUrls.length}
            </span>
          </>
        )}
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

      {discount > 0 && <span style={styles.badge}>-{discount}%</span>}

      <div style={styles.price}>
        {discount > 0 && price != null && (
          <span style={styles.oldPrice}>{formatPrice(price)} ₽</span>
        )}
        {price != null ? formatPrice(finalPrice) : "Цена не указана"} ₽
      </div>

      <div style={styles.description}>{description || ""}</div>

      {(categories.length > 0 || sizes.length > 0) && (
        <div style={styles.metaRow}>
          {categories.map((cat) => (
            <span key={cat} style={styles.chip}>
              {cat}
            </span>
          ))}
          {sizes.map((size) => (
            <span key={`size-${size}`} style={styles.sizeBox}>
              {size}
            </span>
          ))}
        </div>
      )}

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
          <button
            style={{ ...currentBtnStyle, ...singleButtonStyle }}
            disabled={isInCart || isJustAdded}
            onClick={() =>
              handleAddToCart({
                id,
                title,
                price,
                discount,
                imageUrl,
              })
            }
          >
            {isInCart ? "В корзине" : isJustAdded ? "Добавлено!" : "В корзину"}
          </button>
        )}

        {isAdmin && (
          <>
            <button
              style={{ ...styles.btnEdit, ...singleButtonStyle }}
              onClick={() => {
                setEditing((v) => !v);
                setEditMsg({ text: "", isError: false });
              }}
            >
              {editing ? "Отмена" : "Редактировать"}
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

      {isAdmin && editing && (
        <form style={styles.editCard} onSubmit={handleSaveEdit}>
          <h3 style={{ marginTop: 0, marginBottom: "16px" }}>
            Редактирование товара
          </h3>

          {editMsg.text && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                marginBottom: "12px",
                backgroundColor: editMsg.isError ? "#fef3f2" : "#edfcf2",
                color: editMsg.isError ? "#b42318" : "#0ea341",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              {editMsg.text}
            </div>
          )}

          <label style={styles.label}>Цена (₽)</label>
          <input
            type="number"
            style={styles.input}
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
            min="0"
            step="0.01"
            required
          />

          <label style={styles.label}>Скидка (%)</label>
          <input
            type="number"
            style={styles.input}
            value={editDiscount}
            onChange={(e) => setEditDiscount(e.target.value)}
            min="0"
            max="100"
            required
          />

          <label style={styles.label}>Краткое описание</label>
          <textarea
            style={styles.textarea}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            required
          />

          <label style={styles.label}>Подробное описание</label>
          <textarea
            style={{ ...styles.textarea, minHeight: "150px" }}
            value={editFullDescription}
            onChange={(e) => setEditFullDescription(e.target.value)}
          />

          <label style={styles.label}>Категории (через запятую)</label>
          <input
            type="text"
            style={styles.input}
            value={editCategories}
            onChange={(e) => setEditCategories(e.target.value)}
            placeholder="Кроссовки, Спорт"
          />

          <label style={styles.label}>Размеры (через запятую)</label>
          <input
            type="text"
            style={styles.input}
            value={editSizes}
            onChange={(e) => setEditSizes(e.target.value)}
            placeholder="36, 37, 38"
          />

          <button
            type="submit"
            style={{ ...styles.btnEdit, width: "100%" }}
            disabled={saving}
          >
            {saving ? "Сохранение..." : "Сохранить изменения"}
          </button>
        </form>
      )}
    </div>
  );
}
