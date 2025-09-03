# Cash Call Management - Microservices Architecture

## 🏗️ Architecture Overview

This application is refactored into a microservices architecture to enable:
- **Independent deployment** of features
- **Selective maintenance** without full downtime
- **Scalable development** by different teams
- **Fault isolation** - one service failure doesn't affect others

## 📦 Service Structure

```
cash-call-management/
├── core/                    # Core shared services
│   ├── auth-service/        # Authentication & Authorization
│   ├── user-service/        # User management
│   └── shared-components/   # Common UI components
├── features/                # Feature-specific services
│   ├── dashboard-service/   # Dashboard & Analytics
│   ├── cash-call-service/   # Cash call management
│   ├── affiliate-service/   # Affiliate management
│   ├── document-service/    # Document upload/management
│   ├── notification-service/ # Notifications & alerts
│   └── reporting-service/   # Reports & analytics
├── gateway/                 # API Gateway & routing
└── shared/                  # Shared utilities & types
```

## 🔧 Service Details

### Core Services

#### 1. Auth Service (`core/auth-service/`)
- **Purpose**: Authentication, authorization, session management
- **Features**: Login, logout, role-based access, JWT tokens
- **Dependencies**: Firebase Auth, user-service
- **Port**: 3001

#### 2. User Service (`core/user-service/`)
- **Purpose**: User profile management, roles, permissions
- **Features**: User CRUD, role assignment, profile updates
- **Dependencies**: Firebase Firestore
- **Port**: 3002

#### 3. Shared Components (`core/shared-components/`)
- **Purpose**: Reusable UI components across services
- **Features**: Common components, themes, utilities
- **Dependencies**: None (standalone)
- **Port**: N/A (imported)

### Feature Services

#### 4. Dashboard Service (`features/dashboard-service/`)
- **Purpose**: Main dashboard, analytics, overview
- **Features**: KPI cards, charts, real-time metrics
- **Dependencies**: All other services
- **Port**: 3003

#### 5. Cash Call Service (`features/cash-call-service/`)
- **Purpose**: Cash call creation, management, workflow
- **Features**: CRUD operations, status management, assignments
- **Dependencies**: auth-service, user-service, affiliate-service
- **Port**: 3004

#### 6. Affiliate Service (`features/affiliate-service/`)
- **Purpose**: Affiliate company management
- **Features**: Affiliate CRUD, company profiles, relationships
- **Dependencies**: auth-service, user-service
- **Port**: 3005

#### 7. Document Service (`features/document-service/`)
- **Purpose**: Document upload, storage, management
- **Features**: File upload, storage, retrieval, permissions
- **Dependencies**: auth-service, cash-call-service
- **Port**: 3006

#### 8. Notification Service (`features/notification-service/`)
- **Purpose**: Real-time notifications, alerts, messaging
- **Features**: Push notifications, email alerts, in-app notifications
- **Dependencies**: All other services
- **Port**: 3007

#### 9. Reporting Service (`features/reporting-service/`)
- **Purpose**: Analytics, reports, data export
- **Features**: Charts, analytics, CSV export, insights
- **Dependencies**: All other services
- **Port**: 3008

### Infrastructure

#### 10. API Gateway (`gateway/`)
- **Purpose**: Route requests to appropriate services
- **Features**: Load balancing, authentication, rate limiting
- **Dependencies**: All services
- **Port**: 3000 (main entry point)

## 🚀 Deployment Strategy

### Development
- Each service runs independently on different ports
- Hot reloading for individual services
- Shared development database

### Production
- Containerized deployment (Docker)
- Kubernetes orchestration
- Independent scaling per service
- Service mesh for communication

## 🔄 Service Communication

### Internal Communication
- **REST APIs**: Service-to-service communication
- **Event Bus**: Real-time updates and notifications
- **Shared Database**: Firebase (with service-specific collections)

### External Communication
- **API Gateway**: Single entry point for all external requests
- **WebSocket**: Real-time features (notifications, live updates)

## 🛠️ Maintenance Strategy

### Individual Service Maintenance
```bash
# Put only dashboard service in maintenance
curl -X POST http://gateway:3000/maintenance/dashboard-service/enable

# Put only cash-call service in maintenance
curl -X POST http://gateway:3000/maintenance/cash-call-service/enable

# Check service status
curl http://gateway:3000/health
```

### Blue-Green Deployment
- Deploy new version alongside old version
- Switch traffic when ready
- Rollback capability

## 📊 Monitoring & Health Checks

### Health Endpoints
- `/health` - Basic health check
- `/health/detailed` - Detailed service status
- `/metrics` - Performance metrics

### Service Discovery
- Automatic service registration
- Load balancing
- Circuit breaker pattern

## 🔐 Security

### Authentication
- JWT tokens for service-to-service communication
- API keys for external services
- Role-based access control

### Data Isolation
- Service-specific database collections
- Encrypted communication
- Audit logging

## 📈 Scaling

### Horizontal Scaling
- Stateless services for easy scaling
- Database connection pooling
- Caching strategies

### Performance
- Service-specific caching
- CDN for static assets
- Database optimization per service
