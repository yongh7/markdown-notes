"""
Pydantic schemas for File model
"""

from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional


class FileMetadataBase(BaseModel):
    """Base schema for file metadata"""
    file_path: str
    title: str
    is_public: bool


class FileMetadataCreate(FileMetadataBase):
    """Schema for creating file metadata"""
    preview: Optional[str] = None


class FileMetadataUpdate(BaseModel):
    """Schema for updating file metadata"""
    is_public: Optional[bool] = None
    title: Optional[str] = None


class FileMetadataResponse(FileMetadataBase):
    """Schema for file metadata response"""
    id: UUID
    user_id: UUID
    preview: Optional[str]
    created_at: datetime
    updated_at: datetime
    username: str  # Joined from User

    class Config:
        from_attributes = True


class PublicNoteResponse(BaseModel):
    """Schema for public note in feed"""
    id: UUID
    title: str
    preview: Optional[str]
    username: str
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
