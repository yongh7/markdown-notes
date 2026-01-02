/**
 * Toolbar component for file/folder operations
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FilePlus,
  FolderPlus,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  LogOut,
  User,
  Home,
} from 'lucide-react';
import { useFileStore } from '../../stores/fileStore';
import { useFolderStore } from '../../stores/folderStore';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { PrivacyToggle } from './PrivacyToggle';

export function Toolbar() {
  const { currentFile, deleteFile } = useFileStore();
  const { refresh } = useFolderStore();
  const { showPreview, togglePreview } = useUIStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          title="Back to Landing Page"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setShowNewFileDialog(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          title="New File"
        >
          <FilePlus className="w-4 h-4" />
          <span>New File</span>
        </button>

        <button
          onClick={() => setShowNewFolderDialog(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          title="New Folder"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Folder</span>
        </button>

        {currentFile && (
          <button
            onClick={async () => {
              if (
                window.confirm(
                  `Are you sure you want to delete "${currentFile}"?`
                )
              ) {
                try {
                  await deleteFile(currentFile);
                  await refresh();
                } catch (error) {
                  alert('Failed to delete file');
                }
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            title="Delete File"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        )}

        <button
          onClick={() => refresh()}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={togglePreview}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          title={showPreview ? 'Hide Preview' : 'Show Preview'}
        >
          {showPreview ? (
            <>
              <EyeOff className="w-4 h-4" />
              <span>Hide Preview</span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              <span>Show Preview</span>
            </>
          )}
        </button>

        <PrivacyToggle />

        {currentFile && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Current:</span> {currentFile}
          </div>
        )}

        {user && (
          <div className="flex items-center gap-2 ml-4">
            <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded">
              <User className="w-4 h-4" />
              <span>{user.username}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      {showNewFileDialog && (
        <NewFileDialog onClose={() => setShowNewFileDialog(false)} />
      )}

      {showNewFolderDialog && (
        <NewFolderDialog onClose={() => setShowNewFolderDialog(false)} />
      )}
    </div>
  );
}

function NewFileDialog({ onClose }: { onClose: () => void }) {
  const [path, setPath] = useState('');
  const { createFile } = useFileStore();
  const { refresh } = useFolderStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!path.trim()) return;

    const filePath = path.endsWith('.md') ? path : `${path}.md`;

    try {
      await createFile(filePath, '# New Note\n\nStart writing...');
      await refresh();
      onClose();
    } catch (error) {
      alert('Failed to create file. Make sure the path is valid.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold mb-4">Create New File</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="folder/filename.md"
            className="w-full px-3 py-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NewFolderDialog({ onClose }: { onClose: () => void }) {
  const [path, setPath] = useState('');
  const { createFolder } = useFolderStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!path.trim()) return;

    try {
      await createFolder(path);
      onClose();
    } catch (error) {
      alert('Failed to create folder. Make sure the path is valid.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold mb-4">Create New Folder</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="folder-name"
            className="w-full px-3 py-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
