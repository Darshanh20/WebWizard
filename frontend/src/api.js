import axios from "axios";

export const API = axios.create({
  baseURL: "http://localhost:5000/api", // your backend
});

// attach token if exists
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Event methods
export const EventAPI = {
  // Get single event
  getEvent: (id) => API.get(`/events/${id}`),
  
  // Update event
  updateEvent: (id, eventData) => API.put(`/events/${id}`, eventData),
  
  // Delete event
  deleteEvent: (id) => API.delete(`/events/${id}`),
  
  // Register for event
  register: (id, data) => API.post(`/events/${id}/register`, data),
  
  // Unregister from event
  unregister: (id) => API.post(`/events/${id}/unregister`),
};
