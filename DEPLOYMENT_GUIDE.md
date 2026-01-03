# 🚀 Railway Deployment Guide

Complete step-by-step guide to deploy your Knowledge Base app to Railway.

## 📋 Prerequisites

- GitHub account
- Railway account (sign up at https://railway.app)
- Domain name (optional - Railway provides free subdomain)

## 🎯 Deployment Steps

### **Step 1: Push Code to GitHub**

If you haven't already pushed to GitHub:

```bash
# Make sure you're in the project root
cd /Users/huangyong/claude-code-playground

# Check git status
git status

# Add all files
git add .

# Commit changes
git commit -m "Add Railway configuration and production-ready setup"

# Push to GitHub
git push origin main
```

### **Step 2: Sign Up for Railway**

1. Go to https://railway.app
2. Click "Login" → Sign in with GitHub
3. Authorize Railway to access your repositories

### **Step 3: Create New Project**

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository: `markdown-notes` (or whatever you named it)
4. Railway will detect your project structure

### **Step 4: Add PostgreSQL Database**

1. In your Railway project dashboard
2. Click "+ New" → "Database" → "Add PostgreSQL"
3. Railway automatically creates the database
4. The `DATABASE_URL` environment variable is auto-generated

### **Step 5: Deploy Backend**

1. Click "+ New" → "GitHub Repo" → Select your repo
2. Configure the service:
   - **Name**: `backend`
   - **Root Directory**: `backend`
   - Railway auto-detects it's a Python app

3. Add Environment Variables:
   - Click on the backend service
   - Go to "Variables" tab
   - Add these variables:

   ```
   JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-now-random-string-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ENVIRONMENT=production
   NOTES_DIR=/app/notes
   ```

   Note: `DATABASE_URL` is automatically added by Railway when you connect PostgreSQL

4. **Add Persistent Storage Volume** (CRITICAL - prevents file loss on deployment):
   - Still in the backend service, go to "Settings" tab
   - Scroll down to "Volumes" section
   - Click "+ Add Volume"
   - Configure the volume:
     - **Mount Path**: `/app/notes`
     - **Size**: 1GB (or more based on your needs)
   - Click "Add"

   ⚠️ **Important**: Without this volume, all user files will be deleted on every deployment!
   The volume persists your markdown files across deployments.

5. Click "Deploy"
6. Wait for deployment (2-3 minutes)
7. Railway gives you a URL like: `https://backend-production-xxxx.up.railway.app`

### **Step 6: Deploy Frontend**

1. Click "+ New" → "GitHub Repo" → Select your repo again
2. Configure the service:
   - **Name**: `frontend`
   - **Root Directory**: `frontend`
   - Railway auto-detects it's a Node.js app

3. Add Environment Variables:
   - Click on the frontend service
   - Go to "Variables" tab
   - Add:

   ```
   VITE_API_URL=https://your-backend-url.up.railway.app/api
   ```

   Replace `your-backend-url` with the actual URL from Step 5

4. Click "Deploy"
5. Wait for deployment (3-4 minutes)
6. Railway gives you a URL like: `https://frontend-production-xxxx.up.railway.app`

### **Step 7: Connect Services**

Railway should automatically connect services in the same project, but verify:

1. Backend should have access to PostgreSQL (check `DATABASE_URL` in variables)
2. Frontend should point to backend API (check `VITE_API_URL`)

### **Step 8: Update CORS Settings (Important!)**

Update your backend CORS to allow the frontend domain:

Edit `backend/app/main.py`:

```python
origins = [
    "http://localhost:5173",
    "http://localhost:4173",
    "https://your-frontend-url.up.railway.app",  # Add this
]
```

Then:
```bash
git add backend/app/main.py
git commit -m "Update CORS for production"
git push origin main
```

Railway will auto-deploy the update.

### **Step 9: Test Your Deployment**

1. Open your frontend URL: `https://frontend-production-xxxx.up.railway.app`
2. You should see the login screen
3. Register a new user
4. Create some notes
5. Test all features (create, edit, delete files/folders)

### **Step 10: Add Custom Domain (Optional)**

If you bought a domain:

#### **Frontend Domain Setup**:
1. In Railway, click on frontend service
2. Go to "Settings" → "Domains"
3. Click "Generate Domain" to get a Railway subdomain
4. Click "Custom Domain" → Enter your domain (e.g., `notes.yourdomain.com`)
5. Railway shows DNS records to add
6. Go to your domain registrar (Namecheap, etc.)
7. Add CNAME record:
   ```
   Type: CNAME
   Name: notes (or @)
   Value: frontend-production-xxxx.up.railway.app
   ```
8. Wait 5-15 minutes for DNS propagation
9. SSL certificate auto-provisions

#### **Backend Domain Setup**:
1. In Railway, click on backend service
2. Go to "Settings" → "Domains"
3. Click "Custom Domain" → Enter subdomain (e.g., `api.yourdomain.com`)
4. Add CNAME record in your domain registrar:
   ```
   Type: CNAME
   Name: api
   Value: backend-production-xxxx.up.railway.app
   ```

5. Update frontend environment variable:
   ```
   VITE_API_URL=https://api.yourdomain.com/api
   ```

6. Update backend CORS:
   ```python
   origins = [
       "https://notes.yourdomain.com",
   ]
   ```

## 💰 Cost Breakdown

**Railway Pricing**:
- Free tier: $5 credit per month
- After free tier: ~$5-10/month for both services + database

**Estimated Monthly Usage**:
```
Backend: ~$3-5/month (depends on traffic)
Frontend: ~$2-3/month
PostgreSQL: Included in project
Total: ~$5-8/month
```

**Railway gives you**:
- ✅ Auto-deployment on git push
- ✅ Free SSL certificates
- ✅ Built-in monitoring
- ✅ Logs and metrics
- ✅ PostgreSQL database
- ✅ Automatic scaling

## 🔧 Maintenance

### **View Logs**:
```
Railway Dashboard → Service → "Deployments" → Click on deployment → "View Logs"
```

### **Update Environment Variables**:
```
Railway Dashboard → Service → "Variables" → Add/Edit → Save
```

### **Restart Service**:
```
Railway Dashboard → Service → "Deployments" → "Restart"
```

### **Rollback Deployment**:
```
Railway Dashboard → Service → "Deployments" → Click previous deployment → "Redeploy"
```

## 🐛 Troubleshooting

### **Files disappear after deployment**:
- **Cause**: Railway uses ephemeral storage - the filesystem is wiped on each deployment
- **Solution**: Add a Railway Volume (see Step 5, substep 4)
  1. Go to backend service → Settings → Volumes
  2. Add volume with mount path `/app/notes`
  3. Add environment variable `NOTES_DIR=/app/notes`
  4. Redeploy the service
- **Note**: Database persists (users, file metadata), but actual `.md` files need a volume

### **Frontend can't connect to backend**:
- Check `VITE_API_URL` environment variable
- Check backend CORS settings
- Verify backend is running (check logs)

### **Database connection error**:
- Verify `DATABASE_URL` is set
- Check PostgreSQL service is running
- Check backend logs for errors

### **401 Unauthorized errors**:
- Check `JWT_SECRET_KEY` is set
- Clear browser localStorage and register again
- Check backend /health endpoint

### **Build failures**:
- Check Railway build logs
- Verify `railway.toml` is correct
- Check `requirements.txt` or `package.json` for missing dependencies

## 🔄 Continuous Deployment

Railway automatically deploys when you push to GitHub:

```bash
# Make changes locally
git add .
git commit -m "Add new feature"
git push origin main

# Railway automatically:
# 1. Detects the push
# 2. Builds your services
# 3. Runs tests (if configured)
# 4. Deploys to production
# 5. Zero-downtime deployment
```

## 📊 Monitoring

Railway provides built-in monitoring:

1. **Metrics**: CPU, Memory, Network usage
2. **Logs**: Real-time application logs
3. **Deployments**: History of all deployments
4. **Health Checks**: Automatic health monitoring

Access via: Railway Dashboard → Service → "Metrics"

## 🎉 You're Live!

Your app is now deployed and accessible worldwide!

**Frontend**: https://frontend-production-xxxx.up.railway.app
**Backend**: https://backend-production-xxxx.up.railway.app

Share it with friends and start using your personal knowledge base!

---

## 📝 Quick Reference

**Railway CLI** (optional for power users):
```bash
# Install
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# View logs
railway logs

# Open dashboard
railway open
```

**Useful Commands**:
```bash
# Force rebuild and deploy
git commit --allow-empty -m "Force rebuild"
git push origin main

# Check service status
curl https://backend-production-xxxx.up.railway.app/health

# View environment
railway variables
```
