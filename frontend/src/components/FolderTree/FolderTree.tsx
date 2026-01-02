/**
 * Recursive folder tree component for file navigation
 */

import { useEffect, useState } from 'react';
import { ChevronRight, ChevronDown, Folder, File, Copy, Trash2, X } from 'lucide-react';
import { useFolderStore } from '../../stores/folderStore';
import { useFileStore } from '../../stores/fileStore';
import type { FolderNode } from '../../types';

export function FolderTree() {
  const { tree, expandedFolders, toggleFolder, loadTree } = useFolderStore();
  const { loadFile, currentFile } = useFileStore();

  useEffect(() => {
    // Load the tree on mount
    loadTree();
  }, [loadTree]);

  const handleFileClick = async (path: string) => {
    try {
      await loadFile(path);
    } catch (error) {
      console.error('Failed to load file:', error);
    }
  };

  const handleFolderClick = (path: string) => {
    toggleFolder(path);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 border-r border-gray-200">
      <div className="p-3">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Notes</h2>
        <div className="space-y-1">
          {tree.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              level={0}
              expandedFolders={expandedFolders}
              currentFile={currentFile}
              onFileClick={handleFileClick}
              onFolderClick={handleFolderClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface TreeNodeProps {
  node: FolderNode;
  level: number;
  expandedFolders: Set<string>;
  currentFile: string | null;
  onFileClick: (path: string) => void;
  onFolderClick: (path: string) => void;
}

function TreeNode({
  node,
  level,
  expandedFolders,
  currentFile,
  onFileClick,
  onFolderClick,
}: TreeNodeProps) {
  const { deleteFolder, copyFolder, refresh } = useFolderStore();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [showCopyDialog, setShowCopyDialog] = useState(false);

  const isExpanded = expandedFolders.has(node.path);
  const isSelected = currentFile === node.path;
  const paddingLeft = level * 12 + 8;

  const handleContextMenu = (e: React.MouseEvent) => {
    if (node.type === 'folder') {
      e.preventDefault();
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
      setShowContextMenu(true);
    }
  };

  const handleDeleteFolder = async () => {
    if (window.confirm(`Are you sure you want to delete the folder "${node.name}" and all its contents?`)) {
      try {
        await deleteFolder(node.path);
        setShowContextMenu(false);
      } catch (error) {
        alert('Failed to delete folder');
      }
    }
  };

  const handleCopyFolder = () => {
    setShowContextMenu(false);
    setShowCopyDialog(true);
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setShowContextMenu(false);
    if (showContextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showContextMenu]);

  if (node.type === 'file') {
    return (
      <button
        onClick={() => onFileClick(node.path)}
        className={`
          w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2
          transition-colors
          ${
            isSelected
              ? 'bg-blue-100 text-blue-900'
              : 'hover:bg-gray-100 text-gray-700'
          }
        `}
        style={{ paddingLeft }}
      >
        <File className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  // Folder
  return (
    <>
      <div>
        <button
          onClick={() => onFolderClick(node.path)}
          onContextMenu={handleContextMenu}
          className="w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 hover:bg-gray-100 text-gray-700 transition-colors"
          style={{ paddingLeft }}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
          )}
          <Folder className="w-4 h-4 flex-shrink-0" />
          <span className="truncate font-medium">{node.name}</span>
        </button>
        {isExpanded && node.children && (
          <div className="space-y-1">
            {node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                level={level + 1}
                expandedFolders={expandedFolders}
                currentFile={currentFile}
                onFileClick={onFileClick}
                onFolderClick={onFolderClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded shadow-lg py-1 z-50"
          style={{ left: contextMenuPosition.x, top: contextMenuPosition.y }}
        >
          <button
            onClick={handleCopyFolder}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy Folder
          </button>
          <button
            onClick={handleDeleteFolder}
            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Folder
          </button>
        </div>
      )}

      {/* Copy Dialog */}
      {showCopyDialog && (
        <CopyFolderDialog
          sourcePath={node.path}
          sourceName={node.name}
          onClose={() => setShowCopyDialog(false)}
          onCopy={async (destPath) => {
            try {
              await copyFolder(node.path, destPath);
              setShowCopyDialog(false);
              await refresh();
            } catch (error) {
              alert('Failed to copy folder. Make sure the destination name is valid and doesn\'t already exist.');
            }
          }}
        />
      )}
    </>
  );
}

interface CopyFolderDialogProps {
  sourcePath: string;
  sourceName: string;
  onClose: () => void;
  onCopy: (destPath: string) => Promise<void>;
}

function CopyFolderDialog({ sourcePath, sourceName, onClose, onCopy }: CopyFolderDialogProps) {
  const [destName, setDestName] = useState(`${sourceName}-copy`);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destName.trim()) return;

    setIsLoading(true);
    try {
      // Calculate destination path by replacing the last component
      const pathParts = sourcePath.split('/');
      pathParts[pathParts.length - 1] = destName;
      const destPath = pathParts.join('/');

      await onCopy(destPath);
    } catch (error) {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Copy Folder</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source: <span className="font-normal text-gray-600">{sourceName}</span>
            </label>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destination Name:
            </label>
            <input
              type="text"
              value={destName}
              onChange={(e) => setDestName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter new folder name"
              autoFocus
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500">
              Only alphanumeric, dash, and underscore allowed
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              disabled={isLoading}
            >
              {isLoading ? 'Copying...' : 'Copy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
