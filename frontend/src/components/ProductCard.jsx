import { useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getFinalPrice, formatPrice } from "../utils/price";
import styles from "./ProductCard.module.css";

export default function ProductCard({
  product,
  isInCart,
  onAddToCart,
  userRole,
  token,
  onDelete,
}) {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const images = getProductImages(product);
  const discount = product.discount || 0;
  const finalPrice = getFinalPrice(product.price, discount);

  function getProductImages(p) {
    const fromArray = Array.isArray(p.image_urls)
      ? p.image_urls.filter(Boolean)
      : [];
    if (fromArray.length > 0) return fromArray;
    if (p.image_url) return [p.image_url];
    return ["/placeholder.png"];
  }

  const handleMouseMove = useCallback(
    (e) => {
      if (!cardRef.current || images.length <= 1) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = x / rect.width;

      // Разбиваем карточку на количество сегментов = количество изображений
      const segmentSize = 1 / images.length;
      let newIndex = Math.floor(ratio / segmentSize);
      if (newIndex >= images.length) newIndex = images.length - 1;
      if (newIndex < 0) newIndex = 0;

      if (newIndex !== imageIndex) {
        setImageIndex(newIndex);
      }
    },
    [images.length, imageIndex]
  );

  const handleMouseEnter = useCallback(() => {
    setHovered(true);
    setImageIndex(0);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    setImageIndex(0);
  }, []);

  return (
    <div
      ref={cardRef}
      className={styles.card}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={hovered ? handleMouseMove : undefined}
      onClick={() => navigate(`/products/${product.id}`)}
    >
      {discount > 0 && <span className={styles.badge}>-{discount}%</span>}

      <div className={styles.imgContainer}>
        <img
          src={images[imageIndex] || "/placeholder.png"}
          alt={product.title}
          className={styles.img}
          loading="lazy"
        />
        {images.length > 1 && hovered && (
          <div className={styles.imageDots}>
            {images.map((_, i) => (
              <span
                key={i}
                className={`${styles.dot} ${i === imageIndex ? styles.dotActive : ""}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className={styles.content}>
        <h4 className={styles.title}>{product.title}</h4>
        <p className={styles.desc}>{product.description}</p>

        <div className={styles.price}>
          {discount > 0 && (
            <span className={styles.oldPrice}>
              {formatPrice(product.price)} ₽
            </span>
          )}
          {formatPrice(finalPrice)} ₽
        </div>

        <button
          className={`${styles.buyBtn} ${isInCart ? styles.inCart : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            if (!isInCart) onAddToCart(product);
          }}
          disabled={isInCart}
        >
          {isInCart ? "✓ В корзине" : "🛒 В корзину"}
        </button>

        {token && userRole === "admin" && (
          <button
            className={styles.deleteBtn}
            onClick={(e) => {
              e.stopPropagation();
              if (onDelete) onDelete(product.id);
            }}
          >
            🗑️ Удалить
          </button>
        )}
      </div>
    </div>
  );
}