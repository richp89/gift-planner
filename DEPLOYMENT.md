# Deployment Guide for Gift Planner

## 🚀 Railway Deployment (Recommended)

### Backend Setup

1. **Create Railway Account**: https://railway.app

2. **Create New Project** → "Deploy from GitHub repo"

3. **Add PostgreSQL Database**:
   - Click "New" → "Database" → "PostgreSQL"
   - Railway automatically creates `DATABASE_URL` variable

4. **Set Environment Variables**:
   ```
   SECRET_KEY = <run python generate_secret.py to get value>
   ALLOWED_ORIGINS = https://your-frontend-url.vercel.app,https://your-frontend-url.com
   ```

5. **Configure Service**:
   - Root Directory: `backend`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Railway will auto-detect Python and install dependencies

6. **Deploy**: Railway auto-deploys on push to main branch

### Frontend Setup

#### Option A: Vercel (Recommended for frontend)

1. **Connect GitHub**: https://vercel.com
2. **Import your repository**
3. **Configure**:
   - Framework: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Environment Variables**:
   ```
   VITE_API_URL = https://your-backend.railway.app
   ```

#### Option B: Railway (All-in-one)

1. **Add New Service** in same project
2. **Configure**:
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run preview`
3. **Environment Variables**:
   ```
   VITE_API_URL = https://your-backend-service.railway.app
   ```

---

## 🎯 Render Deployment (Free Option)

### Backend

1. **Create account**: https://render.com
2. **New Web Service** → Connect GitHub
3. **Configure**:
   - Name: gift-planner-api
   - Root Directory: `backend`
   - Runtime: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. **Add PostgreSQL Database** (free tier)
5. **Environment Variables**:
   ```
   SECRET_KEY = <generate with python generate_secret.py>
   DATABASE_URL = <Render provides this>
   ALLOWED_ORIGINS = https://your-frontend.vercel.app
   ```

### Frontend

1. **New Static Site** → Connect GitHub
2. **Configure**:
   - Name: gift-planner
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
3. **Environment Variables**:
   ```
   VITE_API_URL = https://gift-planner-api.onrender.com
   ```

---

## 🔑 Generating SECRET_KEY

Run this command:
```bash
python generate_secret.py
```

Or manually:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output to your Railway/Render environment variables.

---

## 📝 Environment Variables Summary

### Backend Variables:
- `SECRET_KEY` - **REQUIRED** - JWT signing key (generate new one)
- `DATABASE_URL` - Auto-provided by Railway/Render PostgreSQL
- `ALLOWED_ORIGINS` - Your frontend URL(s), comma-separated

### Frontend Variables:
- `VITE_API_URL` - Your backend API URL (e.g., https://api.railway.app)

---

## ✅ Post-Deployment Checklist

- [ ] SECRET_KEY is set and unique (not the dev default)
- [ ] DATABASE_URL is configured (PostgreSQL)
- [ ] ALLOWED_ORIGINS includes your frontend URL
- [ ] Frontend VITE_API_URL points to backend
- [ ] HTTPS is enabled (automatic on Railway/Render/Vercel)
- [ ] Can register a new user
- [ ] Can create contacts and events
- [ ] Data persists after refresh

---

## 🔄 Updating Production

Just push to GitHub main branch - auto-deploys on all platforms:
```bash
git add .
git commit -m "Update feature"
git push
```

---

## 💰 Cost Estimate

### Free Tier (starts at $0):
- **Render**: Backend + DB + Frontend = $0
- **Railway**: $5 credit/month (backend + DB ~$5-10)
- **Vercel**: Frontend = $0

### Recommended Free Stack:
- Backend: Render Web Service (Free)
- Database: Render PostgreSQL (Free)
- Frontend: Vercel (Free)
- **Total: $0/month**

### Production Stack (~$10-20/month):
- Backend: Railway ($10)
- Database: Railway PostgreSQL (included)
- Frontend: Vercel (Free)
- **Total: ~$10/month**
