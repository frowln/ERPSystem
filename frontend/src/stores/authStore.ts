import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  redirectAfterLogin: string | null;
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setRedirectAfterLogin: (url: string | null) => void;
  logout: () => void;
  validateToken: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      redirectAfterLogin: null,

      setAuth: (user, token, refreshToken) => {
        set({
          user,
          token,
          refreshToken: refreshToken ?? get().refreshToken,
          isAuthenticated: true,
        });
      },

      setUser: (user) => {
        set({ user });
      },

      setToken: (token) => {
        set({ token });
      },

      setRedirectAfterLogin: (url) => {
        set({ redirectAfterLogin: url });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          redirectAfterLogin: null,
        });
      },

      validateToken: () => {
        const { token, user } = get();
        if (!token || !user) {
          if (token || user) {
            get().logout();
          }
          return false;
        }
        // Check JWT expiration (basic decode without verification)
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            get().logout();
            return false;
          }
        } catch {
          // If token is not a valid JWT, let the server validate it
        }
        return true;
      },
    }),
    {
      name: 'privod-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
