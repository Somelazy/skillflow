import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bot, MessageCircle, RotateCcw, Send, Sparkles, Trash2, X } from "lucide-react";
import { useLocation, useParams } from "react-router-dom";
import { aiChatApi } from "../api/aiChatApi";

const STORAGE_KEY = "skillflow_ai_chat_history";
const MAX_MESSAGE_LENGTH = 2000;
const MAX_STORED_MESSAGES = 30;
const HISTORY_CONTEXT_LIMIT = 10;

const welcomeMessage = {
  id: "welcome",
  role: "assistant",
  text: "Здравствуйте! Я ИИ-ассистент SkillFlow. Помогу выбрать курс, разобраться с уроком, заданием или прогрессом.",
  createdAt: new Date().toISOString(),
};

const quickPrompts = [
  "Помоги выбрать курс",
  "Объясни текущий урок",
  "Составь план обучения",
  "Как выполнить задание?",
];

const getFriendlyErrorMessage = (error) => {
  if (error.message === "AI service is not configured") {
    return "ИИ-ассистент ещё не настроен. Проверьте ключ Groq на backend.";
  }

  if (error.message === "AI assistant is temporarily unavailable") {
    return "ИИ-ассистент временно недоступен. Попробуйте ещё раз чуть позже.";
  }

  if (error.message === "Message is required") {
    return "Напишите сообщение, чтобы ассистент смог ответить.";
  }

  if (error.message === "Message is too long") {
    return `Сообщение слишком длинное. Сократите его до ${MAX_MESSAGE_LENGTH} символов.`;
  }

  if (error.message === "Too many requests. Please try again later.") {
    return "Слишком много запросов подряд. Подождите немного и попробуйте снова.";
  }

  return "Не удалось получить ответ ассистента. Проверьте соединение и попробуйте ещё раз.";
};

const formatTime = (dateValue) =>
  new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateValue || Date.now()));

const getInitialMessages = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(saved) && saved.length) {
      return saved.slice(-MAX_STORED_MESSAGES);
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  return [welcomeMessage];
};

const normalizeForHistory = (messages) =>
  messages
    .filter((item) => ["user", "assistant"].includes(item.role) && item.id !== "welcome" && !item.isError)
    .slice(-HISTORY_CONTEXT_LIMIT)
    .map((item) => ({
      role: item.role,
      content: item.text,
    }));

const parseMessageParts = (text) => {
  const parts = [];
  const pattern = /```([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }

    parts.push({ type: "code", value: match[1].replace(/^\w+\n/, "").trim() });
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts.length ? parts : [{ type: "text", value: text }];
};

function MessageContent({ text }) {
  return (
    <>
      {parseMessageParts(text).map((part, index) =>
        part.type === "code" ? (
          <pre className="ai-chat__code" key={`${part.type}-${index}`}>
            <code>{part.value}</code>
          </pre>
        ) : (
          <span className="ai-chat__text" key={`${part.type}-${index}`}>
            {part.value}
          </span>
        )
      )}
    </>
  );
}

export default function AiChatWidget() {
  const location = useLocation();
  const params = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(getInitialMessages);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const pageContext = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const lessonMatch = location.pathname.match(/^\/lessons\/([^/]+)/);
    const courseMatch = location.pathname.match(/^\/(?:courses|learn)\/([^/]+)/);

    return {
      path: `${location.pathname}${location.search}`,
      courseId: searchParams.get("course") || courseMatch?.[1] || params.id || undefined,
      lessonId: lessonMatch?.[1] || undefined,
    };
  }, [location.pathname, location.search, params.id]);

  const lastUserMessage = [...messages].reverse().find((item) => item.role === "user");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)));
  }, [messages]);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading, isOpen]);

  const appendAssistantError = (error, sourceText) => {
    setMessages((current) => [
      ...current,
      {
        id: `assistant-error-${Date.now()}`,
        role: "assistant",
        text: getFriendlyErrorMessage(error),
        createdAt: new Date().toISOString(),
        isError: true,
        retryText: sourceText,
      },
    ]);
  };

  const submitMessage = async (text) => {
    const cleanText = text.trim();
    if (!cleanText || isLoading) return;

    if (cleanText.length > MAX_MESSAGE_LENGTH) {
      appendAssistantError(new Error("Message is too long"), cleanText);
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: cleanText,
      createdAt: new Date().toISOString(),
    };

    const history = normalizeForHistory([...messages, userMessage]);

    setMessages((current) => [...current, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await aiChatApi.sendMessage({
        message: cleanText,
        history,
        context: pageContext,
      });

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: response.reply,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (requestError) {
      appendAssistantError(requestError, cleanText);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    await submitMessage(message);
  };

  const clearHistory = () => {
    setMessages([welcomeMessage]);
    setMessage("");
    localStorage.removeItem(STORAGE_KEY);
  };

  const retryMessage = async (text) => {
    await submitMessage(text || lastUserMessage?.text || "");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const handleChange = (event) => {
    setMessage(event.target.value.slice(0, MAX_MESSAGE_LENGTH));
  };

  return (
    <div className="ai-chat">
      {isOpen && (
        <section className="ai-chat__panel" aria-label="AI chat">
          <header className="ai-chat__header">
            <div className="ai-chat__title">
              <span className="ai-chat__bot">
                <Bot size={20} />
              </span>
              <div>
                <strong>SkillFlow AI</strong>
                <small>Помощник по обучению</small>
              </div>
            </div>
            <div className="ai-chat__header-actions">
              <button className="ai-chat__icon" onClick={clearHistory} title="Очистить чат" type="button">
                <Trash2 size={17} />
              </button>
              <button className="ai-chat__icon" onClick={() => setIsOpen(false)} title="Закрыть чат" type="button">
                <X size={18} />
              </button>
            </div>
          </header>

          <div className="ai-chat__messages">
            {messages.length <= 1 && (
              <div className="ai-chat__quick">
                <div>
                  <Sparkles size={18} />
                  <span>Быстрый старт</span>
                </div>
                {quickPrompts.map((prompt) => (
                  <button key={prompt} type="button" onClick={() => submitMessage(prompt)} disabled={isLoading}>
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {messages.map((item) => (
              <div className={`ai-chat__message-row ai-chat__message-row--${item.role}`} key={item.id}>
                <div className={`ai-chat__message ai-chat__message--${item.role} ${item.isError ? "ai-chat__message--error" : ""}`.trim()}>
                  <MessageContent text={item.text} />
                  <time>{formatTime(item.createdAt)}</time>
                  {item.isError && item.retryText && (
                    <button className="ai-chat__retry" type="button" onClick={() => retryMessage(item.retryText)} disabled={isLoading}>
                      <RotateCcw size={14} />
                      Повторить
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="ai-chat__message-row ai-chat__message-row--assistant">
                <div className="ai-chat__message ai-chat__message--assistant ai-chat__loading">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="ai-chat__form" onSubmit={sendMessage}>
            <label className="ai-chat__input-wrap">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Спросите про курсы, урок или задание..."
                disabled={isLoading}
                rows={2}
                maxLength={MAX_MESSAGE_LENGTH}
              />
              <span>{message.length}/{MAX_MESSAGE_LENGTH}</span>
            </label>
            <button type="submit" disabled={isLoading || !message.trim()} title="Отправить">
              <Send size={18} />
            </button>
          </form>
        </section>
      )}

      <button className="ai-chat__toggle" onClick={() => setIsOpen((current) => !current)} title="Открыть AI чат" type="button">
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
