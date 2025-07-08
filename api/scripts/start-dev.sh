#!/bin/bash
# Development server startup script
# Runs Flask app with Gunicorn on port 5000

echo "🚀 Starting RowCast API Development Server..."

# Kill any existing process on port 5000
PID=$(lsof -ti:5000)
if [ ! -z "$PID" ]; then
    echo "⚠️  Killing existing process on port 5000 (PID: $PID)"
    kill -9 $PID
    sleep 2
fi

# Start Redis if not running
if ! pgrep -x "redis-server" > /dev/null; then
    echo "🗄️  Starting Redis server..."
    redis-server --daemonize yes
fi

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo "🐍 Activating virtual environment..."
    source venv/bin/activate
fi

# Start the development server
echo "🌐 Starting Flask API on http://localhost:5000"
export FLASK_ENV=development
export FLASK_DEBUG=1

# Use gunicorn for consistent behavior
gunicorn -w 1 -b 127.0.0.1:5000 --timeout 120 --access-logfile logs/access.log --error-logfile logs/error.log --capture-output --enable-stdio-inheritance wsgi:app &

# Store the PID
echo $! > .dev_server.pid

echo "✅ Development server started!"
echo "📊 API available at: http://localhost:5000/api"
echo "📖 Documentation at: http://localhost:5000/api/docs"
echo "🛑 Stop with: ./scripts/stop-server.sh"
