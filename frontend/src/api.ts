import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://scalabrinianos.dev.connectortech.com.br/api/';
const api = axios.create({
  baseURL: API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL,
});

export const getFileUrl = (path: string | null) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  
  // Use the full API_URL (which includes /api) to ensure the proxy handles it correctly
  const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
