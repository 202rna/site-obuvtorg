import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Navigation.module.css";
import logoImg from "../assets/logo-no-bg.png";

export default function Navigation({
  token,
  userRole,
  cartCount,
  handleLogout,
  localCartCount = 0,
  onChatToggle,
  onChatClose,
}) {
  const location = useLocation();
  const [hoveredLink, setHoveredLink] = useState(null);

  // Определяем активный пункт
  const activeLink = (() => {
    if (location.pathname === "/") return "catalog";
    if (location.pathname === "/discount") return "discount";
    if (location.pathname === "/notes") return "news";
    if (location.pathname === "/how-to-drive") return "howtodrive";
    if (location.pathname === "/shop") return "shop";
    return null;
  })();

  const navLinks = [
    { id: "catalog", label: "Каталог", path: "/" },
    { id: "discount", label: "Скидки", path: "/discount", isRed: true },
    { id: "news", label: "Новости", path: "/notes", subLabel: "магазина" },
    { id: "howtodrive", label: "Как проехать", path: "/how-to-drive" },
  ];

  const totalCartCount = (cartCount || 0) + (localCartCount || 0);

  return (
    <>
      <nav className={styles.nav}>
        {/* Верхняя строка: логотип + контакты + мобильные действия */}
        <div className={styles.topRow}>
          <div className={styles.brandBlock}>
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
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "#777777",
                  letterSpacing: "0.05em",
                  fontVariant: "small-caps",
                  fontWeight: "500",
                  marginBottom: "1px",
                }}
              >
                для консультации:
              </span>

              <a href="tel:+74852214755" className={styles.phone}>
                📞 +7 (4852) 21-47-55
              </a>

              <span>
                г. Ярославль, ул.{"\u00A0"}Вспольинское{"\u00A0"}Поле, д.
                {"\u00A0"}18
              </span>

              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "4px 8px", // 4px между строками при переносе, 8px между блоками в одну строку
                }}
              >
                {/* Блок Вт. - Пт. */}
                <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
                  🕒 Вт. – Пт. 09:00–17:00,
                </span>

                {/* Блок Сб. */}
                <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
                  Cб. 09:00–16:00
                </span>

                {/* Блок Вс. - Пн. */}
                <span
                  style={{
                    display: "inline-block",
                    whiteSpace: "nowrap",
                    color: "#3f3e3e",
                  }}
                >
                  | Вс. – Пн. выходной
                </span>
              </div>
            </div>
          </div>

          {/* Мобильные действия (корзина + войти) — рядом с логотипом */}
          <div className={styles.mobileTopActions}>
            <Link to={token ? "/cart" : "/login"} className={styles.cartBtn}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {totalCartCount > 0 && (
                <span className={styles.cartBadge}>{totalCartCount}</span>
              )}
            </Link>
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

        {/* Нижняя строка: навигационные ссылки + правая панель */}
        <div className={styles.bottomRow}>
          <div className={styles.navLinks}>
            {navLinks.map((link) => {
              const isActive = activeLink === link.id;
              const isHovered = hoveredLink === link.id;

              return (
                <Link
                  key={link.id}
                  to={link.path}
                  className={styles.navLink}
                  onClick={onChatClose}
                  style={{
                    opacity: hoveredLink !== null && !isHovered ? 0.4 : 1,
                    color:
                      isHovered || isActive
                        ? "#000000"
                        : link.isRed
                          ? "#dc2626"
                          : "#4b5563",
                    transition: "opacity 0.25s ease, color 0.25s ease",
                  }}
                  onMouseEnter={() => setHoveredLink(link.id)}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  <span style={{ fontWeight: 700 }}>{link.label}</span>
                  {link.subLabel && (
                    <span className={styles.navSublabel}>{link.subLabel}</span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className={styles.rightBlock}>
            {/* Кнопка AI-чата - desktop: overlay toggle */}
            <button
              className={styles.chatToggleBtn}
              onClick={() => {
                onChatToggle();
                // Если чат закрывается — не делаем доп. действий
              }}
              aria-label="Открыть чат с консультантом"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>AI Подбор обуви</span>
            </button>

            {/* Иконка корзины — всегда видна (и для авторизованных, и для нет) */}
            <Link to={token ? "/cart" : "/login"} className={styles.cartBtn}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {totalCartCount > 0 && (
                <span className={styles.cartBadge}>{totalCartCount}</span>
              )}
            </Link>

            {/* Войти / Выйти */}
            {token ? (
              <button className={styles.btnOut} onClick={handleLogout}>
                Выйти
              </button>
            ) : (
              <Link to="/login" className={styles.btnIn}>
                Войти
              </Link>
            )}

            {token && userRole === "admin" && (
              <>
                <Link to="/admin" className={styles.adminBtn}>
                  Админ
                </Link>
                <Link to="/admin/notes" className={styles.adminBtn}>
                  Публикации
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Мобильная панель: AI-подборщик на всю ширину */}
      <div className={styles.mobileChatBar}>
        <button className={styles.mobileChatBtn} onClick={onChatToggle}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          AI Подбор обуви по описанию
        </button>
      </div>
    </>
  );
}
