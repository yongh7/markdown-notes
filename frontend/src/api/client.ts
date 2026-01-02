/**
 * API client for communicating with the FastAPI backend
 */

import type { FolderNode, SearchResult } from '../types';
import { useAuthStore } from '../stores/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Get authorization headers with JWT token
 */
function getAuthHeaders(): HeadersInit {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

/**
 * File API endpoints
 */
export const fileAPI = {
  /**
   * Get the complete folder tree structure
   */
  async getTree(): Promise<FolderNode[]> {
    const response = await fetch(`${API_BASE}/files/tree`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch file tree');
    }
    return response.json();
  },

  /**
   * Get content of a specific file
   */
  async getContent(path: string): Promise<string> {
    const response = await fetch(
      `${API_BASE}/files/content?path=${encodeURIComponent(path)}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${path}`);
    }
    const data = await response.json();
    return data.content;
  },

  /**
   * Create a new file
   */
  async createFile(path: string, content: string): Promise<void> {
    const response = await fetch(`${API_BASE}/files/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ path, content }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create file');
    }
  },

  /**
   * Update an existing file
   */
  async updateFile(path: string, content: string): Promise<void> {
    const response = await fetch(`${API_BASE}/files/`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ path, content }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update file');
    }
  },

  /**
   * Delete a file
   */
  async deleteFile(path: string): Promise<void> {
    const response = await fetch(
      `${API_BASE}/files/?path=${encodeURIComponent(path)}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete file');
    }
  },

  /**
   * Search for files containing a query
   */
  async search(query: string): Promise<SearchResult[]> {
    const response = await fetch(
      `${API_BASE}/files/search?q=${encodeURIComponent(query)}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) {
      throw new Error('Search failed');
    }
    const data = await response.json();
    return data.results;
  },
};

/**
 * Folder API endpoints
 */
export const folderAPI = {
  /**
   * Create a new folder
   */
  async create(path: string): Promise<void> {
    const response = await fetch(`${API_BASE}/folders/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ path }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create folder');
    }
  },

  /**
   * Delete a folder and all its contents
   */
  async delete(path: string): Promise<void> {
    const response = await fetch(
      `${API_BASE}/folders/?path=${encodeURIComponent(path)}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete folder');
    }
  },

  /**
   * Copy a folder and all its contents to a new location
   */
  async copy(sourcePath: string, destPath: string): Promise<void> {
    const response = await fetch(`${API_BASE}/folders/copy`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ source_path: sourcePath, dest_path: destPath }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to copy folder');
    }
  },
};
