#!/bin/bash

# Auto-deploy script for trans-vividcycle
# Run this on the server to auto-pull and restart services

set -e

APP_DIR="/opt/trans-vividcycle"
LOG_FILE="/var/log/trans-vividcycle-deploy.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

cd "$APP_DIR"

# Fetch latest changes
git fetch origin main

# Check if there are updates
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
    log "New commits detected. Deploying..."
    
    # Pull latest code
    git pull origin main
    
    # Rebuild frontend
    log "Building frontend..."
    cd frontend
    npm install
    npm run build
    cd ..
    
    # Copy to nginx
    log "Updating nginx static files..."
    rm -rf /usr/share/nginx/html/*
    cp -r frontend/dist/* /usr/share/nginx/html/
    
    # Restart backend
    log "Restarting backend..."
    docker-compose -f docker-compose.prod.yml restart backend
    
    # Restart frontend container (if using docker for frontend)
    # docker-compose -f docker-compose.prod.yml restart frontend
    
    log "Deployment complete!"
    
    # Send notification (optional)
    # curl -s "https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<CHAT_ID>&text=Trans+Vivid+Cycle+deployed+successfully"
else
    log "No updates."
fi
