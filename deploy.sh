#!/bin/bash

# Production Deployment Script for RowCast

echo "🚀 Building RowCast for production deployment..."

# Set production environment
export NODE_ENV=production

# Build the frontend project
echo "📦 Building frontend with Vite..."
cd api && npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful!"
    echo ""
    echo "📁 Built files are in: api/dist/"
    echo ""
    echo "🌐 Frontend deployment options:"
    echo "1. Upload the 'api/dist' folder contents to Cloudflare Pages"
    echo "2. Set environment variable VITE_API_BASE_URL to your API URL"
    echo "3. Configure custom domain if needed"
    echo ""
    echo "🔧 API deployment:"
    echo "1. Run: cd api && ./deploy.sh"
    echo "2. Or use: cd api && ./start_server.sh for local production"
    echo "3. Set FLASK_ENV=production"
    echo "4. Update CORS settings for your domain"
    echo ""
    echo "📋 To start local production servers:"
    echo "   Frontend: npx vite preview"
    echo "   API: cd api && ./start_server.sh"
else
    echo "❌ Build failed!"
    exit 1
fi
