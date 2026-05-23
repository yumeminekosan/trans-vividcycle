#!/bin/bash

# Deploy script for anti-overdose.wiki

set -e

echo "🚀 Deploying Trans Vivid Cycle to anti-overdose.wiki..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root or with sudo"
    exit 1
fi

# Create app directory
APP_DIR="/opt/trans-vividcycle"
mkdir -p $APP_DIR
cd $APP_DIR

# Clone or pull latest code
if [ -d ".git" ]; then
    echo "📥 Pulling latest code..."
    git pull origin main
else
    echo "📥 Cloning repository..."
    git clone https://github.com/yumeminekosan/trans-vividcycle.git .
fi

# Build and start services
echo "🔧 Building services..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services..."
sleep 10

# Check health
echo "🏥 Health check..."
curl -s http://localhost:3000/health || echo "⚠️ Backend not responding"

# Setup nginx if not already configured
if [ ! -f "/etc/nginx/sites-enabled/anti-overdose.wiki.conf" ]; then
    echo "🔧 Configuring nginx..."
    cp nginx/anti-overdose.wiki.conf /etc/nginx/sites-available/
    ln -sf /etc/nginx/sites-available/anti-overdose.wiki.conf /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
fi

echo "✅ Deployment complete!"
echo ""
echo "🌐 Frontend: http://anti-overdose.wiki"
echo "🔌 API: http://anti-overdose.wiki/api"
echo "🗄️ Neo4j: http://anti-overdose.wiki:7474"
echo ""
echo "📋 Useful commands:"
echo "  docker-compose -f docker-compose.prod.yml logs -f"
echo "  docker-compose -f docker-compose.prod.yml down"
echo "  docker-compose -f docker-compose.prod.yml up -d"
