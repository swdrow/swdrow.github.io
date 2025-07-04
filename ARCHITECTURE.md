# RowCast Development & Deployment Guide

## Architecture Overview

### Development Environment
- **Frontend Dev Server**: Vite on port 3000 (with HMR, proxy to API)
- **Backend API Server**: Flask on port 5000
- **Proxy Configuration**: Vite proxies `/api/*` requests to Flask

### Production Environment
- **Frontend**: Static files served by Cloudflare Pages
- **Backend**: Flask API deployed to cloud platform (Railway, Heroku, etc.)
- **CORS**: Configured for cross-origin requests

## Development Workflow

### Start Development Servers
```bash
# Terminal 1: Start Flask API
cd api
./start_server.sh

# Terminal 2: Start Vite Dev Server
npm run dev
```

### URLs
- Frontend: http://localhost:3000 (with HMR)
- API: http://localhost:5000/api/*
- API Docs: http://localhost:5000/docs

## Production Deployment

### Backend (API)
1. Deploy Flask app to Railway/Heroku
2. Set environment variables:
   - `FLASK_ENV=production`
   - `DATABASE_URL` (if needed)
3. API will be available at: `https://your-api.railway.app`

### Frontend
1. Update API URLs for production
2. Build static files: `npm run build`
3. Deploy `dist/` folder to Cloudflare Pages
4. Configure custom domain

## Environment Configuration

### Development
- API calls use proxy: `/api/water/current`
- Vite handles routing and HMR

### Production
- API calls use full URL: `https://your-api.railway.app/api/water/current`
- Static files served from CDN

## Benefits of This Architecture

1. **Separation of Concerns**: Frontend and backend are independent
2. **Scalability**: Can scale frontend and backend separately
3. **Performance**: Frontend served from CDN (Cloudflare)
4. **Development Experience**: Hot reload, fast builds
5. **Cost Effective**: Cloudflare Pages is free, API server can be small
