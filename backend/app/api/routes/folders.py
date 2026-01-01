"""
API routes for folder operations.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from ...services.file_service import FileService

router = APIRouter(prefix="/api/folders", tags=["folders"])

# Initialize file service
file_service = FileService()


class FolderCreate(BaseModel):
    """Request model for folder creation."""
    path: str


@router.post("/")
async def create_folder(folder_data: FolderCreate):
    """
    Create a new folder.

    Args:
        folder_data: Object containing folder path

    Returns:
        Success message
    """
    try:
        await file_service.create_folder(folder_data.path)
        return {"message": "Folder created successfully", "path": folder_data.path}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create folder: {str(e)}")


@router.delete("/")
async def delete_folder(path: str = Query(..., description="Relative path to the folder")):
    """
    Delete a folder and all its contents.

    Args:
        path: Relative path to the folder

    Returns:
        Success message
    """
    try:
        await file_service.delete_folder(path)
        return {"message": "Folder deleted successfully", "path": path}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Folder not found: {path}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete folder: {str(e)}")
