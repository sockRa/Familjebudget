#!/bin/bash

# Stop script on error
set -e

echo "🚀 Starting deployment..."

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed."
    exit 1
fi

# Check if docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed."
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull

# Rebuild and restart containers
# Using 'docker compose' (V2) as it's the modern standard. 
# If you have an older version, you might need 'docker-compose'.
echo "🔄 Rebuilding and restarting Docker containers..."
docker compose down
docker compose up -d --build

# Cleanup unused images to save space
echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ Deployment complete!"
