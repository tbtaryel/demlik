import axios from 'axios';

const rawBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:4000/api';
const normalizeBase = (url) => {
  try {
    let u = String(url || '').trim();
    if (!u) return 'http://localhost:4000/api';
    if (u.endsWith('/')) u = u.slice(0, -1);
    if (!/\/api$/.test(u)) u = `${u}/api`;
    return u;
  } catch (_) {
    return 'http://localhost:4000/api';
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