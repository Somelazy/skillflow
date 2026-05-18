const {
  createAiReply,
  AiServiceNotConfiguredError,
  AiServiceUnavailableError,
} = require("../services/aiChat.service");

const MAX_MESSAGE_LENGTH = 2000;

const sendMessage = async (req, res) => {
  const { message, history, context } = req.body;
  const normalizedMessage = String(message || "").trim();

  if (!normalizedMessage) {
    return res.status(400).json({ error: "Message is required" });
  }

  if (normalizedMessage.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: "Message is too long" });
  }

  try {
    const reply = await createAiReply({
      message: normalizedMessage,
      history,
      context,
    });
    res.json({ reply });
  } catch (error) {
    if (error instanceof AiServiceNotConfiguredError) {
      return res.status(500).json({ error: "AI service is not configured" });
    }

    if (error instanceof AiServiceUnavailableError) {
      return res.status(503).json({ error: "AI assistant is temporarily unavailable" });
    }

    throw error;
  }
};

module.exports = { sendMessage };
