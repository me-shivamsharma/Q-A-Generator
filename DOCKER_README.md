# 🐳 Docker Setup for Q&A Generator

This guide will help you run the complete Q&A Generator stack using Docker Compose, including PostgreSQL, Redis, and the application itself.

## 📋 Prerequisites

- **Docker Desktop** (recommended) or Docker Engine + Docker Compose
- **Git** (to clone the repository)
- **API Keys** for Gemini AI and/or OpenAI

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# If you haven't already cloned the repository
git clone <your-repo-url>
cd "Q&A gen"
```

### 2. Configure Environment

```bash
# Copy the environment template
cp .env.docker .env

# Edit the .env file and add your API keys
nano .env  # or use your preferred editor
```

**Required API Keys:**
- `GEMINI_API_KEY` - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- `OPENAI_API_KEY` - Get from [OpenAI Platform](https://platform.openai.com/api-keys)

### 3. Start the Stack

```bash
# Option 1: Use the startup script (recommended)
./start-docker.sh

# Option 2: Manual Docker Compose
docker-compose up --build -d
```

### 4. Access the Application

- **Q&A Generator**: http://localhost:9000
- **PostgreSQL**: localhost:5432 (user: `qa_user`, password: `qa_password_2024`, db: `qa_generator`)
- **Redis**: localhost:6379

## 🏗️ Architecture

The Docker Compose setup includes:

### Services

1. **PostgreSQL Database** (`postgres`)
   - Image: `postgres:15-alpine`
   - Port: `5432`
   - Database: `qa_generator`
   - Auto-initializes with schema

2. **Redis Cache** (`redis`)
   - Image: `redis:7-alpine`
   - Port: `6379`
   - Persistent storage
   - Memory limit: 256MB

3. **Q&A Generator App** (`qa-generator`)
   - Built from local Dockerfile
   - Port: `9000` (mapped to container port `8080`)
   - Health checks enabled
   - Persistent uploads directory

### Networks & Volumes

- **Network**: `qa-network` (bridge)
- **Volumes**: 
  - `postgres_data` - Database persistence
  - `redis_data` - Redis persistence
  - `./qa-generator/uploads` - File uploads

## 🛠️ Management Commands

### Basic Operations
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f qa-generator
```

### Development
```bash
# Rebuild and restart
docker-compose up --build -d

# Execute commands in containers
docker-compose exec qa-generator sh
docker-compose exec postgres psql -U qa_user -d qa_generator

# Check service health
docker-compose ps
```

### Database Management
```bash
# Access PostgreSQL
docker-compose exec postgres psql -U qa_user -d qa_generator

# Backup database
docker-compose exec postgres pg_dump -U qa_user qa_generator > backup.sql

# Restore database
docker-compose exec -T postgres psql -U qa_user -d qa_generator < backup.sql
```

## 🔧 Configuration

### Environment Variables

Key environment variables in `.env`:

```env
# Required API Keys
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key

# Database (auto-configured)
DATABASE_URL=postgresql://qa_user:qa_password_2024@postgres:5432/qa_generator

# Redis (auto-configured)
REDIS_URL=redis://redis:6379

# Security
JWT_SECRET=your-super-secret-jwt-key-for-docker-compose-2024
NEXTAUTH_SECRET=your-nextauth-secret-key-for-docker-compose-2024
```

### Customization

To customize the setup:

1. **Change ports**: Edit `docker-compose.yml` ports section
2. **Database credentials**: Update environment variables in `docker-compose.yml`
3. **Resource limits**: Add resource constraints to services
4. **Additional services**: Add new services to `docker-compose.yml`

## 🔍 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using the ports
   lsof -i :9000
   lsof -i :5432
   lsof -i :6379
   ```

2. **Permission issues**
   ```bash
   # Fix uploads directory permissions
   sudo chown -R $USER:$USER qa-generator/uploads
   ```

3. **Database connection issues**
   ```bash
   # Check PostgreSQL logs
   docker-compose logs postgres
   
   # Test database connection
   docker-compose exec postgres pg_isready -U qa_user
   ```

4. **Application not starting**
   ```bash
   # Check application logs
   docker-compose logs qa-generator
   
   # Check health status
   curl http://localhost:9000/api/health
   ```

### Health Checks

The setup includes health checks for all services:

```bash
# Check all service health
docker-compose ps

# Manual health check
curl http://localhost:9000/api/health
```

## 📊 Monitoring

### Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f qa-generator

# Last N lines
docker-compose logs --tail=50 qa-generator
```

### Resource Usage
```bash
# Container stats
docker stats

# Disk usage
docker system df
```

## 🧹 Cleanup

### Stop and Remove
```bash
# Stop services
docker-compose down

# Remove volumes (⚠️ This will delete all data)
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

### System Cleanup
```bash
# Clean up unused Docker resources
docker system prune -a
```

## 🔒 Security Notes

- Default passwords are for development only
- Change all secrets in production
- Use Docker secrets for sensitive data in production
- Consider using a reverse proxy (nginx) for production
- Enable SSL/TLS for production deployments

## 📞 Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify health checks: `docker-compose ps`
3. Test API endpoints: `curl http://localhost:9000/api/health`
4. Check environment variables: `docker-compose config`

For more help, refer to the main application documentation or create an issue in the repository.
