import { Link } from "react-router-dom";

export default function Navigation({
  token,
  userRole,
  cartCount,
  handleLogout,
}) {
  const styles = {
    nav: {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.85)",
      backdropFilter: "blur(12px)",

      width: "100%",
      padding: "16px 24px",

      borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
      marginBottom: "40px",
      gap: "16px",
      fontFamily: "system-ui, -apple-system, sans-serif",
      boxSizing: "border-box",
    },

    brandBlock: { display: "flex", alignItems: "center", gap: "12px" },
    logo: {
      fontWeight: "800",
      fontSize: "20px",
      color: "#4f46e5",
      textDecoration: "none",
      letterSpacing: "-0.5px",
    },

    contacts: {
      display: "flex",
      flexDirection: "column",
      fontSize: "12px",
      color: "#64748b",
      borderLeft: "1px solid #e2e8f0",
      paddingLeft: "12px",
    },
    phone: {
      fontWeight: "600",
      color: "#0f172a",
      textDecoration: "none",
      marginBottom: "2px",
    },

    links: {
      display: "flex",
      gap: "24px",
      alignItems: "center",
      flexWrap: "wrap",
    },
    link: {
      textDecoration: "none",
      color: "#4b5563",
      fontWeight: "500",
      fontSize: "15px",
    },
    activeLink: {
      textDecoration: "none",
      color: "#4f46e5",
      fontWeight: "600",
      fontSize: "15px",
    },

    rightBlock: { display: "flex", alignItems: "center", gap: "16px" },
    btnOut: {
      padding: "10px 20px",
      fontSize: "14px",
      fontWeight: "600",
      color: "#4f46e5",
      backgroundColor: "#f5f3ff",
      border: "none",
      borderRadius: "10px",
      cursor: "pointer",
      whiteSpace: "nowrap",
    },
    btnIn: {
      textDecoration: "none",
      backgroundColor: "#4f46e5",
      color: "#ffffff",
      padding: "10px 20px",
      borderRadius: "10px",
      fontSize: "14px",
      fontWeight: "600",
      display: "inline-block",
      whiteSpace: "nowrap",
    },
    badge: {
      backgroundColor: "#e0e7ff",
      color: "#4f46e5",
      padding: "2px 8px",
      borderRadius: "20px",
      fontSize: "12px",
      marginLeft: "6px",
      fontWeight: "600",
    },
  };

  return (
    <nav style={styles.nav}>
      {/* Логотип + Контакты */}
      <div style={styles.brandBlock}>
        <Link to="/" style={styles.logo}>
          ООО ФИРМА "ОБУВЬТОРГ"
        </Link>
        <div style={styles.contacts}>
          <a href="tel:+79991234567" style={styles.phone}>
            +7 (999) 123-45-67
          </a>
          <span>
            150049, Ярославская область, г. Ярославль, ул. Вспольинское Поле, д.
            18
          </span>
        </div>
      </div>

      {/* Навигационные ссылки */}
      <div style={styles.links}>
        <Link to="/" style={styles.activeLink}>
          Каталог
        </Link>
        {token && (
          <Link to="/profile" style={styles.link}>
            Профиль
          </Link>
        )}
        {token && (
          <Link to="/cart" style={styles.link}>
            Корзина <span style={styles.badge}>{cartCount}</span>
          </Link>
        )}
        {/* --- ПОЛНОСТЬЮ ИСПРАВЛЕННЫЙ И ЗАКРЫТЫЙ БЛОК ДЛЯ АДМИНА --- */}
        {token && userRole === "admin" && (
          <>
            <Link
              to="/admin"
              style={{
                ...styles.link,
                color: "#ef4444",
                borderLeft: "1px solid #e5e7eb",
                paddingLeft: "24px",
                fontWeight: "600",
              }}
            >
              🛠️ Админка
            </Link>

            <Link
              to="/admin/notes"
              style={{
                ...styles.link,
                color: "#ef4444",
                fontWeight: "600",
              }}
            >
              📄 Заметки
            </Link>
          </>
        )}
      </div>

      {/* Кнопка Входа / Выхода */}
      <div style={styles.rightBlock}>
        {token ? (
          <button style={styles.btnOut} onClick={handleLogout}>
            Выйти
          </button>
        ) : (
          <Link to="/login" style={styles.btnIn}>
            Войти
          </Link>
        )}
      </div>
    </nav>
  );
}
