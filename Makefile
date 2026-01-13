# Q&A Generator Docker Management
# Usage: make [command]

.PHONY: help build up down restart logs clean dev prod health backup restore

# Default target
help:
	@echo "🐳 Q&A Generator Docker Commands"
	@echo ""
	@echo "Production Commands:"
	@echo "  make up          - Start all services in production mode"
	@echo "  make down        - Stop all services"
	@echo "  make restart     - Restart all services"
	@echo "  make build       - Build all images"
	@echo "  make logs        - Show logs for all services"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev         - Start in development mode with hot reload"
	@echo "  make dev-down    - Stop development services"
	@echo "  make dev-logs    - Show development logs"
	@echo ""
	@echo "Utility Commands:"
	@echo "  make health      - Check service health"
	@echo "  make clean       - Clean up containers and images"
	@echo "  make backup      - Backup database"
	@echo "  make restore     - Restore database from backup"
	@echo "  make shell       - Open shell in app container"
	@echo "  make db-shell    - Open PostgreSQL shell"
	@echo ""

# Production commands
up:
	@echo "🚀 Starting Q&A Generator in production mode..."
	docker-compose up -d
	@echo "✅ Services started! Visit http://localhost:9000"

down:
	@echo "🛑 Stopping all services..."
	docker-compose down

restart:
	@echo "🔄 Restarting all services..."
	docker-compose restart

build:
	@echo "🔨 Building all images..."
	docker-compose build --no-cache

logs:
	@echo "📋 Showing logs..."
	docker-compose logs -f

# Development commands
dev:
	@echo "🚀 Starting Q&A Generator in development mode..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
	@echo "✅ Development services started!"
	@echo "🌐 App: http://localhost:9000"
	@echo "🗄️  PgAdmin: http://localhost:5050 (admin@qa-generator.local / admin123)"
	@echo "🔴 Redis Commander: http://localhost:8081"

dev-down:
	@echo "🛑 Stopping development services..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

dev-logs:
	@echo "📋 Showing development logs..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

# Utility commands
health:
	@echo "🔍 Checking service health..."
	@docker-compose ps
	@echo ""
	@echo "🌐 Application health:"
	@curl -s http://localhost:9000/api/health | jq . || echo "❌ Application not responding"

clean:
	@echo "🧹 Cleaning up Docker resources..."
	docker-compose down -v --remove-orphans
	docker system prune -f
	@echo "✅ Cleanup complete"

backup:
	@echo "💾 Creating database backup..."
	@mkdir -p backups
	docker-compose exec postgres pg_dump -U qa_user qa_generator > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup created in backups/ directory"

restore:
	@echo "📥 Restoring database from backup..."
	@echo "Available backups:"
	@ls -la backups/*.sql 2>/dev/null || echo "No backups found"
	@read -p "Enter backup filename: " backup; \
	if [ -f "backups/$$backup" ]; then \
		docker-compose exec -T postgres psql -U qa_user -d qa_generator < "backups/$$backup"; \
		echo "✅ Database restored from $$backup"; \
	else \
		echo "❌ Backup file not found"; \
	fi

shell:
	@echo "🐚 Opening shell in app container..."
	docker-compose exec qa-generator sh

db-shell:
	@echo "🗄️  Opening PostgreSQL shell..."
	docker-compose exec postgres psql -U qa_user -d qa_generator

# Setup commands
setup:
	@echo "⚙️  Setting up Q&A Generator..."
	@if [ ! -f .env ]; then \
		cp .env.docker .env; \
		echo "📝 Created .env file from template"; \
		echo "⚠️  Please edit .env and add your API keys"; \
	fi
	@mkdir -p qa-generator/uploads
	@mkdir -p backups
	@echo "✅ Setup complete"

# Quick start
start: setup up

# Status check
status:
	@echo "📊 Service Status:"
	@docker-compose ps
	@echo ""
	@echo "💾 Volume Usage:"
	@docker system df
	@echo ""
	@echo "🌐 Network Info:"
	@docker network ls | grep qa-network || echo "Network not found"
