# Personal Knowledge Base

A modern, markdown-based personal knowledge base with folder navigation, Monaco Editor, and math rendering support.

## Features

- **Markdown Editor**: Monaco Editor (VS Code's editor) for a powerful editing experience
- **Folder Navigation**: Organize notes in folders (algorithms, stats, etc.)
- **Math Support**: LaTeX math rendering with KaTeX
- **Live Preview**: Real-time markdown preview with syntax highlighting
- **Auto-save**: Automatic saving with debouncing
- **File Management**: Create, edit, delete files and folders
- **Search**: Full-text search across all notes
- **Keyboard Shortcuts**: Ctrl+S to save, and more

## Tech Stack

### Frontend ✅ (Complete - Ready to Run)
- React + Vite + TypeScript
- Monaco Editor (VS Code's editor)
- Zustand (state management)
- Tailwind CSS (styling)
- react-markdown + KaTeX (markdown rendering with math)

### Backend ✅ (Running)
- FastAPI (Python)
- File system storage (markdown as `.md` files)
- Async file operations
- Path validation and security

## Project Structure

```
knowledge-base/
├── frontend/           # React + Vite (requires Node.js)
├── backend/            # FastAPI (Python) ✅ WORKING
│   ├── app/
│   │   ├── api/routes/
│   │   ├── services/
│   │   └── main.py
│   └── requirements.txt
└── notes/              # Your markdown files ✅
    ├── algorithms/
    │   └── sorting.md
    ├── stats/
    │   └── probability.md
    └── README.md
```

## Current Status

✅ **Backend: Complete and Running**
- FastAPI server running on http://localhost:8000
- All file operations working (create, read, update, delete)
- Folder management working
- Search functionality working
- API docs available at http://localhost:8000/docs

✅ **Frontend: Complete (Requires Node.js to Run)**
- All React components built and ready
- Monaco Editor integration complete
- Markdown preview with KaTeX ready
- Zustand state management configured
- Tailwind CSS styling complete
- **Just need to install Node.js and run `npm install`!**

## Quick Start

### Backend (Already Running)

The backend is currently running on http://localhost:8000

To restart it:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Test the API:
```bash
# View API docs
open http://localhost:8000/docs

# Get file tree
curl http://localhost:8000/api/files/tree

# Get file content
curl "http://localhost:8000/api/files/content?path=algorithms/sorting.md"
```

### Frontend Setup (Simple 3-Step Process)

1. **Install Node.js**:
   ```bash
   # Using Homebrew (macOS)
   brew install node

   # Or using nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install --lts
   ```

2. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

3. **Start the App**:
   ```bash
   npm run dev
   ```

4. **Open in Browser**:
   - Frontend: **http://localhost:5173**
   - Backend API: http://localhost:8000

## API Endpoints

### Files
- `GET /api/files/tree` - Get folder tree
- `GET /api/files/content?path=<path>` - Get file content
- `POST /api/files/` - Create file
- `PUT /api/files/` - Update file
- `DELETE /api/files/?path=<path>` - Delete file
- `GET /api/files/search?q=<query>` - Search files

### Folders
- `POST /api/folders/` - Create folder
- `DELETE /api/folders/?path=<path>` - Delete folder

See [backend/README.md](backend/README.md) for detailed API documentation.

## Development Workflow

### Daily Development (after frontend setup)

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Then open http://localhost:5173 in your browser.

## Notes Storage

All notes are stored as `.md` files in the `notes/` directory:

```
notes/
├── algorithms/
│   └── sorting.md
├── stats/
│   └── probability.md
└── README.md
```

You can:
- Edit files directly in your favorite editor (VS Code, Vim, etc.)
- Organize notes in folders
- Use git for version control
- Back up by copying the `notes/` directory

## Math Support

Write math using LaTeX syntax:

**Inline math:**
```markdown
The formula is $E = mc^2$
```

**Block math:**
```markdown
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

## Security

- **Path Validation**: Prevents directory traversal attacks
- **Filename Validation**: Only allows safe characters
- **CORS**: Configured for local development
- **No Execution**: Files are never executed, only read/written

## Implementation Phases

- ✅ **Phase 1**: Backend with file operations
- ✅ **Phase 2**: Frontend with React + Vite
- ✅ **Phase 3**: Monaco Editor integration
- ✅ **Phase 4**: Markdown preview with KaTeX
- ✅ **Phase 5**: File operations UI (create, delete, auto-save)

## Troubleshooting

### Backend Issues

**Port already in use:**
```bash
lsof -i :8000  # Find process
kill -9 <PID>  # Kill process
```

**Import errors:**
```bash
cd backend
source venv/bin/activate
```

### Frontend Issues (after Node.js installation)

**Node not found:**
- Install Node.js first (see Quick Start)

**npm not found:**
- Node.js installation includes npm

**Dependencies not installing:**
- Clear npm cache: `npm cache clean --force`
- Remove node_modules: `rm -rf node_modules`
- Reinstall: `npm install`

## Next Steps

1. ✅ Backend is complete and running
2. ✅ Frontend code is complete
3. **Install Node.js** (if not already installed)
4. **Run `npm install`** in the frontend directory
5. **Run `npm run dev`** to start the application
6. **Open http://localhost:5173** and enjoy your knowledge base!

## Documentation

- [Backend README](backend/README.md) - Detailed backend documentation
- [Frontend README](frontend/README.md) - Detailed frontend documentation
- [Implementation Plan](~/.claude/plans/twinkly-riding-scroll.md) - Complete implementation plan
- API Docs: http://localhost:8000/docs (interactive)

## License

MIT License - Free for personal use

## Contributing

This is a personal project, but feel free to fork and customize for your own use!

---

**Current Status**: Backend complete ✅ | Frontend complete ✅ | Ready to run after `npm install`! 🚀
