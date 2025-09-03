"use client"

import { ReactNode } from "react"
import { useAuth } from "@/lib/firebase-auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Lock, AlertTriangle } from "lucide-react"

interface SecurityGuardProps {
  children: ReactNode
  requiredRoles?: string[]
  requiredPermissions?: string[]
  fallback?: ReactNode
  showAlert?: boolean
}

export function SecurityGuard({ 
  children, 
  requiredRoles = [], 
  requiredPermissions = [], 
  fallback,
  showAlert = true 
}: SecurityGuardProps) {
  const { user, userProfile, isLoading } = useAuth()

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0033A0]"></div>
      </div>
    )
  }

  // Check if user is authenticated
  if (!user || !userProfile) {
    return showAlert ? (
      <Alert className="border-red-200 bg-red-50">
        <Lock className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          You must be logged in to access this resource.
        </AlertDescription>
      </Alert>
    ) : null
  }

  // Check if user is active
  if (!userProfile.is_active) {
    return showAlert ? (
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          Your account has been deactivated. Please contact your administrator.
        </AlertDescription>
      </Alert>
    ) : null
  }

  // Check role requirements
  if (requiredRoles.length > 0 && !requiredRoles.includes(userProfile.role)) {
    return showAlert ? (
      <Alert className="border-red-200 bg-red-50">
        <Shield className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          You don't have the required role to access this resource. 
          Required roles: {requiredRoles.join(", ")}
        </AlertDescription>
      </Alert>
    ) : fallback || null
  }

  // Check permission requirements (future enhancement)
  if (requiredPermissions.length > 0) {
    // TODO: Implement permission checking logic
    const hasPermissions = true // Placeholder
    if (!hasPermissions) {
      return showAlert ? (
        <Alert className="border-red-200 bg-red-50">
          <Shield className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            You don't have the required permissions to access this resource.
          </AlertDescription>
        </Alert>
      ) : fallback || null
    }
  }

  return <>{children}</>
}

// Convenience components for common role checks
export function AdminOnly({ children, ...props }: Omit<SecurityGuardProps, 'requiredRoles'>) {
  return (
    <SecurityGuard requiredRoles={['admin']} {...props}>
      {children}
    </SecurityGuard>
  )
}

export function FinanceOnly({ children, ...props }: Omit<SecurityGuardProps, 'requiredRoles'>) {
  return (
    <SecurityGuard requiredRoles={['finance', 'admin']} {...props}>
      {children}
    </SecurityGuard>
  )
}

export function AffiliateOnly({ children, ...props }: Omit<SecurityGuardProps, 'requiredRoles'>) {
  return (
    <SecurityGuard requiredRoles={['affiliate']} {...props}>
      {children}
    </SecurityGuard>
  )
}

export function AuthenticatedOnly({ children, ...props }: Omit<SecurityGuardProps, 'requiredRoles'>) {
  return (
    <SecurityGuard {...props}>
      {children}
    </SecurityGuard>
  )
}
