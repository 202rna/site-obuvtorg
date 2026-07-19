import { useState, useEffect } from "react";

export default function AdminNotesPage({ API_URL, token }) {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // 1. Загрузка списка существующих заметок
  async function fetchNotes() {
    try {
      // Предполагаем, что у тебя есть GET /note или GET /products для заметок.
      // Если GET роута еще нет, пока оставим пустой массив или запросим с бэка
      const response = await fetch(`${API_URL}/products?limit=100`);
      const data = await response.json();
      if (response.ok) {
        // Если заметки лежат в общей таблице, отфильтруем их или выведем все
        setNotes(data);
      }
    } catch (err) {
      console.error("Не удалось загрузить заметки:", err);
    }
  }

  // ИСПРАВЛЕНО: Заворачиваем вызов в изолированную асинхронную функцию внутри эффекта
  useEffect(() => {
    async function loadInitialNotes() {
      await fetchNotes();
    }
    loadInitialNotes();

    // Передаем токен и API_URL в массив зависимостей, чтобы эффект не перезапускался бесконечно
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_URL, token]);

  // 2. Отправка новой заметки на бэкенд (POST /note)
  async function handleCreateNote(e) {
    e.preventDefault();
    if (!file) {
      setMessage("❌ Пожалуйста, выберите файл!");
      return;
    }

    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("file", file); // Твой UploadFile = File(...) на бэкенде

    try {
      const response = await fetch(`${API_URL}/note`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }, // Передаем токен админа
        body: formData, // Для файлов заголовки Content-Type ставить НЕЛЬЗЯ, браузер сделает это сам
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✅ Заметка успешно создана и файл загружен!");
        setTitle("");
        setDescription("");
        setFile(null);
        document.getElementById("noteFileInput").value = ""; // Сбрасываем инпут файла
        fetchNotes(); // Обновляем список на экране
      } else {
        setMessage(`❌ Ошибка: ${data.detail || "Не удалось создать заметку"}`);
      }
    }  finally {
      setLoading(false);
    }
  }

  // 3. Удаление заметки (DELETE /note/{id})
  async function handleDeleteNote(noteId) {
    if (!window.confirm("Удалить эту заметку навсегда?")) return;

    try {
      const response = await fetch(`${API_URL}/note/${noteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
      } else {
        alert("Не удалось удалить заметку");
      }
    } catch (err) {
      console.error(err);
    }
  }

  const styles = {
    container: {
      maxWidth: "100%",
      padding: "0 40px",
      boxSizing: "border-box",
      fontFamily: "system-ui, sans-serif",
    },
    wrapper: {
      display: "flex",
      gap: "40px",
      flexWrap: "wrap",
      marginTop: "24px",
    },
    formCard: {
      backgroundColor: "#fff",
      padding: "32px",
      borderRadius: "16px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
      border: "1px solid #f1f5f9",
      flex: "1 1 400px",
    },
    listCard: {
      backgroundColor: "#fff",
      padding: "32px",
      borderRadius: "16px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
      border: "1px solid #f1f5f9",
      flex: "1 1 500px",
    },
    input: {
      width: "100%",
      padding: "12px",
      fontSize: "15px",
      borderRadius: "10px",
      border: "1px solid #e2e8f0",
      boxSizing: "border-box",
      marginBottom: "16px",
      outline: "none",
      fontFamily: "inherit",
    },
    label: {
      display: "block",
      fontSize: "14px",
      color: "#475569",
      marginBottom: "8px",
      fontWeight: "600",
    },
    btn: {
      width: "100%",
      padding: "14px",
      fontSize: "15px",
      fontWeight: "600",
      color: "#fff",
      backgroundColor: "#4f46e5",
      border: "none",
      borderRadius: "12px",
      cursor: "pointer",
      boxShadow: "0 4px 12px rgba(79, 70, 229, 0.15)",
    },
    noteItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 0",
      borderBottom: "1px solid #f1f5f9",
    },
    delBtn: {
      backgroundColor: "transparent",
      color: "#ef4444",
      border: "none",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "14px",
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={{ color: "#0f172a", fontSize: "26px", fontWeight: "800" }}>
        Панель управления заметками (Notes) 📄
      </h2>

      {message && (
        <div
          style={{
            padding: "14px",
            borderRadius: "10px",
            marginBottom: "20px",
            backgroundColor: message.includes("✅") ? "#f0fdf4" : "#fef2f2",
            color: message.includes("✅") ? "#15803d" : "#b91c1c",
            fontWeight: "500",
          }}
        >
          {message}
        </div>
      )}

      <div style={styles.wrapper}>
        {/* ФОРМА СОЗДАНИЯ ЗАМЕТКИ */}
        <div style={styles.formCard}>
          <h3
            style={{
              margin: "0 0 20px 0",
              fontSize: "18px",
              fontWeight: "700",
            }}
          >
            Создать новую заметку
          </h3>
          <form onSubmit={handleCreateNote}>
            <label style={styles.label}>Название заметки</label>
            <input
              type="text"
              style={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Ноты - Бетховен Симфония 5"
              required
            />

            <label style={styles.label}>Краткое описание / Аннотация</label>
            <textarea
              style={{ ...styles.input, height: "100px", resize: "vertical" }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Введите текст заметки или описание вложенного файла"
              required
            />

            <label style={styles.label}>
              Вложить файл (Документ, Картинка, PDF) 📁
            </label>
            <input
              id="noteFileInput"
              type="file"
              style={styles.input}
              onChange={(e) => setFile(e.target.files[0])}
              required
            />

            <button type="submit" style={styles.btn} disabled={loading}>
              {loading ? "Загрузка файла..." : "🚀 Опубликовать заметку"}
            </button>
          </form>
        </div>

        {/* СПИСОК ВСЕХ ЗАМЕТОК ДЛЯ УДАЛЕНИЯ */}
        <div style={styles.listCard}>
          <h3
            style={{
              margin: "0 0 20px 0",
              fontSize: "18px",
              fontWeight: "700",
            }}
          >
            Текущие публикации
          </h3>
          {notes.length === 0 ? (
            <p style={{ color: "#64748b", fontStyle: "italic" }}>
              Список заметок пуст.
            </p>
          ) : (
            notes.map((n) => (
              <div key={n.id} style={styles.noteItem}>
                <div>
                  <div style={{ fontWeight: "600", color: "#0f172a" }}>
                    {n.title}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#64748b",
                      marginTop: "2px",
                    }}
                  >
                    {n.description.substring(0, 50)}...
                  </div>
                </div>
                <button
                  style={styles.delBtn}
                  onClick={() => handleDeleteNote(n.id)}
                >
                  🗑️ Удалить
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
