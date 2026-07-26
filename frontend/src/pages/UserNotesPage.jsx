// UserNotesPage.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const styles = {
  container: {
    width: "100%",
    maxWidth: "100%",
    padding: "0 24px 40px 24px",
    boxSizing: "border-box",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  header: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#0f172a",
    margin: "24px 0 0 0",
    textAlign: "center",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
    marginTop: "28px",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
    border: "1px solid #f1f5f9",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    transition: "transform 0.25s ease, box-shadow 0.25s ease",
    cursor: "default",
    position: "relative",
    overflow: "hidden",
  },
  cardAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "4px",
    height: "100%",
    background: "linear-gradient(180deg, #4f46e5 0%, #7c3aed 100%)",
    borderRadius: "16px 0 0 16px",
  },
  cardBody: {
    paddingLeft: "8px",
  },
  title: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 16px 0",
    lineHeight: "1.4",
    display: "-webkit-box",
    WebkitLineClamp: "3",
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  meta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingTop: "12px",
    borderTop: "1px solid #f1f5f9",
  },
  date: {
    fontSize: "12px",
    color: "#010914",
  },
  btn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
    color: "#fff",
    padding: "8px 18px",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "600",
    boxShadow: "0 3px 10px rgba(124, 58, 237, 0.15)",
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

  function formatDate(dateStr) {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "";
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        {notes.map((n) => (
          <div
            key={n.id}
            style={styles.card}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)";
            }}
          >
            <div style={styles.cardAccent} />
            <div style={styles.cardBody}>
              <h3 style={styles.title}>{n.title}</h3>
              <div style={styles.meta}>
                <span style={styles.date}>
                  {formatDate(n.created_at || n.date || "")}
                </span>
                <Link to={`/note/${n.id}`} style={styles.btn}>
                  Читать →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", paddingBottom: "60px" }}>
        {hasMore ? (
          <button
            style={styles.btnMore}
            onClick={loadMoreNotes}
            disabled={loading}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#dde3ff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#eef2ff";
            }}
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
