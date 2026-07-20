import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { marked } from "marked";

export default function NoteDetailPage({ API_URL }) {
  const { id } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Состояние для адаптивной мобильной верстки
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Проверка ширины экрана для адаптивности
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };

    handleResize(); // Инициализация при старте
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Динамические стили с учетом мобильных экранов
  const styles = {
    container: {
      maxWidth: "800px",
      margin: isMobile ? "20px auto" : "40px auto",
      padding: isMobile ? "0 16px" : "0 24px",
      boxSizing: "border-box",
      fontFamily: "system-ui, -apple-system, sans-serif",
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
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    card: {
      backgroundColor: "#fff",
      padding: isMobile ? "20px" : "40px",
      borderRadius: "20px",
      boxShadow: "0 4px 30px rgba(0,0,0,0.02)",
      border: "1px solid #f1f5f9",
    },
    title: {
      fontSize: isMobile ? "24px" : "32px", // Уменьшили шрифт на мобильном
      fontWeight: "800",
      color: "#0f172a",
      margin: "0 0 16px 0",
      letterSpacing: "normal", // Убрали наложение букв друг на друга
      lineHeight: "1.3", // Добавили межстрочный интервал, чтобы строки не слипались
    },
    desc: {
      fontSize: isMobile ? "15px" : "16px",
      color: "#334155",
      lineHeight: "1.7",
      whiteSpace: "pre-wrap",
      marginBottom: "32px",
    },
    fileBox: {
      backgroundColor: "#f8fafc",
      padding: "20px",
      borderRadius: "12px",
      border: "1px solid #e2e8f0",
      textAlign: "center",
    },
    img: {
      maxWidth: "100%",
      maxHeight: "500px",
      borderRadius: "8px",
      marginTop: "12px",
      objectFit: "contain",
    },
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchNote() {
      try {
        const response = await fetch(`${API_URL}/note/${id}`);
        const data = await response.json();

        if (!isMounted) return;

        if (response.ok) {
          console.log("ДАННЫЕ ЗАМЕТКИ:", data);
          setNote(data);
        } else {
          setError(data.detail || "Заметка не найдена");
        }
      } catch {
        if (isMounted) setError("Ошибка подключения к бэкенду");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchNote();
    return () => {
      isMounted = false;
    };
  }, [id, API_URL]);

  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        Загрузка заметки...
      </div>
    );
  if (error)
    return (
      <div style={{ textAlign: "center", marginTop: "50px", color: "#ef4444" }}>
        {error}
      </div>
    );
  if (!note)
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        Заметка пуста
      </div>
    );

  let title = "";
  let description = "";
  let rawImageUrl = "";

  if (Array.isArray(note)) {
    title = note[1];
    description = note[2];
    rawImageUrl = note[3];
  } else {
    title = note.title;
    description = note.description || note.desc;
    rawImageUrl = note.image_url || note.image;
  }

  let finalImageUrl = "";
  if (rawImageUrl) {
    if (
      rawImageUrl.startsWith("http://") ||
      rawImageUrl.startsWith("https://")
    ) {
      finalImageUrl = rawImageUrl;
    } else {
      const baseHost = API_URL.replace(/\/api$/, "");
      finalImageUrl = `${baseHost}${rawImageUrl.startsWith("/") ? "" : "/"}${rawImageUrl}`;
    }
  }

  marked.setOptions({
    breaks: true,
    gfm: true,
  });
  const formattedHtml = description ? marked.parse(description) : "";

  return (
    <div style={styles.container}>
      <div
        style={styles.backBtn}
        onClick={() => navigate("/notes")}
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
        ← К списку заметок
      </div>

      <div style={styles.card}>
        <h1 style={styles.title}>{title || "Без названия"}</h1>

        <div
          style={styles.desc}
          dangerouslySetInnerHTML={{ __html: formattedHtml }}
        />

        {finalImageUrl && (
          <div style={styles.fileBox}>
            <img
              src={finalImageUrl}
              alt="Вложенный файл"
              style={styles.img}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/placeholder.png";
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
