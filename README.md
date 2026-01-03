# Downwrite

**Write Down, Share Ideas** - A modern markdown note-taking app with public/private notes, inline creation, and beautiful editing experience.

🌐 **Live Demo**: [Your Railway URL]

## ✨ Features

### 📝 Powerful Editor
- **Monaco Editor** - VS Code's editor for markdown
- **Live Preview** - Real-time rendering with syntax highlighting
- **Math Support** - LaTeX math rendering with KaTeX
- **Auto-save** - Never lose your work

### 📁 Smart Organization
- **Inline Creation** - Hover folders to create files/folders instantly
- **Nested Folders** - Organize notes in deep hierarchies
- **Visual Tree** - See your entire note structure at a glance
- **No Modals** - Fast, inline editing like VS Code

### 🌐 Knowledge Sharing
- **Public Notes** - Share your knowledge with the world
- **Private Notes** - Keep personal notes private
- **Public Feed** - Browse recent public notes from all users
- **User Profiles** - View anyone's public notes collection
- **Privacy Toggle** - One-click to make notes public/private

### 👥 Multi-User
- **User Authentication** - Secure JWT-based auth
- **Personal Workspace** - Your own private editing space
- **User Isolation** - Notes stored per-user (`notes/user_<id>/`)
- **Profile Pages** - Each user gets a public profile

### 🎨 Beautiful UI
- **Modern Design** - Clean, professional interface
- **Responsive** - Works on desktop, tablet, mobile
- **Dark Editor** - Easy on the eyes for long writing sessions
- **Tailwind CSS** - Fast, beautiful styling

## 🏗️ Tech Stack

### Frontend
- **React** + **TypeScript** + **Vite**
- **Monaco Editor** - Code editor component
- **React Router** - Client-side routing
- **Zustand** - State management
- **TailwindCSS** - Styling
- **react-markdown** + **KaTeX** - Markdown rendering

### Backend
- **FastAPI** (Python) - High-performance API
- **PostgreSQL** - Database for users & metadata
- **SQLAlchemy** - ORM with async support
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **File System** - Notes stored as `.md` files

### Infrastructure
- **Railway** - Cloud deployment
- **GitHub** - Version control & CI/CD
- **Environment-based config** - Dev/prod separation

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.9+
- Node.js 18+ (or 20+ for react-router v7)
- PostgreSQL

### Backend Setup

1. **Create virtual environment**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up database**:
   ```bash
   # Create PostgreSQL database
   createdb downwrite_db

   # Set environment variable
   export DATABASE_URL="postgresql://user:password@localhost/downwrite_db"
   ```

4. **Initialize database**:
   ```bash
   python -c "from app.core.database import init_db; import asyncio; asyncio.run(init_db())"
   ```

5. **Start backend**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### Frontend Setup

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Set API URL**:
   ```bash
   # Create .env file
   echo "VITE_API_URL=http://localhost:8000/api" > .env
   ```

3. **Start frontend**:
   ```bash
   npm run dev
   ```

4. **Open browser**:
   - Frontend: http://localhost:5173
   - Backend API docs: http://localhost:8000/docs

## 📦 Project Structure

```
downwrite/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── auth.py          # Authentication endpoints
│   │   │   │   ├── files.py         # File CRUD + privacy
│   │   │   │   ├── folders.py       # Folder operations
│   │   │   │   └── public.py        # Public feed & profiles
│   │   │   └── schemas/             # Pydantic models
│   │   ├── core/
│   │   │   ├── auth.py              # JWT utilities
│   │   │   ├── database.py          # Database config
│   │   │   └── security.py          # Password hashing
│   │   ├── models/
│   │   │   ├── user.py              # User model
│   │   │   └── file.py              # File metadata model
│   │   ├── services/
│   │   │   ├── file_service.py      # File operations
│   │   │   └── folder_service.py    # Folder operations
│   │   └── main.py                  # FastAPI app
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/                # Login, Register
│   │   │   ├── Editor/              # Monaco Editor
│   │   │   ├── FolderTree/          # Tree with inline creation
│   │   │   ├── Preview/             # Markdown preview
│   │   │   ├── Public/              # Public feed components
│   │   │   └── Toolbar/             # Top toolbar + privacy toggle
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx      # Home with public feed
│   │   │   ├── Workspace.tsx        # Editor workspace
│   │   │   ├── PublicNoteViewer.tsx # Read-only note view
│   │   │   └── UserProfile.tsx      # User's public notes
│   │   ├── stores/                  # Zustand state
│   │   ├── api/                     # API client
│   │   └── App.tsx                  # Router config
│   └── package.json
├── notes/                           # User notes storage
│   └── user_<uuid>/                 # Per-user folders
└── README.md
```

## 🔒 Security

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - Bcrypt with salt rounds
- **Path Validation** - Prevents directory traversal
- **CORS Protection** - Configured for production
- **SQL Injection Protection** - SQLAlchemy ORM
- **Privacy Enforcement** - Backend validates file access

## 🌍 Deployment (Railway)

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

**Quick steps:**
1. Push to GitHub
2. Connect Railway to your repo
3. Add environment variables
4. Deploy!

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection (Railway provides)
- `SECRET_KEY` - JWT secret (generate with `openssl rand -hex 32`)
- `VITE_API_URL` - Frontend → Backend URL

## 📖 User Guide

### Creating Notes

**Option 1: Inline Creation (Recommended)**
1. Hover over any folder in the tree
2. Click the `📄` or `📁` button
3. Type name → Press Enter

**Option 2: Root Level**
1. Click `📁+` or `📄+` at top of tree
2. Type name → Press Enter

### Making Notes Public

1. Open a note in the editor
2. Look for the privacy toggle (🔒 or 🌐) in toolbar
3. Click to toggle Private ↔ Public
4. Public notes appear in the feed immediately

### Viewing Public Notes

- **Public Feed**: Go to landing page (`/`)
- **User Profiles**: Click any username → see all their public notes
- **Direct Link**: Share note URL: `/note/{id}`

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Get JWT token
- `GET /api/auth/me` - Get current user

### Files (Protected)
- `GET /api/files/tree` - Get folder tree
- `GET /api/files/content?path=<path>` - Get file content
- `POST /api/files/` - Create file
- `PUT /api/files/` - Update file
- `DELETE /api/files/?path=<path>` - Delete file
- `PATCH /api/files/{id}/privacy?is_public=<bool>` - Toggle privacy
- `GET /api/files/metadata` - Get all file metadata

### Public (No Auth)
- `GET /api/public/notes` - Get recent public notes
- `GET /api/public/notes/{id}/content` - Get specific note
- `GET /api/public/users/{id}/notes` - Get user's public notes

Full API docs: http://localhost:8000/docs

## 🎯 Roadmap

- [ ] Comments on public notes
- [ ] Likes/reactions
- [ ] Tags/categories
- [ ] Full-text search across public notes
- [ ] Export to PDF
- [ ] Mobile app
- [ ] Collaborative editing
- [ ] Custom domains

## 🐛 Troubleshooting

### "Cannot connect to database"
Check `DATABASE_URL` environment variable is set correctly.

### "Privacy toggle not working"
Hard refresh browser (Ctrl+Shift+R). Check Railway deployment succeeded.

### "Notes not appearing in public feed"
Ensure note is toggled to Public (🌐 icon). Check backend logs.

## 📄 License

MIT License - Free to use and modify

## 🤝 Contributing

This is a personal project, but suggestions and PRs are welcome!

---

**Built with Claude Code** 🤖
