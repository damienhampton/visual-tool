import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  id: string;
  email: string | null;
  name: string;
  isGuest: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface DiagramData {
  nodes: any[];
  edges: any[];
  viewport: { x: number; y: number; zoom: number };
}

export interface Diagram {
  id: string;
  title: string;
  ownerId: string;
  shareToken: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  userRole?: 'owner' | 'editor' | 'viewer';
  currentVersion?: {
    version: number;
    data: DiagramData;
    createdAt: string;
  };
}

export const authApi = {
  register: async (email: string, name: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', { email, name, password });
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  createGuest: async (name: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/guest', { name });
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export interface Subscription {
  id: string;
  userId: string;
  tier: 'free' | 'pro' | 'team';
  status: string;
  currentPeriodEnd: string | null;
}

export interface UsageStats {
  tier: 'free' | 'pro' | 'team';
  status: string;
  diagramCount: number;
  diagramLimit: number;
  currentPeriodEnd: string | null;
}

export const diagramApi = {
  create: async (title: string, data?: DiagramData): Promise<Diagram> => {
    const response = await api.post('/diagrams', { title, data });
    return response.data;
  },

  list: async (): Promise<Diagram[]> => {
    const response = await api.get('/diagrams');
    return response.data;
  },

  get: async (id: string): Promise<Diagram> => {
    const response = await api.get(`/diagrams/${id}`);
    return response.data;
  },

  update: async (id: string, updates: { title?: string; data?: DiagramData }): Promise<Diagram> => {
    const response = await api.put(`/diagrams/${id}`, updates);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/diagrams/${id}`);
  },

  getByShareToken: async (token: string): Promise<Diagram> => {
    const response = await api.get(`/diagrams/shared/${token}`);
    return response.data;
  },

  regenerateShareToken: async (id: string): Promise<{ shareToken: string }> => {
    const response = await api.post(`/diagrams/${id}/share`);
    return response.data;
  },
};

export const subscriptionApi = {
  getMySubscription: async (): Promise<Subscription> => {
    const response = await api.get('/subscriptions/me');
    return response.data;
  },

  getUsage: async (): Promise<UsageStats> => {
    const response = await api.get('/subscriptions/usage');
    return response.data;
  },

  createCheckoutSession: async (tier: 'pro' | 'team', successUrl: string, cancelUrl: string): Promise<{ sessionId: string; url: string }> => {
    const response = await api.post('/subscriptions/checkout', { tier, successUrl, cancelUrl });
    return response.data;
  },

  createBillingPortalSession: async (returnUrl: string): Promise<{ url: string }> => {
    const response = await api.post('/subscriptions/portal', { returnUrl });
    return response.data;
  },
};
