#!/bin/bash
# deploy.sh - Deploy RowCast API to production server

set -e

echo "🚀 RowCast Production Deployment"
echo "================================="

# Activate conda environment if available
if command -v conda &> /dev/null; then
    echo "🐍 Activating conda environment: rowcast"
    source "$(conda info --base)/etc/profile.d/conda.sh"
    conda activate rowcast
fi

# Build frontend assets for production
echo "📦 Building frontend assets..."
npm run build

# Create deployment package
echo "📋 Creating deployment package..."
DEPLOY_DIR="rowcast-deploy-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEPLOY_DIR"

# Copy necessary files
echo "📁 Copying application files..."
cp -r app/ "$DEPLOY_DIR/"
cp wsgi.py "$DEPLOY_DIR/"
cp requirements.txt "$DEPLOY_DIR/"
cp *.sh "$DEPLOY_DIR/"
cp vite.config.js "$DEPLOY_DIR/"
cp package*.json "$DEPLOY_DIR/"
cp -r dist/ "$DEPLOY_DIR/" 2>/dev/null || echo "No dist directory found"

# Create production start script
cat > "$DEPLOY_DIR/start_production.sh" << 'EOF'
#!/bin/bash
# Production startup script

set -e

echo "🚀 Starting RowCast API in production mode..."

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Set production environment
export FLASK_ENV=production
export FLASK_APP=wsgi:app

# Create logs directory
mkdir -p logs

# Start with gunicorn
echo "🌐 Starting production server with Gunicorn..."
exec gunicorn wsgi:app \
  --bind 0.0.0.0:5000 \
  --workers 4 \
  --threads 4 \
  --timeout 120 \
  --preload \
  --access-logfile logs/access.log \
  --error-logfile logs/error.log \
  --log-level info
EOF

chmod +x "$DEPLOY_DIR/start_production.sh"

echo "✅ Deployment package created: $DEPLOY_DIR"
echo ""
echo "📋 Next steps:"
echo "1. Upload the $DEPLOY_DIR folder to your production server"
echo "2. SSH into your server and navigate to the uploaded folder"
echo "3. Run: ./start_production.sh"
echo ""
echo "🔗 Your API should be available at: https://api.samwduncan.com"
