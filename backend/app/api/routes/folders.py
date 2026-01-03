"""
API routes for folder operations.
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
import os
from ...services.file_service import FileService
from ...core.auth import get_current_active_user
from ...models.user import User

router = APIRouter(prefix="/api/folders", tags=["folders"])

# Initialize file service with environment-based notes directory
notes_dir = os.getenv("NOTES_DIR", "../notes")
file_service = FileService(notes_dir=notes_dir)


class FolderCreate(BaseModel):
    """Request model for folder creation."""
    path: str


class FolderCopy(BaseModel):
    """Request model for folder copy."""
    source_path: str
    dest_path: str


@router.post("/")
async def create_folder(
    folder_data: FolderCreate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new folder.

    Args:
        folder_data: Object containing folder path
        current_user: Current authenticated user

    Returns:
        Success message
    """
    try:
        await file_service.create_folder(str(current_user.id), folder_data.path)
        return {"message": "Folder created successfully", "path": folder_data.path}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create folder: {str(e)}")


@router.delete("/")
async def delete_folder(
    path: str = Query(..., description="Relative path to the folder"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a folder and all its contents.

    Args:
        path: Relative path to the folder
        current_user: Current authenticated user

    Returns:
        Success message
    """
    try:
        await file_service.delete_folder(str(current_user.id), path)
        return {"message": "Folder deleted successfully", "path": path}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Folder not found: {path}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete folder: {str(e)}")


@router.post("/copy")
async def copy_folder(
    copy_data: FolderCopy,
    current_user: User = Depends(get_current_active_user)
):
    """
    Copy a folder and all its contents to a new location.

    Args:
        copy_data: Object containing source and destination paths
        current_user: Current authenticated user

    Returns:
        Success message
    """
    try:
        await file_service.copy_folder(
            str(current_user.id),
            copy_data.source_path,
            copy_data.dest_path
        )
        return {
            "message": "Folder copied successfully",
            "source_path": copy_data.source_path,
            "dest_path": copy_data.dest_path
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to copy folder: {str(e)}")
