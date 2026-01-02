"""
API routes for file operations.
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import List, Dict
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...services.file_service import FileService
from ...core.auth import get_current_active_user
from ...core.database import get_db
from ...models.user import User
from ...models.file import File

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
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new file and sync with database.

    Args:
        file_data: Object containing path and content
        current_user: Current authenticated user
        db: Database session

    Returns:
        Success message with file ID
    """
    try:
        file_id = await file_service.write_file(
            str(current_user.id),
            file_data.path,
            file_data.content,
            db=db
        )
        return {
            "message": "File created successfully",
            "path": file_data.path,
            "file_id": file_id
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create file: {str(e)}")


@router.put("/")
async def update_file(
    file_data: FileContent,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update an existing file and sync with database.

    Args:
        file_data: Object containing path and content
        current_user: Current authenticated user
        db: Database session

    Returns:
        Success message with file ID
    """
    try:
        file_id = await file_service.write_file(
            str(current_user.id),
            file_data.path,
            file_data.content,
            db=db
        )
        return {
            "message": "File updated successfully",
            "path": file_data.path,
            "file_id": file_id
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update file: {str(e)}")


@router.delete("/")
async def delete_file(
    path: str = Query(..., description="Relative path to the file"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a file and its database record.

    Args:
        path: Relative path to the file
        current_user: Current authenticated user
        db: Database session

    Returns:
        Success message
    """
    try:
        await file_service.delete_file(str(current_user.id), path, db=db)
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


@router.patch("/{file_id}/privacy")
async def update_file_privacy(
    file_id: UUID,
    is_public: bool = Query(..., description="Set file as public (true) or private (false)"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Toggle file privacy setting (public/private).

    Args:
        file_id: File ID
        is_public: Whether file should be public
        current_user: Current authenticated user
        db: Database session

    Returns:
        Success message with updated privacy status
    """
    try:
        # Query file and verify ownership
        query = select(File).where(
            File.id == file_id,
            File.user_id == current_user.id
        )
        result = await db.execute(query)
        file_record = result.scalar_one_or_none()

        if not file_record:
            raise HTTPException(
                status_code=404,
                detail="File not found or you don't have permission to modify it"
            )

        # Update privacy setting
        file_record.is_public = is_public
        await db.commit()

        return {
            "message": f"File privacy updated to {'public' if is_public else 'private'}",
            "file_id": str(file_id),
            "is_public": is_public
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update file privacy: {str(e)}"
        )


@router.get("/metadata")
async def get_user_files_metadata(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get metadata for all user's files (including privacy status).

    Args:
        current_user: Current authenticated user
        db: Database session

    Returns:
        List of file metadata with privacy status
    """
    try:
        query = select(File).where(File.user_id == current_user.id)
        result = await db.execute(query)
        files = result.scalars().all()

        return {
            "files": [
                {
                    "id": str(f.id),
                    "file_path": f.file_path,
                    "title": f.title,
                    "is_public": f.is_public,
                    "preview": f.preview,
                    "created_at": f.created_at,
                    "updated_at": f.updated_at
                }
                for f in files
            ],
            "count": len(files)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get file metadata: {str(e)}"
        )
