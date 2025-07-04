#!/usr/bin/env bash
# start_server.sh - start the API server with nohup and logging

# Create logs directory if it doesn't exist
mkdir -p logs

# Get current timestamp for log files
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/rowcast_${TIMESTAMP}.log"
PID_FILE="logs/rowcast.pid"

echo "Starting RowCast API server..."
echo "Logs will be written to: $LOG_FILE"
echo "PID file: $PID_FILE"

# Stop any existing server
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "Stopping existing server (PID: $OLD_PID)..."
        kill "$OLD_PID"
        sleep 2
    fi
    rm -f "$PID_FILE"
fi

# Also kill any lingering gunicorn processes on our port
pkill -f "gunicorn wsgi:app" 2>/dev/null || true
sleep 1

# Activate conda environment
echo "Activating conda environment: rowcast"
source "$(conda info --base)/etc/profile.d/conda.sh"
conda activate rowcast

# Set production environment
export FLASK_ENV=production

# Verify gunicorn is available
if ! command -v gunicorn &> /dev/null; then
    echo "❌ gunicorn not found in conda environment!"
    echo "Installing gunicorn..."
    conda install -c conda-forge gunicorn -y
fi

# Start server with nohup
nohup gunicorn wsgi:app \
  --bind 127.0.0.1:5000 \
  --workers 4 \
  --threads 4 \
  --timeout 120 \
  --preload \
  --access-logfile "$LOG_FILE" \
  --error-logfile "$LOG_FILE" \
  --log-level info \
  "$@" >> "$LOG_FILE" 2>&1 &

# Save PID
echo $! > "$PID_FILE"
PID=$(cat "$PID_FILE")

echo "Server started with PID: $PID"
echo "To view logs: tail -f $LOG_FILE"
echo "To stop server: ./stop_server.sh"

# Wait a moment and check if server started successfully
sleep 3
if ps -p "$PID" > /dev/null 2>&1; then
    echo "✅ Server is running successfully!"
    echo "API available at: http://localhost:5000"
    echo "Documentation: http://localhost:5000/docs"
else
    echo "❌ Server failed to start. Check logs: $LOG_FILE"
    exit 1
fi
