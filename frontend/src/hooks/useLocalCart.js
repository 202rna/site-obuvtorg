import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "obuvtorg_local_cart";

/**
 * Хук для управления корзиной в localStorage (для НЕавторизованных пользователей).
 * После авторизации можно вызвать syncToServer(token) для переноса локальной корзины на бэкенд.
 */
function loadInitialCart() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Ошибка загрузки корзины из localStorage:", e);
  }
  return [];
}

export default function useLocalCart() {
  const [localCart, setLocalCart] = useState(loadInitialCart);

  // Сохранение в localStorage при изменении
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localCart));
  }, [localCart]);

  const addToLocalCart = useCallback((product) => {
    setLocalCart((prev) => {
      if (prev.some((item) => String(item.id) === String(product.id))) {
        return prev; // уже есть
      }
      return [...prev, product];
    });
  }, []);

  const removeFromLocalCart = useCallback((productId) => {
    setLocalCart((prev) =>
      prev.filter((item) => String(item.id) !== String(productId))
    );
  }, []);

  const clearLocalCart = useCallback(() => {
    setLocalCart([]);
  }, []);

  const isInLocalCart = useCallback(
    (productId) => {
      return localCart.some((item) => String(item.id) === String(productId));
    },
    [localCart]
  );

  /**
   * Функция-заглушка синхронизации локальной корзины с бэкендом.
   * Вызывается после успешной авторизации пользователя.
   * @param {string} token - JWT токен авторизованного пользователя
   * @param {string} apiUrl - базовый URL API
   */
  const syncToServer = useCallback(
    async (token, apiUrl = "/api") => {
      if (!token || localCart.length === 0) return;

      console.log(
        "[syncToServer] Синхронизация локальной корзины с сервером:",
        localCart.length,
        "товаров"
      );

      // Поочерёдно добавляем каждый товар из локальной корзины на сервер
      for (const item of localCart) {
        try {
          await fetch(`${apiUrl}/cart/${item.id}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (err) {
          console.error(`[syncToServer] Ошибка синхронизации товара ${item.id}:`, err);
        }
      }

      // Очищаем локальную корзину после синхронизации
      clearLocalCart();
      console.log("[syncToServer] Синхронизация завершена, локальная корзина очищена");
    },
    [localCart, clearLocalCart]
  );

  return {
    localCart,
    addToLocalCart,
    removeFromLocalCart,
    clearLocalCart,
    isInLocalCart,
    syncToServer,
    localCartCount: localCart.length,
  };
}