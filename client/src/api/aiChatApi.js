import { apiRequest } from "./api";

export const aiChatApi = {
  sendMessage: (payload) => {
    const body = typeof payload === "string" ? { message: payload } : payload;

    return apiRequest("/ai-chat", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
};
