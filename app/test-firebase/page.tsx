'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase-auth-context'
import { getAffiliates, createCashCall } from '@/lib/firebase-database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function TestFirebasePage() {
  const { user, userProfile } = useAuth()
  const [testResults, setTestResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addTestResult = (test: string, status: 'success' | 'error', message: string, details?: any) => {
    setTestResults(prev => [...prev, {
      test,
      status,
      message,
      details,
      timestamp: new Date().toISOString()
    }])
  }

  const runTests = async () => {
    setIsLoading(true)
    setTestResults([])

    try {
      // Test 1: Authentication
      addTestResult(
        'Authentication',
        user ? 'success' : 'error',
        user ? `User authenticated: ${user.email}` : 'No user authenticated',
        { uid: user?.uid, email: user?.email }
      )

      // Test 2: User Profile
      addTestResult(
        'User Profile',
        userProfile ? 'success' : 'error',
        userProfile ? `Profile loaded: ${userProfile.role}` : 'No user profile loaded',
        userProfile
      )

      // Test 3: Read Affiliates
      try {
        const affiliates = await getAffiliates()
        addTestResult(
          'Read Affiliates',
          'success',
          `Successfully read ${affiliates.length} affiliates`,
          { count: affiliates.length, affiliates: affiliates.map(a => ({ id: a.id, name: a.name })) }
        )
      } catch (error: any) {
        addTestResult(
          'Read Affiliates',
          'error',
          `Failed to read affiliates: ${error.message}`,
          { error: error.message, code: error.code }
        )
      }

      // Test 4: Create Test Cash Call
      if (user && userProfile) {
        try {
          const testCashCallData = {
            call_number: `TEST-${Date.now()}`,
            affiliate_id: userProfile.affiliate_company_id || 'test-affiliate',
            amount_requested: 100,
            description: 'Test cash call for debugging',
            created_by: user.uid,
            status: 'draft' as const,
            currency: 'USD',
            exchange_rate: 1,
            priority: 'medium' as const,
            compliance_status: 'pending' as const,
          }

          const newCallId = await createCashCall(testCashCallData)
          addTestResult(
            'Create Cash Call',
            'success',
            `Successfully created test cash call: ${newCallId}`,
            { callId: newCallId, data: testCashCallData }
          )
        } catch (error: any) {
          addTestResult(
            'Create Cash Call',
            'error',
            `Failed to create cash call: ${error.message}`,
            { error: error.message, code: error.code }
          )
        }
      }

    } catch (error: any) {
      addTestResult(
        'General Test',
        'error',
        `Test failed: ${error.message}`,
        { error: error.message }
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[#0033A0]">Firebase Connection Test</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Firebase Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runTests} 
            disabled={isLoading}
            className="mb-4"
          >
            {isLoading ? 'Running Tests...' : 'Run Firebase Tests'}
          </Button>

          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div 
                key={index} 
                className={`p-4 border rounded-lg ${
                  result.status === 'success' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                    {result.status.toUpperCase()}
                  </Badge>
                  <span className="font-medium">{result.test}</span>
                </div>
                <p className="text-sm">{result.message}</p>
                {result.details && (
                  <details className="mt-2">
                    <summary className="text-sm cursor-pointer">View Details</summary>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div><strong>User:</strong> {user?.email || 'Not authenticated'}</div>
            <div><strong>Role:</strong> {userProfile?.role || 'Not loaded'}</div>
            <div><strong>Affiliate ID:</strong> {userProfile?.affiliate_company_id || 'Not set'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
