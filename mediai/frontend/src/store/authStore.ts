import { create } from 'zustand';
import api from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN' | 'STAFF';
  profileId: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: Record<string, string>) => Promise<User>;
  register: (data: Record<string, any>) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => void;
  clearError: () => void;
}

const getInitialAuth = () => {
  try {
    const cachedToken = localStorage.getItem('token');
    const cachedUser = localStorage.getItem('user');
    if (cachedToken && cachedUser) {
      try {
        return {
          token: cachedToken,
          user: JSON.parse(cachedUser),
          isAuthenticated: true,
        };
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  } catch (err) {
    // Ignore storage access errors
  }
  return {
    token: null,
    user: null,
    isAuthenticated: false,
  };
};

const initialAuth = getInitialAuth();

export const useAuthStore = create<AuthState>((set) => ({
  ...initialAuth,
  isLoading: false,
  error: null,

  initialize: () => {
    // State is already initialized synchronously on store creation.
    // Keeping this method as a no-op to maintain compatibility with callers.
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', credentials);
      const { token, user } = response.data.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return user;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Login credentials invalid';
      set({ error: errMsg, isLoading: false });
      throw new Error(errMsg);
    }
  },

  register: async (registerData) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/auth/register', registerData);
      set({ isLoading: false });
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Registration failed';
      set({ error: errMsg, isLoading: false });
      throw new Error(errMsg);
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await api.post('/auth/logout').catch(() => {});
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
