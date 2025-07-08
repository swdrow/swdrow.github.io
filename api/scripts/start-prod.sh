#!/bin/bash
# Production server startup script
# Runs Flask app with Gunicorn on port 5000 in production mode

set -e

echo "🚀 Starting RowCast API Production Server..."

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

# Remove venv activation, ensure conda env is active
if [ -z "$CONDA_DEFAULT_ENV" ] || [ "$CONDA_DEFAULT_ENV" != "rowcast" ]; then
    echo "⚠️  Conda environment 'rowcast' is not active. Attempting to activate..."
    if command -v conda >/dev/null 2>&1; then
        source $(conda info --base)/etc/profile.d/conda.sh
        conda activate rowcast
    else
        echo "❌ Conda is not installed or not in PATH. Exiting."
        exit 1
    fi
fi

# Start the production server
cd /home/swd/swdrow.github.io/api

# Ensure logs directory and files exist (after cd)
LOGS_DIR="/home/swd/swdrow.github.io/api/logs"
if [ ! -d "$LOGS_DIR" ]; then
    echo "📁 Creating logs directory at $LOGS_DIR..."
    mkdir -p "$LOGS_DIR"
fi
if [ ! -f "$LOGS_DIR/error.log" ]; then
    touch "$LOGS_DIR/error.log"
fi
if [ ! -f "$LOGS_DIR/access.log" ]; then
    touch "$LOGS_DIR/access.log"
fi

# Check for wsgi.py and app object
WSGI_FILE="/home/swd/swdrow.github.io/api/wsgi.py"
if [ ! -f "$WSGI_FILE" ]; then
    echo "❌ wsgi.py not found at $WSGI_FILE! Exiting."
    exit 1
fi
if ! grep -q "app" "$WSGI_FILE"; then
    echo "❌ 'app' object not found in $WSGI_FILE! Exiting."
    exit 1
fi

# Refresh all data in Redis before starting Gunicorn
python3 refresh_all_data.py

echo "🌐 Starting Flask API in production mode on http://localhost:5000"
export FLASK_ENV=production

# Use multiple workers for production, with absolute log paths
GUNICORN_ERROR_LOG="$LOGS_DIR/error.log"
GUNICORN_ACCESS_LOG="$LOGS_DIR/access.log"
gunicorn -w 4 -b 127.0.0.1:5000 --timeout 120 --access-logfile "$GUNICORN_ACCESS_LOG" --error-logfile "$GUNICORN_ERROR_LOG" --daemon wsgi:app

# Check if Gunicorn started successfully
sleep 2
GUNICORN_PID=$(pgrep -f "gunicorn.*wsgi:app" | head -1)
if [ -z "$GUNICORN_PID" ]; then
    echo "❌ Gunicorn failed to start! Last 20 lines of $GUNICORN_ERROR_LOG:"
    tail -20 "$GUNICORN_ERROR_LOG"
    exit 1
fi

# Store the PID
echo $GUNICORN_PID > .prod_server.pid

echo "✅ Production server started!"
echo "📊 API available at: http://localhost:5000/api"
echo "🛑 Stop with: ./scripts/stop-server.sh"
