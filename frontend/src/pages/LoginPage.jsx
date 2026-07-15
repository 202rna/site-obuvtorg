import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage({ API_URL, setToken }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const endpoint = isLoginMode ? "/login" : "/register";
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || "Ошибка");
        return;
      }

      if (isLoginMode) {
        localStorage.setItem("token", data.access_token);
        setToken(data.access_token);
        navigate("/");
      } else {
        const loginRes = await fetch(`${API_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const loginData = await loginRes.json();
        if (loginRes.ok) {
          localStorage.setItem("token", loginData.access_token);
          setToken(loginData.access_token);
          navigate("/");
        } else {
          setIsLoginMode(true);
        }
      }
    } catch {
      setError("Ошибка сети");
    }
  }

  const styles = {
    card: {
      background: "#ffffff",
      padding: "40px",
      borderRadius: "16px",
      boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
      width: "100%",
      maxWidth: "380px",
      margin: "100px auto",
      textAlign: "center",
      fontFamily: "sans-serif",
      boxSizing: "border-box",
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
    },
    btn: {
      width: "100%",
      padding: "12px",
      fontSize: "16px",
      fontWeight: "600",
      color: "#fff",
      backgroundColor: "#5469d4",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.card}>
      <form onSubmit={handleSubmit}>
        <h2>{isLoginMode ? "Вход" : "Регистрация"}</h2>
        {error && (
          <div style={{ color: "red", marginBottom: "15px" }}>⚠️ {error}</div>
        )}
        <input
          type="text" 
          style={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Введите логин или Email" 
        />
        <input
          type="password"
          style={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
        />
        <button type="submit" style={styles.btn}>
          {isLoginMode ? "Войти" : "Создать аккаунт"}
        </button>
        <p style={{ fontSize: "14px", color: "#697386", marginTop: "15px" }}>
          {isLoginMode ? "Ещё нет аккаунта?" : "Уже зарегистрированы?"}
          <span
            style={{
              color: "#5469d4",
              cursor: "pointer",
              fontWeight: "600",
              marginLeft: "5px",
            }}
            onClick={() => setIsLoginMode(!isLoginMode)}
          >
            {isLoginMode ? "Зарегистрироваться" : "Войти"}
          </span>
        </p>
      </form>
    </div>
  );
}
