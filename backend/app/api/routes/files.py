"""
API routes for file operations.
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import List, Dict
from ...services.file_service import FileService
from ...core.auth import get_current_active_user
from ...models.user import User

router = APIRouter(prefix="/api/files", tags=["files"])

# Initialize file service
file_service = FileService()


class FileContent(BaseModel):
    """Request model for file content operations."""
    path: str
    content: str


class FolderCreate(BaseModel):
    """Request model for folder creation."""
    path: str


@router.get("/tree", response_model=List[Dict])
async def get_file_tree(current_user: User = Depends(get_current_active_user)):
    """
    Get the complete folder tree structure for the current user.

    Args:
        current_user: Current authenticated user

    Returns:
        List of folder/file nodes with nested children
    """
    try:
        tree = file_service.get_tree(str(current_user.id))
        return tree
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get file tree: {str(e)}")


@router.get("/content")
async def get_file_content(
    path: str = Query(..., description="Relative path to the file"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get content of a specific file.

    Args:
        path: Relative path to the file
        current_user: Current authenticated user

    Returns:
        File content as plain text
    """
    try:
        content = await file_service.read_file(str(current_user.id), path)
        return {"content": content}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found: {path}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")


@router.post("/")
async def create_file(
    file_data: FileContent,
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new file.

    Args:
        file_data: Object containing path and content
        current_user: Current authenticated user

    Returns:
        Success message
    """
    try:
        await file_service.write_file(str(current_user.id), file_data.path, file_data.content)
        return {"message": "File created successfully", "path": file_data.path}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create file: {str(e)}")


@router.put("/")
async def update_file(
    file_data: FileContent,
    current_user: User = Depends(get_current_active_user)
):
    """
    Update an existing file.

    Args:
        file_data: Object containing path and content
        current_user: Current authenticated user

    Returns:
        Success message
    """
    try:
        await file_service.write_file(str(current_user.id), file_data.path, file_data.content)
        return {"message": "File updated successfully", "path": file_data.path}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update file: {str(e)}")


@router.delete("/")
async def delete_file(
    path: str = Query(..., description="Relative path to the file"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a file.

    Args:
        path: Relative path to the file
        current_user: Current authenticated user

    Returns:
        Success message
    """
    try:
        await file_service.delete_file(str(current_user.id), path)
        return {"message": "File deleted successfully", "path": path}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found: {path}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")


@router.get("/search")
async def search_files(
    q: str = Query(..., description="Search query"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Search for files containing a query string.

    Args:
        q: Search query
        current_user: Current authenticated user

    Returns:
        List of matching files with preview snippets
    """
    try:
        results = await file_service.search_files(str(current_user.id), q)
        return {"results": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
