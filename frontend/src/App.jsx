import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import CaptchaGate from "./components/CaptchaGate.jsx";
import Navigation from "./components/Navigation.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import CartPage from "./pages/CartPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import AdminNotesPage from "./pages/AdminNotePage.jsx";
import UserNotesPage from "./pages/UserNotesPage.jsx";
import NoteDetailPage from "./pages/NoteDetailPage.jsx";
import ProductPage from "./pages/ProductPage";
import HowToDrivePage from "./pages/HowToDrivePage";
import ChatWidget from "./components/ChatWidget.jsx";
import useLocalCart from "./hooks/useLocalCart.js";

export default function App() {
  const API_URL = "/api";
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [profile, setProfile] = useState(null);
  const [cart, setCart] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isHuman, setIsHuman] = useState(() => {
    return sessionStorage.getItem("captcha_passed") === "true";
  });

  const {
    localCart,
    addToLocalCart,
    clearLocalCart,
    isInLocalCart,
    syncToServer,
    localCartCount,
  } = useLocalCart();

  // Отслеживаем ширину экрана для определения мобильности
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    setToken("");
    setProfile(null);
    setCart([]);
  }

  function handleChatClose() {
    setChatOpen(false);
  }

  function handleChatToggle() {
    if (chatOpen) {
      handleChatClose();
    } else {
      setChatOpen(true);
    }
  }

  async function fetchCart(currentToken) {
    try {
      const response = await fetch(`${API_URL}/cart`, {
        method: "GET",
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      const data = await response.json();
      if (response.ok) {
        setCart(data);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function addToCart(product) {
    if (token) {
      try {
        const response = await fetch(`${API_URL}/cart/${product.id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          setCart((prev) => {
            if (prev.some((item) => item.id === product.id)) return prev;
            return [...prev, product];
          });
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      addToLocalCart(product);
    }
  }

  async function clearCart() {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/cart`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setCart([]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch(`${API_URL}/me`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setProfile(data);
          fetchCart(token);
          if (localCart.length > 0) {
            syncToServer(token, API_URL);
          }
        } else {
          handleLogout();
        }
      } catch {
        handleLogout();
      }
    }
    if (token) loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, API_URL]);

  // На мобильных — чат как overlay поверх всего, без изменения раскладки страницы
  const showChatAsOverlay = chatOpen && isMobile;

  return (
    <CaptchaGate onPass={() => setIsHuman(true)}>
      <div
        className="appRoot"
        style={{
          background:
            "linear-gradient(135deg, #d3eaf5 0%, #faf4f4 50%, #f2f2e1 100%)",
          minHeight: "100vh",
          boxSizing: "border-box",
          height: "100vh",
          maxHeight: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Navigation
          token={token}
          userRole={profile?.role || "user"}
          cartCount={cart.length}
          localCartCount={localCartCount}
          handleLogout={handleLogout}
          onChatToggle={handleChatToggle}
          onChatClose={handleChatClose}
        />

        {/* Контейнер, который при chatOpen делит экран на десктопе */}
        <div
          className="chatLayout"
          style={{
            display: "flex",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* Основной контент */}
          <div
            className="mainContent"
            style={{
              flex: chatOpen && !isMobile ? "0 0 66.666%" : "1 1 auto",
              overflow: "auto",
              minWidth: 0,
            }}
          >
            <Routes>
              <Route
                path="/"
                element={
                  <ProductsPage
                    API_URL={API_URL}
                    addToCart={addToCart}
                    token={token}
                    userRole={profile?.role || "user"}
                    cart={cart}
                    localCart={localCart}
                    isInLocalCart={isInLocalCart}
                  />
                }
              />
              <Route
                path="/discount"
                element={
                  <ProductsPage
                    API_URL={API_URL}
                    addToCart={addToCart}
                    token={token}
                    userRole={profile?.role || "user"}
                    cart={cart}
                    localCart={localCart}
                    isInLocalCart={isInLocalCart}
                    discountedOnly
                  />
                }
              />

              <Route
                path="/notes"
                element={<UserNotesPage API_URL={API_URL} />}
              />
              <Route path="/how-to-drive" element={<HowToDrivePage />} />
              <Route
                path="/note/:id"
                element={<NoteDetailPage API_URL={API_URL} />}
              />
              <Route
                path="/products/:productId"
                element={
                  <ProductPage
                    API_URL={API_URL}
                    addToCart={addToCart}
                    token={token}
                    cart={cart}
                    userRole={profile?.role || "user"}
                  />
                }
              />
              <Route
                path="/login"
                element={
                  !token ? (
                    <LoginPage API_URL={API_URL} setToken={setToken} />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
              <Route
                path="/profile"
                element={
                  token ? (
                    <ProfilePage profile={profile} />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/cart"
                element={
                  token ? (
                    <CartPage cart={cart} clearCart={clearCart} />
                  ) : (
                    <CartPage
                      cart={localCart}
                      clearCart={clearLocalCart}
                      isLocal
                    />
                  )
                }
              />

              <Route
                path="/admin"
                element={
                  token && profile?.role === "admin" ? (
                    <AdminPage API_URL={API_URL} token={token} />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />

              <Route
                path="/admin/notes"
                element={
                  token && profile?.role === "admin" ? (
                    <AdminNotesPage API_URL={API_URL} token={token} />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
            </Routes>
          </div>

          {/* Чат-панель на десктопе (боковая панель) */}
          {chatOpen && !isMobile && (
            <div
              className="chatWrapper"
              style={{
                flex: "0 0 33.333%",
                minWidth: 0,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                borderLeft: "1px solid #e2e8f0",
                boxShadow: "-2px 0 8px rgba(0, 0, 0, 0.06)",
              }}
            >
              <ChatWidget isOpen={true} onClose={handleChatClose} />
            </div>
          )}
        </div>

        {/* Чат overlay на мобильных — поверх всего, не меняет раскладку */}
        {showChatAsOverlay && (
          <div
            className="chatMobileOverlay"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              background: "#f7f8fc",
            }}
          >
            <ChatWidget isOpen={true} onClose={handleChatClose} />
          </div>
        )}

        <style>{`
          body {
            overflow: hidden;
            height: 100%;
            margin: 0;
          }

          /* На мобильных body не трогаем, т.к. чат — overlay */
          @media (max-width: 768px) {
            body {
              overflow: visible;
              height: auto;
            }
          }
        `}</style>
      </div>
    </CaptchaGate>
  );
}