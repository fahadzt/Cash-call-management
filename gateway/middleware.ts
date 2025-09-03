import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { gatewayMiddleware } from './src/middleware/gateway-middleware'

export function middleware(request: NextRequest) {
  return gatewayMiddleware(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
