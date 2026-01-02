# Deployment & Multi-User Architecture Guide

## Table of Contents
1. [Current Architecture (Single User)](#current-architecture)
2. [Multi-User Architecture](#multi-user-architecture)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [Implementation Roadmap](#implementation-roadmap)

---

## Current Architecture (Single User)

**Current Setup:**
- Files stored in shared `notes/` directory
- No authentication
- Single namespace for all notes
- Direct file system access

**Limitations:**
- ❌ No user isolation
- ❌ No access control
- ❌ Files can conflict
- ❌ No user-specific data

---

## Multi-User Architecture

### Option 1: File System with User Directories (Simpler)

**Structure:**
```
notes/
├── user_123/
│   ├── algorithms/
│   └── stats/
├── user_456/
│   ├── projects/
│   └── ideas/
```

**Pros:**
- Simple to implement
- Easy to backup
- Familiar structure
- Good for small-medium scale

**Cons:**
- Not ideal for high scale
- Backup complexity grows
- Limited search across users
- File permission management

### Option 2: Object Storage (S3/MinIO) (Recommended)

**Structure:**
```
bucket: knowledge-base
├── users/user_123/algorithms/sorting.md
├── users/user_456/projects/readme.md
```

**Pros:**
- Scalable
- Built-in versioning
- Easy backup/replication
- Cloud-native
- CDN integration possible

**Cons:**
- Additional service dependency
- Slightly more complex
- Cost for cloud storage

### Option 3: Database Storage (PostgreSQL)

**Schema:**
```sql
users (id, username, email, password_hash)
files (id, user_id, path, content, created_at, updated_at)
folders (id, user_id, path, created_at)
```

**Pros:**
- ACID compliance
- Easy queries
- User management built-in
- Versioning with triggers

**Cons:**
- Large files = database bloat
- Performance for binary data
- Backup size grows quickly

### **Recommended: Hybrid Approach**

**Combine Database + Object Storage:**
- **PostgreSQL**: User data, file metadata, permissions
- **MinIO/S3**: Actual file content
- **Redis**: Session cache, real-time collaboration

```
PostgreSQL:
  - users (auth, profiles)
  - file_metadata (path, size, last_modified)
  - permissions (sharing, access control)

MinIO/S3:
  - Actual markdown files
  - Versioned content

Redis:
  - Session storage
  - Active editing locks
  - WebSocket connections
```

---

## Multi-User Implementation

### 1. Authentication Layer

**Add JWT-based Authentication:**

```python
# backend/app/core/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from datetime import datetime, timedelta

SECRET_KEY = "your-secret-key-here"  # Use env variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication")
```

**Add User Registration & Login:**

```python
# backend/app/api/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from passlib.context import CryptContext

router = APIRouter(prefix="/api/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

@router.post("/register")
async def register(user: UserCreate):
    # Check if user exists
    # Hash password
    # Create user in database
    # Return success
    pass

@router.post("/login")
async def login(user: UserLogin):
    # Verify credentials
    # Create JWT token
    # Return token
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
```

### 2. User-Scoped File Service

**Update File Service for Multi-User:**

```python
# backend/app/services/file_service.py
class FileService:
    def __init__(self, notes_dir: str = "../notes"):
        self.notes_dir = Path(notes_dir).resolve()

    def _get_user_dir(self, user_id: str) -> Path:
        """Get user-specific directory"""
        user_dir = self.notes_dir / f"user_{user_id}"
        user_dir.mkdir(parents=True, exist_ok=True)
        return user_dir

    def _validate_path(self, user_id: str, user_path: str) -> Path:
        """Validate path is within user's directory"""
        user_dir = self._get_user_dir(user_id)
        full_path = (user_dir / user_path).resolve()

        if not full_path.is_relative_to(user_dir):
            raise ValueError("Invalid path: outside user directory")

        return full_path

    async def read_file(self, user_id: str, path: str) -> str:
        """Read file scoped to user"""
        full_path = self._validate_path(user_id, path)
        # ... rest of implementation
```

**Update API Routes with Authentication:**

```python
# backend/app/api/routes/files.py
from ...core.auth import get_current_user

@router.get("/content")
async def get_file_content(
    path: str = Query(...),
    user_id: str = Depends(get_current_user)
):
    try:
        content = await file_service.read_file(user_id, path)
        return {"content": content}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
```

### 3. Database Schema

**PostgreSQL Schema:**

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- File metadata table
CREATE TABLE file_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    path VARCHAR(500) NOT NULL,
    size_bytes INTEGER,
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, path)
);

-- Sharing/permissions table
CREATE TABLE file_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES file_metadata(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission_level VARCHAR(20) CHECK (permission_level IN ('read', 'write', 'admin')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_file_metadata_user_id ON file_metadata(user_id);
CREATE INDEX idx_file_permissions_file_id ON file_permissions(file_id);
CREATE INDEX idx_file_permissions_user_id ON file_permissions(shared_with_user_id);
```

### 4. Frontend Changes

**Add Authentication to Frontend:**

```typescript
// frontend/src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthStore {
  token: string | null;
  user: { id: string; email: string } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      login: async (email: string, password: string) => {
        const response = await fetch('http://localhost:8000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          throw new Error('Login failed');
        }

        const data = await response.json();
        set({ token: data.access_token, user: { id: data.user_id, email } });
      },

      logout: () => {
        set({ token: null, user: null });
      },

      isAuthenticated: () => {
        return get().token !== null;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

**Update API Client with Auth:**

```typescript
// frontend/src/api/client.ts
import { useAuthStore } from '../stores/authStore';

const getAuthHeader = () => {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fileAPI = {
  async getContent(path: string): Promise<string> {
    const response = await fetch(
      `${API_BASE}/files/content?path=${encodeURIComponent(path)}`,
      {
        headers: {
          ...getAuthHeader(),
        },
      }
    );
    // ... rest
  },
};
```

---

## Kubernetes Deployment

### 1. Dockerfiles

**Backend Dockerfile:**

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY app/ ./app/

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend Dockerfile:**

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Frontend nginx.conf:**

```nginx
# frontend/nginx.conf
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://backend-service:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. Kubernetes Manifests

**Namespace:**

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: knowledge-base
```

**ConfigMap:**

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: knowledge-base
data:
  DATABASE_URL: "postgresql://user:password@postgres:5432/knowledge_base"
  MINIO_ENDPOINT: "minio:9000"
  REDIS_URL: "redis://redis:6379"
```

**Secrets:**

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: knowledge-base
type: Opaque
data:
  jwt-secret: <base64-encoded-secret>
  db-password: <base64-encoded-password>
  minio-access-key: <base64-encoded-key>
  minio-secret-key: <base64-encoded-key>
```

**PostgreSQL Deployment:**

```yaml
# k8s/postgres.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: knowledge-base
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: knowledge-base
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_DB
          value: knowledge_base
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: db-password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: knowledge-base
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
```

**MinIO Deployment (Object Storage):**

```yaml
# k8s/minio.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: minio-pvc
  namespace: knowledge-base
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: minio
  namespace: knowledge-base
spec:
  replicas: 1
  selector:
    matchLabels:
      app: minio
  template:
    metadata:
      labels:
        app: minio
    spec:
      containers:
      - name: minio
        image: minio/minio:latest
        args:
        - server
        - /data
        - --console-address
        - ":9001"
        env:
        - name: MINIO_ROOT_USER
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: minio-access-key
        - name: MINIO_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: minio-secret-key
        ports:
        - containerPort: 9000
        - containerPort: 9001
        volumeMounts:
        - name: minio-storage
          mountPath: /data
      volumes:
      - name: minio-storage
        persistentVolumeClaim:
          claimName: minio-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: minio
  namespace: knowledge-base
spec:
  selector:
    app: minio
  ports:
  - name: api
    port: 9000
    targetPort: 9000
  - name: console
    port: 9001
    targetPort: 9001
```

**Backend Deployment:**

```yaml
# k8s/backend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: knowledge-base
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: your-registry/knowledge-base-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: DATABASE_URL
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        - name: MINIO_ENDPOINT
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: MINIO_ENDPOINT
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: knowledge-base
spec:
  selector:
    app: backend
  ports:
  - port: 8000
    targetPort: 8000
```

**Frontend Deployment:**

```yaml
# k8s/frontend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: knowledge-base
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: your-registry/knowledge-base-frontend:latest
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: knowledge-base
spec:
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 80
```

**Ingress:**

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: knowledge-base-ingress
  namespace: knowledge-base
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - knowledge-base.yourdomain.com
    secretName: knowledge-base-tls
  rules:
  - host: knowledge-base.yourdomain.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 8000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

### 3. Deployment Commands

```bash
# Build Docker images
docker build -t your-registry/knowledge-base-backend:latest ./backend
docker build -t your-registry/knowledge-base-frontend:latest ./frontend

# Push to registry
docker push your-registry/knowledge-base-backend:latest
docker push your-registry/knowledge-base-frontend:latest

# Apply Kubernetes manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/minio.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml

# Check status
kubectl get all -n knowledge-base
```

---

## Implementation Roadmap

### Phase 1: Multi-User Foundation (Week 1-2)
- [ ] Add PostgreSQL database
- [ ] Implement user authentication (JWT)
- [ ] Create user registration/login endpoints
- [ ] Update file service for user scoping
- [ ] Add login/register UI components

### Phase 2: File Storage Migration (Week 3)
- [ ] Set up MinIO for object storage
- [ ] Migrate file operations to use MinIO
- [ ] Update API to use object storage
- [ ] Test file operations with new storage

### Phase 3: Containerization (Week 4)
- [ ] Create Dockerfiles
- [ ] Build and test Docker images
- [ ] Set up local docker-compose for testing
- [ ] Push images to container registry

### Phase 4: Kubernetes Deployment (Week 5)
- [ ] Create Kubernetes manifests
- [ ] Set up persistent volumes
- [ ] Configure ingress and SSL
- [ ] Deploy to cluster
- [ ] Test production deployment

### Phase 5: Advanced Features (Week 6+)
- [ ] File sharing between users
- [ ] Real-time collaboration
- [ ] Version history
- [ ] Search across all user files
- [ ] Admin dashboard

---

## File Storage Recommendations

### For Small-Medium Scale (< 1000 users)
**Recommendation: File System + PostgreSQL**
- User directories: `notes/user_{id}/`
- PostgreSQL for metadata and auth
- Simple backup with rsync/tar
- Easy to manage

### For Large Scale (1000+ users)
**Recommendation: MinIO/S3 + PostgreSQL + Redis**
- MinIO/S3 for file content
- PostgreSQL for metadata
- Redis for caching and sessions
- Scalable and cloud-ready

---

## Security Considerations

1. **Authentication:**
   - Use strong JWT secrets
   - Implement refresh tokens
   - Rate limit login attempts

2. **File Access:**
   - Always validate user permissions
   - Prevent path traversal
   - Sanitize file names

3. **Data Protection:**
   - Encrypt sensitive data at rest
   - Use TLS for all connections
   - Regular backups

4. **Kubernetes Security:**
   - Use NetworkPolicies
   - Enable RBAC
   - Scan images for vulnerabilities
   - Use secrets for sensitive data

---

## Monitoring & Logging

```yaml
# Recommended tools:
- Prometheus: Metrics collection
- Grafana: Visualization
- Loki: Log aggregation
- Jaeger: Distributed tracing
```

---

## Cost Estimation

**Small Deployment (100 users):**
- Kubernetes: $50-100/month (managed cluster)
- Storage: $10-20/month (100GB)
- Database: $20-30/month
- **Total: ~$100-150/month**

**Medium Deployment (1000 users):**
- Kubernetes: $150-300/month
- Storage: $50-100/month (1TB)
- Database: $50-100/month
- **Total: ~$300-500/month**

---

## Next Steps

1. **Decide on scale**: How many users do you expect?
2. **Choose storage**: File system or object storage?
3. **Set up infrastructure**: Local K8s (minikube) or cloud?
4. **Implement auth**: Start with JWT authentication
5. **Containerize**: Build Docker images
6. **Deploy**: Start with local, then move to cloud

Would you like me to help implement any of these phases?
