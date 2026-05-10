const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant";
const FALLBACK_MODELS = ["llama-3.1-8b-instant", "llama-3.3-70b-versatile"];

const systemPrompt =
  "Ты ИИ-ассистент образовательной платформы SkillFlow. Помогай пользователям подобрать курс, понять структуру курса, разобраться с уроками, заданиями, прогрессом и профилем. Отвечай кратко, понятно и дружелюбно. Если вопрос не связан с платформой или обучением, всё равно помоги, но мягко верни пользователя к теме обучения.";

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

const getCandidateModels = () => {
  const configuredModel = process.env.GROQ_MODEL?.trim();
  return [...new Set([configuredModel, DEFAULT_GROQ_MODEL, ...FALLBACK_MODELS].filter(Boolean))];
};

const requestCompletion = async ({ apiKey, model, message }) => {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: String(message).trim() },
      ],
      temperature: 0.4,
      max_completion_tokens: 500,
    }),
  });

  const bodyText = await response.text();
  let data = null;

  try {
    data = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    data = null;
  }

  return { response, data, bodyText };
};

const createAiReply = async (message) => {
  const apiKey = process.env.GROQ_API_KEY?.trim();

  if (!apiKey) {
    throw new AiServiceNotConfiguredError();
  }

  const models = getCandidateModels();
  let sawAuthError = false;

  for (const model of models) {
    const { response, data, bodyText } = await requestCompletion({ apiKey, model, message });

    if (response.ok) {
      const reply = data?.choices?.[0]?.message?.content?.trim();

      if (reply) {
        return reply;
      }

      console.error(`Groq returned an empty reply for model "${model}".`, data || bodyText);
      continue;
    }

    const providerMessage = data?.error?.message || bodyText || `HTTP ${response.status}`;
    console.error(`Groq request failed for model "${model}" with status ${response.status}: ${providerMessage}`);

    if (response.status === 401) {
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
