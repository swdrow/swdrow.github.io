#!/bin/bash
# Emergency test server for API testing only
# Should only be used for testing major API changes
# Runs on port 8000

echo "⚠️  Starting EMERGENCY TEST SERVER on port 8000"
echo "   This should only be used for testing major API changes!"
echo "   Normal development should use port 5000"

# Kill any existing process on port 8000
PID=$(lsof -ti:8000)
if [ ! -z "$PID" ]; then
    echo "🔄 Killing existing process on port 8000 (PID: $PID)"
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

echo "🧪 Starting TEST API server on http://localhost:8000"
export FLASK_ENV=development
export FLASK_DEBUG=1

# Start test server
gunicorn -w 1 -b 127.0.0.1:8000 --timeout 120 --access-logfile logs/test_access.log --error-logfile logs/test_error.log --capture-output --enable-stdio-inheritance wsgi:app &

echo $! > .test_server.pid

echo "⚠️  TEST SERVER STARTED on port 8000"
echo "📊 Test API at: http://localhost:8000/api"
echo "🛑 Stop with: ./scripts/stop-server.sh"
echo ""
echo "⚠️  REMEMBER: This is for testing only!"
echo "   Switch back to port 5000 for normal development"
