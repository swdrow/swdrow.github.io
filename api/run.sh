#!/usr/bin/env bash
# run.sh - start the API server in foreground mode
# Useful for debugging and development

# Activate conda environment if available
if command -v conda &> /dev/null; then
    echo "Activating conda environment: rowcast"
    source "$(conda info --base)/etc/profile.d/conda.sh"
    conda activate rowcast
fi

# Set production environment
export FLASK_ENV=production

# Preload the app so APScheduler runs in the master process
# Increase timeout to prevent worker startup timeouts
exec gunicorn wsgi:app \
  --bind 0.0.0.0:5000 \
  --workers 1 \
  --threads 4 \
  --timeout 120 \
  --preload \
  --log-level info \
  "$@"
