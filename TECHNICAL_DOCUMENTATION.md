# Technical Documentation - Downwrite

**A comprehensive guide to understanding the complete architecture, technologies, and implementation details.**

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Frontend Deep Dive](#frontend-deep-dive)
3. [Backend Deep Dive](#backend-deep-dive)
4. [Database Architecture](#database-architecture)
5. [Authentication System](#authentication-system)
6. [File Storage System](#file-storage-system)
7. [API Endpoints](#api-endpoints)
8. [Security Implementation](#security-implementation)
9. [Deployment Architecture](#deployment-architecture)
10. [Data Flow Examples](#data-flow-examples)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React SPA (Vite + TypeScript)                       │   │
│  │  - React Router (routing)                            │   │
│  │  - Zustand (state management)                        │   │
│  │  - Monaco Editor (code editing)                      │   │
│  │  - React Markdown (rendering)                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            │ JWT Token in Headers
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Railway)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  FastAPI (Python)                                    │   │
│  │  - CORS Middleware                                   │   │
│  │  - JWT Authentication                                │   │
│  │  - API Routes                                        │   │
│  │  - Service Layer                                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
            │                           │
            │                           │
            ▼                           ▼
┌──────────────────────┐    ┌──────────────────────────────┐
│   PostgreSQL DB      │    │   File System (Volume)       │
│   (Railway)          │    │   /app/notes/                │
│                      │    │                              │
│   Tables:            │    │   Structure:                 │
│   - users            │    │   notes/                     │
│   - files            │    │   └── user_<uuid>/           │
│                      │    │       ├── file1.md           │
│                      │    │       ├── folder/            │
│                      │    │       │   └── file2.md       │
└──────────────────────┘    └──────────────────────────────┘
```

### Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18.2 | UI library |
| | TypeScript 5.2 | Type safety |
| | Vite 5.0 | Build tool & dev server |
| | React Router 7.11 | Client-side routing |
| | Zustand 4.4 | State management |
| | Monaco Editor 4.6 | Code editor (VS Code engine) |
| | TailwindCSS 3.4 | Styling |
| **Backend** | FastAPI | Python web framework |
| | Python 3.9+ | Language |
| | SQLAlchemy | ORM |
| | Pydantic | Data validation |
| | Uvicorn | ASGI server |
| **Database** | PostgreSQL | Relational database |
| **Auth** | JWT | Token-based authentication |
| | Bcrypt | Password hashing |
| **Deployment** | Railway | Cloud platform |
| | Let's Encrypt | SSL certificates |

---

## Frontend Deep Dive

### Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── Auth/           # Login, Register
│   │   ├── Editor/         # Monaco Editor wrapper
│   │   ├── FolderTree/     # File tree with inline creation
│   │   ├── Preview/        # Markdown preview
│   │   ├── Public/         # Public notes feed components
│   │   └── Toolbar/        # Top toolbar + privacy toggle
│   ├── pages/              # Route pages
│   │   ├── LandingPage.tsx       # Home with public feed
│   │   ├── Workspace.tsx         # Main editor workspace
│   │   ├── PublicNoteViewer.tsx  # Read-only note view
│   │   └── UserProfile.tsx       # User's public notes
│   ├── stores/             # Zustand state stores
│   │   ├── authStore.ts          # Authentication state
│   │   ├── fileStore.ts          # File content & metadata
│   │   ├── folderStore.ts        # Folder tree state
│   │   ├── publicStore.ts        # Public notes feed
│   │   └── uiStore.ts            # UI state (preview toggle)
│   ├── api/                # API client
│   │   └── client.ts             # HTTP requests to backend
│   ├── types/              # TypeScript interfaces
│   │   └── index.ts              # Shared types
│   ├── App.tsx             # Router configuration
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

### State Management with Zustand

Zustand is a lightweight state management library. Each store is independent and uses hooks.

#### Example: Auth Store

```typescript
// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (username: string, email: string, password: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      login: async (username, password) => {
        const response = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ username, password }),
        });
        const data = await response.json();
        set({ user: data.user, token: data.access_token });
      },

      logout: () => {
        set({ user: null, token: null });
      },
    }),
    {
      name: 'auth-storage', // localStorage key
    }
  )
);
```

**Key Concepts:**
- `create()`: Creates the store
- `persist()`: Middleware that saves state to localStorage
- `set()`: Updates state
- `get()`: Reads current state
- Automatic re-rendering when state changes

#### File Store - Complex Example

```typescript
// stores/fileStore.ts
export const useFileStore = create<FileStore>((set, get) => ({
  currentFile: null,
  currentFileId: null,
  isPublic: false,
  content: '',
  isDirty: false,
  isLoading: false,
  metadata: new Map<string, FileMetadata>(),

  // Load file from backend
  loadFile: async (path: string) => {
    set({ isLoading: true });
    try {
      const content = await fileAPI.getContent(path);
      const { metadata } = get();
      const fileMeta = metadata.get(path);

      set({
        currentFile: path,
        currentFileId: fileMeta?.id || null,
        isPublic: fileMeta?.is_public || false,
        content,
        isDirty: false,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Update content (marks as dirty)
  updateContent: (content: string) => {
    set({ content, isDirty: true });
  },

  // Save to backend
  saveFile: async () => {
    const { currentFile, content } = get();
    if (!currentFile) return;

    await fileAPI.updateFile(currentFile, content);
    set({ isDirty: false });
  },
}));
```

**State Flow:**
1. User clicks file in tree
2. `loadFile()` called
3. Fetches from API
4. Updates store state
5. Components re-render automatically

### Component Architecture

#### Monaco Editor Integration

```typescript
// components/Editor/MonacoEditor.tsx
import Editor from '@monaco-editor/react';

export function MonacoEditor() {
  const { content, updateContent, saveFile } = useFileStore();

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      updateContent(value); // Update Zustand store
    }
  };

  const handleEditorMount = (editor: any) => {
    // Add Cmd+S / Ctrl+S save shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveFile();
    });
  };

  return (
    <Editor
      language="markdown"
      theme="vs-dark"
      value={content}
      onChange={handleEditorChange}
      onMount={handleEditorMount}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: 'on',
        lineNumbers: 'on',
      }}
    />
  );
}
```

**Monaco Editor Features:**
- Full VS Code editing experience
- Syntax highlighting for markdown
- Keyboard shortcuts (Cmd+S for save)
- Auto-save on change (with debouncing in practice)

#### Markdown Preview with GFM

```typescript
// components/Preview/MarkdownPreview.tsx
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';

export function MarkdownPreview() {
  const { content } = useFileStore();

  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath, remarkGfm]}
      rehypePlugins={[rehypeKatex]}
      components={{
        // Custom table rendering
        table: ({ children }) => (
          <div className="overflow-x-auto my-6">
            <table className="min-w-full border">
              {children}
            </table>
          </div>
        ),
        // Custom code block rendering
        code({ className, children }) {
          const inline = !className;
          return inline ? (
            <code className="bg-gray-100 px-1.5 py-0.5">
              {children}
            </code>
          ) : (
            <code className="block bg-gray-900 p-4">
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
```

**Plugins:**
- `remarkMath`: Parse LaTeX math
- `remarkGfm`: GitHub Flavored Markdown (tables, strikethrough, task lists)
- `rehypeKatex`: Render math with KaTeX

### Routing with React Router v7

```typescript
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/note/:fileId" element={<PublicNoteViewer />} />
        <Route path="/profile/:userId" element={<UserProfile />} />

        {/* Protected routes */}
        <Route
          path="/workspace"
          element={
            <ProtectedRoute>
              <Workspace />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/" />;
}
```

**Route Types:**
- **Public**: Accessible without authentication
- **Protected**: Requires JWT token (auto-redirect to landing if not logged in)

### API Client

```typescript
// api/client.ts
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getAuthHeaders(): HeadersInit {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

export const fileAPI = {
  async getContent(path: string): Promise<string> {
    const response = await fetch(
      `${API_BASE}/files/content?path=${encodeURIComponent(path)}`,
      { headers: getAuthHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch file');
    const data = await response.json();
    return data.content;
  },

  async updateFile(path: string, content: string): Promise<void> {
    const response = await fetch(`${API_BASE}/files/`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ path, content }),
    });
    if (!response.ok) throw new Error('Failed to update file');
  },
};
```

**Key Concepts:**
- Environment variables: `import.meta.env.VITE_API_URL`
- Authorization header with JWT: `Bearer <token>`
- Type-safe API methods with TypeScript

---

## Backend Deep Dive

### Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── routes/              # API endpoints
│   │   │   ├── auth.py          # /api/auth/* (login, register)
│   │   │   ├── files.py         # /api/files/* (CRUD + privacy)
│   │   │   ├── folders.py       # /api/folders/* (create, delete)
│   │   │   └── public.py        # /api/public/* (public notes)
│   │   └── schemas/             # Pydantic models
│   │       ├── auth.py          # UserCreate, UserResponse, Token
│   │       └── file.py          # FileCreate, FileUpdate, PublicNoteResponse
│   ├── core/
│   │   ├── auth.py              # JWT utilities, get_current_user
│   │   ├── database.py          # Database connection, session
│   │   └── security.py          # Password hashing (bcrypt)
│   ├── models/
│   │   ├── user.py              # User SQLAlchemy model
│   │   └── file.py              # File SQLAlchemy model
│   ├── services/
│   │   ├── file_service.py      # File operations (read, write, tree)
│   │   └── folder_service.py    # Folder operations
│   └── main.py                  # FastAPI app, CORS, lifespan
├── requirements.txt
└── railway.toml
```

### FastAPI Application Setup

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Runs on startup and shutdown"""
    # Startup: Initialize database
    print("Initializing database...")
    await init_db()
    print("Database initialized!")
    yield
    # Shutdown
    print("Shutting down...")

app = FastAPI(
    title="Knowledge Base API",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Configuration
origins = [
    "http://localhost:5173",
    "https://www.down-write.com",
    "https://down-write.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(public.router)
app.include_router(files.router)
app.include_router(folders.router)
```

**Key Concepts:**
- `lifespan`: Context manager for startup/shutdown events
- `CORS`: Cross-Origin Resource Sharing - allows frontend to call backend
- `allow_credentials=True`: Allows cookies/auth headers
- `include_router`: Modular route organization

### Database Configuration

```python
# app/core/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
import os

DATABASE_URL = os.getenv("DATABASE_URL")

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Set True to see SQL queries
    pool_pre_ping=True,  # Verify connections before using
)

# Async session factory
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()

async def get_db() -> AsyncSession:
    """Dependency for getting database session"""
    async with AsyncSessionLocal() as session:
        yield session

async def init_db():
    """Create all tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

**Key Concepts:**
- `create_async_engine`: Async SQLAlchemy engine
- `AsyncSession`: Async database sessions
- `get_db()`: Dependency injection - provides DB session to routes
- `init_db()`: Creates tables on startup

### Models (SQLAlchemy ORM)

```python
# app/models/user.py
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

```python
# app/models/file.py
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

class File(Base):
    __tablename__ = "files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(String(500), nullable=False)  # Relative path in user's dir
    title = Column(String(255), nullable=False)
    is_public = Column(Boolean, default=False, nullable=False, index=True)
    preview = Column(Text, nullable=True)  # First 200 chars
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship
    user = relationship("User", backref="files")

    # Composite indexes
    __table_args__ = (
        Index('idx_user_file_path', 'user_id', 'file_path', unique=True),
        Index('idx_public_created', 'is_public', 'created_at'),
    )
```

**Key Concepts:**
- `UUID`: Unique identifier (not sequential, more secure than int)
- `ForeignKey`: Relationship between tables
- `Index`: Speeds up queries
- `server_default=func.now()`: Database sets timestamp
- `ondelete="CASCADE"`: Delete user → delete their files
- `relationship()`: ORM relationship (can access `user.files`)

### Pydantic Schemas (Data Validation)

```python
# app/api/schemas/auth.py
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from uuid import UUID

class UserCreate(BaseModel):
    """Request body for user registration"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)

class UserResponse(BaseModel):
    """Response body for user data"""
    id: UUID
    username: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True  # Allows ORM models

class Token(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str
    user: UserResponse
```

**Key Concepts:**
- Pydantic validates incoming data automatically
- `Field()`: Validation constraints (min/max length)
- `EmailStr`: Validates email format
- `from_attributes = True`: Convert SQLAlchemy models to Pydantic
- Type hints enforce structure

### Authentication Routes

```python
# app/api/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    # Check if username exists
    result = await db.execute(select(User).where(User.username == user_data.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already exists")

    # Hash password
    hashed_password = hash_password(user_data.password)

    # Create user
    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    # Find user
    result = await db.execute(select(User).where(User.username == form_data.username))
    user = result.scalar_one_or_none()

    # Verify password
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    # Create JWT token
    access_token = create_access_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_route(
    current_user: User = Depends(get_current_active_user)
):
    return current_user
```

**Flow:**
1. **Register**: Hash password → Save to DB → Return user
2. **Login**: Find user → Verify password → Generate JWT → Return token + user
3. **Get Me**: Extract JWT → Find user → Return user data

### JWT Authentication

```python
# app/core/auth.py
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import os

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def create_access_token(data: dict) -> str:
    """Create JWT token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Decode JWT and get user from database"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decode JWT
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Get user from DB
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Ensure user is active"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
```

**JWT Structure:**
```json
{
  "sub": "user-uuid-here",
  "exp": 1234567890
}
```

**Flow:**
1. User logs in → Backend creates JWT with user ID
2. Frontend stores JWT in localStorage
3. Frontend sends JWT in `Authorization: Bearer <token>` header
4. Backend decodes JWT → Extracts user ID → Fetches user from DB
5. Route gets authenticated user via `Depends(get_current_active_user)`

### Password Security

```python
# app/core/security.py
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash password with bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)
```

**Bcrypt:**
- Slow hashing algorithm (intentional) - makes brute force attacks impractical
- Automatically adds salt (random data) to prevent rainbow table attacks
- `hash_password("password123")` → `$2b$12$...` (different every time)

### File Service

```python
# app/services/file_service.py
from pathlib import Path
import aiofiles
import os

class FileService:
    def __init__(self, notes_dir: str = "../notes"):
        # Resolve notes directory
        current_file = Path(__file__).resolve()
        backend_root = current_file.parent.parent.parent
        self.notes_dir = (backend_root / notes_dir).resolve()
        self.notes_dir.mkdir(parents=True, exist_ok=True)

    def _get_user_dir(self, user_id: str) -> Path:
        """Get user's notes directory"""
        user_dir = self.notes_dir / f"user_{user_id}"
        user_dir.mkdir(parents=True, exist_ok=True)
        return user_dir

    def _validate_path(self, user_id: str, user_path: str) -> Path:
        """Validate path to prevent directory traversal"""
        if not user_path:
            raise ValueError("Path cannot be empty")

        # Remove leading/trailing slashes
        user_path = user_path.strip("/").strip()

        # Check for directory traversal
        if ".." in user_path or user_path.startswith("/"):
            raise ValueError("Invalid path: directory traversal not allowed")

        # Get user directory
        user_dir = self._get_user_dir(user_id)

        # Resolve full path
        full_path = (user_dir / user_path).resolve()

        # Ensure it's within user's directory
        if not full_path.is_relative_to(user_dir):
            raise ValueError("Invalid path: outside user directory")

        return full_path

    async def read_file(self, user_id: str, path: str) -> str:
        """Read file content"""
        full_path = self._validate_path(user_id, path)

        if not full_path.exists():
            raise FileNotFoundError(f"File not found: {path}")

        async with aiofiles.open(full_path, 'r', encoding='utf-8') as f:
            return await f.read()

    async def write_file(self, user_id: str, path: str, content: str) -> None:
        """Write file content"""
        full_path = self._validate_path(user_id, path)

        # Ensure .md extension
        if not full_path.name.endswith('.md'):
            raise ValueError("File must have .md extension")

        # Create parent directories
        full_path.parent.mkdir(parents=True, exist_ok=True)

        # Write file
        async with aiofiles.open(full_path, 'w', encoding='utf-8') as f:
            await f.write(content)

    def get_tree(self, user_id: str) -> List[Dict]:
        """Build folder tree"""
        user_dir = self._get_user_dir(user_id)

        def build_tree(path: Path) -> Dict:
            relative_path = path.relative_to(user_dir)

            if path.is_file():
                return {
                    "name": path.name,
                    "path": str(relative_path),
                    "type": "file"
                }

            # Directory
            children = []
            for child in sorted(path.iterdir(), key=lambda p: (p.is_file(), p.name)):
                if not child.name.startswith('.'):
                    children.append(build_tree(child))

            return {
                "name": path.name,
                "path": str(relative_path),
                "type": "folder",
                "children": children
            }

        tree = build_tree(user_dir)
        return tree.get("children", [])
```

**Security:**
- `_validate_path()`: Prevents directory traversal attacks (`../../../etc/passwd`)
- `is_relative_to()`: Ensures file is within user's directory
- User isolation: Each user has their own `user_<uuid>/` directory

### File Routes

```python
# app/api/routes/files.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/files", tags=["files"])
file_service = FileService(notes_dir=os.getenv("NOTES_DIR", "../notes"))

@router.get("/tree")
async def get_file_tree(
    current_user: User = Depends(get_current_active_user)
):
    """Get folder tree for current user"""
    tree = file_service.get_tree(str(current_user.id))
    return tree

@router.get("/content")
async def get_file_content(
    path: str = Query(...),
    current_user: User = Depends(get_current_active_user)
):
    """Get file content"""
    content = await file_service.read_file(str(current_user.id), path)
    return {"content": content}

@router.post("/")
async def create_file(
    file_data: FileContent,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create new file"""
    # Write to filesystem
    await file_service.write_file(
        str(current_user.id),
        file_data.path,
        file_data.content,
        db  # Also creates DB record
    )
    return {"message": "File created"}

@router.put("/")
async def update_file(
    file_data: FileContent,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update existing file"""
    await file_service.write_file(
        str(current_user.id),
        file_data.path,
        file_data.content,
        db
    )
    return {"message": "File updated"}

@router.delete("/")
async def delete_file(
    path: str = Query(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete file"""
    await file_service.delete_file(str(current_user.id), path, db)
    return {"message": "File deleted"}

@router.patch("/{file_id}/privacy")
async def toggle_privacy(
    file_id: UUID,
    is_public: bool = Query(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Toggle file privacy"""
    # Get file from DB
    result = await db.execute(
        select(File).where(File.id == file_id, File.user_id == current_user.id)
    )
    file = result.scalar_one_or_none()

    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    # Update privacy
    file.is_public = is_public
    await db.commit()

    return {"message": "Privacy updated"}
```

**Dependencies:**
- `current_user = Depends(get_current_active_user)`: Automatically extracts user from JWT
- `db = Depends(get_db)`: Provides database session
- FastAPI handles dependency injection automatically

---

## Database Architecture

### Schema Design

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Files metadata table
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    title VARCHAR(255) NOT NULL,
    is_public BOOLEAN DEFAULT FALSE NOT NULL,
    preview TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_user_file_path ON files(user_id, file_path);
CREATE INDEX idx_public_created ON files(is_public, created_at);
CREATE INDEX idx_files_user_id ON files(user_id);
```

### Why This Design?

**Hybrid Storage:**
- **Database**: User accounts, file metadata (privacy, title, preview)
- **Filesystem**: Actual markdown content

**Benefits:**
- Fast metadata queries (public feed, user's files)
- Efficient full-text markdown storage
- Easy backup (database + volume)

**Indexes:**
- `idx_user_file_path`: Fast lookups for specific user's file
- `idx_public_created`: Fast queries for public feed (sorted by date)
- `idx_files_user_id`: Fast queries for all user's files

### Relationships

```
User (1) ────< (N) Files
  │
  └─ id (UUID)
       │
       └─ Referenced by File.user_id
```

**Cascade Delete:**
- Delete user → Automatically deletes all their files from DB
- `ON DELETE CASCADE` in foreign key constraint

---

## Authentication System

### Complete Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      1. REGISTRATION                         │
└─────────────────────────────────────────────────────────────┘

Client                          Backend                    Database
  │                               │                            │
  │ POST /api/auth/register       │                            │
  │ {username, email, password}   │                            │
  ├──────────────────────────────>│                            │
  │                               │ Hash password (bcrypt)     │
  │                               │ salt + hash = "$2b$12..."  │
  │                               │                            │
  │                               │ INSERT INTO users          │
  │                               ├───────────────────────────>│
  │                               │                            │
  │                               │<───────────────────────────┤
  │                               │ Return user                │
  │                               │                            │
  │<──────────────────────────────┤                            │
  │ {id, username, email}         │                            │
  │                               │                            │


┌─────────────────────────────────────────────────────────────┐
│                         2. LOGIN                             │
└─────────────────────────────────────────────────────────────┘

Client                          Backend                    Database
  │                               │                            │
  │ POST /api/auth/login          │                            │
  │ {username, password}          │                            │
  ├──────────────────────────────>│                            │
  │                               │ SELECT * FROM users        │
  │                               │ WHERE username = ?         │
  │                               ├───────────────────────────>│
  │                               │                            │
  │                               │<───────────────────────────┤
  │                               │ User + hashed_password     │
  │                               │                            │
  │                               │ Verify password:           │
  │                               │ bcrypt.verify(password,    │
  │                               │   hashed_password)         │
  │                               │ ✓ Match!                   │
  │                               │                            │
  │                               │ Create JWT:                │
  │                               │ {                          │
  │                               │   "sub": "user-id",        │
  │                               │   "exp": 1234567890        │
  │                               │ }                          │
  │                               │ Signed with SECRET_KEY     │
  │                               │                            │
  │<──────────────────────────────┤                            │
  │ {                             │                            │
  │   access_token: "eyJ...",     │                            │
  │   token_type: "bearer",       │                            │
  │   user: {...}                 │                            │
  │ }                             │                            │
  │                               │                            │
  │ Store in localStorage:        │                            │
  │ {                             │                            │
  │   token: "eyJ...",            │                            │
  │   user: {...}                 │                            │
  │ }                             │                            │


┌─────────────────────────────────────────────────────────────┐
│                    3. AUTHENTICATED REQUEST                  │
└─────────────────────────────────────────────────────────────┘

Client                          Backend                    Database
  │                               │                            │
  │ GET /api/files/tree           │                            │
  │ Authorization: Bearer eyJ...  │                            │
  ├──────────────────────────────>│                            │
  │                               │ Extract token from header  │
  │                               │                            │
  │                               │ Decode JWT:                │
  │                               │ jwt.decode(token,          │
  │                               │   SECRET_KEY)              │
  │                               │ → {sub: "user-id"}         │
  │                               │                            │
  │                               │ SELECT * FROM users        │
  │                               │ WHERE id = "user-id"       │
  │                               ├───────────────────────────>│
  │                               │                            │
  │                               │<───────────────────────────┤
  │                               │ User object                │
  │                               │                            │
  │                               │ Proceed with request       │
  │                               │ (user is authenticated)    │
  │                               │                            │
  │<──────────────────────────────┤                            │
  │ [File tree data]              │                            │
```

### JWT Token Structure

**Encoded (sent to client):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YmNkMzI2Yy01OTA5LTRhNDAtYjkyNi1jYTJlYmIyODA3ZDQiLCJleHAiOjE3Njc0MDU5MDh9.5Bdglq3GLsUMsoVEd-AdIayXfkQk4KcO6vyDwa6pZas
```

**Decoded (header.payload.signature):**
```json
// Header
{
  "alg": "HS256",
  "typ": "JWT"
}

// Payload
{
  "sub": "6bcd326c-5909-4a40-b926-ca2ebb2807d4",  // User ID
  "exp": 1767405908  // Expiration timestamp
}

// Signature
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  SECRET_KEY
)
```

**Security:**
- Token is signed with `SECRET_KEY` (only backend knows it)
- Client can't modify token without invalidating signature
- Token expires after 7 days (`exp` field)
- No password stored in token, only user ID

---

## File Storage System

### Storage Architecture

```
/app/notes/                          (Railway Volume - Persistent)
├── user_6bcd326c-5909-4a40-b926-ca2ebb2807d4/
│   ├── algorithms/
│   │   ├── sorting.md
│   │   ├── searching.md
│   │   └── dynamic-programming/
│   │       └── fibonacci.md
│   ├── data-structures/
│   │   ├── arrays.md
│   │   └── trees.md
│   └── notes.md
└── user_cfb9e28e-a423-47d0-a723-299d86ea27f9/
    ├── projects/
    │   └── todo-app.md
    └── ideas.md
```

### Database Records

```sql
-- File metadata in PostgreSQL
SELECT * FROM files;

| id (UUID)  | user_id    | file_path            | title               | is_public | preview        | created_at |
|------------|------------|----------------------|---------------------|-----------|----------------|------------|
| abc-123... | 6bcd326c...| algorithms/sorting.md| Sorting Algorithms  | true      | # Sorting A... | 2024-01-01 |
| def-456... | 6bcd326c...| notes.md             | Notes               | false     | # Quick Not... | 2024-01-02 |
```

### Sync Strategy

**On File Write:**
1. Write markdown content to filesystem (`/app/notes/user_<id>/path.md`)
2. Extract title from filename
3. Generate preview (first 200 chars)
4. Create/update File record in database

**Example:**
```python
async def write_file(self, user_id: str, path: str, content: str, db: AsyncSession):
    # 1. Write to filesystem
    full_path = self._validate_path(user_id, path)
    async with aiofiles.open(full_path, 'w') as f:
        await f.write(content)

    # 2. Sync with database
    if db:
        title = full_path.stem.replace('-', ' ').title()
        preview = content[:200]

        file_record = File(
            user_id=uuid.UUID(user_id),
            file_path=path,
            title=title,
            preview=preview,
            is_public=False
        )
        db.add(file_record)
        await db.commit()
```

---

## API Endpoints

### Complete API Reference

#### Authentication Endpoints

| Method | Endpoint | Auth | Description | Request Body | Response |
|--------|----------|------|-------------|--------------|----------|
| POST | `/api/auth/register` | No | Create new user | `{username, email, password}` | `{id, username, email, created_at}` |
| POST | `/api/auth/login` | No | Login user | `{username, password}` | `{access_token, token_type, user}` |
| GET | `/api/auth/me` | Yes | Get current user | - | `{id, username, email}` |

#### File Endpoints

| Method | Endpoint | Auth | Description | Query/Body | Response |
|--------|----------|------|-------------|------------|----------|
| GET | `/api/files/tree` | Yes | Get folder tree | - | `[{name, path, type, children}]` |
| GET | `/api/files/content` | Yes | Get file content | `?path=file.md` | `{content: "..."}` |
| POST | `/api/files/` | Yes | Create file | `{path, content}` | `{message}` |
| PUT | `/api/files/` | Yes | Update file | `{path, content}` | `{message}` |
| DELETE | `/api/files/` | Yes | Delete file | `?path=file.md` | `{message}` |
| PATCH | `/api/files/{id}/privacy` | Yes | Toggle privacy | `?is_public=true` | `{message}` |
| GET | `/api/files/metadata` | Yes | Get all file metadata | - | `{files: [{id, path, is_public}], count}` |

#### Folder Endpoints

| Method | Endpoint | Auth | Description | Request Body | Response |
|--------|----------|------|-------------|--------------|----------|
| POST | `/api/folders/` | Yes | Create folder | `{path}` | `{message}` |
| DELETE | `/api/folders/` | Yes | Delete folder | `?path=folder` | `{message}` |
| POST | `/api/folders/copy` | Yes | Copy folder | `{source_path, dest_path}` | `{message}` |

#### Public Endpoints

| Method | Endpoint | Auth | Description | Query | Response |
|--------|----------|------|-------------|-------|----------|
| GET | `/api/public/notes` | No | Get public notes | `?limit=20&offset=0` | `[{id, title, preview, username, created_at}]` |
| GET | `/api/public/notes/{id}/content` | No | Get public note content | - | `{id, title, content, username, created_at}` |
| GET | `/api/public/users/{id}/notes` | No | Get user's public notes | - | `[{id, title, preview, created_at}]` |

---

## Security Implementation

### 1. Password Security

```python
# Hashing with bcrypt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Register user
plain_password = "mypassword123"
hashed = pwd_context.hash(plain_password)
# "$2b$12$KIXfF8Qv3kYQ9Z4oE7XqPe5hC8vW2jR1nT6yL9mN4pQ8sK7dF3gHu"

# Login user
is_valid = pwd_context.verify(plain_password, hashed)  # True
```

**Bcrypt Features:**
- Automatic salting (random data added to password)
- Configurable work factor (default: 12 rounds)
- Slow by design (0.1-0.3 seconds to hash) - prevents brute force

### 2. SQL Injection Prevention

**❌ Vulnerable Code (DON'T DO THIS):**
```python
# String interpolation - VULNERABLE!
query = f"SELECT * FROM users WHERE username = '{username}'"
```

**✅ Safe Code (Use ORM or Parameterized Queries):**
```python
# SQLAlchemy ORM - SAFE
result = await db.execute(
    select(User).where(User.username == username)
)
# Generates: SELECT * FROM users WHERE username = $1
# Parameters: ['username_value']
```

### 3. Path Traversal Prevention

```python
def _validate_path(self, user_id: str, user_path: str) -> Path:
    # Remove leading/trailing slashes
    user_path = user_path.strip("/")

    # Check for directory traversal
    if ".." in user_path:
        raise ValueError("Directory traversal not allowed")

    user_dir = self.notes_dir / f"user_{user_id}"
    full_path = (user_dir / user_path).resolve()

    # Ensure path is within user's directory
    if not full_path.is_relative_to(user_dir):
        raise ValueError("Path outside user directory")

    return full_path
```

**Prevents:**
- `../../../etc/passwd`
- `/etc/passwd`
- `folder/../../other_user/file.md`

### 4. CORS Protection

```python
origins = [
    "https://www.down-write.com",
    "https://down-write.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Only these domains can call API
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Without CORS:**
- `evil.com` could make requests to your API from victim's browser
- Victim's cookies/auth would be sent automatically

**With CORS:**
- Browser blocks requests from `evil.com`
- Only allowed origins can make requests

### 5. Authentication Requirements

```python
# Public endpoint - No auth
@router.get("/api/public/notes")
async def get_public_notes():
    # Anyone can access
    ...

# Protected endpoint - Auth required
@router.get("/api/files/tree")
async def get_file_tree(
    current_user: User = Depends(get_current_active_user)
):
    # Only authenticated users
    # current_user automatically extracted from JWT
    ...
```

---

## Deployment Architecture

### Railway Infrastructure

```
┌─────────────────────────────────────────────────────────────┐
│                         INTERNET                             │
│                  (www.down-write.com)                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS (Let's Encrypt SSL)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    SQUARESPACE DNS                           │
│                                                              │
│  www CNAME → 0xk57jwd.up.railway.app (Frontend)             │
│  api CNAME → abamb989.up.railway.app (Backend)              │
│  @   ALIAS → 0xk57jwd.up.railway.app (Root redirect)        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      RAILWAY PLATFORM                        │
│                                                              │
│  ┌────────────────────┐         ┌──────────────────────┐    │
│  │  Frontend Service  │         │   Backend Service    │    │
│  │  ----------------  │         │   ---------------    │    │
│  │  - Vite build      │         │   - FastAPI app      │    │
│  │  - Static files    │◄────────┤   - Uvicorn server   │    │
│  │  - React SPA       │   API   │   - Python 3.9+      │    │
│  │                    │  calls  │                      │    │
│  │  Port: 5173        │         │   Port: 8000         │    │
│  └────────────────────┘         └──────────────────────┘    │
│                                           │                  │
│                                           │                  │
│                                           ▼                  │
│  ┌────────────────────┐         ┌──────────────────────┐    │
│  │  PostgreSQL        │         │   Railway Volume     │    │
│  │  Database          │         │   /app/notes/        │    │
│  │  ----------------  │         │   ----------------   │    │
│  │  - User accounts   │         │   - Markdown files   │    │
│  │  - File metadata   │         │   - User directories │    │
│  │  - Relationships   │         │   - Persistent!      │    │
│  └────────────────────┘         └──────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Environment Variables

**Backend Service:**
```bash
DATABASE_URL=postgresql://user:pass@host/db  # Auto-provided by Railway
JWT_SECRET_KEY=random-secret-key-here
ENVIRONMENT=production
NOTES_DIR=/app/notes  # Volume mount path
```

**Frontend Service:**
```bash
VITE_API_URL=https://api.down-write.com/api
```

### Build Process

**Frontend:**
```bash
# Railway runs these automatically:
npm install
npm run build  # Creates dist/ folder with optimized static files
# Serves dist/ folder
```

**Backend:**
```bash
# Railway runs:
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Persistent Storage (Railway Volume)

**Problem:**
- Railway uses ephemeral containers
- Files written to filesystem are lost on redeploy

**Solution:**
- Railway Volume mounted at `/app/notes`
- Persists across deployments
- Acts like external hard drive

**Configuration:**
```
Volume Mount: /app/notes
Environment: NOTES_DIR=/app/notes
```

---

## Data Flow Examples

### Example 1: User Creates a File

```
┌─────────────────────────────────────────────────────────────┐
│  USER CREATES FILE: "algorithms/sorting.md"                 │
└─────────────────────────────────────────────────────────────┘

1. User clicks "New File" button in folder tree
   - FolderTree component shows inline creator
   - User types: "sorting.md"
   - Presses Enter

2. Frontend: fileStore.createFile()
   ├─ POST /api/files/
   ├─ Headers: { Authorization: Bearer <jwt> }
   └─ Body: { path: "algorithms/sorting.md", content: "# Sorting" }

3. Backend: auth middleware
   ├─ Extract JWT from header
   ├─ Decode: { sub: "user-id", exp: 12345 }
   ├─ Query database: SELECT * FROM users WHERE id = ?
   └─ Returns User object

4. Backend: create_file route
   ├─ Calls file_service.write_file()
   │  ├─ Validates path (no directory traversal)
   │  ├─ Writes to: /app/notes/user_<id>/algorithms/sorting.md
   │  └─ Returns file_id
   └─ Creates DB record:
      INSERT INTO files (user_id, file_path, title, is_public, preview)
      VALUES (?, 'algorithms/sorting.md', 'Sorting', false, '# Sorting')

5. Backend: Response
   └─ 200 OK { message: "File created" }

6. Frontend: Update state
   ├─ fileStore.loadMetadata() - Refresh metadata
   ├─ folderStore.refresh() - Refresh tree
   └─ fileStore.loadFile() - Open new file in editor

7. UI Updates:
   ├─ File appears in folder tree
   ├─ Editor shows content
   └─ Preview renders markdown
```

### Example 2: User Makes Note Public

```
┌─────────────────────────────────────────────────────────────┐
│  USER TOGGLES FILE TO PUBLIC                                │
└─────────────────────────────────────────────────────────────┘

1. User clicks privacy toggle in toolbar (🔒 → 🌐)

2. Frontend: fileStore.togglePrivacy()
   ├─ Optimistic update: set isPublic = true
   ├─ PATCH /api/files/{file_id}/privacy?is_public=true
   └─ Headers: { Authorization: Bearer <jwt> }

3. Backend: toggle_privacy route
   ├─ Auth: Extract user from JWT
   ├─ Query: SELECT * FROM files WHERE id = ? AND user_id = ?
   ├─ Verify ownership
   ├─ Update: UPDATE files SET is_public = true WHERE id = ?
   └─ Commit to database

4. Backend: Response
   └─ 200 OK { message: "Privacy updated" }

5. Frontend: Confirm update
   ├─ Update metadata in store
   └─ UI shows 🌐 icon

6. Public visibility:
   ├─ File now appears in public feed
   ├─ Accessible at: /note/{file_id}
   └─ Visible in user's profile
```

### Example 3: Anonymous User Views Public Note

```
┌─────────────────────────────────────────────────────────────┐
│  ANONYMOUS USER VIEWS PUBLIC NOTE                           │
└─────────────────────────────────────────────────────────────┘

1. User visits: https://www.down-write.com/note/{file_id}

2. Frontend: PublicNoteViewer component
   ├─ useParams() extracts file_id from URL
   ├─ GET /api/public/notes/{file_id}/content
   └─ No authentication required!

3. Backend: get_public_note route
   ├─ Query: SELECT f.*, u.username
   │         FROM files f JOIN users u ON f.user_id = u.id
   │         WHERE f.id = ? AND f.is_public = true
   ├─ Verify is_public = true
   ├─ Read file: /app/notes/user_<id>/<path>.md
   └─ Return: { id, title, content, username, created_at }

4. Backend: Response
   └─ 200 OK {
       id: "...",
       title: "Sorting Algorithms",
       content: "# Sorting\n\n...",
       username: "john",
       created_at: "2024-01-01"
     }

5. Frontend: Render
   ├─ Display title, author, date
   ├─ ReactMarkdown renders content
   │  ├─ remarkGfm processes tables
   │  ├─ remarkMath processes LaTeX
   │  └─ Custom styling applied
   └─ Read-only view (no editing)
```

---

## Performance Optimizations

### 1. Database Indexing

```sql
-- Fast user lookups
CREATE INDEX idx_users_username ON users(username);

-- Fast public feed queries
CREATE INDEX idx_public_created ON files(is_public, created_at);
-- Enables: SELECT * FROM files WHERE is_public = true ORDER BY created_at DESC
```

### 2. Connection Pooling

```python
engine = create_async_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before use
    pool_size=10,        # Max 10 connections in pool
    max_overflow=20      # Allow 20 extra connections if needed
)
```

### 3. Frontend Code Splitting

Vite automatically splits code by route:
```
dist/assets/
├── LandingPage-abc123.js   # Loaded only on /
├── Workspace-def456.js      # Loaded only on /workspace
└── PublicNoteViewer-ghi789.js
```

### 4. Lazy Loading

```typescript
// React lazy loading
const Workspace = lazy(() => import('./pages/Workspace'));

// Monaco Editor lazy loaded
import('@monaco-editor/react')
```

---

## Common Patterns & Best Practices

### 1. Async/Await Pattern

```python
# Backend
async def get_user(user_id: str, db: AsyncSession):
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()

# Frontend
async function loadFile(path: string) {
    const response = await fetch(`/api/files/content?path=${path}`);
    const data = await response.json();
    return data.content;
}
```

### 2. Error Handling

```python
# Backend
try:
    await file_service.read_file(user_id, path)
except FileNotFoundError:
    raise HTTPException(status_code=404, detail="File not found")
except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))

# Frontend
try {
    await loadFile(path);
} catch (error) {
    console.error('Failed to load file:', error);
    alert('Failed to load file');
}
```

### 3. Dependency Injection

```python
# FastAPI automatically resolves dependencies
@router.get("/files/tree")
async def get_tree(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    # current_user and db are automatically provided
    ...
```

---

## Testing Strategies

### Backend Testing

```python
# Test with pytest + httpx
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_file():
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Register user
        response = await client.post("/api/auth/register", json={
            "username": "testuser",
            "email": "test@test.com",
            "password": "password123"
        })
        assert response.status_code == 200

        # Login
        response = await client.post("/api/auth/login", data={
            "username": "testuser",
            "password": "password123"
        })
        token = response.json()["access_token"]

        # Create file
        response = await client.post("/api/files/",
            json={"path": "test.md", "content": "# Test"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
```

### Frontend Testing

```typescript
// Test with Vitest + React Testing Library
import { render, screen } from '@testing-library/react';
import { MarkdownPreview } from './MarkdownPreview';

test('renders markdown table', () => {
    const content = `
| Header |
|--------|
| Cell   |
    `;

    render(<MarkdownPreview content={content} />);

    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
});
```

---

## Monitoring & Debugging

### Railway Logs

```bash
# View backend logs in Railway
INFO:     Started server process
INFO:     Waiting for application startup.
Initializing database...
Database initialized successfully!
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000

# User requests
POST /api/auth/login - 200 OK
GET /api/files/tree - 200 OK
PUT /api/files/ - 200 OK
```

### Browser DevTools

```javascript
// Frontend logs
console.log('Loaded metadata for', metadataMap.size, 'files');
// Removed in production via cleanup

// Network tab shows:
GET https://api.down-write.com/api/files/tree
Status: 200
Response: [{name: "folder1", type: "folder", children: [...]}]
```

---

## Glossary of Technologies

| Term | What It Is | Why We Use It |
|------|-----------|---------------|
| **React** | JavaScript UI library | Component-based architecture, efficient rendering |
| **TypeScript** | JavaScript with types | Catch errors at compile time, better IDE support |
| **Vite** | Build tool | Fast dev server, optimized production builds |
| **Zustand** | State management | Simpler than Redux, built-in persistence |
| **Monaco Editor** | Code editor | VS Code's editor engine, familiar UX |
| **React Router** | Routing library | Client-side navigation, protected routes |
| **TailwindCSS** | Utility-first CSS | Fast styling, consistent design system |
| **FastAPI** | Python web framework | Fast, automatic API docs, type validation |
| **SQLAlchemy** | Python ORM | Database abstraction, prevents SQL injection |
| **PostgreSQL** | SQL database | Reliable, ACID compliant, great for relations |
| **JWT** | Auth tokens | Stateless authentication, scalable |
| **Bcrypt** | Password hashing | Secure, slow by design, prevents brute force |
| **CORS** | Security policy | Prevents malicious cross-origin requests |
| **Railway** | Cloud platform | Easy deployment, auto-scaling, managed DB |

---

## Summary: Request Flow

**Example: Load a File**

```
User clicks file.md in tree
  │
  ├─ Frontend: fileStore.loadFile("folder/file.md")
  │    │
  │    ├─ GET /api/files/content?path=folder/file.md
  │    └─ Headers: { Authorization: Bearer <jwt> }
  │
  ├─ Backend: Middleware
  │    ├─ Extract JWT from header
  │    ├─ Decode: { sub: user_id }
  │    └─ Query DB: Get user by ID
  │
  ├─ Backend: Route Handler
  │    ├─ file_service.read_file(user_id, "folder/file.md")
  │    ├─ Validate path (security check)
  │    ├─ Read: /app/notes/user_<id>/folder/file.md
  │    └─ Return: { content: "# Markdown content..." }
  │
  ├─ Frontend: Update State
  │    ├─ set({ currentFile: path, content })
  │    └─ Trigger re-render
  │
  └─ UI Updates
       ├─ Editor shows content
       ├─ Preview renders markdown
       └─ Toolbar shows file path
```

---

## Next Steps for Learning

1. **Explore the code**: Read through files mentioned in this doc
2. **Make changes**: Try adding a new feature (e.g., file tags)
3. **Debug issues**: Use browser DevTools and Railway logs
4. **Read docs**: FastAPI docs, React docs, SQLAlchemy docs
5. **Experiment**: Break things, fix them, learn how they work!

---

**End of Technical Documentation**
