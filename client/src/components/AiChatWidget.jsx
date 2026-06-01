import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Check, Clipboard, MessageCircle, RotateCcw, Send, Sparkles, Trash2, X } from "lucide-react";
import { useLocation, useParams } from "react-router-dom";
import { aiChatApi } from "../api/aiChatApi";

const STORAGE_KEY = "skillflow_ai_chat_history";
const SIZE_STORAGE_KEY = "skillflow_ai_chat_size";
const MAX_MESSAGE_LENGTH = 2000;
const MAX_STORED_MESSAGES = 30;
const HISTORY_CONTEXT_LIMIT = 10;
const DEFAULT_CHAT_SIZE = { width: 430, height: 620 };
const CHAT_SIZE_LIMITS = {
  minWidth: 340,
  maxWidth: 760,
  minHeight: 420,
  maxHeight: 820,
};

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
    return "ИИ-ассистент ещё не настроен. Проверьте ключ AI-провайдера на backend.";
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

const clampValue = (value, min, max) => Math.min(Math.max(value, min), max);

const getIsCompactChat = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 720px)").matches;

const clampChatSize = (size = DEFAULT_CHAT_SIZE) => {
  if (typeof window === "undefined") {
    return DEFAULT_CHAT_SIZE;
  }

  const maxWidth = Math.max(CHAT_SIZE_LIMITS.minWidth, Math.min(CHAT_SIZE_LIMITS.maxWidth, window.innerWidth - 32));
  const maxHeight = Math.max(CHAT_SIZE_LIMITS.minHeight, Math.min(CHAT_SIZE_LIMITS.maxHeight, window.innerHeight - 110));

  return {
    width: clampValue(Number(size.width) || DEFAULT_CHAT_SIZE.width, CHAT_SIZE_LIMITS.minWidth, maxWidth),
    height: clampValue(Number(size.height) || DEFAULT_CHAT_SIZE.height, CHAT_SIZE_LIMITS.minHeight, maxHeight),
  };
};

const getInitialChatSize = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(SIZE_STORAGE_KEY) || "null");
    if (saved?.width && saved?.height) {
      return clampChatSize(saved);
    }
  } catch {
    localStorage.removeItem(SIZE_STORAGE_KEY);
  }

  return clampChatSize(DEFAULT_CHAT_SIZE);
};

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

const parseMessageParts = (text = "") => {
  const parts = [];
  const pattern = /```([a-zA-Z0-9_-]+)?\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }

    parts.push({
      type: "code",
      language: match[1]?.trim() || "text",
      content: match[2].replace(/\n$/, ""),
    });
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  return parts.length ? parts : [{ type: "text", content: text }];
};

const parseInlineCode = (text = "") =>
  text.split(/(`[^`]+`)/g).filter(Boolean).map((chunk, index) => {
    if (chunk.startsWith("`") && chunk.endsWith("`")) {
      return (
        <code className="ai-chat__inline-code" key={`inline-${index}`}>
          {chunk.slice(1, -1)}
        </code>
      );
    }

    return <React.Fragment key={`text-${index}`}>{chunk}</React.Fragment>;
  });

const copyText = async (text) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
};

function CodeBlock({ language = "text", code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="ai-chat__code-block">
      <div className="ai-chat__code-header">
        <span className="ai-chat__code-lang">{language}</span>
        <button className="ai-chat__copy-code" type="button" onClick={handleCopy}>
          {copied ? <Check size={14} /> : <Clipboard size={14} />}
          {copied ? "Скопировано" : "Копировать"}
        </button>
      </div>
      <pre className="ai-chat__code-pre">
        <code className="ai-chat__code-code">{code}</code>
      </pre>
    </div>
  );
}

function MessageContent({ text }) {
  return (
    <div className="ai-chat__message-content">
      {parseMessageParts(text).map((part, index) =>
        part.type === "code" ? (
          <CodeBlock code={part.content} language={part.language} key={`code-${index}`} />
        ) : (
          <span className="ai-chat__text" key={`text-${index}`}>
            {parseInlineCode(part.content)}
          </span>
        )
      )}
    </div>
  );
}

export default function AiChatWidget() {
  const location = useLocation();
  const params = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(getInitialMessages);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatSize, setChatSize] = useState(getInitialChatSize);
  const [isCompactChat, setIsCompactChat] = useState(getIsCompactChat);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const resizeStateRef = useRef(null);

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
    localStorage.setItem(SIZE_STORAGE_KEY, JSON.stringify(chatSize));
  }, [chatSize]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 720px)");
    const updateCompactMode = () => {
      setIsCompactChat(mediaQuery.matches);
      setChatSize((current) => clampChatSize(current));
    };

    updateCompactMode();
    mediaQuery.addEventListener?.("change", updateCompactMode);
    mediaQuery.addListener?.(updateCompactMode);

    return () => {
      mediaQuery.removeEventListener?.("change", updateCompactMode);
      mediaQuery.removeListener?.(updateCompactMode);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    document.body.classList.toggle("ai-chat-mobile-open", isOpen && isCompactChat);
    return () => document.body.classList.remove("ai-chat-mobile-open");
  }, [isOpen, isCompactChat]);

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

  const handleChatResize = (event) => {
    if (!resizeStateRef.current) return;

    const nextSize = clampChatSize({
      width: resizeStateRef.current.width - (event.clientX - resizeStateRef.current.x),
      height: resizeStateRef.current.height - (event.clientY - resizeStateRef.current.y),
    });

    setChatSize(nextSize);
  };

  const stopChatResize = () => {
    resizeStateRef.current = null;
    document.body.classList.remove("ai-chat-resizing");
    window.removeEventListener("pointermove", handleChatResize);
    window.removeEventListener("pointerup", stopChatResize);
  };

  const startChatResize = (event) => {
    if (isCompactChat || event.button !== 0) return;

    event.preventDefault();
    resizeStateRef.current = {
      x: event.clientX,
      y: event.clientY,
      width: chatSize.width,
      height: chatSize.height,
    };
    document.body.classList.add("ai-chat-resizing");
    window.addEventListener("pointermove", handleChatResize);
    window.addEventListener("pointerup", stopChatResize, { once: true });
  };

  const resetChatSize = () => {
    setChatSize(clampChatSize(DEFAULT_CHAT_SIZE));
  };

  return (
    <div className="ai-chat">
      {isOpen && (
        <section className="ai-chat__panel" aria-label="AI chat" style={isCompactChat ? undefined : chatSize}>
          <button
            aria-label="Изменить размер окна чата"
            className="ai-chat__resize-handle"
            onDoubleClick={resetChatSize}
            onPointerDown={startChatResize}
            title="Потяните, чтобы изменить размер. Двойной клик сбросит размер."
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
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
