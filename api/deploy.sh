#!/bin/bash
# deploy.sh - Deploy RowCast API to production server

set -e

echo "🚀 RowCast Production Deployment"
echo "================================="

# Build frontend assets for production
echo "📦 Building frontend assets..."
npm run build

# Create deployment package
echo "📋 Creating deployment package..."
DEPLOY_DIR="rowcast-deploy-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEPLOY_DIR"

# Copy necessary files
cp -r api/ "$DEPLOY_DIR/"
cp -r dist/ "$DEPLOY_DIR/" 2>/dev/null || echo "No dist directory found"

# Create production start script
cat > "$DEPLOY_DIR/start_production.sh" << 'EOF'
#!/bin/bash
# Production startup script

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Set production environment
export FLASK_ENV=production
export FLASK_APP=wsgi:app

# Start with gunicorn
echo "Starting production server..."
gunicorn --bind 0.0.0.0:5000 --workers 4 --timeout 120 wsgi:app
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
