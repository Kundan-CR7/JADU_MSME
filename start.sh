#!/bin/bash
echo "Starting MSME Operations System (Production Ready)..."

# Ensure .env exists
if [ ! -f .env ]; then
  echo "Creating .env from example..."
  cp .env.example .env
fi

# Stop any running containers
echo "Stopping existing containers..."
docker compose down

# Build and start containers with no cache to ensure fresh builds (especially for frontend)
echo "Building and starting services..."
docker compose up -d --build

echo "Waiting for Database to accept connections (10s)..."
sleep 10

# Run Migrations
echo "Running Database Migrations..."
docker compose exec backend npx prisma migrate dev --name init

echo "System Start Complete!"
echo "----------------------------------------"
echo "Frontend (Dashboard): http://localhost:80"
echo "Backend API:          http://localhost:3000"
echo "Agent Service:        http://localhost:8000"
echo "----------------------------------------"
echo "Logs available via: docker compose logs -f"