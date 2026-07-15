import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";


import Navigation from "./components/Navigation.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import CartPage from "./pages/CartPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";

export default function App() {
  
  const API_URL = "/api";
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [profile, setProfile] = useState(null);
  const [cart, setCart] = useState([]);

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
    if (!token) return;
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
        } else {
          handleLogout();
        }
      } catch {
        handleLogout();
      }
    }
    if (token) loadProfile();
    
  }, [token, API_URL]);

  return (
    
    <div
      style={{
        background:
          "linear-gradient(135deg, #f5f7ff 0%, #ffffff 50%, #f0fdf4 100%)",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      <Navigation
        token={token}
        userRole={profile?.role || "user"}
        cartCount={cart.length}
        handleLogout={handleLogout}
      />

      {/* Сетка страниц */}
      <Routes>
        {/* ГЛАВНАЯ СТРАНИЦА*/}
        <Route
          path="/"
          element={
            <ProductsPage
              API_URL={API_URL}
              addToCart={addToCart}
              token={token}
              userRole={profile?.role || "user"}
              cart={cart}
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
              <Navigate to="/login" />
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
      </Routes>
    </div>
  );
}
