import axios from 'axios';

const api = axios.create({
  baseURL: '',
});

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/* ---- Auth ---- */
export const register = async (username, email, password) => {
  const res = await api.post('/api/register', { username, email, password });
  return res.data.data || res.data;
};

export const login = async (username, password) => {
  const res = await api.post('/api/login', { username, password });
  const payload = res.data.data || res.data;
  if (payload.token) {
    localStorage.setItem('token', payload.token);
    localStorage.setItem('user', JSON.stringify(payload.user));
  }
  return payload;
};

export const logout = async () => {
  try {
    await api.post('/api/logout');
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

/* ---- Prediction ---- */
export const predict = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/api/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data || res.data;
};

/* ---- History ---- */
export const getHistory = async (params = {}) => {
  const res = await api.get('/api/history', { params });
  return res.data.data || res.data;
};

export const getHistoryItem = async (id) => {
  const res = await api.get(`/api/history/${id}`);
  return res.data.data || res.data;
};

export const deleteHistory = async (id) => {
  const res = await api.delete(`/api/history/${id}`);
  return res.data.data || res.data;
};

/* ---- Dashboard & Analytics ---- */
export const getDashboard = async () => {
  const res = await api.get('/api/dashboard');
  return res.data.data || res.data;
};

export const getAnalytics = async () => {
  const res = await api.get('/api/analytics');
  return res.data.data || res.data;
};

/* ---- Model Info ---- */
export const getModelInfo = async () => {
  const res = await api.get('/api/model-info');
  return res.data.data || res.data;
};

/* ---- Health ---- */
export const healthCheck = async () => {
  const res = await api.get('/api/health');
  return res.data.data || res.data;
};

export default api;
