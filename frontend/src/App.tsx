/**
 * Main application component
 */

import { Toolbar } from './components/Toolbar/Toolbar';
import { FolderTree } from './components/FolderTree/FolderTree';
import { MonacoEditor } from './components/Editor/MonacoEditor';
import { MarkdownPreview } from './components/Preview/MarkdownPreview';
import { useUIStore } from './stores/uiStore';

function App() {
  const { showPreview, sidebarWidth } = useUIStore();

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Toolbar */}
      <Toolbar />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Folder Tree */}
        <div
          className="flex-shrink-0 h-full"
          style={{ width: `${sidebarWidth}px` }}
        >
          <FolderTree />
        </div>

        {/* Editor Area */}
        <div className="flex-1 h-full flex">
          {/* Monaco Editor */}
          <div className={showPreview ? 'flex-1' : 'w-full'}>
            <MonacoEditor key={showPreview ? 'with-preview' : 'no-preview'} />
          </div>

          {/* Preview Pane */}
          {showPreview && (
            <div className="flex-1">
              <MarkdownPreview />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
