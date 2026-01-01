/**
 * Zustand store for UI state management
 */

import { create } from 'zustand';
import type { UIStore } from '../types';

export const useUIStore = create<UIStore>((set) => ({
  showPreview: true,
  sidebarWidth: 250,

  /**
   * Toggle preview pane visibility
   */
  togglePreview: () => {
    set((state) => ({ showPreview: !state.showPreview }));
  },

  /**
   * Set sidebar width
   */
  setSidebarWidth: (width: number) => {
    set({ sidebarWidth: Math.max(200, Math.min(500, width)) });
  },
}));
