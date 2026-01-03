/**
 * Zustand store for file state management
 */

import { create } from 'zustand';
import { fileAPI } from '../api/client';
import type { FileStore, FileMetadata } from '../types';

export const useFileStore = create<FileStore>((set, get) => ({
  currentFile: null,
  currentFileId: null,
  isPublic: false,
  content: '',
  isDirty: false,
  isLoading: false,
  metadata: new Map<string, FileMetadata>(),

  /**
   * Load metadata for all files
   */
  loadMetadata: async () => {
    try {
      const response = await fileAPI.getMetadata();
      const metadataList = response.files || response; // Handle both {files: []} and [] formats
      const metadataMap = new Map<string, FileMetadata>();
      metadataList.forEach((item: FileMetadata) => {
        metadataMap.set(item.file_path, item);
      });
      set({ metadata: metadataMap });
    } catch (error) {
      console.error('Failed to load file metadata:', error);
    }
  },

  /**
   * Load a file from the backend
   */
  loadFile: async (path: string) => {
    set({ isLoading: true });
    try {
      const content = await fileAPI.getContent(path);
      const { metadata } = get();
      const fileMeta = metadata.get(path);

      set({
        currentFile: path,
        currentFileId: fileMeta?.id || null,
        isPublic: fileMeta?.is_public || false,
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
      // Reload metadata to get the new file's ID and privacy status
      await get().loadMetadata();
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
   * Toggle privacy of current file
   */
  togglePrivacy: async () => {
    const { currentFileId, isPublic, currentFile, metadata } = get();
    if (!currentFileId || !currentFile) {
      console.warn('No file selected to toggle privacy');
      return;
    }

    const newIsPublic = !isPublic;

    try {
      // Optimistic update
      set({ isPublic: newIsPublic });

      // Update via API
      await fileAPI.togglePrivacy(currentFileId, newIsPublic);

      // Update metadata map
      const fileMeta = metadata.get(currentFile);
      if (fileMeta) {
        const updatedMetadata = new Map(metadata);
        updatedMetadata.set(currentFile, { ...fileMeta, is_public: newIsPublic });
        set({ metadata: updatedMetadata });
      }
    } catch (error) {
      // Rollback on error
      console.error('Failed to toggle privacy:', error);
      set({ isPublic });
      throw error;
    }
  },

  /**
   * Reset the file store
   */
  reset: () => {
    set({
      currentFile: null,
      currentFileId: null,
      isPublic: false,
      content: '',
      isDirty: false,
      isLoading: false,
      metadata: new Map<string, FileMetadata>(),
    });
  },
}));
