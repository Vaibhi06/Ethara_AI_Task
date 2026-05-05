import axios from 'axios';

const api = axios.create({
  // In production (Railway): VITE_API_URL is not set → use relative URL '/api'
  // In development (local): VITE_API_URL=http://localhost:5000 → use full URL
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
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
      delete api.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// ── Projects ──────────────────────────────────────────────────
export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
};

// ── Tasks ─────────────────────────────────────────────────────
export const tasksAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getOne: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  delete: (id) => api.delete(`/tasks/${id}`),
};

// ── Dashboard ─────────────────────────────────────────────────
export const dashboardAPI = {
  stats: () => api.get('/dashboard/stats'),
  overdue: () => api.get('/dashboard/overdue'),
};

// ── Users ─────────────────────────────────────────────────────
export const usersAPI = {
  getAll: () => api.get('/users'),
  getOne: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
};

export default api;
