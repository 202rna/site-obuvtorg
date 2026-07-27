import { useState, useRef, useEffect } from "react";
import "./ChatWidget.css";

const API_URL = "/api";

const INITIAL_MESSAGE = {
  role: "assistant",
  content:
    "👋 Здравствуйте! Я консультант магазина «Обувьторг». Задайте мне любой вопрос о товарах, акциях или ассортименте — я с радостью помогу!",
};

export default function ChatWidget({ isOpen, onClose }) {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem("chat_messages");
      return saved ? JSON.parse(saved) : [INITIAL_MESSAGE];
    } catch {
      return [INITIAL_MESSAGE];
    }
  });
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    try {
      sessionStorage.setItem("chat_messages", JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const userText = inputText.trim();
    if (!userText || isLoading) return;

    const userMessage = { role: "user", content: userText };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.content,
            recommendedProducts: data.recommended_products || [],
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Извините, произошла ошибка при обращении к AI-консультанту. Попробуйте позже.",
            recommendedProducts: [],
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Извините, не удалось связаться с сервером. Проверьте подключение к интернету.",
          recommendedProducts: [],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function renderMessageContent(content) {
    const parts = content.split(/(\[.*?\]\(https?:\/\/[^\s)]+\))/g);
    return parts.map((part, index) => {
      const linkMatch = part.match(/^\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/);
      if (linkMatch) {
        return (
          <a
            key={index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="productLink"
          >
            {linkMatch[1]}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  }

  function renderProductCards(products) {
    if (!products || products.length === 0) return null;

    return (
      <div className="productCards">
        {products.map((product) => {
          const imageUrl = product.image_url
            ? product.image_url.startsWith("http")
              ? product.image_url
              : product.image_url.startsWith("/static/")
                ? product.image_url
                : `/static/uploads/${product.image_url}`
            : null;

          return (
            <a
              key={product.id}
              href={product.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="productCard"
            >
              {imageUrl && (
                <div className="productCardImage">
                  <img
                    src={imageUrl}
                    alt={product.title}
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )}
              <div className="productCardInfo">
                <div className="productCardTitle">{product.title}</div>
                <div className="productCardPrice">
                  {product.discount > 0 ? (
                    <>
                      <span className="oldPrice">
                        {product.price.toLocaleString()} ₽
                      </span>
                      <span className="finalPrice">
                        {product.final_price.toLocaleString()} ₽
                      </span>
                      <span className="discountBadge">-{product.discount}%</span>
                    </>
                  ) : (
                    <span className="finalPrice">
                      {product.price.toLocaleString()} ₽
                    </span>
                  )}
                </div>
              </div>
            </a>
          );
        })}
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="chatPanel">
      {/* Шапка */}
      <div className="chatHeader">
        <div className="chatHeaderLeft">
          <div className="chatHeaderAvatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="chatHeaderInfo">
            <div className="chatHeaderTitle">AI Консультант</div>
            <div className="chatHeaderStatus">Онлайн</div>
          </div>
        </div>
        <button
          className="closeButton"
          onClick={onClose}
          aria-label="Закрыть"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Сообщения */}
      <div className="messagesContainer">
        {messages.map((msg, index) => (
          <div key={index}>
            <div
              className={`message ${
                msg.role === "assistant" ? "assistantMessage" : "userMessage"
              }`}
            >
              <div className="messageBubble">
                {renderMessageContent(msg.content)}
              </div>
            </div>
            {msg.role === "assistant" &&
              msg.recommendedProducts &&
              msg.recommendedProducts.length > 0 &&
              renderProductCards(msg.recommendedProducts)}
          </div>
        ))}
        {isLoading && (
          <div className="message assistantMessage">
            <div className="messageBubble">
              <div className="typingIndicator">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода */}
      <div className="inputContainer">
        <textarea
          className="textInput"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Напишите сообщение..."
          rows={1}
          disabled={isLoading}
        />
        <button
          className="sendButton"
          onClick={handleSend}
          disabled={!inputText.trim() || isLoading}
          aria-label="Отправить"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}