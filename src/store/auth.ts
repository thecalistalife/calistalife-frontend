import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthAPI } from '../lib/api';

export type AuthUser = {
  _id: string;
  name: string;
  email: string;
  role?: 'customer' | 'admin';
};

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, email: string, newPassword: string) => Promise<void>;
  requestEmailVerification: () => Promise<void>;
  verifyEmail: (token: string, email: string) => Promise<void>;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      error: null,
      async login(email, password) {
        set({ loading: true, error: null });
        try {
          const res = await AuthAPI.login({ email, password });
          const token = res.data.data?.token ?? null;
          const user = (res.data.data as any)?.user ?? null;
          if (token) {
            try { localStorage.setItem('auth_token', token); } catch {}
          }
          set({ user, token, loading: false });
        } catch (err: any) {
          set({ error: err?.response?.data?.message ?? 'Login failed', loading: false });
          throw err;
        }
      },
      async register(name, email, password) {
        set({ loading: true, error: null });
        try {
          const res = await AuthAPI.register({ name, email, password });
          const token = res.data.data?.token ?? null;
          const user = (res.data.data as any)?.user ?? null;
          if (token) {
            try { localStorage.setItem('auth_token', token); } catch {}
          }
          set({ user, token, loading: false });
        } catch (err: any) {
          set({ error: err?.response?.data?.message ?? 'Registration failed', loading: false });
          throw err;
        }
      },
      async googleLogin(idToken) {
        set({ loading: true, error: null });
        try {
          const res = await AuthAPI.googleLogin({ idToken });
          const token = res.data.data?.token ?? null;
          const user = (res.data.data as any)?.user ?? null;
          if (token) {
            try { localStorage.setItem('auth_token', token); } catch {}
          }
          set({ user, token, loading: false });
        } catch (err: any) {
          set({ error: err?.response?.data?.message ?? 'Google login failed', loading: false });
          throw err;
        }
      },
      async forgotPassword(email) {
        set({ loading: true, error: null });
        try {
          await AuthAPI.forgotPassword({ email });
          set({ loading: false });
        } catch (err: any) {
          set({ error: err?.response?.data?.message ?? 'Request failed', loading: false });
          throw err;
        }
      },
      async resetPassword(token, email, newPassword) {
        set({ loading: true, error: null });
        try {
          await AuthAPI.resetPassword({ token, email, newPassword });
          set({ loading: false });
        } catch (err: any) {
          set({ error: err?.response?.data?.message ?? 'Reset failed', loading: false });
          throw err;
        }
      },
      async requestEmailVerification() {
        set({ loading: true, error: null });
        try {
          await AuthAPI.requestEmailVerification();
          set({ loading: false });
        } catch (err: any) {
          set({ error: err?.response?.data?.message ?? 'Request failed', loading: false });
          throw err;
        }
      },
      async verifyEmail(token, email) {
        set({ loading: true, error: null });
        try {
          await AuthAPI.verifyEmail({ token, email });
          set({ loading: false });
        } catch (err: any) {
          set({ error: err?.response?.data?.message ?? 'Verification failed', loading: false });
          throw err;
        }
      },
      async fetchMe() {
        try {
          const res = await AuthAPI.me();
          const user = res.data.data as any;
          set({ user });
        } catch {
          // ignore; user may be unauthenticated
        }
      },
      async logout() {
        try { await AuthAPI.logout(); } catch {}
        try { localStorage.removeItem('auth_token'); } catch {}
        set({ user: null, token: null });
      },
    }),
    { name: 'auth-storage', partialize: (s) => ({ user: s.user, token: s.token }) }
  )
);