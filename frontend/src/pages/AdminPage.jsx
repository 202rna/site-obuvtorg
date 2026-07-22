import { useState } from "react";

export default function AdminPage({ API_URL, token }) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [discount, setDiscount] = useState("0");
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState({ text: "", isError: false });

  async function handleAddProduct(e) {
    e.preventDefault();
    setMsg({ text: "", isError: false });

    if (!title || !price || !description || !file) {
      setMsg({
        text: "Пожалуйста, заполните все поля и выберите фото",
        isError: true,
      });
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("price", price);
    formData.append("description", description);
    formData.append("full_description", fullDescription || "");
    formData.append("discount", discount || "0");
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        setMsg({
          text: `Товар "${data.title}" успешно создан!`,
          isError: false,
        });
        setTitle("");
        setPrice("");
        setDescription("");
        setFullDescription("");
        setDiscount("0");
        setFile(null);
        document.getElementById("fileInput").value = "";
      } else {
        setMsg({ text: data.detail || "Ошибка добавления", isError: true });
      }
    } catch {
      setMsg({ text: "Ошибка сети", isError: true });
    }
  }

  const styles = {
    card: {
      backgroundColor: "#fff",
      padding: "30px",
      borderRadius: "16px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
      maxWidth: "600px",
      margin: "50px auto",
      fontFamily: "sans-serif",
    },
    input: {
      width: "100%",
      padding: "12px",
      fontSize: "15px",
      borderRadius: "8px",
      border: "1px solid #d9dce1",
      boxSizing: "border-box",
      marginBottom: "15px",
      outline: "none",
      fontFamily: "inherit",
    },
    textarea: {
      width: "100%",
      padding: "12px",
      fontSize: "15px",
      borderRadius: "8px",
      border: "1px solid #d9dce1",
      boxSizing: "border-box",
      marginBottom: "15px",
      outline: "none",
      fontFamily: "monospace",
      minHeight: "150px",
      resize: "vertical",
    },
    fileLabel: {
      display: "block",
      fontSize: "14px",
      color: "#4f566b",
      marginBottom: "8px",
      fontWeight: "500",
      textAlign: "left",
    },
    btn: {
      width: "100%",
      padding: "12px",
      fontSize: "16px",
      fontWeight: "600",
      color: "#fff",
      backgroundColor: "#dc3545",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      marginTop: "10px",
    },
    hint: {
      fontSize: "12px",
      color: "#697386",
      marginTop: "-10px",
      marginBottom: "15px",
      textAlign: "left",
    },
  };

  return (
    <div style={styles.card}>
      <h2>Панель администратора 🛠️</h2>
      <p style={{ color: "#697386", fontSize: "14px", marginBottom: "25px" }}>
        Создание товара
      </p>

      {msg.text && (
        <div
          style={{
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "15px",
            backgroundColor: msg.isError ? "#fef3f2" : "#edfcf2",
            color: msg.isError ? "#b42318" : "#0ea341",
            fontWeight: "500",
          }}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={handleAddProduct}>
        <input
          type="text"
          style={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название товара"
        />

        <input
          type="number"
          style={styles.input}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Цена (в рублях)"
        />

        <input
          type="number"
          style={styles.input}
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
          placeholder="Скидка (%)"
          min="0"
          max="100"
        />

        <input
          type="text"
          style={styles.input}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Краткое описание товара"
        />

        {/* Подробное описание с подсказкой по Markdown */}
        <label style={{ ...styles.fileLabel, marginTop: "10px" }}>
          Подробное описание товара
        </label>
        <textarea
          style={styles.textarea}
          value={fullDescription}
          onChange={(e) => setFullDescription(e.target.value)}
          placeholder="Подробное описание товара. Поддерживается Markdown: 
# Заголовок, **жирный**, *курсив*, - список"
        />
        <div style={styles.hint}>
          💡 Поддерживается Markdown: # Заголовок, **жирный**, *курсив*, -
          список
        </div>

        <label style={styles.fileLabel}>Фото товара (Изображение)</label>
        <input
          id="fileInput"
          type="file"
          accept="image/*"
          style={{ ...styles.input, padding: "8px" }}
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button type="submit" style={styles.btn}>
          🚀 Создать и загрузить
        </button>
      </form>
    </div>
  );
}
