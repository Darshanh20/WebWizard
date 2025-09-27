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
