/**
 * Toolbar component for file/folder operations
 */

import { useNavigate } from 'react-router-dom';
import {
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
    </div>
  );
}
