'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/firebase-auth-context'
import { getAffiliates, createCashCall } from '@/lib/firebase-database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SimpleTestPage() {
  const { user, userProfile } = useAuth()
  const [testResult, setTestResult] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const testFirebase = async () => {
    setIsLoading(true)
    setTestResult('Testing...')

    try {
      // Test 1: Read affiliates
      const affiliates = await getAffiliates()
      setTestResult(`✅ Success! Read ${affiliates.length} affiliates`)

      // Test 2: Create a test cash call
      if (user && userProfile) {
        const testData = {
          call_number: `TEST-${Date.now()}`,
          affiliate_id: userProfile.affiliate_company_id || 'cntxt-003',
          amount_requested: 100,
          description: 'Test cash call',
          created_by: user.uid,
          status: 'draft' as const,
          currency: 'USD',
          exchange_rate: 1,
          priority: 'medium' as const,
          compliance_status: 'pending' as const,
        }

        const callId = await createCashCall(testData)
        setTestResult(`✅ SUCCESS! Created cash call with ID: ${callId}`)
      } else {
        setTestResult('❌ User not authenticated or profile not loaded')
      }
    } catch (error: any) {
      setTestResult(`❌ ERROR: ${error.message}`)
      console.error('Test error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Firebase Test (After Rules Deployment)</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div><strong>User:</strong> {user?.email || 'Not logged in'}</div>
            <div><strong>Role:</strong> {userProfile?.role || 'Not loaded'}</div>
            <div><strong>Affiliate ID:</strong> {userProfile?.affiliate_company_id || 'Not set'}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Firebase Test</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={testFirebase} 
            disabled={isLoading}
            className="mb-4"
          >
            {isLoading ? 'Testing...' : 'Test Firebase Connection'}
          </Button>
          
          <div className="p-4 bg-gray-100 rounded">
            <strong>Result:</strong> {testResult}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 