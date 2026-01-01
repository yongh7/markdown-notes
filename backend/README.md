# Knowledge Base Backend

FastAPI backend for the personal markdown knowledge base application.

## Features

- **File Operations**: Create, read, update, delete markdown files
- **Folder Management**: Create and delete folders
- **File Tree**: Get hierarchical folder structure
- **Search**: Search through file contents
- **Security**: Path validation to prevent directory traversal
- **CORS**: Configured for local development

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── routes/
│   │       ├── files.py      # File CRUD endpoints
│   │       └── folders.py    # Folder operations
│   ├── services/
│   │   └── file_service.py   # Core business logic
│   └── main.py               # FastAPI app initialization
├── venv/                     # Python virtual environment
└── requirements.txt          # Python dependencies
```

## Setup

### 1. Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

## Running the Server

### Development Mode (with auto-reload)

```bash
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Interactive API Docs: http://localhost:8000/docs
- Alternative Docs: http://localhost:8000/redoc

### Production Mode

```bash
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### Files

- `GET /api/files/tree` - Get folder tree structure
- `GET /api/files/content?path=<path>` - Get file content
- `POST /api/files/` - Create a new file
  ```json
  {"path": "folder/file.md", "content": "# Content"}
  ```
- `PUT /api/files/` - Update a file
  ```json
  {"path": "folder/file.md", "content": "# Updated content"}
  ```
- `DELETE /api/files/?path=<path>` - Delete a file
- `GET /api/files/search?q=<query>` - Search files

### Folders

- `POST /api/folders/` - Create a new folder
  ```json
  {"path": "new-folder"}
  ```
- `DELETE /api/folders/?path=<path>` - Delete a folder

### Health & Info

- `GET /` - API information
- `GET /health` - Health check

## Testing the API

### Using curl

```bash
# Get file tree
curl http://localhost:8000/api/files/tree

# Get file content
curl "http://localhost:8000/api/files/content?path=algorithms/sorting.md"

# Create a new file
curl -X POST http://localhost:8000/api/files/ \
  -H "Content-Type: application/json" \
  -d '{"path": "test.md", "content": "# Test"}'

# Update a file
curl -X PUT http://localhost:8000/api/files/ \
  -H "Content-Type: application/json" \
  -d '{"path": "test.md", "content": "# Updated"}'

# Delete a file
curl -X DELETE "http://localhost:8000/api/files/?path=test.md"

# Search files
curl "http://localhost:8000/api/files/search?q=algorithm"

# Create a folder
curl -X POST http://localhost:8000/api/folders/ \
  -H "Content-Type: application/json" \
  -d '{"path": "new-folder"}'
```

### Using the Interactive Docs

Open http://localhost:8000/docs in your browser for an interactive API explorer.

## Security Features

### Path Validation

All file paths are validated to ensure they:
- Are within the notes directory
- Don't contain directory traversal attempts (`..`)
- Use valid characters for filenames

### Filename Validation

- Files must have `.md` extension
- Only alphanumeric, dash, underscore, and dot characters allowed

### Folder Name Validation

- Only alphanumeric, dash, and underscore characters allowed

## Notes Directory

Markdown files are stored in `../notes/` relative to the backend directory:

```
claude-code-playground/
├── backend/        # Backend code
└── notes/          # Markdown files
    ├── algorithms/
    ├── stats/
    └── README.md
```

## Configuration

### CORS

The backend allows requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:4173` (Vite preview)

To add more origins, edit `app/main.py`.

## Dependencies

- **fastapi**: Modern web framework
- **uvicorn**: ASGI server
- **aiofiles**: Async file operations
- **pydantic**: Data validation
- **python-multipart**: File upload support

## Development Tips

1. **Auto-reload**: The `--reload` flag watches for file changes
2. **API Docs**: Use `/docs` endpoint for testing
3. **Error Logs**: Check terminal for detailed error messages
4. **File Permissions**: Ensure backend has read/write access to notes directory

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

### Import Errors

Make sure virtual environment is activated:
```bash
source venv/bin/activate
```

### Permission Errors

Ensure the backend has read/write permissions to the notes directory:
```bash
chmod -R 755 ../notes/
```

## Next Steps

Once the backend is running:
1. Install Node.js and npm
2. Set up the frontend (see `../frontend/README.md`)
3. Access the full application at http://localhost:5173
