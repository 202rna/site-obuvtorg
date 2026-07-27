import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

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

  const {
    localCart,
    addToLocalCart,
    clearLocalCart,
    isInLocalCart,
    syncToServer,
    localCartCount,
  } = useLocalCart();

  function handleLogout() {
    localStorage.removeItem("token");
    setToken("");
    setProfile(null);
    setCart([]);
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

  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, #d3eaf5 0%, #faf4f4 50%, #f2f2e1 100%)",
        minHeight: "100vh",
        boxSizing: "border-box",
        overflow: chatOpen ? "hidden" : "visible",
        height: chatOpen ? "100vh" : "auto",
        maxHeight: chatOpen ? "100vh" : "none",
        display: chatOpen ? "flex" : "block",
        flexDirection: chatOpen ? "column" : undefined,
      }}
    >
      <Navigation
        token={token}
        userRole={profile?.role || "user"}
        cartCount={cart.length}
        localCartCount={localCartCount}
        handleLogout={handleLogout}
        onChatToggle={() => setChatOpen((prev) => !prev)}
        onChatClose={() => setChatOpen(false)}
      />

      <ChatWidget isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      <div
        style={{
          display: chatOpen ? "none" : "block",
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

        <Route path="/notes" element={<UserNotesPage API_URL={API_URL} />} />
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
            token ? <ProfilePage profile={profile} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/cart"
          element={
            token ? (
              <CartPage cart={cart} clearCart={clearCart} />
            ) : (
              <CartPage cart={localCart} clearCart={clearLocalCart} isLocal />
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

      {chatOpen && (
        <style>{`
          body {
            overflow: hidden;
            height: 100%;
          }
        `}</style>
      )}
    </div>
  );
}