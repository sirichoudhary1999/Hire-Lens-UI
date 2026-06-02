import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

const api = axios.create({
  baseURL: API_BASE,
});

export default api;
