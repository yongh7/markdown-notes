/**
 * Recursive folder tree component with inline creation
 */

import { useEffect, useState } from 'react';
import { ChevronRight, ChevronDown, Folder, File, Trash2, Copy, FolderPlus, FilePlus, Check, X } from 'lucide-react';
import { useFolderStore } from '../../stores/folderStore';
import { useFileStore } from '../../stores/fileStore';
import type { FolderNode } from '../../types';

export function FolderTree() {
  const { tree, expandedFolders, toggleFolder, loadTree } = useFolderStore();
  const { loadFile, currentFile } = useFileStore();
  const [creatingIn, setCreatingIn] = useState<{ path: string; type: 'file' | 'folder' } | null>(null);

  useEffect(() => {
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

  const handleStartCreating = (folderPath: string, type: 'file' | 'folder') => {
    // Auto-expand the folder when creating inside it
    if (!expandedFolders.has(folderPath)) {
      toggleFolder(folderPath);
    }
    setCreatingIn({ path: folderPath, type });
  };

  const handleCancelCreating = () => {
    setCreatingIn(null);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 border-r border-gray-200">
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700">Notes</h2>
          <div className="flex gap-1">
            <button
              onClick={() => handleStartCreating('', 'folder')}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="New Folder"
            >
              <FolderPlus className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => handleStartCreating('', 'file')}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="New File"
            >
              <FilePlus className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
        <div className="space-y-1">
          {creatingIn && creatingIn.path === '' && (
            <InlineCreator
              parentPath=""
              type={creatingIn.type}
              level={0}
              onCancel={handleCancelCreating}
              onComplete={handleCancelCreating}
            />
          )}
          {tree.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              level={0}
              expandedFolders={expandedFolders}
              currentFile={currentFile}
              onFileClick={handleFileClick}
              onFolderClick={handleFolderClick}
              creatingIn={creatingIn}
              onStartCreating={handleStartCreating}
              onCancelCreating={handleCancelCreating}
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
  creatingIn: { path: string; type: 'file' | 'folder' } | null;
  onStartCreating: (path: string, type: 'file' | 'folder') => void;
  onCancelCreating: () => void;
}

function TreeNode({
  node,
  level,
  expandedFolders,
  currentFile,
  onFileClick,
  onFolderClick,
  creatingIn,
  onStartCreating,
  onCancelCreating,
}: TreeNodeProps) {
  const { deleteFolder, copyFolder, refresh } = useFolderStore();
  const [showActions, setShowActions] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [showCopyDialog, setShowCopyDialog] = useState(false);

  const isExpanded = expandedFolders.has(node.path);
  const isSelected = currentFile === node.path;
  const paddingLeft = level * 12 + 8;

  // File node (simple, no inline actions)
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

  // Folder node with inline actions
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleDeleteFolder = async () => {
    if (window.confirm(`Delete folder "${node.name}" and all its contents?`)) {
      try {
        await deleteFolder(node.path);
        setShowContextMenu(false);
      } catch (error) {
        alert('Failed to delete folder');
      }
    }
  };

  useEffect(() => {
    const handleClick = () => setShowContextMenu(false);
    if (showContextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showContextMenu]);

  return (
    <>
      <div
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="flex items-center gap-1 group">
          <button
            onClick={() => onFolderClick(node.path)}
            onContextMenu={handleContextMenu}
            className="flex-1 text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 hover:bg-gray-100 text-gray-700 transition-colors"
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

          {/* Inline action buttons (show on hover) */}
          {showActions && (
            <div className="flex gap-0.5 pr-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartCreating(node.path, 'file');
                }}
                className="p-1 hover:bg-blue-100 rounded transition-colors"
                title="New file in this folder"
              >
                <FilePlus className="w-3.5 h-3.5 text-blue-600" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartCreating(node.path, 'folder');
                }}
                className="p-1 hover:bg-blue-100 rounded transition-colors"
                title="New folder in this folder"
              >
                <FolderPlus className="w-3.5 h-3.5 text-blue-600" />
              </button>
            </div>
          )}
        </div>

        {/* Children and inline creator */}
        {isExpanded && (
          <div className="space-y-1">
            {/* Show inline creator first if creating in this folder */}
            {creatingIn && creatingIn.path === node.path && (
              <InlineCreator
                parentPath={node.path}
                type={creatingIn.type}
                level={level + 1}
                onCancel={onCancelCreating}
                onComplete={onCancelCreating}
              />
            )}
            {/* Then show children */}
            {node.children && node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                level={level + 1}
                expandedFolders={expandedFolders}
                currentFile={currentFile}
                onFileClick={onFileClick}
                onFolderClick={onFolderClick}
                creatingIn={creatingIn}
                onStartCreating={onStartCreating}
                onCancelCreating={onCancelCreating}
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
            onClick={() => {
              setShowContextMenu(false);
              setShowCopyDialog(true);
            }}
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
              alert('Failed to copy folder');
            }
          }}
        />
      )}
    </>
  );
}

// Inline creator component
interface InlineCreatorProps {
  parentPath: string;
  type: 'file' | 'folder';
  level: number;
  onCancel: () => void;
  onComplete: () => void;
}

function InlineCreator({ parentPath, type, level, onCancel, onComplete }: InlineCreatorProps) {
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { createFile } = useFileStore();
  const { createFolder, refresh } = useFolderStore();
  const paddingLeft = level * 12 + 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const fullPath = parentPath ? `${parentPath}/${name}` : name;

      if (type === 'file') {
        const filePath = fullPath.endsWith('.md') ? fullPath : `${fullPath}.md`;
        await createFile(filePath, '# New Note\n\nStart writing...');
      } else {
        await createFolder(fullPath);
      }

      await refresh();
      onComplete();
    } catch (error) {
      alert(`Failed to create ${type}`);
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1 py-1" style={{ paddingLeft }}>
      {type === 'file' ? (
        <File className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
      ) : (
        <Folder className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
      )}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={type === 'file' ? 'file-name.md' : 'folder-name'}
        className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        autoFocus
        disabled={isCreating}
      />
      <button
        type="submit"
        disabled={!name.trim() || isCreating}
        className="p-1 hover:bg-green-100 rounded transition-colors disabled:opacity-50"
        title="Create"
      >
        <Check className="w-4 h-4 text-green-600" />
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="p-1 hover:bg-red-100 rounded transition-colors"
        title="Cancel"
      >
        <X className="w-4 h-4 text-red-600" />
      </button>
    </form>
  );
}

// Copy folder dialog
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
