const {
  createAiReply,
  AiServiceNotConfiguredError,
  AiServiceUnavailableError,
} = require("../services/aiChat.service");

const sendMessage = async (req, res) => {
  const { message } = req.body;

  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const reply = await createAiReply(message);
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
