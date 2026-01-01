"""
API routes for file operations.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict
from ...services.file_service import FileService

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
async def get_file_tree():
    """
    Get the complete folder tree structure.

    Returns:
        List of folder/file nodes with nested children
    """
    try:
        tree = file_service.get_tree()
        return tree
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get file tree: {str(e)}")


@router.get("/content")
async def get_file_content(path: str = Query(..., description="Relative path to the file")):
    """
    Get content of a specific file.

    Args:
        path: Relative path to the file

    Returns:
        File content as plain text
    """
    try:
        content = await file_service.read_file(path)
        return {"content": content}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found: {path}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")


@router.post("/")
async def create_file(file_data: FileContent):
    """
    Create a new file.

    Args:
        file_data: Object containing path and content

    Returns:
        Success message
    """
    try:
        await file_service.write_file(file_data.path, file_data.content)
        return {"message": "File created successfully", "path": file_data.path}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create file: {str(e)}")


@router.put("/")
async def update_file(file_data: FileContent):
    """
    Update an existing file.

    Args:
        file_data: Object containing path and content

    Returns:
        Success message
    """
    try:
        await file_service.write_file(file_data.path, file_data.content)
        return {"message": "File updated successfully", "path": file_data.path}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update file: {str(e)}")


@router.delete("/")
async def delete_file(path: str = Query(..., description="Relative path to the file")):
    """
    Delete a file.

    Args:
        path: Relative path to the file

    Returns:
        Success message
    """
    try:
        await file_service.delete_file(path)
        return {"message": "File deleted successfully", "path": path}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found: {path}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")


@router.get("/search")
async def search_files(q: str = Query(..., description="Search query")):
    """
    Search for files containing a query string.

    Args:
        q: Search query

    Returns:
        List of matching files with preview snippets
    """
    try:
        results = await file_service.search_files(q)
        return {"results": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
