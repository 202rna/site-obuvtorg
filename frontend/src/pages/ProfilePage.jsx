export default function ProfilePage({ profile }) {
  const styles = {
    card: {
      backgroundColor: "#fff",
      padding: "30px",
      borderRadius: "16px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
      maxWidth: "500px",
      margin: "50px auto",
      fontFamily: "sans-serif",
    },
    info: {
      backgroundColor: "#f8f9fa",
      padding: "20px",
      borderRadius: "12px",
      border: "1px solid #e9ecef",
      marginTop: "20px",
      fontSize: "16px",
      lineHeight: "1.6",
    },
  };

  return (
    <div style={styles.card}>
      <h2 style={{ margin: 0, color: "#1a1f36" }}>Личный кабинет 👤</h2>
      {profile ? (
        <div style={styles.info}>
          <div>
            <strong>Электронная почта:</strong> {profile.email}
          </div>
          <div>
            <strong>Роль в системе:</strong>{" "}
            <span
              style={{
                color: profile.role === "admin" ? "#dc3545" : "#0ea341",
                fontWeight: "bold",
              }}
            >
              {profile.role.toUpperCase()}
            </span>
          </div>
          <div
            style={{ color: "#0ea341", fontWeight: "600", marginTop: "10px" }}
          >
            🚀 {profile.message}
          </div>
        </div>
      ) : (
        <p>Загрузка профиля...</p>
      )}
    </div>
  );
}
