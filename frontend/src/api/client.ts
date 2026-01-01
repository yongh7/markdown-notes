/**
 * API client for communicating with the FastAPI backend
 */

import type { FolderNode, SearchResult } from '../types';

const API_BASE = 'http://localhost:8000/api';

/**
 * File API endpoints
 */
export const fileAPI = {
  /**
   * Get the complete folder tree structure
   */
  async getTree(): Promise<FolderNode[]> {
    const response = await fetch(`${API_BASE}/files/tree`);
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
      `${API_BASE}/files/content?path=${encodeURIComponent(path)}`
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
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
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
      `${API_BASE}/files/search?q=${encodeURIComponent(query)}`
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
      headers: {
        'Content-Type': 'application/json',
      },
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
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete folder');
    }
  },
};
