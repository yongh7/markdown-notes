/**
 * Zustand store for file state management
 */

import { create } from 'zustand';
import { fileAPI } from '../api/client';
import type { FileStore } from '../types';

export const useFileStore = create<FileStore>((set, get) => ({
  currentFile: null,
  content: '',
  isDirty: false,
  isLoading: false,

  /**
   * Load a file from the backend
   */
  loadFile: async (path: string) => {
    set({ isLoading: true });
    try {
      const content = await fileAPI.getContent(path);
      set({
        currentFile: path,
        content,
        isDirty: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load file:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Update content in memory (marks as dirty)
   */
  updateContent: (content: string) => {
    set({ content, isDirty: true });
  },

  /**
   * Save the current file to the backend
   */
  saveFile: async () => {
    const { currentFile, content } = get();
    if (!currentFile) {
      console.warn('No file selected to save');
      return;
    }

    try {
      await fileAPI.updateFile(currentFile, content);
      set({ isDirty: false });
    } catch (error) {
      console.error('Failed to save file:', error);
      throw error;
    }
  },

  /**
   * Create a new file
   */
  createFile: async (path: string, content: string) => {
    try {
      await fileAPI.createFile(path, content);
      // Optionally load the new file
      await get().loadFile(path);
    } catch (error) {
      console.error('Failed to create file:', error);
      throw error;
    }
  },

  /**
   * Delete a file
   */
  deleteFile: async (path: string) => {
    try {
      await fileAPI.deleteFile(path);
      // If we deleted the current file, reset the state
      if (get().currentFile === path) {
        set({
          currentFile: null,
          content: '',
          isDirty: false,
        });
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  },

  /**
   * Reset the file store
   */
  reset: () => {
    set({
      currentFile: null,
      content: '',
      isDirty: false,
      isLoading: false,
    });
  },
}));
