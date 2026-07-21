import { useNavigate } from "react-router-dom";

const styles = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    boxSizing: "border-box",
  },
  title: {
    fontSize: "26px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "16px",
    lineHeight: "1.3",
  },
  section: {
    marginBottom: "24px",
    lineHeight: "1.6",
    color: "#334155",
  },
  infoBlock: {
    backgroundColor: "#f8fafc",
    borderLeft: "4px solid #10b981",
    padding: "16px",
    borderRadius: "0 12px 12px 0",
    marginBottom: "24px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
  },
  subtitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "8px",
  },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    marginBottom: "24px",
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#ffffff",
    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
    border: "none",
    borderRadius: "30px",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(124, 58, 237, 0.3)",
  },
  mapContainer: {
    width: "100%",
    height: "auto",
    aspectRatio: "16 / 9",
    maxHeight: "450px",
    borderRadius: "16px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
    marginBottom: "24px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
    backgroundColor: "#f1f5f9",
  },
};

export default function HowToDrivePage() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <button style={styles.backBtn} onClick={() => navigate(-1)}>
        ← Назад
      </button>

      <h1 style={styles.title}>
        ООО Фирма «Обувьторг» — Схема проезда / Покупка товара
      </h1>

      {/* Новый информационный блок о примерке, качестве и наличии */}
      <div style={styles.infoBlock}>
        <h3 style={{ ...styles.subtitle, color: "#0f172a", marginTop: 0 }}>
          🛍️ Покупка и примерка в магазине
        </h3>
        <p style={{ margin: "0 0 8px 0", color: "#475569" }}>
          В нашем магазине вы можете лично примерить любую понравившуюся модель
          перед покупкой. Мы гарантируем высокое качество всей представленной
          обуви, её надежность и соответствие стандартам.
        </p>
        <p style={{ margin: 0, fontWeight: "600", color: "#0f172a" }}>
          ⚠️ Перед визитом, пожалуйста, обязательно свяжитесь с нами по
          телефону, чтобы уточнить наличие нужного вам размера на складе.
        </p>
      </div>

      <div style={styles.section}>
        <p>
          <strong>📍 Наш адрес:</strong> 150049, Ярославская область, г.
          Ярославль, ул. Вспольинское Поле, д. 18
        </p>
        <p>
          <strong>🕒 Режим работы:</strong> Вт – пт: 09:00–17:00, сб 09:00–16:00
          | Вс.-Пн. выходной
        </p>
        <p>
          <strong>📞 Контактный телефон:</strong>{" "}
          <a
            href="tel:+74852214755"
            style={{ color: "#4f46e5", fontWeight: "600" }}
          >
            +7 (4852) 21-47-55
          </a>
        </p>
      </div>

      <div style={styles.mapContainer}>
        {/* ИСПРАВЛЕНО: Вставлен рабочий виджет Яндекс Карт, который открывает ООО Фирма "Обувьторг" */}
        <iframe
          src="https://yandex.ru/map-widget/v1/?um=constructor%3Ab4515a2533267ae08bc45c9f4012b546b2283852673e0335c5d35628d6256b7d&amp;source=constructor"
          width="100%"
          height="100%"
          frameBorder="0"
          allowFullScreen={true}
          title="Интерактивная карта проезда к ООО Фирма Обувьторг"
          style={{ position: "relative", display: "block", border: "none" }}
        />
      </div>

      <div style={styles.section}>
        <h2 style={styles.subtitle}>Ориентиры для водителей и пешеходов</h2>
        <p>
          Мы находимся внутри оптово-производственной базы на Вспольинском Поле.
        </p>
        <ul style={{ paddingLeft: "20px", marginTop: "8px" }}>
          <li style={{ marginBottom: "8px" }}>
            <strong>На личном транспорте:</strong> Удобнее всего заезжать со
            стороны Магистральной улицы. Едете прямо до вывески дома №18,
            заезжаете в ворота базы. Наш корпус находится в глубине территории,
            около него предусмотрена открытая парковка для клиентов.
          </li>
          <li>
            <strong>На общественном транспорте:</strong> Автобусы и маршрутки до
            остановки «Улица Магистральная» или «Вспольинское поле». Пеший путь
            от остановки через промзону займет около 8 минут спокойным шагом.
          </li>
        </ul>
      </div>
    </div>
  );
}
