import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const adminApi = {
  auth: {
    login: (email: string, password: string) =>
      api.post('/auth/login', { email, password }),
    me: () => api.get('/auth/me'),
  },
  dashboard: {
    getStats: () => api.get('/admin/dashboard/stats'),
    getRevenueChart: (days: number = 30) =>
      api.get(`/admin/dashboard/revenue-chart?days=${days}`),
    getUserGrowthChart: (days: number = 30) =>
      api.get(`/admin/dashboard/user-growth-chart?days=${days}`),
    getTopUsers: (limit: number = 10) =>
      api.get(`/admin/dashboard/top-users?limit=${limit}`),
    getRecentSignups: (limit: number = 10) =>
      api.get(`/admin/dashboard/recent-signups?limit=${limit}`),
    getRecentUpgrades: (limit: number = 10) =>
      api.get(`/admin/dashboard/recent-upgrades?limit=${limit}`),
    getActiveUsersChart: (hours: number = 24) =>
      api.get(`/admin/dashboard/active-users-chart?hours=${hours}`),
    getCurrentlyActive: (limit: number = 20) =>
      api.get(`/admin/dashboard/currently-active?limit=${limit}`),
    getRecentlyActive: (limit: number = 20) =>
      api.get(`/admin/dashboard/recently-active?limit=${limit}`),
  },
  users: {
    list: (page: number = 1, limit: number = 20, search?: string, filter?: string) =>
      api.get('/admin/users', { params: { page, limit, search, filter } }),
    get: (id: string) => api.get(`/admin/users/${id}`),
    update: (id: string, data: any) => api.put(`/admin/users/${id}`, data),
    delete: (id: string) => api.delete(`/admin/users/${id}`),
    subscriptionOverride: (id: string, tier: 'free' | 'pro' | 'team') =>
      api.post(`/admin/users/${id}/subscription-override`, { tier }),
    invite: (data: {
      email: string;
      name: string;
      sendEmail?: boolean;
      tier?: 'free' | 'pro' | 'team';
      isAdmin?: boolean;
    }) => api.post('/admin/users/invite', data),
  },
  subscriptions: {
    list: (page: number = 1, limit: number = 20, filter?: string) =>
      api.get('/admin/subscriptions', { params: { page, limit, filter } }),
    get: (id: string) => api.get(`/admin/subscriptions/${id}`),
    cancel: (id: string) => api.post(`/admin/subscriptions/${id}/cancel`),
  },
  diagrams: {
    list: (page: number = 1, limit: number = 20, search?: string) =>
      api.get('/admin/diagrams', { params: { page, limit, search } }),
    get: (id: string) => api.get(`/admin/diagrams/${id}`),
    delete: (id: string) => api.delete(`/admin/diagrams/${id}`),
    fixCollaborators: () => api.post('/admin/diagrams/fix-collaborators'),
  },
  auditLogs: {
    list: (
      page: number = 1,
      limit: number = 50,
      adminId?: string,
      action?: string,
      targetType?: string
    ) =>
      api.get('/admin/audit-logs', {
        params: { page, limit, adminId, action, targetType },
      }),
  },
};
