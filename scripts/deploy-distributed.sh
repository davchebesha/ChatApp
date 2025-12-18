#!/bin/bash

# Distributed Chat Application Deployment Script

set -e

echo "🚀 Starting distributed deployment..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists docker; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command_exists docker-compose; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Build images
echo "🔨 Building Docker images..."
docker-compose build

# Start distributed services
echo "🚀 Starting distributed services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check service health
echo "🔍 Checking service health..."
for i in {1..10}; do
    if curl -f http://localhost/health >/dev/null 2>&1; then
        echo "✅ All services are healthy!"
        break
    else
        echo "⏳ Waiting for services... (attempt $i/10)"
        sleep 10
    fi
    
    if [ $i -eq 10 ]; then
        echo "❌ Services failed to start properly"
        docker-compose logs
        exit 1
    fi
done

# Display service status
echo "📊 Service Status:"
docker-compose ps

echo "🎉 Distributed deployment completed successfully!"
echo ""
echo "📍 Access Points:"
echo "   Frontend: http://localhost:3000"
echo "   API: http://localhost/api"
echo "   Health Check: http://localhost/health"
echo ""
echo "🔧 Management Commands:"
echo "   View logs: docker-compose logs -f"
echo "   Scale servers: docker-compose up -d --scale server=5"
echo "   Stop services: docker-compose down"
echo ""
echo "📈 Monitoring:"
echo "   Server 1: http://localhost:5000/health"
echo "   Server 2: http://localhost:5001/health"
echo "   Server 3: http://localhost:5002/health"