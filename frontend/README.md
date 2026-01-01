# Knowledge Base Frontend

React + TypeScript frontend for the personal knowledge base application.

## Prerequisites

- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)

## Installation

### 1. Install Node.js

If you haven't installed Node.js yet:

**Using Homebrew (macOS):**
```bash
brew install node
```

**Using nvm (recommended for version management):**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install --lts
```

### 2. Install Dependencies

```bash
cd frontend
npm install
```

This will install all required packages:
- React + React DOM
- Vite (build tool)
- TypeScript
- Monaco Editor (VS Code's editor)
- Zustand (state management)
- Tailwind CSS (styling)
- react-markdown + KaTeX (markdown rendering with math)
- lucide-react (icons)

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at **http://localhost:5173**

Features in dev mode:
- Hot Module Replacement (instant updates)
- Source maps for debugging
- Fast refresh

### Production Build

```bash
npm run build
npm run preview
```

The build will be created in the `dist/` directory.

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── client.ts           # API client for backend
│   ├── components/
│   │   ├── FolderTree/
│   │   │   └── FolderTree.tsx  # Recursive folder navigation
│   │   ├── Editor/
│   │   │   └── MonacoEditor.tsx # Monaco editor wrapper
│   │   ├── Preview/
│   │   │   └── MarkdownPreview.tsx # Markdown preview
│   │   └── Toolbar/
│   │       └── Toolbar.tsx     # File operations toolbar
│   ├── stores/
│   │   ├── fileStore.ts        # File state (Zustand)
│   │   ├── folderStore.ts      # Folder tree state (Zustand)
│   │   └── uiStore.ts          # UI state (Zustand)
│   ├── types/
│   │   └── index.ts            # TypeScript types
│   ├── App.tsx                 # Main app component
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles + Tailwind
├── index.html                  # HTML template
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── vite.config.ts              # Vite config
└── tailwind.config.js          # Tailwind config
```

## Features

### Monaco Editor
- VS Code's powerful editor
- Syntax highlighting for markdown
- Line numbers and folding
- Auto-save (500ms debounce)
- Keyboard shortcut: **Ctrl+S** / **Cmd+S** to save

### Folder Navigation
- Recursive folder tree
- Click to expand/collapse folders
- Click files to open in editor
- Visual indication of selected file

### Markdown Preview
- Live preview as you type
- Math rendering with KaTeX
  - Inline: `$E = mc^2$`
  - Block: `$$\int_0^\infty e^{-x^2} dx$$`
- Syntax highlighting for code blocks
- GitHub-flavored styling

### File Operations
- **New File**: Create files with `.md` extension
- **New Folder**: Create folders for organization
- **Delete**: Remove files with confirmation
- **Auto-save**: Saves 500ms after typing stops
- **Refresh**: Reload folder tree

### UI Controls
- **Toggle Preview**: Show/hide preview pane
- **Unsaved Changes**: Visual indicator when file is dirty
- **Current File**: Display in toolbar

## Configuration

### Backend API URL

By default, the frontend connects to `http://localhost:8000`

To change the backend URL, edit `src/api/client.ts`:

```typescript
const API_BASE = 'http://localhost:8000/api';
```

### Editor Theme

To change the Monaco editor theme, edit `src/components/Editor/MonacoEditor.tsx`:

```typescript
theme="vs-light"  // Options: vs-light, vs-dark
```

### Tailwind Configuration

Customize colors, fonts, etc. in `tailwind.config.js`

## Keyboard Shortcuts

- **Ctrl+S** / **Cmd+S** - Save current file
- **Ctrl+N** / **Cmd+N** - New file (via toolbar button)

## Troubleshooting

### Backend Connection Errors

Make sure the backend is running:
```bash
cd ../backend
source venv/bin/activate
uvicorn app.main:app --reload
```

### CORS Errors

The backend must allow `http://localhost:5173` in CORS configuration.
Check `backend/app/main.py` - it should already be configured.

### Monaco Editor Not Loading

Clear browser cache and reload. Monaco loads from CDN and may be cached.

### Math Not Rendering

Make sure KaTeX CSS is imported in `MarkdownPreview.tsx`:
```typescript
import 'katex/dist/katex.min.css';
```

### TypeScript Errors

Run type checking:
```bash
npm run build
```

Fix any TypeScript errors before building.

### Port 5173 Already in Use

Change the port in `vite.config.ts`:
```typescript
server: {
  port: 5174,  // Use different port
  host: true
}
```

## Development Tips

1. **Hot Reload**: Changes automatically refresh in the browser
2. **React DevTools**: Install browser extension for debugging
3. **Console Logs**: Check browser console for errors
4. **Network Tab**: Inspect API calls in DevTools

## Building for Production

```bash
npm run build
```

This creates an optimized production build in `dist/`:
- Minified JavaScript and CSS
- Optimized images
- Tree-shaken dependencies
- Source maps (optional)

To test the production build:
```bash
npm run preview
```

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool (fast HMR)
- **Tailwind CSS** - Utility-first CSS
- **Monaco Editor** - Code editor
- **Zustand** - State management
- **react-markdown** - Markdown rendering
- **KaTeX** - Math rendering
- **lucide-react** - Icons

## Next Steps

1. ✅ Frontend code is complete
2. Install Node.js if not already installed
3. Run `npm install` in the frontend directory
4. Run `npm run dev` to start the dev server
5. Open http://localhost:5173 in your browser
6. Enjoy your knowledge base!

## License

MIT License - Free for personal use
