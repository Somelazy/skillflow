const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

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

const createAiReply = async (message) => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new AiServiceNotConfiguredError();
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: String(message).trim() },
      ],
      temperature: 0.4,
      max_completion_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new AiServiceUnavailableError();
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content?.trim();

  if (!reply) {
    throw new AiServiceUnavailableError();
  }

  return reply;
};

module.exports = {
  createAiReply,
  AiServiceNotConfiguredError,
  AiServiceUnavailableError,
};
