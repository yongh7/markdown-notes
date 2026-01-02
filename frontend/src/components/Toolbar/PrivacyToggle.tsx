/**
 * Privacy toggle button for the toolbar
 * Allows users to toggle file privacy between public and private
 */

import { useState } from 'react';
import { Globe, Lock, Loader2 } from 'lucide-react';
import { useFileStore } from '../../stores/fileStore';

export function PrivacyToggle() {
  const { currentFile, currentFileId, isPublic, togglePrivacy } = useFileStore();
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    if (!currentFile || !currentFileId) return;

    setIsToggling(true);
    try {
      await togglePrivacy();
    } catch (error) {
      console.error('Failed to toggle privacy:', error);
    } finally {
      setIsToggling(false);
    }
  };

  // Don't show if no file is selected
  if (!currentFile) {
    return null;
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isToggling || !currentFileId}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
        isPublic
          ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
          : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={isPublic ? 'Click to make private' : 'Click to make public'}
    >
      {isToggling ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isPublic ? (
        <Globe className="w-4 h-4" />
      ) : (
        <Lock className="w-4 h-4" />
      )}
      <span className="text-sm font-medium">
        {isPublic ? 'Public' : 'Private'}
      </span>
    </button>
  );
}
