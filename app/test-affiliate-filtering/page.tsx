'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase-auth-context'
import { getCashCallsForUser, getAffiliates, createCashCall } from '@/lib/firebase-database'

export default function TestAffiliateFiltering() {
  const { user, userProfile } = useAuth()
  const [cashCalls, setCashCalls] = useState<any[]>([])
  const [allCashCalls, setAllCashCalls] = useState<any[]>([])
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [testResult, setTestResult] = useState<string>('')

  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid || !userProfile) {
        setError('User not authenticated')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')

        // Load affiliates
        const affiliatesData = await getAffiliates()
        setAffiliates(affiliatesData)

        // Load cash calls for current user (filtered by role)
        const userCashCalls = await getCashCallsForUser(
          user.uid, 
          userProfile.role || 'viewer', 
          userProfile.affiliate_company_id
        )
        setCashCalls(userCashCalls)

        // Load all cash calls (for comparison)
        const { getCashCalls } = await import('@/lib/firebase-database')
        const allCashCallsData = await getCashCalls()
        setAllCashCalls(allCashCallsData)

        console.log('Test data loaded:', {
          userRole: userProfile.role,
          userAffiliateId: userProfile.affiliate_company_id,
          userCashCallsCount: userCashCalls.length,
          allCashCallsCount: allCashCallsData.length,
          userCashCalls: userCashCalls.map(cc => ({ 
            id: cc.id, 
            affiliate_id: cc.affiliate_id, 
            call_number: cc.call_number 
          })),
          allCashCalls: allCashCallsData.map(cc => ({ 
            id: cc.id, 
            affiliate_id: cc.affiliate_id, 
            call_number: cc.call_number 
          }))
        })

      } catch (err) {
        console.error('Error loading test data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, userProfile])

  const runFilteringTest = () => {
    if (!userProfile) {
      setTestResult('❌ No user profile available')
      return
    }

    const userRole = userProfile.role
    const userAffiliateId = userProfile.affiliate_company_id

    console.log('Running filtering test:', {
      userRole,
      userAffiliateId,
      userCashCallsCount: cashCalls.length,
      allCashCallsCount: allCashCalls.length
    })

    if (userRole === 'admin' || userRole === 'approver') {
      // Admins and approvers should see all cash calls
      if (cashCalls.length === allCashCalls.length) {
        setTestResult('✅ PASS: Admin/Approver can see all cash calls')
      } else {
        setTestResult(`❌ FAIL: Admin/Approver should see all cash calls. Expected: ${allCashCalls.length}, Got: ${cashCalls.length}`)
      }
    } else if (userRole === 'affiliate') {
      // Affiliate users should only see their company's cash calls
      if (!userAffiliateId) {
        setTestResult('❌ FAIL: Affiliate user has no affiliate_company_id assigned')
        return
      }

      const expectedCashCalls = allCashCalls.filter(cc => cc.affiliate_id === userAffiliateId)
      const actualCashCalls = cashCalls.filter(cc => cc.affiliate_id === userAffiliateId)

      if (cashCalls.length === expectedCashCalls.length && actualCashCalls.length === expectedCashCalls.length) {
        setTestResult(`✅ PASS: Affiliate user can only see their company's cash calls (${expectedCashCalls.length} cash calls)`)
      } else {
        setTestResult(`❌ FAIL: Affiliate filtering not working correctly. Expected: ${expectedCashCalls.length}, Got: ${cashCalls.length}`)
      }
    } else {
      // Viewers should see all cash calls
      if (cashCalls.length === allCashCalls.length) {
        setTestResult('✅ PASS: Viewer can see all cash calls')
      } else {
        setTestResult(`❌ FAIL: Viewer should see all cash calls. Expected: ${allCashCalls.length}, Got: ${cashCalls.length}`)
      }
    }
  }

  const createTestCashCall = async () => {
    if (!user?.uid || !userProfile) {
      setError('User not authenticated')
      return
    }

    try {
      setError('')

      // Get first affiliate for testing
      if (affiliates.length === 0) {
        setError('No affiliates available for testing')
        return
      }

      const testAffiliate = affiliates[0]
      const testData = {
        call_number: `TEST-${Date.now()}`,
        affiliate_id: testAffiliate.id,
        amount_requested: 1000,
        description: 'Test cash call for filtering verification',
        created_by: user.uid,
        status: 'draft' as const,
        currency: 'USD',
        exchange_rate: 1,
        priority: 'medium' as const,
        compliance_status: 'pending' as const,
      }

      console.log('Creating test cash call:', testData)

      const newCallId = await createCashCall(testData)
      
      console.log('Test cash call created successfully:', newCallId)
      
      // Reload data to see the new cash call
      window.location.reload()
      
    } catch (err) {
      console.error('Error creating test cash call:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const getUserAffiliateName = () => {
    if (!userProfile?.affiliate_company_id) return 'None'
    const affiliate = affiliates.find(a => a.id === userProfile.affiliate_company_id)
    return affiliate ? `${affiliate.name} (${affiliate.company_code})` : 'Unknown'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Affiliate Filtering Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Information */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">User Information</h2>
            
            {loading ? (
              <p>Loading user data...</p>
            ) : userProfile ? (
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Role:</span>
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    {userProfile.role || 'unknown'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Email:</span>
                  <span className="ml-2">{userProfile.email}</span>
                </div>
                <div>
                  <span className="font-medium">Affiliate Company:</span>
                  <span className="ml-2">{getUserAffiliateName()}</span>
                </div>
                <div>
                  <span className="font-medium">Affiliate ID:</span>
                  <span className="ml-2 font-mono text-sm">{userProfile.affiliate_company_id || 'None'}</span>
                </div>
              </div>
            ) : (
              <p className="text-red-600">No user profile available</p>
            )}
          </div>

          {/* Test Results */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Filtering Test</h2>
            
            <div className="space-y-4">
              <div>
                <span className="font-medium">Cash Calls Visible:</span>
                <span className="ml-2 text-lg font-bold">{cashCalls.length}</span>
              </div>
              <div>
                <span className="font-medium">Total Cash Calls:</span>
                <span className="ml-2 text-lg font-bold">{allCashCalls.length}</span>
              </div>
              
              <button
                onClick={runFilteringTest}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Run Filtering Test
              </button>
              
              {testResult && (
                <div className={`p-3 rounded-lg ${
                  testResult.startsWith('✅') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={testResult.startsWith('✅') ? 'text-green-800' : 'text-red-800'}>
                    {testResult}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cash Calls List */}
        <div className="mt-6 bg-white rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Cash Calls Visible to User</h2>
            <button
              onClick={createTestCashCall}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Create Test Cash Call
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
              <h3 className="text-red-800 font-semibold">Error:</h3>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          )}

          {loading ? (
            <p>Loading cash calls...</p>
          ) : cashCalls.length > 0 ? (
            <div className="space-y-3">
              {cashCalls.map((cashCall) => {
                const affiliate = affiliates.find(a => a.id === cashCall.affiliate_id)
                return (
                  <div key={cashCall.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{cashCall.call_number}</h3>
                        <p className="text-sm text-gray-600">Amount: ${cashCall.amount_requested}</p>
                        <p className="text-sm text-gray-600">Affiliate: {affiliate?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-600">Status: {cashCall.status}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                          {cashCall.affiliate_id}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-600">No cash calls visible to this user.</p>
          )}
        </div>

        {/* Debug Information */}
        <div className="mt-6 bg-gray-100 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <div className="text-sm font-mono space-y-2">
            <div>User Role: {userProfile?.role || 'unknown'}</div>
            <div>User Affiliate ID: {userProfile?.affiliate_company_id || 'None'}</div>
            <div>Visible Cash Calls: {cashCalls.length}</div>
            <div>Total Cash Calls: {allCashCalls.length}</div>
            <div>Available Affiliates: {affiliates.length}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
