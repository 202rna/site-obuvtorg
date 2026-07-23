// UserNotesPage.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const styles = {
  container: {
    width: "100%",
    maxWidth: "100%",
    padding: "0 24px 40px 24px", // убрали min-height и background
    boxSizing: "border-box",
    fontFamily: "system-ui, -apple-system, sans-serif",
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
    transition: "transform 0.2s ease",
  },
  title: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 20px 0",
    lineHeight: "1.4",
  },
  btn: {
    display: "block",
    textAlign: "center",
    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
    color: "#fff",
    padding: "12px",
    borderRadius: "10px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "600",
    boxShadow: "0 4px 12px rgba(124, 58, 237, 0.15)",
    transition: "all 0.2s ease",
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
    transition: "all 0.2s ease",
  },
};

export default function UserNotesPage({ API_URL }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const NOTES_LIMIT = 30;

  async function loadMoreNotes() {
    if (loading || !hasMore) return;
    setLoading(true);
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

  return (
    <div style={styles.container}>
      {/* Заголовок можно раскомментировать при необходимости */}
      {/* <h2 style={{ color: "#0f172a", fontSize: "28px", fontWeight: "800", margin: "24px 0 0 0" }}>
        📄 Новостная лента
      </h2> */}

      <div style={styles.grid}>
        {notes.map((n) => (
          <div key={n.id} style={styles.card}>
            <h3 style={styles.title}>{n.title}</h3>
            <Link to={`/note/${n.id}`} style={styles.btn}>
              Открыть полностью →
            </Link>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", paddingBottom: "60px" }}>
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
          ></p>
        )}
      </div>
    </div>
  );
}
