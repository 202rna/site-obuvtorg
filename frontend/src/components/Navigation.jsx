import { Link } from "react-router-dom";
import styles from "./Navigation.module.css";

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
          <Link to="/" className={styles.logo}>
            ООО ФИРМА "ОБУВЬТОРГ"
          </Link>
          <div className={styles.contacts}>
            <a href="tel:+79991234567" className={styles.phone}>
              +7 (999) 123-45-67
            </a>
            <span>
              150049, Ярославская область, г. Ярославль, ул. Вспольинское Поле,
              д. 18
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
