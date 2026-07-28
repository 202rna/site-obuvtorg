import { useEffect, useRef, useState } from "react";
import "./CaptchaGate.css";

const SITE_KEY = import.meta.env.VITE_SMARTCAPTCHA_SITE_KEY || "";

/**
 * Поведенческий трекер — собирает метрики взаимодействия пользователя.
 */
function createBehaviorTracker() {
  let mouseMoves = 0;
  let scrollEvents = 0;
  let clicks = 0;
  let keyPresses = 0;
  let startTime = Date.now();
  let tracked = false;

  function onMouseMove() {
    mouseMoves++;
  }
  function onScroll() {
    scrollEvents++;
  }
  function onClick() {
    clicks++;
  }
  function onKeyDown() {
    keyPresses++;
  }

  function start() {
    if (tracked) return;
    tracked = true;
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("scroll", onScroll);
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onKeyDown);
  }

  function stop() {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("click", onClick);
    window.removeEventListener("keydown", onKeyDown);
  }

  function getData() {
    return {
      mouse_moves: mouseMoves,
      scroll_events: scrollEvents,
      clicks: clicks,
      key_presses: keyPresses,
      time_on_page: (Date.now() - startTime) / 1000,
    };
  }

  function getScore() {
    const elapsed = (Date.now() - startTime) / 1000;
    if (mouseMoves > 3 && (scrollEvents > 0 || clicks > 0 || keyPresses > 0))
      return 0.0;
    if (mouseMoves > 5) return 0.1;
    if (clicks > 0 || keyPresses > 0) return 0.1;
    if (scrollEvents > 0) return 0.2;
    if (elapsed < 2) return 0.3;
    if (elapsed < 5 && !mouseMoves && !scrollEvents && !clicks) return 0.5;
    if (elapsed > 15 && !mouseMoves && !scrollEvents) return 0.7;
    return 0.3;
  }

  return { start, stop, getData, getScore };
}

async function checkServerBehavior(data) {
  try {
    const response = await fetch("/api/check-behavior", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * CaptchaGate — невидимая капча.
 *
 * Ключевой принцип: НОРМАЛЬНЫЕ ПОЛЬЗОВАТЕЛИ НИКОГДА НЕ ВИДЯТ КАПЧУ.
 *
 * 1. Сразу показывает контент (children) — пользователь видит сайт
 * 2. В фоне собирает поведенческие данные + пытается невидимую SmartCaptcha
 * 3. Если невидимая капча прошла → сохраняет флаг в sessionStorage
 * 4. Если невидимая капча НЕ прошла:
 *    - поведение нормальное → ничего не делаем (пропускаем без капчи)
 *    - поведение ОЧЕНЬ подозрительное (score > 0.7) → показываем модалку
 * 5. Сессионная память: пройденная капча не показывается повторно
 */
export default function CaptchaGate({ onPass, children }) {
  const containerRef = useRef(null);
  const invisibleContainerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const invisibleWidgetIdRef = useRef(null);
  const behaviorRef = useRef(createBehaviorTracker());
  const [status, setStatus] = useState(() => {
    if (sessionStorage.getItem("captcha_passed") === "true") {
      return "success";
    }
    return "active"; // active = показываем контент, проверка в фоне
  });
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const invisibleAttemptedRef = useRef(false);

  // Загружаем скрипт Яндекс SmartCaptcha один раз
  useEffect(() => {
    const scriptId = "yandex-smartcaptcha-script";

    function onLoadCallback() {
      if (!invisibleContainerRef.current) return;

      if (typeof window.smartCaptcha === "undefined") {
        console.warn("[CaptchaGate] SmartCaptcha not available");
        return;
      }

      try {
        const invisibleWidgetId = window.smartCaptcha.render(
          invisibleContainerRef.current,
          {
            sitekey: SITE_KEY,
            hl: "ru",
            invisible: true,
            callback: onInvisibleCaptchaSuccess,
          },
        );
        invisibleWidgetIdRef.current = invisibleWidgetId;

        // Если статус уже "active" — сразу пытаемся выполнить невидимую
        if (statusRef.current === "active" && !invisibleAttemptedRef.current) {
          invisibleAttemptedRef.current = true;
          window.smartCaptcha.execute(invisibleWidgetId);
        }
      } catch (err) {
        console.error("[CaptchaGate] Render error:", err);
      }
    }

    async function onInvisibleCaptchaSuccess(token) {
      try {
        const response = await fetch("/api/verify-gate-captcha", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) return;
        const data = await response.json();

        if (data.success) {
          // Невидимая капча ПРОШЛА — сохраняем и пропускаем
          sessionStorage.setItem("captcha_passed", "true");
          setStatus("success");
          if (onPass) onPass();
        }
        // Если не прошла — ничего не делаем, пользователь уже видит контент
      } catch {
        // Игнорируем ошибки — пользователь уже видит сайт
      }
    }

    // Ref для доступа к актуальному статусу внутри колбэков
    const statusRef = { current: status };

    if (document.getElementById(scriptId)) {
      if (typeof window.smartCaptcha !== "undefined") {
        onLoadCallback();
      } else {
        window.smartCaptchaReady = onLoadCallback;
      }
      return () => {
        statusRef.current = null;
      };
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src =
      "https://smartcaptcha.yandexcloud.net/captcha.js?render=onload&onload=onSmartCaptchaReady";
    script.async = true;
    script.defer = true;

    window.onSmartCaptchaReady = onLoadCallback;

    document.body.appendChild(script);

    return () => {
      statusRef.current = null;
      if (widgetIdRef.current != null && window.smartCaptcha) {
        try {
          window.smartCaptcha.destroy(widgetIdRef.current);
        } catch {
          /* ignore */
        }
      }
      if (invisibleWidgetIdRef.current != null && window.smartCaptcha) {
        try {
          window.smartCaptcha.destroy(invisibleWidgetIdRef.current);
        } catch {
          /* ignore */
        }
      }
      widgetIdRef.current = null;
      invisibleWidgetIdRef.current = null;
      const existingScript = document.getElementById(scriptId);
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
      delete window.onSmartCaptchaReady;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Собираем поведение + пытаемся невидимую капчу через 4 секунды
  useEffect(() => {
    if (status !== "active") return;

    const behavior = behaviorRef.current;
    behavior.start();

    const timer = setTimeout(() => {
      behavior.stop();
      const behaviorData = behavior.getData();
      const clientScore = behavior.getScore();

      // Пытаемся выполнить невидимую капчу
      if (invisibleWidgetIdRef.current != null && window.smartCaptcha) {
        invisibleAttemptedRef.current = true;
        window.smartCaptcha.execute(invisibleWidgetIdRef.current);
      }

      // Через 3 секунды после попытки проверяем, не пройдена ли капча
      // Если не пройдена — анализируем поведение
      setTimeout(() => {
        if (statusRef.current === "success") return; // уже прошли

        // Проверяем на сервере
        checkServerBehavior(behaviorData).then((serverResult) => {
          const serverScore = serverResult?.score ?? clientScore;
          const serverSuspicious = serverResult?.suspicious ?? false;
          const finalScore = Math.max(clientScore, serverScore);

          console.log(
            `[CaptchaGate] Invisible check complete. ` +
              `Score: ${finalScore.toFixed(2)}, ` +
              `Suspicious: ${serverSuspicious}`,
          );

          // Модалку показываем ТОЛЬКО если очень подозрительно
          if (finalScore > 0.7 || (serverSuspicious && finalScore > 0.5)) {
            setShowModal(true);
            setStatus("blocked");
          }
          // В противном случае — ничего не делаем, пользователь продолжает
        });
      }, 3000);
    }, 4000);

    const statusRef = { current: status };

    return () => {
      clearTimeout(timer);
      behavior.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Рендерим видимый виджет, когда модалка открыта
  useEffect(() => {
    if (!showModal || status !== "blocked") return;

    const timer = setTimeout(() => {
      if (!containerRef.current || typeof window.smartCaptcha === "undefined")
        return;

      try {
        const widgetId = window.smartCaptcha.render(containerRef.current, {
          sitekey: SITE_KEY,
          hl: "ru",
          callback: onVisibleCaptchaSuccess,
          invisible: false,
        });
        widgetIdRef.current = widgetId;
      } catch (err) {
        console.error("Visible captcha render error:", err);
      }
    }, 100);

    async function onVisibleCaptchaSuccess(token) {
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
          setShowModal(false);
          if (onPass) onPass();
        } else {
          setStatus("error");
          setErrorMsg("Капча не пройдена. Попробуйте ещё раз.");
          if (widgetIdRef.current != null && window.smartCaptcha) {
            window.smartCaptcha.reset(widgetIdRef.current);
          }
        }
      } catch (err) {
        console.error("Visible captcha verification error:", err);
        setStatus("error");
        setErrorMsg(err.message || "Ошибка при проверке капчи");
        if (widgetIdRef.current != null && window.smartCaptcha) {
          window.smartCaptcha.reset(widgetIdRef.current);
        }
      }
    }

    window.__onVisibleCaptchaSuccess = onVisibleCaptchaSuccess;

    return () => {
      clearTimeout(timer);
      delete window.__onVisibleCaptchaSuccess;
    };
  }, [showModal, status, onPass]);

  // Капча пройдена или режим "active" — показываем контент
  if (status === "success" || status === "active" || !children) {
    return (
      <>
        {children}
        {/* Скрытый контейнер для невидимой капчи */}
        <div
          ref={invisibleContainerRef}
          style={{
            position: "absolute",
            width: 0,
            height: 0,
            overflow: "hidden",
            opacity: 0,
            pointerEvents: "none",
            zIndex: -1,
          }}
          aria-hidden="true"
        />
      </>
    );
  }

  // Модалка — показываем ТОЛЬКО если поведение подозрительное
  if (showModal) {
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
            Пожалуйста, пройдите проверку, чтобы продолжить
          </p>

          <div className="captchaGateWidget">
            {status === "loading" && (
              <div className="captchaGateLoading">
                <div className="captchaGateSpinner" />
                <span>Проверка...</span>
              </div>
            )}

            {status === "error" && (
              <div className="captchaGateError">
                <p>{errorMsg}</p>
                <button
                  className="captchaGateRetryBtn"
                  onClick={() => {
                    setStatus("blocked");
                    setErrorMsg("");
                    if (widgetIdRef.current != null && window.smartCaptcha) {
                      window.smartCaptcha.reset(widgetIdRef.current);
                    }
                  }}
                >
                  Попробовать снова
                </button>
              </div>
            )}

            {status === "blocked" && (
              <div ref={containerRef} className="smartcaptchaContainer" />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fallback — показываем контент
  return <>{children}</>;
}
