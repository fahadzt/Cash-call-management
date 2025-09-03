import { NextRequest, NextResponse } from 'next/server'
import { serviceRegistry } from '../services/service-registry'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function gatewayMiddleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const method = request.method
  const fullPath = pathname + search

  // Skip middleware for static files and API routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/api/gateway')) {
    return NextResponse.next()
  }

  // Health check endpoint
  if (pathname === '/health') {
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: serviceRegistry.getAllServices()
    })
  }

  // Maintenance mode endpoints
  if (pathname.startsWith('/maintenance/')) {
    return handleMaintenanceMode(request)
  }

  // Find the appropriate service for this route
  const route = serviceRegistry.findRoute(pathname, method)
  if (!route) {
    return NextResponse.json(
      { error: 'Route not found' },
      { status: 404 }
    )
  }

  const service = serviceRegistry.getService(route.service)
  if (!service) {
    return NextResponse.json(
      { error: 'Service not available' },
      { status: 503 }
    )
  }

  // Check if service is in maintenance mode
  if (serviceRegistry.isInMaintenanceMode(route.service)) {
    return NextResponse.json(
      { 
        error: 'Service temporarily unavailable',
        service: route.service,
        maintenance: true,
        estimatedRestore: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
      },
      { status: 503 }
    )
  }

  // Check if service is healthy
  if (service.health !== 'healthy') {
    return NextResponse.json(
      { 
        error: 'Service unavailable',
        service: route.service,
        health: service.health
      },
      { status: 503 }
    )
  }

  // Authentication check
  if (route.requiresAuth) {
    const authResult = await checkAuthentication(request)
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Role-based access control
    if (route.roles && route.roles.length > 0) {
      if (!route.roles.includes(authResult.userRole)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
    }
  }

  // Rate limiting (basic implementation)
  const rateLimitResult = await checkRateLimit(request)
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    )
  }

  // Proxy the request to the appropriate service
  return proxyRequest(request, service, route)
}

async function handleMaintenanceMode(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const method = request.method

  // Extract service name from path: /maintenance/{service-name}/enable|disable
  const parts = pathname.split('/')
  if (parts.length !== 4) {
    return NextResponse.json(
      { error: 'Invalid maintenance endpoint' },
      { status: 400 }
    )
  }

  const serviceName = parts[2]
  const action = parts[3]

  if (method !== 'POST') {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    )
  }

  if (action === 'enable') {
    serviceRegistry.enableMaintenanceMode(serviceName)
    return NextResponse.json({
      message: `Maintenance mode enabled for ${serviceName}`,
      service: serviceName,
      status: 'maintenance'
    })
  } else if (action === 'disable') {
    serviceRegistry.disableMaintenanceMode(serviceName)
    return NextResponse.json({
      message: `Maintenance mode disabled for ${serviceName}`,
      service: serviceName,
      status: 'healthy'
    })
  } else {
    return NextResponse.json(
      { error: 'Invalid action. Use "enable" or "disable"' },
      { status: 400 }
    )
  }
}

async function checkAuthentication(request: NextRequest): Promise<{
  authenticated: boolean
  userRole?: string
  userId?: string
}> {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return { authenticated: false }
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return {
      authenticated: true,
      userRole: decoded.role,
      userId: decoded.userId
    }
  } catch (error) {
    return { authenticated: false }
  }
}

async function checkRateLimit(request: NextRequest): Promise<{
  allowed: boolean
  remaining: number
}> {
  // Basic rate limiting - can be enhanced with Redis
  const clientIp = request.ip || 'unknown'
  const key = `rate_limit:${clientIp}`

  // For now, allow all requests (implement proper rate limiting in production)
  return {
    allowed: true,
    remaining: 100
  }
}

async function proxyRequest(
  request: NextRequest, 
  service: any, 
  route: any
): Promise<NextResponse> {
  const targetUrl = `http://${service.host}:${service.port}${request.nextUrl.pathname}${request.nextUrl.search}`
  
  try {
    const headers = new Headers(request.headers)
    
    // Add service-specific headers
    headers.set('X-Service-Name', route.service)
    headers.set('X-Gateway-Timestamp', new Date().toISOString())

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.body,
      signal: AbortSignal.timeout(30000) // 30 second timeout
    })

    const responseBody = await response.text()
    
    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    })
  } catch (error) {
    console.error(`Error proxying request to ${route.service}:`, error)
    
    return NextResponse.json(
      { 
        error: 'Service communication error',
        service: route.service,
        message: 'Unable to reach the service'
      },
      { status: 502 }
    )
  }
}

// Health check function for services
export async function checkServiceHealth() {
  await serviceRegistry.checkAllServicesHealth()
}

// Scheduled health checks
if (typeof window === 'undefined') {
  // Run health checks every 30 seconds in production
  setInterval(checkServiceHealth, 30000)
}
