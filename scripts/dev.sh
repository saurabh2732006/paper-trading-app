#!/bin/bash

# Development setup script for Paper Trading App

echo "🚀 Setting up Paper Trading App for development..."

# Check if yarn is installed
if ! command -v yarn &> /dev/null; then
    echo "❌ Yarn is not installed. Please install Yarn first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
yarn install

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
yarn prisma:generate

# Run database migrations
echo "🔄 Running database migrations..."
yarn prisma:migrate

# Seed the database
echo "🌱 Seeding database..."
yarn prisma:seed

echo "✅ Setup complete! You can now run 'yarn dev' to start the development servers."
echo ""
echo "📝 Available commands:"
echo "  yarn dev          - Start frontend and backend servers"
echo "  yarn test         - Run all tests"
echo "  yarn test:e2e     - Run E2E tests"
echo "  yarn lint         - Run linters"
echo "  yarn typecheck    - Run TypeScript checks"
echo "  yarn prisma:reset - Reset database"
echo ""
echo "🌐 URLs:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3001"
echo "  WebSocket: ws://localhost:3001/ws/prices"


