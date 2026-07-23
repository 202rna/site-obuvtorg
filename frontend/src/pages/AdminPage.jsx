import { useState } from "react";

export default function AdminPage({ API_URL, token }) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [discount, setDiscount] = useState("0");
  const [files, setFiles] = useState([]);
  const [categories, setCategories] = useState("");
  const [sizes, setSizes] = useState("");
  const [msg, setMsg] = useState({ text: "", isError: false });

  async function handleAddProduct(e) {
    e.preventDefault();
    setMsg({ text: "", isError: false });

    if (!title || !price || !description || files.length === 0) {
      setMsg({
        text: "Пожалуйста, заполните все поля и выберите хотя бы одно фото",
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
    formData.append("categories", categories || "");
    formData.append("sizes", sizes || "");
    files.forEach((file) => formData.append("files", file));

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
        setFiles([]);
        setCategories("");
        setSizes("");
        document.getElementById("fileInput").value = "";
      } else {
        setMsg({ text: data.detail || "Ошибка добавления", isError: true });
      }
    } catch {
      setMsg({ text: "Ошибка сети", isError: true });
    }
  }

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length === 0) return;
    // Добавляем новые файлы к существующим
    setFiles((prev) => [...prev, ...newFiles]);
    // Сбрасываем input, чтобы можно было выбрать ещё файлы
    e.target.value = "";
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

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
    fileList: {
      marginTop: "8px",
      marginBottom: "12px",
      padding: "0",
      listStyle: "none",
    },
    fileItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "6px 10px",
      backgroundColor: "#f8fafc",
      borderRadius: "6px",
      marginBottom: "4px",
      fontSize: "14px",
    },
    removeBtn: {
      background: "none",
      border: "none",
      color: "#ef4444",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "bold",
      padding: "0 4px",
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
          placeholder="Краткое описание товара (Марка / Производитель)"
        />

        <input
          type="text"
          style={styles.input}
          value={categories}
          onChange={(e) => setCategories(e.target.value)}
          placeholder="Категории через запятую (например: Кроссовки, Спорт)"
        />

        <input
          type="text"
          style={styles.input}
          value={sizes}
          onChange={(e) => setSizes(e.target.value)}
          placeholder="Размеры через запятую (например: 36, 37, 38)"
        />

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

        <label style={styles.fileLabel}>
          Фото товара (можно выбрать несколько)
        </label>
        <input
          id="fileInput"
          type="file"
          accept="image/*"
          multiple
          style={{ ...styles.input, padding: "8px" }}
          onChange={handleFileChange}
        />

        {files.length > 0 && (
          <ul style={styles.fileList}>
            {files.map((file, index) => (
              <li key={index} style={styles.fileItem}>
                <span>
                  {file.name} ({(file.size / 1024).toFixed(0)} KB)
                </span>
                <button
                  type="button"
                  style={styles.removeBtn}
                  onClick={() => removeFile(index)}
                  title="Удалить файл"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        <button type="submit" style={styles.btn}>
          🚀 Создать и загрузить
        </button>
      </form>
    </div>
  );
}
