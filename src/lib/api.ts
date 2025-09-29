import axios, { AxiosError } from 'axios';

// Normalize base URL: if set to '/api', use relative '' to avoid '/api/api' duplication since
// endpoint paths already include '/api/*'. If set to absolute (http://...), use as-is.
const RAW_BASE = (import.meta as any).env?.VITE_API_URL as string | undefined;
const API_BASE_URL = (!RAW_BASE || RAW_BASE === '/api') ? '' : RAW_BASE;

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
  updateProfile: (payload: { name?: string; email?: string; phone?: string }) =>
    api.put<ApiResponse<any>>('/api/auth/profile', payload),
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    api.put<ApiResponse<void>>('/api/auth/password', payload),
};

export const PaymentsAPI = {
  createPaymentIntent: (payload: { amount: number; currency?: string; metadata?: Record<string, string> }) =>
    api.post<ApiResponse<{ clientSecret: string; paymentIntentId: string }>>('/api/payments/intent', payload),
  createRazorpayOrder: (amountPaise: number, orderNumber?: string, notes?: Record<string, string>) =>
    api.post<ApiResponse<{ orderId: string; amount: number; currency: string; receipt?: string }>>('/api/payments/razorpay/order', { amount: amountPaise, orderNumber, notes }),
  getRazorpayKey: () => api.get<ApiResponse<{ keyId: string | null }>>('/api/payments/razorpay/key'),
};

export const OrdersAPI = {
  create: (payload: any) => api.post<ApiResponse<{ id: string; orderNumber: string }>>('/api/orders/create', payload),
  my: () => api.get<ApiResponse<any[]>>('/api/orders/my'),
  get: (id: string) => api.get<ApiResponse<any>>(`/api/orders/${encodeURIComponent(id)}`),
  getByNumber: (orderNumber: string) => api.get<ApiResponse<any>>(`/api/orders/by-number/${encodeURIComponent(orderNumber)}`),
};

// Marketing endpoints (Brevo automation helpers)
export const MarketingAPI = {
  newsletterSubscribe: (payload: { email: string; firstName?: string }) =>
    api.post<ApiResponse<{ success: boolean; message: string }>>('/api/marketing/newsletter/subscribe', payload),
  contactDates: (payload: { email: string; birthdate?: string; anniversary?: string }) =>
    api.post<ApiResponse<{ success: boolean; message: string }>>('/api/marketing/contact/dates', payload),
};

// Cart + Wishlist APIs (authenticated)
export const CartAPI = {
  get: () => api.get<ApiResponse<{ cart: any; items: any[] }>>('/api/cart'),
  add: (payload: { productId: string; size: string; color: string; quantity: number; price?: number }) =>
    api.post<ApiResponse<{ cart: any; items: any[] }>>('/api/cart/add', payload),
  update: (payload: { productId: string; size: string; color: string; quantity: number }) =>
    api.put<ApiResponse<{ cart: any; items: any[] }>>('/api/cart/update', payload),
  remove: (payload: { productId: string; size: string; color: string }) =>
    api.delete<ApiResponse<{ cart: any; items: any[] }>>('/api/cart/remove', { data: payload }),
  clear: () => api.delete<ApiResponse<{ cart: any; items: any[] }>>('/api/cart/clear'),
};

export const AdminAPI = {
  ordersList: () => api.get<ApiResponse<any[]>>('/api' + `${import.meta.env.VITE_ADMIN_BASE_PATH ? '/' + (import.meta as any).env.VITE_ADMIN_BASE_PATH : '/cl-private-dashboard-2024'}` + '/orders'),
  orderGet: (id: string) => api.get<ApiResponse<any>>('/api' + `${import.meta.env.VITE_ADMIN_BASE_PATH ? '/' + (import.meta as any).env.VITE_ADMIN_BASE_PATH : '/cl-private-dashboard-2024'}` + `/orders/${encodeURIComponent(id)}`),
  orderUpdate: (id: string, payload: { order_status?: string; tracking_number?: string; courier?: string; track_url?: string; estimated_delivery?: string; }) =>
    api.patch<ApiResponse<any>>('/api' + `${import.meta.env.VITE_ADMIN_BASE_PATH ? '/' + (import.meta as any).env.VITE_ADMIN_BASE_PATH : '/cl-private-dashboard-2024'}` + `/orders/${encodeURIComponent(id)}`, payload),
};

// Product APIs
export type ProductQuery = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  collection?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  inStock?: boolean;
  sortBy?: 'featured' | 'newest' | 'price-low' | 'price-high' | 'name' | 'rating';
};

export const ProductsAPI = {
  list: (params: ProductQuery) => api.get<ApiResponse<any[]>>('/api/products', { params }),
  featured: (limit = 8) => api.get<ApiResponse<any[]>>('/api/products/featured', { params: { limit } }),
  newArrivals: (limit = 8) => api.get<ApiResponse<any[]>>('/api/products/new-arrivals', { params: { limit } }),
  bestSellers: (limit = 8) => api.get<ApiResponse<any[]>>('/api/products/best-sellers', { params: { limit } }),
  collections: () => api.get<ApiResponse<any[]>>('/api/products/collections'),
  filters: () => api.get<ApiResponse<any>>('/api/products/filters'),
  get: (idOrSlug: string) => api.get<ApiResponse<any>>(`/api/products/${encodeURIComponent(idOrSlug)}`),
  searchSuggestions: (q: string) => api.get<ApiResponse<any[]>>('/api/products/search/suggestions', { params: { q } }),
};

// Reviews API
export type ReviewsQuery = {
  page?: number; limit?: number; sort?: 'newest'|'helpful'; photosOnly?: boolean; verifiedOnly?: boolean; minRating?: number; fit?: 'too_small'|'perfect'|'too_large';
}
export const ReviewsAPI = {
  summary: (productId: string) => api.get<ApiResponse<{ total: number; average: number; counts: Record<number, number>; verified: number }>>(`/api/reviews/summary/${encodeURIComponent(productId)}`),
  list: (productId: string, params: ReviewsQuery = {}) => api.get<ApiResponse<any[]>>(`/api/reviews/${encodeURIComponent(productId)}`, { params }),
  create: (payload: { productId: string; rating: number; reviewTitle?: string; reviewText: string; reviewerName: string; reviewerEmail: string; sizePurchased?: string; colorPurchased?: string; fitFeedback?: 'too_small'|'perfect'|'too_large'; qualityRating?: number; comfortRating?: number; styleRating?: number; }) => api.post<ApiResponse<any>>('/api/reviews', payload),
  vote: (reviewId: string, isHelpful: boolean) => api.post<ApiResponse<{ helpful: number; unhelpful: number }>>('/api/reviews/vote', { reviewId, isHelpful }),
  uploadImages: (files: File[]) => {
    const form = new FormData();
    files.forEach(f => form.append('images', f));
    return api.post<ApiResponse<{ urls: string[] }>>('/api/reviews/upload-image', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  }
};
