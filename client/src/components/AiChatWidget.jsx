import React, { useState } from "react";
import { Bot, Loader2, MessageCircle, Send, X } from "lucide-react";
import { aiChatApi } from "../api/aiChatApi";

const welcomeMessage = {
  id: "welcome",
  role: "assistant",
  text: "Здравствуйте! Я ИИ-ассистент SkillFlow. Помогу выбрать курс, найти урок или разобраться с прогрессом.",
};

const getFriendlyErrorMessage = (error) => {
  if (error.message === "AI service is not configured") {
    return "ИИ-ассистент ещё не настроен. Добавьте ключ Groq на backend.";
  }

  if (error.message === "AI assistant is temporarily unavailable") {
    return "ИИ-ассистент временно недоступен. Попробуйте ещё раз чуть позже.";
  }

  if (error.message === "Message is required") {
    return "Напишите сообщение, чтобы ассистент смог ответить.";
  }

  return "Не удалось получить ответ ассистента. Попробуйте ещё раз.";
};

export default function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([welcomeMessage]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const sendMessage = async (event) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text,
    };

    setMessages((current) => [...current, userMessage]);
    setMessage("");
    setError("");
    setIsLoading(true);

    try {
      const response = await aiChatApi.sendMessage(text);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: response.reply,
        },
      ]);
    } catch (requestError) {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          text: getFriendlyErrorMessage(requestError),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-chat">
      {isOpen && (
        <section className="ai-chat__panel" aria-label="AI chat">
          <header className="ai-chat__header">
            <div>
              <Bot size={20} />
              <span>SkillFlow AI</span>
            </div>
            <button className="ai-chat__icon" onClick={() => setIsOpen(false)} title="Закрыть чат">
              <X size={18} />
            </button>
          </header>

          <div className="ai-chat__messages">
            {messages.map((item) => (
              <div className={`ai-chat__message ai-chat__message--${item.role}`} key={item.id}>
                {item.text}
              </div>
            ))}
            {isLoading && (
              <div className="ai-chat__message ai-chat__message--assistant ai-chat__loading">
                <Loader2 size={16} />
                Думаю над ответом...
              </div>
            )}
            {error && <div className="ai-chat__error">{error}</div>}
          </div>

          <form className="ai-chat__form" onSubmit={sendMessage}>
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Спросите про курсы..."
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !message.trim()} title="Отправить">
              <Send size={18} />
            </button>
          </form>
        </section>
      )}

      <button className="ai-chat__toggle" onClick={() => setIsOpen((current) => !current)} title="Открыть AI чат">
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
