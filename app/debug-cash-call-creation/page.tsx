'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase-auth-context'
import { getCashCallsForUser, getAffiliates, createCashCall, getCashCalls } from '@/lib/firebase-database'

export default function DebugCashCallCreation() {
  const { user, userProfile } = useAuth()
  const [cashCalls, setCashCalls] = useState<any[]>([])
  const [allCashCalls, setAllCashCalls] = useState<any[]>([])
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [result, setResult] = useState<string>('')
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid || !userProfile) {
        setError('Please log in first')
        return
      }

      try {
        setLoading(true)
        setError('')

        console.log('=== COMPREHENSIVE DEBUG START ===')
        
        // Load user info
        const userInfo = {
          userId: user.uid,
          userEmail: userProfile.email,
          userRole: userProfile.role,
          affiliateCompanyId: userProfile.affiliate_company_id,
          fullProfile: userProfile
        }
        console.log('User Info:', userInfo)

        // Load affiliates
        const affiliatesData = await getAffiliates()
        setAffiliates(affiliatesData)
        console.log('All Affiliates:', affiliatesData.map(a => ({ id: a.id, name: a.name, company_code: a.company_code })))

        // Find user's affiliate
        const userAffiliate = affiliatesData.find(a => a.id === userProfile.affiliate_company_id)
        console.log('User Affiliate:', userAffiliate)

        // Load all cash calls
        const allCashCallsData = await getCashCalls()
        setAllCashCalls(allCashCallsData)
        console.log('All Cash Calls:', allCashCallsData.map(cc => ({ 
          id: cc.id, 
          call_number: cc.call_number, 
          affiliate_id: cc.affiliate_id, 
          created_by: cc.created_by,
          amount: cc.amount_requested 
        })))

        // Load filtered cash calls for user
        const userCashCalls = await getCashCallsForUser(
          user.uid, 
          userProfile.role || 'viewer', 
          userProfile.affiliate_company_id
        )
        setCashCalls(userCashCalls)
        console.log('User Cash Calls (Filtered):', userCashCalls.map(cc => ({ 
          id: cc.id, 
          call_number: cc.call_number, 
          affiliate_id: cc.affiliate_id, 
          created_by: cc.created_by 
        })))

        // Analyze the data
        const analysis = {
          userInfo,
          totalAffiliates: affiliatesData.length,
          totalCashCalls: allCashCallsData.length,
          userCashCallsCount: userCashCalls.length,
          userAffiliateFound: !!userAffiliate,
          userAffiliateName: userAffiliate?.name,
          cashCallsForUserAffiliate: allCashCallsData.filter(cc => cc.affiliate_id === userProfile.affiliate_company_id),
          cashCallsCreatedByUser: allCashCallsData.filter(cc => cc.created_by === user.uid),
          cashCallsForUserAffiliateAndCreatedByUser: allCashCallsData.filter(cc => 
            cc.affiliate_id === userProfile.affiliate_company_id && cc.created_by === user.uid
          )
        }

        setDebugInfo(analysis)
        console.log('Analysis:', analysis)
        console.log('=== COMPREHENSIVE DEBUG END ===')

      } catch (err) {
        console.error('Error loading debug data:', err)
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

      // Get user's affiliate
      const userAffiliate = affiliates.find(a => a.id === userProfile.affiliate_company_id)
      if (!userAffiliate) {
        setError('Your affiliate company not found in database')
        return
      }

      console.log('Using user affiliate:', userAffiliate)

      const testData = {
        call_number: `DEBUG-${Date.now()}`,
        affiliate_id: userAffiliate.id, // Use user's affiliate ID
        amount_requested: 1000,
        description: 'Debug test cash call',
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
      
      // Wait a moment then reload data
      setTimeout(async () => {
        console.log('=== RELOADING DATA AFTER CREATION ===')
        
        const updatedAllCashCalls = await getCashCalls()
        setAllCashCalls(updatedAllCashCalls)
        
        const updatedUserCashCalls = await getCashCallsForUser(
          user.uid, 
          userProfile.role || 'viewer', 
          userProfile.affiliate_company_id
        )
        setCashCalls(updatedUserCashCalls)
        
        console.log('Updated all cash calls:', updatedAllCashCalls.length)
        console.log('Updated user cash calls:', updatedUserCashCalls.length)
        
        // Check if the new cash call is in the filtered results
        const newCashCall = updatedAllCashCalls.find(cc => cc.id === newCallId)
        console.log('New cash call in all cash calls:', newCashCall)
        
        const newCashCallInUserCalls = updatedUserCashCalls.find(cc => cc.id === newCallId)
        console.log('New cash call in user cash calls:', newCashCallInUserCalls)
        
      }, 2000)
      
    } catch (err) {
      console.error('❌ Error creating cash call:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setResult(`❌ Failed to create cash call: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const analyzeIssue = () => {
    if (!debugInfo.userInfo) {
      setResult('❌ No debug info available. Please wait for data to load.')
      return
    }

    const { userInfo, userAffiliateFound, userCashCallsCount, cashCallsForUserAffiliate, cashCallsCreatedByUser } = debugInfo

    console.log('=== ISSUE ANALYSIS ===')

    if (userInfo.userRole !== 'affiliate') {
      setResult(`❌ ISSUE FOUND: User role is '${userInfo.userRole}', should be 'affiliate'`)
      return
    }

    if (!userInfo.affiliateCompanyId) {
      setResult('❌ ISSUE FOUND: User has no affiliate_company_id assigned')
      return
    }

    if (!userAffiliateFound) {
      setResult('❌ ISSUE FOUND: User affiliate company not found in database')
      return
    }

    if (cashCallsCreatedByUser.length > 0 && userCashCallsCount === 0) {
      setResult(`❌ ISSUE FOUND: User has created ${cashCallsCreatedByUser.length} cash calls, but filtering shows 0. This indicates a filtering problem.`)
      return
    }

    if (cashCallsForUserAffiliate.length > 0 && userCashCallsCount === 0) {
      setResult(`❌ ISSUE FOUND: There are ${cashCallsForUserAffiliate.length} cash calls for user's affiliate, but filtering shows 0. This indicates a filtering problem.`)
      return
    }

    setResult('✅ No obvious issues found. Check console for detailed debug information.')
  }

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Cash Call Creation Debug</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold">Not Authenticated</h2>
            <p className="text-red-600 mt-2">Please log in first to debug cash call creation.</p>
          </div>
        </div>
      </div>
    )
  }

  // Only allow admin users to access debug pages
  if (userProfile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Cash Call Creation Debug</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold">Access Denied</h2>
            <p className="text-red-600 mt-2">Only admin users can access debug pages.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Cash Call Creation Debug</h1>
        
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
              <span className={`ml-2 px-2 py-1 text-xs rounded ${
                userProfile.role === 'affiliate' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {userProfile.role || 'unknown'}
              </span>
            </div>
            <div>
              <span className="font-medium">Affiliate ID:</span>
              <span className="ml-2 font-mono">{userProfile.affiliate_company_id || 'None'}</span>
            </div>
            <div>
              <span className="font-medium">User Cash Calls:</span>
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
              onClick={analyzeIssue}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Analyze Issue
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <h2 className="text-xl font-semibold mb-4">Analysis Result</h2>
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

        {/* Debug Information */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Database Statistics</h3>
              <div className="text-sm space-y-1">
                <div>Total Affiliates: {debugInfo.totalAffiliates || 0}</div>
                <div>Total Cash Calls: {debugInfo.totalCashCalls || 0}</div>
                <div>User Cash Calls: {debugInfo.userCashCallsCount || 0}</div>
                <div>User Affiliate Found: {debugInfo.userAffiliateFound ? 'Yes' : 'No'}</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">User's Cash Calls Analysis</h3>
              <div className="text-sm space-y-1">
                <div>Created by User: {debugInfo.cashCallsCreatedByUser?.length || 0}</div>
                <div>For User's Affiliate: {debugInfo.cashCallsForUserAffiliate?.length || 0}</div>
                <div>Both Conditions: {debugInfo.cashCallsForUserAffiliateAndCreatedByUser?.length || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Cash Calls Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User's Cash Calls */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">User's Cash Calls ({cashCalls.length})</h2>
            {cashCalls.length > 0 ? (
              <div className="space-y-3">
                {cashCalls.map((cashCall) => {
                  const affiliate = affiliates.find(a => a.id === cashCall.affiliate_id)
                  return (
                    <div key={cashCall.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="text-sm">
                        <div className="font-semibold">{cashCall.call_number}</div>
                        <div>Amount: ${cashCall.amount_requested}</div>
                        <div>Affiliate: {affiliate?.name || 'Unknown'}</div>
                        <div>Created by: {cashCall.created_by}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-600">No cash calls visible to user.</p>
            )}
          </div>

          {/* All Cash Calls */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">All Cash Calls ({allCashCalls.length})</h2>
            {allCashCalls.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {allCashCalls.map((cashCall) => {
                  const affiliate = affiliates.find(a => a.id === cashCall.affiliate_id)
                  const isUserAffiliate = cashCall.affiliate_id === userProfile.affiliate_company_id
                  const isCreatedByUser = cashCall.created_by === user?.uid
                  return (
                    <div key={cashCall.id} className={`p-3 border rounded-lg ${
                      isUserAffiliate && isCreatedByUser ? 'border-green-300 bg-green-50' :
                      isUserAffiliate ? 'border-blue-300 bg-blue-50' :
                      isCreatedByUser ? 'border-yellow-300 bg-yellow-50' :
                      'border-gray-200'
                    }`}>
                      <div className="text-sm">
                        <div className="font-semibold">{cashCall.call_number}</div>
                        <div>Amount: ${cashCall.amount_requested}</div>
                        <div>Affiliate: {affiliate?.name || 'Unknown'}</div>
                        <div>Created by: {cashCall.created_by}</div>
                        <div className="text-xs mt-1">
                          {isUserAffiliate && isCreatedByUser ? '✅ User Affiliate + Created by User' :
                           isUserAffiliate ? '🔵 User Affiliate' :
                           isCreatedByUser ? '🟡 Created by User' :
                           '⚪ Other'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-600">No cash calls in database.</p>
            )}
          </div>
        </div>

        {/* Console Instructions */}
        <div className="mt-6 bg-gray-100 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Console Debug Information</h2>
          <p className="text-sm text-gray-600 mb-2">
            Open your browser's developer tools (F12) and check the console for detailed debug information.
          </p>
          <p className="text-sm text-gray-600">
            Look for messages starting with "=== COMPREHENSIVE DEBUG START ===" to see all the data.
          </p>
        </div>
      </div>
    </div>
  )
}
