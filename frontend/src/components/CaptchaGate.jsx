import { useEffect, useRef, useState } from "react";
import "./CaptchaGate.css";

// Ключ клиента — из .env через VITE_SMARTCAPTCHA_SITE_KEY
const SITE_KEY = import.meta.env.VITE_SMARTCAPTCHA_SITE_KEY || "";

/**
 * CaptchaGate — показывает Яндекс SmartCaptcha перед доступом к контенту.
 * После успешного прохождения вызывает onPass().
 */
export default function CaptchaGate({ onPass, children }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [status, setStatus] = useState(() => {
    // Если уже проходили капчу в этой сессии — пропускаем
    if (sessionStorage.getItem("captcha_passed") === "true") {
      return "success";
    }
    return "loading";
  }); // loading | ready | error | success
  const [errorMsg, setErrorMsg] = useState("");

  // Загружаем скрипт Яндекс SmartCaptcha
  useEffect(() => {
    const scriptId = "yandex-smartcaptcha-script";

    function onLoadCallback() {
      // Если контейнер уже размонтирован — выходим
      if (!containerRef.current) return;

      // Убедимся, что window.smartCaptcha существует
      if (typeof window.smartCaptcha === "undefined") {
        setStatus("error");
        setErrorMsg("Не удалось загрузить капчу");
        return;
      }

      try {
        // Рендерим виджет
        const widgetId = window.smartCaptcha.render(containerRef.current, {
          sitekey: SITE_KEY,
          hl: "ru",
          callback: onCaptchaSuccess,
          invisible: false, // показываем обычную (не невидимую) капчу
        });
        widgetIdRef.current = widgetId;
        setStatus("ready");
      } catch (err) {
        console.error("Captcha render error:", err);
        setStatus("error");
        setErrorMsg("Ошибка при инициализации капчи");
      }
    }

    // Обработчик успешного прохождения капчи
    async function onCaptchaSuccess(token) {
      setStatus("loading");
      try {
        const response = await fetch("/api/verify-gate-captcha", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || "Ошибка верификации капчи");
        }

        const data = await response.json();
        if (data.success) {
          sessionStorage.setItem("captcha_passed", "true");
          setStatus("success");
          if (onPass) onPass();
        } else {
          setStatus("error");
          setErrorMsg("Капча не пройдена. Попробуйте ещё раз.");
          // Сбрасываем виджет
          if (widgetIdRef.current != null && window.smartCaptcha) {
            window.smartCaptcha.reset(widgetIdRef.current);
          }
        }
      } catch (err) {
        console.error("Captcha verification error:", err);
        setStatus("error");
        setErrorMsg(err.message || "Ошибка при проверке капчи");
        // Сбрасываем виджет
        if (widgetIdRef.current != null && window.smartCaptcha) {
          window.smartCaptcha.reset(widgetIdRef.current);
        }
      }
    }

    // Проверяем, не загружен ли уже скрипт
    if (document.getElementById(scriptId)) {
      // Скрипт уже есть, ждём когда загрузится
      if (typeof window.smartCaptcha !== "undefined") {
        onLoadCallback();
      } else {
        // Ждём загрузки
        window.smartCaptchaReady = onLoadCallback;
      }
      return;
    }

    // Создаём скрипт
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://smartcaptcha.yandexcloud.net/captcha.js?render=onload&onload=onSmartCaptchaReady";
    script.async = true;
    script.defer = true;

    // Глобальный колбэк загрузки
    window.onSmartCaptchaReady = onLoadCallback;

    script.onerror = () => {
      console.error("Failed to load SmartCaptcha script");
      setStatus("error");
      setErrorMsg("Не удалось загрузить капчу. Проверьте подключение к интернету.");
    };

    document.body.appendChild(script);

    return () => {
      // Очистка при размонтировании
      if (widgetIdRef.current != null && window.smartCaptcha) {
        try {
          window.smartCaptcha.destroy(widgetIdRef.current);
        } catch {
          // ignore
        }
      }
      widgetIdRef.current = null;
      // Удаляем скрипт при размонтировании
      const existingScript = document.getElementById(scriptId);
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
      delete window.onSmartCaptchaReady;
    };
  }, [onPass]);

  // Если капча пройдена или children не передан — рендерим children
  if (status === "success" || !children) {
    return children;
  }

  return (
    <div className="captchaGateOverlay">
      <div className="captchaGateModal">
        <div className="captchaGateIcon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className="captchaGateTitle">Проверка безопасности</h2>
        <p className="captchaGateText">
          Пожалуйста, пройдите проверку, чтобы продолжить просмотр каталога
        </p>

        <div className="captchaGateWidget">
          {status === "loading" && (
            <div className="captchaGateLoading">
              <div className="captchaGateSpinner" />
              <span>Загрузка капчи...</span>
            </div>
          )}

          {status === "error" && (
            <div className="captchaGateError">
              <p>{errorMsg}</p>
              <button
                className="captchaGateRetryBtn"
                onClick={() => {
                  setStatus("loading");
                  setErrorMsg("");
                  // Перезагружаем страницу, чтобы переинициализировать капчу
                  window.location.reload();
                }}
              >
                Попробовать снова
              </button>
            </div>
          )}

          {/* Контейнер для виджета SmartCaptcha */}
          <div
            ref={containerRef}
            className="smartcaptchaContainer"
            style={{ display: status === "ready" ? "block" : "none" }}
          />
        </div>
      </div>
    </div>
  );
}