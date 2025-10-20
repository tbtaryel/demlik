import axios from 'axios';

// Prefer env var; if missing, fall back to same-origin
const rawBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || '';
const normalizeBase = (url) => {
  try {
    let u = String(url || '').trim();
    if (!u) {
      const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'http://localhost:4000';
      return `${origin}/api`;
    }
    if (u.endsWith('/')) u = u.slice(0, -1);
    if (!/\/api$/.test(u)) u = `${u}/api`;
    return u;
  } catch (_) {
    const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'http://localhost:4000';
    return `${origin}/api`;
  }
};
const baseURL = normalizeBase(rawBase);
const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err.response?.status;
    if (status === 401 || status === 403) {
      const path = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '';
      const isAdminArea = path.startsWith('/admin');
      location.href = isAdminArea ? '/admin-login' : '/login';
    }
    return Promise.reject(err);
  }
);

export default api;