import { useState, useEffect } from "react";

export default function AdminNotesPage({ API_URL, token }) {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ID заметки, которую сейчас правим (если null — режим создания)
  const [editingId, setEditingId] = useState(null);

  async function fetchNotes() {
    try {
      const response = await fetch(`${API_URL}/notes?limit=100`);
      const data = await response.json();
      if (response.ok) setNotes(data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    async function loadData() {
      await fetchNotes();
    }
    loadData();

    // Добавляем зависимости, чтобы эффект знал, когда перезапускаться, и не уходил в бесконечный цикл
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_URL, token]);

  // Главная функция отправки формы
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (editingId) {
      // --- РЕЖИМ PATCH ОБНОВЛЕНИЯ (Передаем JSON по твоей NoteUpdateSchema) ---
      try {
        // ПРОВЕРЬ И ИСПРАВЬ ЭТУ СТРОКУ В AdminNotesPage.jsx:
        // Убедись, что перед note стоит косая черта, а после нее идет ID без лишних знаков
        // ИСПРАВЛЕНО: Перед note обязательно должен быть слэш, и перед ${editingId} тоже!
        const response = await fetch(`${API_URL}/note/${editingId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title, description }), // Отправляем ровно те поля, что ждут в NoteUpdateSchema
        });

        const data = await response.json();
        if (response.ok) {
          setMessage("✅ Заметка успешно обновлена!");
          setEditingId(null);
          setTitle("");
          setDescription("");
          fetchNotes();
        } else {
          setMessage(`❌ Ошибка: ${data.detail || "Не удалось обновить"}`);
        }
      } catch {
        setMessage("❌ Ошибка соединения при обновлении");
      } finally {
        setLoading(false);
      }
    } else {
      // --- РЕЖИМ POST СОЗДАНИЯ (Передаем Form-Data с вложенным файлом) ---
      if (!file) {
        setMessage("❌ Пожалуйста, выберите файл!");
        setLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("file", file);

      try {
        const response = await fetch(`${API_URL}/note`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (response.ok) {
          setMessage("✅ Заметка успешно создана!");
          setTitle("");
          setDescription("");
          setFile(null);
          if (document.getElementById("adminNoteFile"))
            document.getElementById("adminNoteFile").value = "";
          fetchNotes();
        } else {
          const errData = await response.json();
          setMessage(
            `❌ Ошибка: ${errData.detail || "Не удалось создать заметку"}`,
          );
        }
      } catch {
        setMessage("❌ Ошибка соединения при создании");
      } finally {
        setLoading(false);
      }
    }
  }

  // Переключение формы в режим редактирования
  function startEdit(note) {
    setEditingId(note.id);
    setTitle(note.title);
    setDescription(note.description);
  }

  // Выход из режима редактирования
  function cancelEdit() {
    setEditingId(null);
    setTitle("");
    setDescription("");
  }

  // ДЕЙСТВИЕ: Удаление заметки (DELETE)
  async function handleDelete(id) {
    if (!window.confirm("Вы уверены, что хотите навсегда удалить эту заметку?"))
      return;
    try {
      const response = await fetch(`${API_URL}/note/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
        if (editingId === id) cancelEdit();
      } else {
        alert("Не удалось удалить заметку");
      }
    } catch (err) {
      console.error(err);
    }
  }

  const styles = {
    container: {
      width: "100%",
      maxWidth: "100%",
      padding: "0 24px",
      boxSizing: "border-box",
      fontFamily: "system-ui, sans-serif",
    },
    wrapper: {
      display: "flex",
      gap: "40px",
      flexWrap: "wrap",
      marginTop: "24px",
    },
    card: {
      backgroundColor: "#fff",
      padding: "32px",
      borderRadius: "16px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
      border: "1px solid #f1f5f9",
      flex: "1 1 450px",
    },
    input: {
      width: "100%",
      padding: "12px",
      borderRadius: "10px",
      border: "1px solid #e2e8f0",
      boxSizing: "border-box",
      marginBottom: "16px",
      outline: "none",
      fontSize: "15px",
    },
    label: {
      display: "block",
      fontSize: "14px",
      fontWeight: "600",
      color: "#475569",
      marginBottom: "6px",
    },
    btn: {
      width: "100%",
      padding: "14px",
      fontSize: "15px",
      fontWeight: "600",
      color: "#fff",
      border: "none",
      borderRadius: "12px",
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
    item: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 0",
      borderBottom: "1px solid #f1f5f9",
    },
    actionBtn: {
      background: "none",
      border: "none",
      fontWeight: "600",
      cursor: "pointer",
      fontSize: "14px",
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={{ color: "#0f172a", fontSize: "26px", fontWeight: "800" }}>
        Панель управления заметками 📄
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
        {/* ФОРМА СОЗДАНИЯ / PATCH ОБНОВЛЕНИЯ */}
        <div style={styles.card}>
          <h3 style={{ margin: "0 0 20px 0", fontWeight: "700" }}>
            {editingId
              ? "📝 Редактировать публикацию"
              : "🚀 Создать новую заметку"}
          </h3>
          <form onSubmit={handleSubmit}>
            <label style={styles.label}>Название</label>
            <input
              type="text"
              style={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название публикации"
              required
            />

            <label style={styles.label}>Полный текст</label>
            <textarea
              style={{ ...styles.input, height: "140px", resize: "vertical" }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Введите текст или аннотацию к файлу"
              required
            />

            {/* При PATCH обновлении поле файла скрывается, так как мы обновляем только текстовые поля в схеме */}
            {!editingId && (
              <>
                <label style={styles.label}>
                  Прикрепить файл (Документ, Ноты, Картинка)
                </label>
                <input
                  id="adminNoteFile"
                  type="file"
                  style={styles.input}
                  onChange={(e) => setFile(e.target.files[0])}
                  required
                />
              </>
            )}

            <button
              type="submit"
              style={{
                ...styles.btn,
                backgroundColor: editingId ? "#10b981" : "#4f46e5",
              }}
              disabled={loading}
            >
              {loading
                ? "Обработка запроса..."
                : editingId
                  ? "Сохранить изменения (PATCH)"
                  : "Опубликовать заметку (POST)"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                style={{
                  ...styles.btn,
                  backgroundColor: "#64748b",
                  marginTop: "10px",
                }}
              >
                Отменить редактирование
              </button>
            )}
          </form>
        </div>

        {/* СПИСОК ПУБЛИКАЦИЙ АДМИНА */}
        <div style={styles.card}>
          <h3 style={{ margin: "0 0 20px 0", fontWeight: "700" }}>
            Все публикации (Только заголовки)
          </h3>
          {notes.length === 0 ? (
            <p style={{ color: "#64748b", fontStyle: "italic" }}>
              Заметок пока нет.
            </p>
          ) : (
            notes.map((n) => (
              <div key={n.id} style={styles.item}>
                <span style={{ fontWeight: "600", color: "#0f172a" }}>
                  {n.title}
                </span>
                <div style={{ display: "flex", gap: "16px" }}>
                  <button
                    onClick={() => startEdit(n)}
                    style={{ ...styles.actionBtn, color: "#4f46e5" }}
                  >
                    Правка
                  </button>
                  <button
                    onClick={() => handleDelete(n.id)}
                    style={{ ...styles.actionBtn, color: "#ef4444" }}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
