"""
File service for managing markdown files in the knowledge base.
Provides operations for reading, writing, and organizing files.
"""

from pathlib import Path
from typing import List, Dict, Optional
import aiofiles
import os
import re


class FileService:
    """Service for managing file operations with security and validation."""

    def __init__(self, notes_dir: str = "../notes"):
        """
        Initialize the file service.

        Args:
            notes_dir: Path to the notes directory (relative to backend/app)
        """
        # Resolve the notes directory relative to this file
        current_file = Path(__file__).resolve()
        backend_root = current_file.parent.parent.parent
        self.notes_dir = (backend_root / notes_dir).resolve()

        # Create notes directory if it doesn't exist
        self.notes_dir.mkdir(parents=True, exist_ok=True)

    def _validate_path(self, user_path: str) -> Path:
        """
        Validate that a user-provided path is safe and within notes directory.

        Args:
            user_path: User-provided relative path

        Returns:
            Resolved absolute path

        Raises:
            ValueError: If path is invalid or outside notes directory
        """
        if not user_path:
            raise ValueError("Path cannot be empty")

        # Remove leading/trailing slashes and normalize
        user_path = user_path.strip("/").strip()

        # Check for suspicious patterns
        if ".." in user_path or user_path.startswith("/"):
            raise ValueError("Invalid path: directory traversal not allowed")

        # Resolve the full path
        full_path = (self.notes_dir / user_path).resolve()

        # Ensure it's within the notes directory
        if not full_path.is_relative_to(self.notes_dir):
            raise ValueError("Invalid path: outside notes directory")

        return full_path

    def _validate_filename(self, filename: str) -> None:
        """
        Validate filename doesn't contain invalid characters.

        Args:
            filename: The filename to validate

        Raises:
            ValueError: If filename contains invalid characters
        """
        # Allow alphanumeric, dash, underscore, dot
        if not re.match(r'^[a-zA-Z0-9._\-]+$', filename):
            raise ValueError(
                "Invalid filename: only alphanumeric, dash, underscore, and dot allowed"
            )

    def get_tree(self) -> List[Dict]:
        """
        Build hierarchical folder tree structure.

        Returns:
            List of folder/file nodes with nested children

        Example:
            [
                {
                    "name": "algorithms",
                    "path": "algorithms",
                    "type": "folder",
                    "children": [
                        {"name": "sorting.md", "path": "algorithms/sorting.md", "type": "file"}
                    ]
                }
            ]
        """
        def build_tree(path: Path) -> Dict:
            """Recursively build tree for a path."""
            relative_path = path.relative_to(self.notes_dir)

            if path.is_file():
                return {
                    "name": path.name,
                    "path": str(relative_path),
                    "type": "file"
                }

            # It's a directory
            children = []
            try:
                for child in sorted(path.iterdir(), key=lambda p: (p.is_file(), p.name)):
                    # Skip hidden files and directories
                    if child.name.startswith('.'):
                        continue
                    children.append(build_tree(child))
            except PermissionError:
                pass  # Skip directories we can't read

            return {
                "name": path.name if str(relative_path) != "." else "notes",
                "path": str(relative_path) if str(relative_path) != "." else "",
                "type": "folder",
                "children": children
            }

        # Build tree for notes directory
        tree = build_tree(self.notes_dir)
        return tree.get("children", [])

    async def read_file(self, path: str) -> str:
        """
        Read content of a file.

        Args:
            path: Relative path to the file

        Returns:
            File content as string

        Raises:
            FileNotFoundError: If file doesn't exist
            ValueError: If path is invalid
        """
        full_path = self._validate_path(path)

        if not full_path.exists():
            raise FileNotFoundError(f"File not found: {path}")

        if not full_path.is_file():
            raise ValueError(f"Path is not a file: {path}")

        async with aiofiles.open(full_path, 'r', encoding='utf-8') as f:
            return await f.read()

    async def write_file(self, path: str, content: str) -> None:
        """
        Write or update a file.

        Args:
            path: Relative path to the file
            content: Content to write

        Raises:
            ValueError: If path or filename is invalid
        """
        full_path = self._validate_path(path)

        # Validate filename
        self._validate_filename(full_path.name)

        # Ensure file has .md extension
        if not full_path.name.endswith('.md'):
            raise ValueError("File must have .md extension")

        # Create parent directories if needed
        full_path.parent.mkdir(parents=True, exist_ok=True)

        # Write the file
        async with aiofiles.open(full_path, 'w', encoding='utf-8') as f:
            await f.write(content)

    async def delete_file(self, path: str) -> None:
        """
        Delete a file.

        Args:
            path: Relative path to the file

        Raises:
            FileNotFoundError: If file doesn't exist
            ValueError: If path is invalid or not a file
        """
        full_path = self._validate_path(path)

        if not full_path.exists():
            raise FileNotFoundError(f"File not found: {path}")

        if not full_path.is_file():
            raise ValueError(f"Path is not a file: {path}")

        full_path.unlink()

    async def create_folder(self, path: str) -> None:
        """
        Create a new folder.

        Args:
            path: Relative path to the folder

        Raises:
            ValueError: If path is invalid or folder already exists
        """
        full_path = self._validate_path(path)

        # Validate folder name (last component)
        folder_name = full_path.name
        if not re.match(r'^[a-zA-Z0-9_\-]+$', folder_name):
            raise ValueError(
                "Invalid folder name: only alphanumeric, dash, and underscore allowed"
            )

        if full_path.exists():
            raise ValueError(f"Folder already exists: {path}")

        full_path.mkdir(parents=True, exist_ok=False)

    async def delete_folder(self, path: str) -> None:
        """
        Delete a folder and all its contents.

        Args:
            path: Relative path to the folder

        Raises:
            FileNotFoundError: If folder doesn't exist
            ValueError: If path is invalid or not a folder
        """
        full_path = self._validate_path(path)

        if not full_path.exists():
            raise FileNotFoundError(f"Folder not found: {path}")

        if not full_path.is_dir():
            raise ValueError(f"Path is not a folder: {path}")

        # Recursively delete folder contents
        import shutil
        shutil.rmtree(full_path)

    async def search_files(self, query: str) -> List[Dict]:
        """
        Search for files containing a query string.

        Args:
            query: Search query

        Returns:
            List of matching files with preview snippets
        """
        results = []
        query_lower = query.lower()

        for file_path in self.notes_dir.rglob("*.md"):
            try:
                async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                    content = await f.read()

                if query_lower in content.lower():
                    # Find first occurrence for preview
                    lines = content.split('\n')
                    matching_line = next(
                        (line for line in lines if query_lower in line.lower()),
                        lines[0] if lines else ""
                    )

                    relative_path = file_path.relative_to(self.notes_dir)
                    results.append({
                        "path": str(relative_path),
                        "name": file_path.name,
                        "preview": matching_line[:100]
                    })
            except Exception:
                continue  # Skip files we can't read

        return results
