/**
 * Zustand store for folder tree state management
 */

import { create } from 'zustand';
import { fileAPI, folderAPI } from '../api/client';
import type { FolderStore } from '../types';

export const useFolderStore = create<FolderStore>((set, get) => ({
  tree: [],
  expandedFolders: new Set<string>(),
  isLoading: false,

  /**
   * Load the folder tree from the backend
   */
  loadTree: async () => {
    set({ isLoading: true });
    try {
      const tree = await fileAPI.getTree();
      set({ tree, isLoading: false });
    } catch (error) {
      console.error('Failed to load folder tree:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Toggle folder expansion state
   */
  toggleFolder: (path: string) => {
    const expandedFolders = new Set(get().expandedFolders);
    if (expandedFolders.has(path)) {
      expandedFolders.delete(path);
    } else {
      expandedFolders.add(path);
    }
    set({ expandedFolders });
  },

  /**
   * Create a new folder
   */
  createFolder: async (path: string) => {
    try {
      await folderAPI.create(path);
      // Refresh the tree after creating
      await get().loadTree();
    } catch (error) {
      console.error('Failed to create folder:', error);
      throw error;
    }
  },

  /**
   * Delete a folder
   */
  deleteFolder: async (path: string) => {
    try {
      await folderAPI.delete(path);
      // Refresh the tree after deleting
      await get().loadTree();
    } catch (error) {
      console.error('Failed to delete folder:', error);
      throw error;
    }
  },

  /**
   * Refresh the folder tree
   */
  refresh: async () => {
    await get().loadTree();
  },
}));
