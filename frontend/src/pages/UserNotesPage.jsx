import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function UserNotesPage({ API_URL }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const NOTES_LIMIT = 30;

  // Функция дозагрузки следующих страниц
  async function loadMoreNotes() {
    if (loading || !hasMore) return;
    setLoading(true);
    // Вытаскиваем ID последней загруженной заметки
    const lastId = notes.length > 0 ? notes[notes.length - 1].id : "";
    try {
      const response = await fetch(
        `${API_URL}/notes?last_id=${lastId}&limit=${NOTES_LIMIT}`,
      );
      const newNotes = await response.json();
      if (response.ok) {
        setNotes((prev) => [...prev, ...newNotes]);
        if (newNotes.length < NOTES_LIMIT) setHasMore(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Самая первая загрузка при открытии страницы
  useEffect(() => {
    async function loadInitialNotes() {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/notes?limit=${NOTES_LIMIT}`);
        const initialNotes = await response.json();
        if (response.ok) {
          setNotes(initialNotes);
          if (initialNotes.length < NOTES_LIMIT) setHasMore(false);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialNotes();
  }, [API_URL]);

  const styles = {
    container: {
      width: "100%",
      maxWidth: "100%",
      padding: "0 24px",
      boxSizing: "border-box",
      fontFamily: "system-ui, sans-serif",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      gap: "24px",
      marginTop: "32px",
    },
    card: {
      backgroundColor: "#fff",
      borderRadius: "16px",
      padding: "24px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
      border: "1px solid #f1f5f9",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      transition: "transform 0.2s",
    },
    // Отображаем СТРОГО только title
    title: {
      fontSize: "18px",
      fontWeight: "700",
      color: "#0f172a",
      margin: "0 0 20px 0",
    },
    btn: {
      display: "block",
      textAlign: "center",
      backgroundColor: "#4f46e5",
      color: "#fff",
      padding: "12px",
      borderRadius: "10px",
      textDecoration: "none",
      fontSize: "14px",
      fontWeight: "600",
    },
    btnMore: {
      padding: "12px 32px",
      fontSize: "15px",
      fontWeight: "600",
      color: "#4f46e5",
      backgroundColor: "#eef2ff",
      border: "none",
      borderRadius: "10px",
      cursor: "pointer",
      marginTop: "40px",
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={{ color: "#0f172a", fontSize: "28px", fontWeight: "800" }}>
        📄 Полезные заметки и ноты
      </h2>

      <div style={styles.grid}>
        {notes.map((n) => (
          <div key={n.id} style={styles.card}>
            <h3 style={styles.title}>{n.title}</h3>
            {/* Кнопка ведет на детальный роут по ID */}
            <Link to={`/note/${n.id}`} style={styles.btn}>
              Открыть полностью →
            </Link>
          </div>
        ))}
      </div>

      {/* Пагинация кнопкой Показать еще */}
      <div style={{ textAlign: "center", marginBottom: "60px" }}>
        {hasMore ? (
          <button
            style={styles.btnMore}
            onClick={loadMoreNotes}
            disabled={loading}
          >
            {loading ? "Загрузка..." : "Показать еще заметки"}
          </button>
        ) : (
          <p
            style={{ color: "#64748b", fontStyle: "italic", marginTop: "40px" }}
          >
            Вы посмотрели все доступные заметки 🎉
          </p>
        )}
      </div>
    </div>
  );
}
