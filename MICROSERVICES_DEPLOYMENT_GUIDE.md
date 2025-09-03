# Cash Call Management - Microservices Deployment Guide

## 🏗️ Architecture Overview

The application has been refactored into a microservices architecture with the following benefits:

- **Independent Deployment**: Deploy individual services without affecting others
- **Selective Maintenance**: Put specific features in maintenance mode
- **Fault Isolation**: One service failure doesn't bring down the entire application
- **Scalability**: Scale services independently based on demand
- **Team Development**: Different teams can work on different services

## 📦 Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │  Auth Service   │    │  User Service   │
│   (Port 3000)   │    │  (Port 3001)    │    │  (Port 3002)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│Dashboard Service│    │Cash Call Service│    │Affiliate Service│
│  (Port 3003)    │    │  (Port 3004)    │    │  (Port 3005)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│Document Service │    │Notification Svc │    │Reporting Service│
│  (Port 3006)    │    │  (Port 3007)    │    │  (Port 3008)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Development Setup

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Docker (for production deployment)

### Quick Start

1. **Clone and setup**:
```bash
git clone <repository>
cd cash-call-management
```

2. **Start all services**:
```bash
./scripts/start-microservices.sh start
```

3. **Check service status**:
```bash
./scripts/start-microservices.sh status
```

4. **View logs**:
```bash
./scripts/start-microservices.sh logs dashboard-service
```

## 🛠️ Maintenance Management

### Put a Service in Maintenance Mode

```bash
# Enable maintenance mode for dashboard service
./scripts/maintenance-manager.sh enable dashboard-service

# Disable maintenance mode
./scripts/maintenance-manager.sh disable dashboard-service

# Check all service status
./scripts/maintenance-manager.sh status
```

### Available Services for Maintenance
- `auth-service`
- `user-service`
- `dashboard-service`
- `cash-call-service`
- `affiliate-service`
- `document-service`
- `notification-service`
- `reporting-service`

## 🐳 Production Deployment

### Using Docker Compose

1. **Build and start all services**:
```bash
docker-compose up -d
```

2. **Check service health**:
```bash
curl http://localhost:3000/health
```

3. **View logs**:
```bash
docker-compose logs -f gateway
docker-compose logs -f dashboard-service
```

### Using Kubernetes

1. **Create namespace**:
```bash
kubectl create namespace cash-call-management
```

2. **Deploy services**:
```bash
kubectl apply -f k8s/ -n cash-call-management
```

3. **Check deployment status**:
```bash
kubectl get pods -n cash-call-management
```

## 🔧 Service Configuration

### Environment Variables

Each service can be configured with environment variables:

```bash
# Gateway
JWT_SECRET=your-secret-key
NODE_ENV=production

# Services
PORT=3001-3008
NODE_ENV=production
FIREBASE_PROJECT_ID=your-project-id
```

### Health Check Endpoints

All services expose health check endpoints:

```bash
# Check individual service health
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # User Service
curl http://localhost:3003/health  # Dashboard Service
# ... etc

# Check all services via gateway
curl http://localhost:3000/health
```

## 📊 Monitoring & Observability

### Service Health Monitoring

The API Gateway automatically monitors service health:

```bash
# Get detailed health status
curl http://localhost:3000/health | jq

# Response example:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": [
    {
      "name": "auth-service",
      "port": 3001,
      "health": "healthy",
      "lastCheck": "2024-01-15T10:29:55.000Z"
    }
  ]
}
```

### Logs Management

```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f dashboard-service

# In development
./scripts/start-microservices.sh logs dashboard-service
```

## 🔐 Security

### Authentication & Authorization

- **JWT Tokens**: Used for service-to-service communication
- **Role-based Access**: Each endpoint can require specific roles
- **API Gateway**: Centralized authentication and authorization

### Service Communication

```bash
# Internal service communication (via gateway)
curl -H "Authorization: Bearer <jwt-token>" \
     http://localhost:3000/dashboard

# Direct service access (for debugging)
curl http://localhost:3003/dashboard
```

## 📈 Scaling

### Horizontal Scaling

```bash
# Scale specific services
docker-compose up -d --scale dashboard-service=3
docker-compose up -d --scale cash-call-service=2

# In Kubernetes
kubectl scale deployment dashboard-service --replicas=3 -n cash-call-management
```

### Load Balancing

The API Gateway automatically load balances requests across multiple instances of the same service.

## 🚨 Troubleshooting

### Common Issues

1. **Service not starting**:
```bash
# Check if port is available
lsof -i :3003

# Check service logs
./scripts/start-microservices.sh logs dashboard-service
```

2. **Service in maintenance mode**:
```bash
# Check maintenance status
./scripts/maintenance-manager.sh status

# Disable maintenance mode
./scripts/maintenance-manager.sh disable dashboard-service
```

3. **Gateway connection issues**:
```bash
# Check gateway health
curl http://localhost:3000/health

# Check service connectivity
curl http://localhost:3003/health
```

### Debug Commands

```bash
# Show all running services
./scripts/start-microservices.sh status

# Restart all services
./scripts/start-microservices.sh restart

# View real-time logs
./scripts/start-microservices.sh logs gateway
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy Microservices

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build and push Docker images
        run: |
          docker-compose build
          docker-compose push
      
      - name: Deploy to production
        run: |
          docker-compose -f docker-compose.prod.yml up -d
```

## 📋 Service Dependencies

### Dependency Matrix

| Service | Depends On | Port |
|---------|------------|------|
| Gateway | All services | 3000 |
| Auth Service | None | 3001 |
| User Service | Auth Service | 3002 |
| Dashboard Service | All services | 3003 |
| Cash Call Service | Auth, User, Affiliate | 3004 |
| Affiliate Service | Auth, User | 3005 |
| Document Service | Auth, Cash Call | 3006 |
| Notification Service | All services | 3007 |
| Reporting Service | All services | 3008 |

## 🎯 Best Practices

### Development
1. **Start with Gateway**: Always start the API Gateway first
2. **Health Checks**: Use health endpoints to verify service status
3. **Logs**: Monitor logs for debugging and troubleshooting
4. **Maintenance Mode**: Use maintenance mode for safe deployments

### Production
1. **Monitoring**: Set up proper monitoring and alerting
2. **Backup**: Regular backups of service configurations
3. **Security**: Use proper JWT secrets and environment variables
4. **Scaling**: Monitor performance and scale services as needed

## 📞 Support

For issues and questions:
1. Check service logs first
2. Verify service health endpoints
3. Check maintenance mode status
4. Review this documentation

---

**Note**: This microservices architecture provides maximum flexibility for maintenance and deployment while maintaining system reliability and scalability.
