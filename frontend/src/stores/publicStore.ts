/**
 * Store for managing public notes feed
 */

import { create } from 'zustand';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface PublicNote {
  id: string;
  title: string;
  preview: string | null;
  username: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface PublicStore {
  notes: PublicNote[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;

  loadPublicNotes: (limit?: number, offset?: number) => Promise<void>;
  loadUserPublicNotes: (userId: string, limit?: number, offset?: number) => Promise<void>;
  reset: () => void;
  clearError: () => void;
}

export const usePublicStore = create<PublicStore>((set, get) => ({
  notes: [],
  isLoading: false,
  error: null,
  hasMore: true,

  loadPublicNotes: async (limit = 20, offset = 0) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(
        `${API_BASE}/public/notes?limit=${limit}&offset=${offset}`
      );

      if (!response.ok) {
        throw new Error(`Failed to load public notes: ${response.statusText}`);
      }

      const data: PublicNote[] = await response.json();

      set({
        notes: offset === 0 ? data : [...get().notes, ...data],
        hasMore: data.length === limit,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Failed to load public notes:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load public notes',
        isLoading: false,
      });
    }
  },

  loadUserPublicNotes: async (userId: string, limit = 20, offset = 0) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(
        `${API_BASE}/public/users/${userId}/notes?limit=${limit}&offset=${offset}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found');
        }
        throw new Error(`Failed to load user's public notes: ${response.statusText}`);
      }

      const data: PublicNote[] = await response.json();

      set({
        notes: offset === 0 ? data : [...get().notes, ...data],
        hasMore: data.length === limit,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error(`Failed to load user's public notes:`, error);
      set({
        error: error instanceof Error ? error.message : "Failed to load user's public notes",
        isLoading: false,
      });
    }
  },

  reset: () => set({ notes: [], hasMore: true, error: null }),

  clearError: () => set({ error: null }),
}));
