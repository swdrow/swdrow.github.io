#!/usr/bin/env bash
# restart_server.sh - Restart the RowCast API server with latest code

echo "🔄 Restarting RowCast API server..."

# Stop the current server
echo "🛑 Stopping current server..."
./stop_server.sh

# Give it a moment to fully stop
sleep 2

# Kill any remaining processes just to be sure
echo "🧹 Cleaning up any remaining processes..."
pkill -f "gunicorn wsgi:app" 2>/dev/null || true
sleep 1

# Clear Python cache to ensure latest code is loaded
echo "🗑️  Clearing Python cache..."
find . -name "*.pyc" -delete 2>/dev/null || true
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

# Start the server with latest code
echo "🚀 Starting server with latest code..."
./start_server.sh

echo "✅ Server restart complete!"
echo "🌐 API should be available at: http://localhost:5000"
echo "📊 Check status with: ./status_server.sh"
