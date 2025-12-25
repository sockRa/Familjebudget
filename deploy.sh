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

# Determine which docker compose command to use
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo "❌ Neither 'docker compose' nor 'docker-compose' found."
    exit 1
fi

echo "🔄 Rebuilding and restarting Docker containers using $DOCKER_COMPOSE_CMD..."
$DOCKER_COMPOSE_CMD down
$DOCKER_COMPOSE_CMD up -d --build

# Cleanup unused images to save space
echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ Deployment complete!"
