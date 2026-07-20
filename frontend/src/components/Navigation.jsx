import { Link } from "react-router-dom";
import styles from "./Navigation.module.css";
// Импортируем изображение. Убедитесь, что файл logo-no-bg.png лежит в папке src/assets/
import logoImg from "../assets/logo-no-bg.png";

export default function Navigation({
  token,
  userRole,
  cartCount,
  handleLogout,
}) {
  return (
    <nav className={styles.nav}>
      {/* Верхняя строка: логотип + контакты */}
      <div className={styles.topRow}>
        <div className={styles.brandBlock}>
          {/* Адаптивный логотип с функцией clamp */}
          <Link to="/" className={styles.logo}>
            <img
              src={logoImg}
              alt="ООО ФИРМА ОБУВЬТОРГ"
              style={{
                display: "block",
                width: "clamp(100px, 20vw, 180px)",
                height: "auto",
                maxHeight: "clamp(100px, 12vh, 140px)",
                objectFit: "contain",
              }}
            />
          </Link>
          <div className={styles.contacts}>
            {/* Изящный, уменьшенный призыв к действию */}
            <span
              style={{
                fontSize: "0.75rem", // Уменьшенный размер
                color: "#777777", // Мягкий серый цвет
                letterSpacing: "0.05em", // Элегантный разряд между буквами
                fontVariant: "small-caps", // Стильные мини-капители
                fontWeight: "500", // Небольшая плотность
                marginBottom: "1px",
              }}
            >
              для заказа и консультации:
            </span>

            <a href="tel:+74852214755" className={styles.phone}>
              📞 +7 (4852) 21-47-55
            </a>

            <span>
              150049, Ярославская область, г. Ярославль, ул. Вспольинское Поле,
              д. 18
            </span>

            <span
              style={{ fontSize: "0.85rem", color: "#888", marginTop: "2px" }}
            >
              🕒 Вт – пт: 09:00–17:00, сб 09:00–16:00 | Вс.-Пн. выходной
            </span>
          </div>
        </div>
      </div>

      {/* Нижняя строка: ссылки + кнопка */}
      <div className={styles.bottomRow}>
        <div className={styles.links}>
          <Link to="/" className={styles.activeLink}>
            Каталог
          </Link>
          <Link to="/notes" className={styles.newsLink}>
            📄 Новости
          </Link>
          {token && (
            <Link to="/profile" className={styles.link}>
              Профиль
            </Link>
          )}
          {token && (
            <Link to="/cart" className={styles.link}>
              Корзина <span className={styles.badge}>{cartCount}</span>
            </Link>
          )}
          {token && userRole === "admin" && (
            <>
              <Link
                to="/admin"
                className={`${styles.link} ${styles.adminLink}`}
              >
                🛠️ Админка
              </Link>
              <Link
                to="/admin/notes"
                className={`${styles.link} ${styles.adminLink}`}
              >
                📄 Заметки
              </Link>
            </>
          )}
        </div>

        <div className={styles.rightBlock}>
          {token ? (
            <button className={styles.btnOut} onClick={handleLogout}>
              Выйти
            </button>
          ) : (
            <Link to="/login" className={styles.btnIn}>
              Войти
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
