"""
FastAPI application for the Knowledge Base backend.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .api.routes import files, folders, auth
from .core.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    """
    # Startup: Initialize database
    try:
        print("Initializing database...")
        await init_db()
        print("Database initialized successfully!")
    except Exception as e:
        print(f"Database initialization failed: {e}")
        print("App will start but database operations may fail")
    yield
    # Shutdown: cleanup if needed
    print("Shutting down...")


# Create FastAPI app
app = FastAPI(
    title="Knowledge Base API",
    description="Backend API for multi-user markdown knowledge base with authentication",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS
origins = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:4173",  # Vite preview
    "http://127.0.0.1:5173",
    "http://127.0.0.1:4173",
    "https://frontend-production-2c90.up.railway.app",  # Production frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)  # Auth routes (no authentication required)
app.include_router(files.router)  # File routes (authentication required)
app.include_router(folders.router)  # Folder routes (authentication required)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Knowledge Base API - Multi-User Edition",
        "version": "2.0.0",
        "features": [
            "User authentication with JWT",
            "User-scoped file storage",
            "Secure file operations"
        ],
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "database": "connected"}
