/**
 * Recursive folder tree component for file navigation
 */

import { useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, File } from 'lucide-react';
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
  const isExpanded = expandedFolders.has(node.path);
  const isSelected = currentFile === node.path;
  const paddingLeft = level * 12 + 8;

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
    <div>
      <button
        onClick={() => onFolderClick(node.path)}
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
  );
}
