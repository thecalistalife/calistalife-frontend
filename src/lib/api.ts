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

let isRefreshing = false;
let pendingRequests: Array<(token: string | null) => void> = [];

async function refreshToken(): Promise<string | null> {
  try {
    const res = await api.post('/api/auth/refresh', {});
    const newToken = (res.data?.data?.token as string) ?? null;
    if (newToken) {
      try { localStorage.setItem('auth_token', newToken); } catch {}
    }
    return newToken;
  } catch {
    try { localStorage.removeItem('auth_token'); } catch {}
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original: any = error.config || {};

    if (status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push((token) => {
            if (token) {
              original.headers = original.headers ?? {};
              original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            } else {
              reject(error);
            }
          });
        });
      }

      isRefreshing = true;
      const newToken = await refreshToken();
      isRefreshing = false;
      const queue = [...pendingRequests];
      pendingRequests = [];
      queue.forEach((cb) => cb(newToken));

      if (newToken) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
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
  refresh: () => api.post<ApiResponse<{ token: string }>>('/api/auth/refresh', {}),
  forgotPassword: (payload: { email: string }) => api.post<ApiResponse<void>>('/api/auth/password/forgot', payload),
  resetPassword: (payload: { token: string; email: string; newPassword: string }) => api.post<ApiResponse<void>>('/api/auth/password/reset', payload),
  requestEmailVerification: () => api.post<ApiResponse<void>>('/api/auth/verify/request', {}),
  verifyEmail: (payload: { token: string; email: string }) => api.post<ApiResponse<void>>('/api/auth/verify/confirm', payload),
  googleLogin: (payload: { idToken: string }) => api.post<ApiResponse<{ user: any; token: string }>>('/api/auth/google', payload),
};

export const PaymentsAPI = {
  createPaymentIntent: (payload: { amount: number; currency?: string; metadata?: Record<string, string> }) =>
    api.post<ApiResponse<{ clientSecret: string; paymentIntentId: string }>>('/api/payments/intent', payload),
};
