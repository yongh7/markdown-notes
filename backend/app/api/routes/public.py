"""
Public API routes for accessing public notes (no authentication required)
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List
from uuid import UUID

from ...core.database import get_db
from ...models.file import File
from ...models.user import User
from ..schemas.file import PublicNoteResponse
from ...services.file_service import FileService

router = APIRouter(prefix="/api/public", tags=["public"])
file_service = FileService()


@router.get("/notes", response_model=List[PublicNoteResponse])
async def get_public_notes(
    limit: int = Query(20, le=100, description="Number of notes to return"),
    offset: int = Query(0, ge=0, description="Number of notes to skip"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get recent public notes (no authentication required).

    Returns list of public notes sorted by creation date (newest first).
    Includes preview text and author information.
    """
    query = (
        select(File, User.username)
        .join(User, File.user_id == User.id)
        .where(File.is_public == True)
        .order_by(desc(File.created_at))
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(query)
    rows = result.all()

    return [
        PublicNoteResponse(
            id=file.id,
            title=file.title,
            preview=file.preview,
            username=username,
            user_id=file.user_id,
            created_at=file.created_at,
            updated_at=file.updated_at
        )
        for file, username in rows
    ]


@router.get("/notes/{file_id}/content")
async def get_public_note_content(
    file_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Get content of a specific public note (no authentication required).

    Returns the full markdown content of a public note.
    """
    query = (
        select(File, User.username)
        .join(User, File.user_id == User.id)
        .where(File.id == file_id, File.is_public == True)
    )
    result = await db.execute(query)
    row = result.one_or_none()

    if not row:
        raise HTTPException(status_code=404, detail="Public note not found")

    file_record, username = row

    # Read actual file content from filesystem
    try:
        content = await file_service.read_file(
            str(file_record.user_id),
            file_record.file_path
        )
        return {
            "id": str(file_record.id),
            "title": file_record.title,
            "content": content,
            "username": username,
            "user_id": str(file_record.user_id),
            "created_at": file_record.created_at,
            "updated_at": file_record.updated_at
        }
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="File content not found (file may have been deleted)"
        )


@router.get("/users/{user_id}/notes", response_model=List[PublicNoteResponse])
async def get_user_public_notes(
    user_id: UUID,
    limit: int = Query(20, le=100, description="Number of notes to return"),
    offset: int = Query(0, ge=0, description="Number of notes to skip"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all public notes from a specific user (no authentication required).

    Useful for user profile pages showing all their shared notes.
    """
    # First check if user exists
    user_query = select(User).where(User.id == user_id)
    user_result = await db.execute(user_query)
    user = user_result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get user's public notes
    query = (
        select(File)
        .where(File.user_id == user_id, File.is_public == True)
        .order_by(desc(File.created_at))
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(query)
    files = result.scalars().all()

    return [
        PublicNoteResponse(
            id=file.id,
            title=file.title,
            preview=file.preview,
            username=user.username,
            user_id=file.user_id,
            created_at=file.created_at,
            updated_at=file.updated_at
        )
        for file in files
    ]
