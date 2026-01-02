import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
}

interface AuthStore {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
  clearError: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          // Login request
          const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
          }

          const { access_token } = await response.json();

          // Get user info
          const userResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${access_token}` },
          });

          if (!userResponse.ok) {
            throw new Error('Failed to get user info');
          }

          const user = await userResponse.json();
          set({ token: access_token, user, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      register: async (username, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Registration failed');
          }

          // Auto-login after registration
          await get().login(email, password);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Registration failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ token: null, user: null, error: null });
      },

      isAuthenticated: () => {
        return get().token !== null;
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
