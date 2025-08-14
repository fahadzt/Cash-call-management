'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase-auth-context'
import { getCashCallsForUser, getAffiliates, createCashCall } from '@/lib/firebase-database'

export default function SimpleCashCallTest() {
  const { user, userProfile } = useAuth()
  const [cashCalls, setCashCalls] = useState<any[]>([])
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [result, setResult] = useState<string>('')

  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid || !userProfile) {
        setError('Please log in first')
        return
      }

      try {
        setLoading(true)
        setError('')

        console.log('=== USER INFO ===')
        console.log('User ID:', user.uid)
        console.log('User Email:', userProfile.email)
        console.log('User Role:', userProfile.role)
        console.log('Affiliate Company ID:', userProfile.affiliate_company_id)

        // Load affiliates
        const affiliatesData = await getAffiliates()
        setAffiliates(affiliatesData)
        console.log('=== AFFILIATES ===')
        console.log('Total affiliates:', affiliatesData.length)
        affiliatesData.forEach(aff => {
          console.log(`- ${aff.name} (${aff.company_code}): ${aff.id}`)
        })

        // Load cash calls
        const userCashCalls = await getCashCallsForUser(
          user.uid, 
          userProfile.role || 'viewer', 
          userProfile.affiliate_company_id
        )
        setCashCalls(userCashCalls)
        console.log('=== CASH CALLS ===')
        console.log('Total cash calls visible:', userCashCalls.length)
        userCashCalls.forEach(cc => {
          console.log(`- ${cc.call_number}: $${cc.amount_requested} (${cc.affiliate_id})`)
        })

      } catch (err) {
        console.error('Error loading data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, userProfile])

  const createTestCashCall = async () => {
    if (!user?.uid || !userProfile) {
      setError('Please log in first')
      return
    }

    try {
      setLoading(true)
      setError('')
      setResult('')

      console.log('=== CREATING TEST CASH CALL ===')

      // Get first affiliate
      if (affiliates.length === 0) {
        setError('No affiliates found')
        return
      }

      const testAffiliate = affiliates[0]
      console.log('Using affiliate:', testAffiliate)

      const testData = {
        call_number: `TEST-${Date.now()}`,
        affiliate_id: testAffiliate.id,
        amount_requested: 1000,
        description: 'Simple test cash call',
        created_by: user.uid,
        status: 'draft' as const,
        currency: 'USD',
        exchange_rate: 1,
        priority: 'medium' as const,
        compliance_status: 'pending' as const,
      }

      console.log('Creating cash call with data:', testData)

      const newCallId = await createCashCall(testData)
      
      console.log('✅ Cash call created successfully with ID:', newCallId)
      setResult(`✅ Cash call created successfully! ID: ${newCallId}`)
      
      // Reload data to see the new cash call
      console.log('=== RELOADING DATA ===')
      const updatedCashCalls = await getCashCallsForUser(
        user.uid, 
        userProfile.role || 'viewer', 
        userProfile.affiliate_company_id
      )
      setCashCalls(updatedCashCalls)
      console.log('Updated cash calls count:', updatedCashCalls.length)
      
    } catch (err) {
      console.error('❌ Error creating cash call:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setResult(`❌ Failed to create cash call: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    if (!user?.uid || !userProfile) {
      setError('Please log in first')
      return
    }

    try {
      setLoading(true)
      setError('')

      console.log('=== REFRESHING DATA ===')
      
      const updatedCashCalls = await getCashCallsForUser(
        user.uid, 
        userProfile.role || 'viewer', 
        userProfile.affiliate_company_id
      )
      setCashCalls(updatedCashCalls)
      console.log('Updated cash calls count:', updatedCashCalls.length)
      
    } catch (err) {
      console.error('Error refreshing data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Simple Cash Call Test</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold">Not Authenticated</h2>
            <p className="text-red-600 mt-2">Please log in first to test cash call creation.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Simple Cash Call Test</h1>
        
        {/* User Info */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Email:</span>
              <span className="ml-2">{userProfile.email}</span>
            </div>
            <div>
              <span className="font-medium">Role:</span>
              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                {userProfile.role || 'unknown'}
              </span>
            </div>
            <div>
              <span className="font-medium">Affiliate ID:</span>
              <span className="ml-2 font-mono">{userProfile.affiliate_company_id || 'None'}</span>
            </div>
            <div>
              <span className="font-medium">Cash Calls Visible:</span>
              <span className="ml-2 font-bold">{cashCalls.length}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex gap-4">
            <button
              onClick={createTestCashCall}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Test Cash Call'}
            </button>
            <button
              onClick={refreshData}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <h2 className="text-xl font-semibold mb-4">Result</h2>
            <div className={`p-3 rounded-lg ${
              result.startsWith('✅') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <p className={result.startsWith('✅') ? 'text-green-800' : 'text-red-800'}>
                {result}
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <h2 className="text-xl font-semibold mb-4">Error</h2>
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Cash Calls */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4">Cash Calls ({cashCalls.length})</h2>
          {cashCalls.length > 0 ? (
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
            <p className="text-gray-600">No cash calls visible.</p>
          )}
        </div>

        {/* Debug Info */}
        <div className="bg-gray-100 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <div className="text-sm font-mono space-y-2">
            <div>User ID: {user?.uid}</div>
            <div>User Role: {userProfile?.role || 'unknown'}</div>
            <div>Affiliate Company ID: {userProfile?.affiliate_company_id || 'None'}</div>
            <div>Available Affiliates: {affiliates.length}</div>
            <div>Visible Cash Calls: {cashCalls.length}</div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Check the browser console for detailed debug information.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
