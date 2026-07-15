export default function CartPage({ cart, clearCart }) {
  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

  const styles = {
    card: {
      backgroundColor: "#fff",
      padding: "30px",
      borderRadius: "16px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
      maxWidth: "600px",
      margin: "50px auto",
      fontFamily: "sans-serif",
    },
    item: {
      display: "flex",
      justifyContent: "space-between",
      padding: "12px 0",
      borderBottom: "1px solid #eee",
    },
    totalBlock: {
      marginTop: "25px",
      paddingTop: "15px",
      borderTop: "2px solid #1a1f36",
      display: "flex",
      justifyContent: "space-between",
      fontSize: "18px",
      fontWeight: "bold",
    },
    btn: {
      padding: "10px 20px",
      color: "#fff",
      backgroundColor: "#dc3545",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      marginTop: "20px",
      width: "100%",
      fontWeight: "600",
    },
  };

  return (
    <div style={styles.card}>
      <h2>Ваша корзина 🛒</h2>
      {cart.length === 0 ? (
        <p style={{ color: "#697386", fontStyle: "italic" }}>
          В корзине пока пусто. Добавьте курсы из каталога!
        </p>
      ) : (
        <div>
          {cart.map((item, index) => (
            <div key={index} style={styles.item}>
              <span style={{ fontWeight: "500" }}>{item.title}</span>
              <span style={{ color: "#28a745", fontWeight: "600" }}>
                {item.price.toLocaleString("ru-RU")} ₽
              </span>
            </div>
          ))}

          <div style={styles.totalBlock}>
            <span>Итоговая стоимость:</span>
            <span style={{ color: "#28a745" }}>
              {totalPrice.toLocaleString("ru-RU")} ₽
            </span>
          </div>

          <button style={styles.btn} onClick={clearCart}>
            🗑️ Очистить корзину
          </button>
        </div>
      )}
    </div>
  );
}
