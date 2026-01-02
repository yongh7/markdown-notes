/**
 * Type definitions for the Knowledge Base application
 */

export interface FolderNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FolderNode[];
}

export interface FileMetadata {
  id: string;
  file_path: string;
  is_public: boolean;
  title: string;
}

export interface FileStore {
  currentFile: string | null;
  currentFileId: string | null;
  isPublic: boolean;
  content: string;
  isDirty: boolean;
  isLoading: boolean;
  metadata: Map<string, FileMetadata>;

  loadFile: (path: string) => Promise<void>;
  updateContent: (content: string) => void;
  saveFile: () => Promise<void>;
  createFile: (path: string, content: string) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  loadMetadata: () => Promise<void>;
  togglePrivacy: () => Promise<void>;
  reset: () => void;
}

export interface FolderStore {
  tree: FolderNode[];
  expandedFolders: Set<string>;
  isLoading: boolean;

  loadTree: () => Promise<void>;
  toggleFolder: (path: string) => void;
  createFolder: (path: string) => Promise<void>;
  deleteFolder: (path: string) => Promise<void>;
  copyFolder: (sourcePath: string, destPath: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export interface UIStore {
  showPreview: boolean;
  sidebarWidth: number;

  togglePreview: () => void;
  setSidebarWidth: (width: number) => void;
}

export interface SearchResult {
  path: string;
  name: string;
  preview: string;
}
