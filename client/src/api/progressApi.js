import { apiRequest } from "./api";

export const progressApi = {
  getMe: () => apiRequest("/progress/me"),
  getCourse: (courseId) => apiRequest(`/progress/me/course/${courseId}`),
  startLesson: (lessonId) => apiRequest(`/progress/lesson/${lessonId}/start`, { method: "POST" }),
  completeLesson: (lessonId, score) =>
    apiRequest(`/progress/lesson/${lessonId}/complete`, { method: "POST", body: JSON.stringify({ score }) }),
  updateLesson: (lessonId, payload) =>
    apiRequest(`/progress/lesson/${lessonId}`, { method: "PUT", body: JSON.stringify(payload) }),
};

