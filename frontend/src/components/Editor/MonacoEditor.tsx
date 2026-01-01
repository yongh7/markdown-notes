/**
 * Monaco Editor component for markdown editing
 */

import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useFileStore } from '../../stores/fileStore';

export function MonacoEditor() {
  const { content, updateContent, saveFile, isDirty, currentFile } =
    useFileStore();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  const handleChange = (value: string | undefined) => {
    if (value !== undefined && value !== content) {
      updateContent(value);

      // Auto-save with debounce
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveFile().catch((error) => {
          console.error('Auto-save failed:', error);
        });
      }, 500);
    }
  };

  useEffect(() => {
    // Keyboard shortcut: Ctrl+S / Cmd+S to save
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveFile().catch((error) => {
          console.error('Manual save failed:', error);
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveFile]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!currentFile) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">No file selected</p>
          <p className="text-sm">Select a file from the sidebar to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative bg-white">
      {isDirty && (
        <div className="absolute top-2 right-2 z-10 bg-yellow-500 text-white px-3 py-1 rounded-md text-xs font-medium shadow-md">
          Unsaved changes
        </div>
      )}
      <Editor
        height="100%"
        defaultLanguage="markdown"
        value={content}
        onChange={handleChange}
        theme="vs-light"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          folding: true,
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 3,
        }}
      />
    </div>
  );
}
