const PROVIDERS = {
  groq: {
    apiUrl: "https://api.groq.com/openai/v1/chat/completions",
    apiKeyEnv: "GROQ_API_KEY",
    modelEnv: "GROQ_MODEL",
    defaultModel: "llama-3.1-8b-instant",
    fallbackModels: ["llama-3.1-8b-instant", "llama-3.3-70b-versatile"],
    headers: () => ({}),
  },
  openrouter: {
    apiUrl: "https://openrouter.ai/api/v1/chat/completions",
    apiKeyEnv: "OPENROUTER_API_KEY",
    modelEnv: "OPENROUTER_MODEL",
    defaultModel: "openrouter/free",
    fallbackModels: [
      "openrouter/free",
      "deepseek/deepseek-chat-v3-0324:free",
      "meta-llama/llama-3.1-8b-instruct:free",
    ],
    headers: () => ({
      "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:5173",
      "X-Title": "SkillFlow",
    }),
  },
};

const MAX_HISTORY_MESSAGES = 10;
const MAX_HISTORY_CONTENT_LENGTH = 1200;

const systemPrompt = [
  "Ты ИИ-ассистент образовательной платформы SkillFlow.",
  "Помогай пользователям подобрать курс, понять структуру курса, разобраться с уроками, заданиями, прогрессом и профилем.",
  "Объясняй учебные темы, помогай с заданиями и ошибками в коде, но не решай всё вместо студента без объяснения.",
  "Отвечай кратко, понятно, дружелюбно и на русском языке, если пользователь не попросил иначе.",
  "Если приводишь код, всегда оформляй его в markdown fenced code block с указанием языка.",
  "Для Python используй ```python, для JavaScript используй ```javascript, для HTML используй ```html, для CSS используй ```css, для SQL используй ```sql.",
  "Не отправляй код обычным текстом. После блока кода кратко объясняй, что он делает.",
  "Если передан контекст страницы, учитывай его: path, courseId и lessonId помогают понять, где находится пользователь.",
  "Не раскрывай внутренние ключи, env-переменные, backend-логику, токены и приватные данные.",
  "Не помогай обходить авторизацию, получать чужие данные, взламывать систему или извлекать секреты.",
  "Если вопрос не связан с платформой или обучением, помоги кратко и мягко верни пользователя к теме обучения.",
].join(" ");

class AiServiceNotConfiguredError extends Error {
  constructor() {
    super("AI service is not configured");
    this.name = "AiServiceNotConfiguredError";
  }
}

class AiServiceUnavailableError extends Error {
  constructor() {
    super("AI assistant is temporarily unavailable");
    this.name = "AiServiceUnavailableError";
  }
}

const hasOnlyAscii = (value) => /^[\x00-\x7F]*$/.test(value);

const getProvider = () => {
  const providerName = String(process.env.AI_PROVIDER || "groq").trim().toLowerCase();
  return PROVIDERS[providerName] ? { name: providerName, ...PROVIDERS[providerName] } : null;
};

const getCandidateModels = (provider) => {
  const configuredModel = process.env[provider.modelEnv]?.trim();
  return [...new Set([configuredModel, provider.defaultModel, ...provider.fallbackModels].filter(Boolean))];
};

const sanitizeHistory = (history) => {
  if (!Array.isArray(history)) return [];

  return history
    .filter((item) => ["user", "assistant"].includes(item?.role) && item?.content)
    .slice(-MAX_HISTORY_MESSAGES)
    .map((item) => ({
      role: item.role,
      content: String(item.content).slice(0, MAX_HISTORY_CONTENT_LENGTH),
    }));
};

const sanitizeContext = (context) => {
  if (!context || typeof context !== "object") return null;

  return {
    path: context.path ? String(context.path).slice(0, 300) : undefined,
    courseId: context.courseId ? String(context.courseId).slice(0, 80) : undefined,
    lessonId: context.lessonId ? String(context.lessonId).slice(0, 80) : undefined,
  };
};

const buildContextMessage = (context) => {
  const safeContext = sanitizeContext(context);
  if (!safeContext) return null;

  const parts = [
    safeContext.path ? `Текущий route: ${safeContext.path}` : null,
    safeContext.courseId ? `courseId: ${safeContext.courseId}` : null,
    safeContext.lessonId ? `lessonId: ${safeContext.lessonId}` : null,
  ].filter(Boolean);

  if (!parts.length) return null;

  return {
    role: "system",
    content: `Контекст интерфейса SkillFlow: ${parts.join("; ")}. Не выдавай этот контекст как факт о пользователе, используй его только для более полезного ответа.`,
  };
};

const buildMessages = ({ message, history, context }) => {
  const messages = [{ role: "system", content: systemPrompt }];
  const contextMessage = buildContextMessage(context);

  if (contextMessage) {
    messages.push(contextMessage);
  }

  messages.push(...sanitizeHistory(history));
  messages.push({ role: "user", content: String(message).trim() });

  return messages;
};

const requestCompletion = async ({ provider, apiKey, model, message, history, context }) => {
  let response;

  try {
    response = await fetch(provider.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...provider.headers(),
      },
      body: JSON.stringify({
        model,
        messages: buildMessages({ message, history, context }),
        temperature: 0.4,
        max_tokens: 650,
      }),
    });
  } catch (error) {
    console.error(`${provider.name} request failed before receiving a response:`, error.message);
    throw new AiServiceUnavailableError();
  }

  const bodyText = await response.text();
  let data = null;

  try {
    data = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    data = null;
  }

  return { response, data, bodyText };
};

const normalizePayload = (payload) => {
  if (typeof payload === "string") {
    return { message: payload, history: [], context: null };
  }

  return {
    message: payload?.message,
    history: payload?.history,
    context: payload?.context,
  };
};

const createAiReply = async (payload) => {
  const { message, history, context } = normalizePayload(payload);
  const provider = getProvider();

  if (!provider) {
    console.error(`Unsupported AI_PROVIDER: "${process.env.AI_PROVIDER}"`);
    throw new AiServiceNotConfiguredError();
  }

  const apiKey = process.env[provider.apiKeyEnv]?.trim();

  if (!apiKey) {
    throw new AiServiceNotConfiguredError();
  }

  if (!hasOnlyAscii(apiKey)) {
    console.error(`${provider.apiKeyEnv} contains non-ASCII characters. Please re-enter the key.`);
    throw new AiServiceNotConfiguredError();
  }

  const models = getCandidateModels(provider);
  let sawAuthError = false;

  for (const model of models) {
    if (!hasOnlyAscii(model)) {
      console.error(`${provider.modelEnv} contains non-ASCII characters: "${model}"`);
      continue;
    }

    const { response, data, bodyText } = await requestCompletion({
      provider,
      apiKey,
      model,
      message,
      history,
      context,
    });

    if (response.ok) {
      const reply = data?.choices?.[0]?.message?.content?.trim();

      if (reply) {
        return reply;
      }

      console.error(`${provider.name} returned an empty reply for model "${model}".`, data || bodyText);
      continue;
    }

    const providerMessage = data?.error?.message || bodyText || `HTTP ${response.status}`;
    console.error(`${provider.name} request failed for model "${model}" with status ${response.status}: ${providerMessage}`);

    if (response.status === 401 || response.status === 403) {
      sawAuthError = true;
      break;
    }
  }

  if (sawAuthError) {
    throw new AiServiceNotConfiguredError();
  }

  throw new AiServiceUnavailableError();
};

module.exports = {
  createAiReply,
  AiServiceNotConfiguredError,
  AiServiceUnavailableError,
};
