'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/firebase-auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, Wifi, WifiOff, AlertCircle } from 'lucide-react'

interface FirebaseAuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function FirebaseAuthGuard({ children, fallback }: FirebaseAuthGuardProps) {
  const { user, loading } = useAuth()
  const [networkError, setNetworkError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    // Check for network connectivity
    const checkNetwork = () => {
      if (!navigator.onLine) {
        setNetworkError(true)
        return
      }

      // Test Firebase connectivity
      const testConnection = async () => {
        try {
          // Simple network test
          const response = await fetch('https://www.google.com', { 
            method: 'HEAD',
            mode: 'no-cors'
          })
          setNetworkError(false)
        } catch (error) {
          console.error('Network connectivity test failed:', error)
          setNetworkError(true)
        }
      }

      testConnection()
    }

    checkNetwork()

    // Listen for online/offline events
    const handleOnline = () => {
      setNetworkError(false)
      setRetryCount(0)
    }

    const handleOffline = () => {
      setNetworkError(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    setNetworkError(false)
    // Force a page reload to retry Firebase initialization
    window.location.reload()
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    )
  }

  // Show network error
  if (networkError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WifiOff className="h-5 w-5 text-red-500" />
              Network Connection Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unable to connect to Firebase services. This could be due to:
              </AlertDescription>
            </Alert>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• No internet connection</li>
              <li>• Firebase services are temporarily unavailable</li>
              <li>• Firewall blocking the connection</li>
              <li>• Emulator not running (if in development)</li>
            </ul>
            <div className="flex gap-2">
              <Button onClick={handleRetry} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Connection
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Reload Page
              </Button>
            </div>
            {retryCount > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                Retry attempt: {retryCount}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show fallback if no user and not loading
  if (!user && !loading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please sign in to access this page.
            </p>
            <Button onClick={() => window.location.href = '/login'}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show children if authenticated
  return <>{children}</>
} 