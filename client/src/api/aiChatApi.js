import { apiRequest } from "./api";

export const aiChatApi = {
  sendMessage: (message) =>
    apiRequest("/ai-chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
};

