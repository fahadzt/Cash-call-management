export interface ServiceInfo {
  name: string
  port: number
  host: string
  health: 'healthy' | 'unhealthy' | 'maintenance'
  lastCheck: Date
  endpoints: string[]
}

export interface ServiceRoute {
  path: string
  service: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  requiresAuth: boolean
  roles?: string[]
}

class ServiceRegistry {
  private services: Map<string, ServiceInfo> = new Map()
  private routes: ServiceRoute[] = []
  private maintenanceMode: Set<string> = new Set()

  constructor() {
    this.initializeServices()
    this.initializeRoutes()
  }

  private initializeServices() {
    // Core Services
    this.registerService({
      name: 'auth-service',
      port: 3001,
      host: 'localhost',
      health: 'healthy',
      lastCheck: new Date(),
      endpoints: ['/auth/*', '/login', '/logout', '/verify']
    })

    this.registerService({
      name: 'user-service',
      port: 3002,
      host: 'localhost',
      health: 'healthy',
      lastCheck: new Date(),
      endpoints: ['/users/*', '/profiles/*']
    })

    // Feature Services
    this.registerService({
      name: 'dashboard-service',
      port: 3003,
      host: 'localhost',
      health: 'healthy',
      lastCheck: new Date(),
      endpoints: ['/dashboard/*', '/analytics/*']
    })

    this.registerService({
      name: 'cash-call-service',
      port: 3004,
      host: 'localhost',
      health: 'healthy',
      lastCheck: new Date(),
      endpoints: ['/cash-calls/*', '/cash-call/*']
    })

    this.registerService({
      name: 'affiliate-service',
      port: 3005,
      host: 'localhost',
      health: 'healthy',
      lastCheck: new Date(),
      endpoints: ['/affiliates/*', '/affiliate/*']
    })

    this.registerService({
      name: 'document-service',
      port: 3006,
      host: 'localhost',
      health: 'healthy',
      lastCheck: new Date(),
      endpoints: ['/documents/*', '/upload/*']
    })

    this.registerService({
      name: 'notification-service',
      port: 3007,
      host: 'localhost',
      health: 'healthy',
      lastCheck: new Date(),
      endpoints: ['/notifications/*', '/alerts/*']
    })

    this.registerService({
      name: 'reporting-service',
      port: 3008,
      host: 'localhost',
      health: 'healthy',
      lastCheck: new Date(),
      endpoints: ['/reports/*', '/analytics/*']
    })
  }

  private initializeRoutes() {
    // Auth routes
    this.addRoute('/auth/login', 'auth-service', 'POST', false)
    this.addRoute('/auth/logout', 'auth-service', 'POST', true)
    this.addRoute('/auth/verify', 'auth-service', 'GET', true)

    // User routes
    this.addRoute('/users', 'user-service', 'GET', true, ['admin'])
    this.addRoute('/users/:id', 'user-service', 'GET', true)
    this.addRoute('/users/:id', 'user-service', 'PUT', true)
    this.addRoute('/profiles/:id', 'user-service', 'GET', true)

    // Dashboard routes
    this.addRoute('/dashboard', 'dashboard-service', 'GET', true)
    this.addRoute('/dashboard/analytics', 'dashboard-service', 'GET', true)

    // Cash call routes
    this.addRoute('/cash-calls', 'cash-call-service', 'GET', true)
    this.addRoute('/cash-calls', 'cash-call-service', 'POST', true)
    this.addRoute('/cash-calls/:id', 'cash-call-service', 'GET', true)
    this.addRoute('/cash-calls/:id', 'cash-call-service', 'PUT', true)
    this.addRoute('/cash-calls/:id', 'cash-call-service', 'DELETE', true, ['admin'])

    // Affiliate routes
    this.addRoute('/affiliates', 'affiliate-service', 'GET', true)
    this.addRoute('/affiliates', 'affiliate-service', 'POST', true, ['admin'])
    this.addRoute('/affiliates/:id', 'affiliate-service', 'GET', true)
    this.addRoute('/affiliates/:id', 'affiliate-service', 'PUT', true, ['admin'])

    // Document routes
    this.addRoute('/documents/upload', 'document-service', 'POST', true)
    this.addRoute('/documents/:id', 'document-service', 'GET', true)
    this.addRoute('/documents/:id', 'document-service', 'DELETE', true)

    // Notification routes
    this.addRoute('/notifications', 'notification-service', 'GET', true)
    this.addRoute('/notifications', 'notification-service', 'POST', true)
    this.addRoute('/notifications/:id', 'notification-service', 'PUT', true)

    // Reporting routes
    this.addRoute('/reports', 'reporting-service', 'GET', true, ['admin', 'finance'])
    this.addRoute('/reports/analytics', 'reporting-service', 'GET', true, ['admin', 'finance'])
    this.addRoute('/reports/export', 'reporting-service', 'GET', true, ['admin', 'finance'])
  }

  registerService(service: ServiceInfo) {
    this.services.set(service.name, service)
  }

  addRoute(path: string, service: string, method: string, requiresAuth: boolean, roles?: string[]) {
    this.routes.push({
      path,
      service,
      method: method as any,
      requiresAuth,
      roles
    })
  }

  getService(name: string): ServiceInfo | undefined {
    return this.services.get(name)
  }

  getAllServices(): ServiceInfo[] {
    return Array.from(this.services.values())
  }

  findRoute(path: string, method: string): ServiceRoute | undefined {
    return this.routes.find(route => {
      const pathMatch = this.matchPath(route.path, path)
      const methodMatch = route.method === method || route.method === 'GET'
      return pathMatch && methodMatch
    })
  }

  private matchPath(pattern: string, path: string): boolean {
    // Simple path matching - can be enhanced with regex
    const patternParts = pattern.split('/')
    const pathParts = path.split('/')

    if (patternParts.length !== pathParts.length) {
      return false
    }

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        continue // Parameter match
      }
      if (patternParts[i] !== pathParts[i]) {
        return false
      }
    }

    return true
  }

  setServiceHealth(name: string, health: 'healthy' | 'unhealthy' | 'maintenance') {
    const service = this.services.get(name)
    if (service) {
      service.health = health
      service.lastCheck = new Date()
      this.services.set(name, service)
    }
  }

  enableMaintenanceMode(serviceName: string) {
    this.maintenanceMode.add(serviceName)
    this.setServiceHealth(serviceName, 'maintenance')
  }

  disableMaintenanceMode(serviceName: string) {
    this.maintenanceMode.delete(serviceName)
    this.setServiceHealth(serviceName, 'healthy')
  }

  isInMaintenanceMode(serviceName: string): boolean {
    return this.maintenanceMode.has(serviceName)
  }

  getHealthyServices(): ServiceInfo[] {
    return Array.from(this.services.values()).filter(service => service.health === 'healthy')
  }

  async checkServiceHealth(serviceName: string): Promise<boolean> {
    const service = this.services.get(serviceName)
    if (!service) return false

    try {
      const response = await fetch(`http://${service.host}:${service.port}/health`, {
        method: 'GET',
        timeout: 5000
      })
      
      const isHealthy = response.ok
      this.setServiceHealth(serviceName, isHealthy ? 'healthy' : 'unhealthy')
      return isHealthy
    } catch (error) {
      this.setServiceHealth(serviceName, 'unhealthy')
      return false
    }
  }

  async checkAllServicesHealth(): Promise<void> {
    const promises = Array.from(this.services.keys()).map(serviceName => 
      this.checkServiceHealth(serviceName)
    )
    await Promise.allSettled(promises)
  }
}

export const serviceRegistry = new ServiceRegistry()
