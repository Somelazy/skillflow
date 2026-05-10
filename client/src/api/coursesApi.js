import { apiRequest } from "./api";

export const coursesApi = {
  getAll: () => apiRequest("/courses"),
  getById: (id) => apiRequest(`/courses/${id}`),
  getLesson: (id) => apiRequest(`/lessons/${id}`),
  create: (payload) => apiRequest("/courses", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => apiRequest(`/courses/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  remove: (id) => apiRequest(`/courses/${id}`, { method: "DELETE" }),
  createModule: (courseId, payload) => apiRequest(`/courses/${courseId}/modules`, { method: "POST", body: JSON.stringify(payload) }),
  updateModule: (id, payload) => apiRequest(`/modules/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  removeModule: (id) => apiRequest(`/modules/${id}`, { method: "DELETE" }),
  createLesson: (moduleId, payload) => apiRequest(`/modules/${moduleId}/lessons`, { method: "POST", body: JSON.stringify(payload) }),
  updateLesson: (id, payload) => apiRequest(`/lessons/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  removeLesson: (id) => apiRequest(`/lessons/${id}`, { method: "DELETE" }),
  createAssignment: (lessonId, payload) => apiRequest(`/lessons/${lessonId}/assignments`, { method: "POST", body: JSON.stringify(payload) }),
  updateAssignment: (id, payload) => apiRequest(`/assignments/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  removeAssignment: (id) => apiRequest(`/assignments/${id}`, { method: "DELETE" }),
  createResource: (lessonId, payload) => apiRequest(`/lessons/${lessonId}/resources`, { method: "POST", body: JSON.stringify(payload) }),
  removeResource: (id) => apiRequest(`/resources/${id}`, { method: "DELETE" }),
};
