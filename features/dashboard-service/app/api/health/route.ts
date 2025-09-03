import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    service: 'dashboard-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: [
      '/dashboard',
      '/dashboard/analytics',
      '/api/health'
    ]
  })
}
