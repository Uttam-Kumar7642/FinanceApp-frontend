import axios from 'axios';

// Hardcoded backend URL — no env var dependency
const BACKEND = 'https://financeapp-backend-xwai.onrender.com';

const api = axios.create({
  baseURL: `${BACKEND}/api`,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register:      (data) => api.post('/auth/register', data),
  login:         (data) => api.post('/auth/login', data),
  me:            ()     => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const transactionAPI = {
  getAll:     (params)   => api.get('/transactions', { params }),
  create:     (data)     => api.post('/transactions', data),
  update:     (id, data) => api.put(`/transactions/${id}`, data),
  delete:     (id)       => api.delete(`/transactions/${id}`),
  getSummary: (params)   => api.get('/transactions/summary', { params }),
};

export const budgetAPI = {
  getAll:     ()      => api.get('/budgets'),
  getByMonth: (month) => api.get(`/budgets/${month}`),
  save:       (data)  => api.post('/budgets', data),
  delete:     (id)    => api.delete(`/budgets/${id}`),
};

export const dashboardAPI = {
  getOverview: () => api.get('/dashboard/overview'),
};

export default api;
