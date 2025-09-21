import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

function getToken(): string | null {
  try {
    return localStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Optionally trigger a logout or token refresh flow here
      // For now, just remove any stale token
      try { localStorage.removeItem('auth_token'); } catch {}
    }
    return Promise.reject(error);
  }
);

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export const AuthAPI = {
  register: (payload: { name: string; email: string; password: string }) =>
    api.post<ApiResponse<{ user: any; token: string }>>('/api/auth/register', payload),
  login: (payload: { email: string; password: string }) =>
    api.post<ApiResponse<{ user: any; token: string }>>('/api/auth/login', payload),
  me: () => api.get<ApiResponse<any>>('/api/auth/me'),
  logout: () => api.post<ApiResponse<undefined>>('/api/auth/logout'),
};