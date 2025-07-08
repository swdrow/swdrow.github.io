#!/bin/bash
# Server stop script
# Stops all RowCast API servers

echo "🛑 Stopping RowCast API servers..."

# Stop development server
if [ -f ".dev_server.pid" ]; then
    DEV_PID=$(cat .dev_server.pid)
    if kill -0 $DEV_PID 2>/dev/null; then
        echo "🔄 Stopping development server (PID: $DEV_PID)"
        kill -TERM $DEV_PID
        sleep 2
        kill -9 $DEV_PID 2>/dev/null
    fi
    rm -f .dev_server.pid
fi

# Stop production server
if [ -f ".prod_server.pid" ]; then
    PROD_PID=$(cat .prod_server.pid)
    if kill -0 $PROD_PID 2>/dev/null; then
        echo "🔄 Stopping production server (PID: $PROD_PID)"
        kill -TERM $PROD_PID
        sleep 2
        kill -9 $PROD_PID 2>/dev/null
    fi
    rm -f .prod_server.pid
fi

# Kill any remaining gunicorn processes
pkill -f "gunicorn.*wsgi:app" 2>/dev/null

# Kill any process on port 5000
PID_5000=$(lsof -ti:5000 2>/dev/null)
if [ ! -z "$PID_5000" ]; then
    echo "🔄 Killing process on port 5000 (PID: $PID_5000)"
    kill -9 $PID_5000
fi

# Kill any process on port 8000 (test server)
PID_8000=$(lsof -ti:8000 2>/dev/null)
if [ ! -z "$PID_8000" ]; then
    echo "🔄 Killing process on port 8000 (PID: $PID_8000)"
    kill -9 $PID_8000
fi

echo "✅ All servers stopped!"
