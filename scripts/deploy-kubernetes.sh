#!/bin/bash

# Kubernetes Deployment Script for Distributed Chat Application

set -e

echo "🚀 Starting Kubernetes deployment..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists kubectl; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

if ! kubectl cluster-info >/dev/null 2>&1; then
    echo "❌ No Kubernetes cluster found. Please connect to a cluster first."
    exit 1
fi

# Build and push images (assuming Docker registry is configured)
echo "🔨 Building and pushing Docker images..."
docker build -t chat-server:latest ./server
docker build -t chat-client:latest ./client

# If using a registry, tag and push
# docker tag chat-server:latest your-registry/chat-server:latest
# docker tag chat-client:latest your-registry/chat-client:latest
# docker push your-registry/chat-server:latest
# docker push your-registry/chat-client:latest

# Apply Kubernetes manifests
echo "📦 Applying Kubernetes manifests..."

kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/mongodb-deployment.yaml
kubectl apply -f k8s/redis-deployment.yaml

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
kubectl wait --for=condition=ready pod -l app=mongodb -n chat-app --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n chat-app --timeout=300s

# Deploy application services
kubectl apply -f k8s/server-deployment.yaml
kubectl apply -f k8s/client-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Wait for deployments to be ready
echo "⏳ Waiting for application deployments..."
kubectl wait --for=condition=available deployment/chat-server -n chat-app --timeout=300s
kubectl wait --for=condition=available deployment/chat-client -n chat-app --timeout=300s

# Display deployment status
echo "📊 Deployment Status:"
kubectl get all -n chat-app

echo "🎉 Kubernetes deployment completed successfully!"
echo ""
echo "📍 Access Information:"
echo "   Add '127.0.0.1 chat-app.local' to your /etc/hosts file"
echo "   Then access: http://chat-app.local"
echo ""
echo "🔧 Management Commands:"
echo "   View pods: kubectl get pods -n chat-app"
echo "   View logs: kubectl logs -f deployment/chat-server -n chat-app"
echo "   Scale servers: kubectl scale deployment chat-server --replicas=5 -n chat-app"
echo "   Delete deployment: kubectl delete namespace chat-app"
echo ""
echo "📈 Monitoring:"
echo "   kubectl port-forward svc/chat-server-service 8080:5000 -n chat-app"
echo "   Then access health check: http://localhost:8080/health"