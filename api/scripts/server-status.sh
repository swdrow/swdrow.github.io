#!/bin/bash
# Server status check script

echo "🔍 RowCast API Server Status"
echo "============================"

# Check port 5000 (main API server)
PID_5000=$(lsof -ti:5000 2>/dev/null)
if [ ! -z "$PID_5000" ]; then
    echo "✅ Port 5000: ACTIVE (PID: $PID_5000)"
    PROC_INFO=$(ps -p $PID_5000 -o cmd= 2>/dev/null)
    echo "   Process: $PROC_INFO"
else
    echo "❌ Port 5000: INACTIVE"
fi

# Check port 8000 (test server)
PID_8000=$(lsof -ti:8000 2>/dev/null)
if [ ! -z "$PID_8000" ]; then
    echo "⚠️  Port 8000: ACTIVE (PID: $PID_8000) - TEST SERVER"
    PROC_INFO=$(ps -p $PID_8000 -o cmd= 2>/dev/null)
    echo "   Process: $PROC_INFO"
else
    echo "✅ Port 8000: INACTIVE (Good - no test server)"
fi

# Check port 3000 (Vite dev server)
PID_3000=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$PID_3000" ]; then
    echo "🔧 Port 3000: ACTIVE (PID: $PID_3000) - Vite Dev Server"
else
    echo "⚪ Port 3000: INACTIVE (Vite not running)"
fi

# Check Redis
if pgrep -x "redis-server" > /dev/null; then
    echo "✅ Redis: ACTIVE"
else
    echo "❌ Redis: INACTIVE"
fi

echo ""
echo "🌐 Test endpoints:"
echo "   API Status: curl http://localhost:5000/api/status"
echo "   Main Site:  curl http://localhost:3000 (if Vite running)"
