"""
File model for tracking file metadata and privacy settings
"""

from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from ..core.database import Base


class File(Base):
    """File metadata model for tracking file privacy and metadata"""

    __tablename__ = "files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # File information
    file_path = Column(String(500), nullable=False)  # Relative path within user's directory
    title = Column(String(255), nullable=False)  # Extracted from filename or first heading
    is_public = Column(Boolean, default=False, nullable=False, index=True)

    # Optional: Cache first 200 chars for preview
    preview = Column(Text, nullable=True)  # First 200 chars of content

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship
    user = relationship("User", backref="files")

    # Composite index for user + path uniqueness
    __table_args__ = (
        Index('idx_user_file_path', 'user_id', 'file_path', unique=True),
        Index('idx_public_created', 'is_public', 'created_at'),
    )

    def __repr__(self):
        return f"<File(id={self.id}, title={self.title}, public={self.is_public})>"
