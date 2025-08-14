'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase-auth-context'
import { getCashCallsForUser, getAffiliates, createCashCall } from '@/lib/firebase-database'

export default function DebugCNTXTUser() {
  const { user, userProfile } = useAuth()
  const [cashCalls, setCashCalls] = useState<any[]>([])
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

        console.log('Debug - CNTXT User Profile:', {
          userId: user.uid,
          userRole: userProfile.role,
          userEmail: userProfile.email,
          affiliateCompanyId: userProfile.affiliate_company_id,
          fullProfile: userProfile
        })

        // Load affiliates
        const affiliatesData = await getAffiliates()
        setAffiliates(affiliatesData)

        // Find CNTXT affiliate
        const cntxtAffiliate = affiliatesData.find(a => 
          a.name.toLowerCase().includes('cntxt') || 
          a.company_code.toLowerCase().includes('cntxt')
        )

        console.log('Debug - CNTXT Affiliate found:', cntxtAffiliate)

        // Load cash calls for current user
        const userCashCalls = await getCashCallsForUser(
          user.uid, 
          userProfile.role || 'viewer', 
          userProfile.affiliate_company_id
        )
        setCashCalls(userCashCalls)

        console.log('Debug - CNTXT User Cash Calls:', {
          totalCashCalls: userCashCalls.length,
          cashCalls: userCashCalls.map(cc => ({
            id: cc.id,
            call_number: cc.call_number,
            affiliate_id: cc.affiliate_id,
            amount: cc.amount_requested,
            status: cc.status
          }))
        })

      } catch (err) {
        console.error('Error loading CNTXT debug data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, userProfile])

  const createCNTXTCashCall = async () => {
    if (!user?.uid || !userProfile) {
      setError('User not authenticated')
      return
    }

    try {
      setError('')

      // Find CNTXT affiliate
      const cntxtAffiliate = affiliates.find(a => 
        a.name.toLowerCase().includes('cntxt') || 
        a.company_code.toLowerCase().includes('cntxt')
      )

      if (!cntxtAffiliate) {
        setError('CNTXT affiliate not found in database')
        return
      }

      console.log('Debug - Creating CNTXT cash call with affiliate:', cntxtAffiliate)

      const testData = {
        call_number: `CNTXT-TEST-${Date.now()}`,
        affiliate_id: cntxtAffiliate.id,
        amount_requested: 5000,
        description: 'Test cash call for CNTXT affiliate',
        created_by: user.uid,
        status: 'draft' as const,
        currency: 'USD',
        exchange_rate: 1,
        priority: 'medium' as const,
        compliance_status: 'pending' as const,
      }

      console.log('Debug - Creating cash call with data:', testData)

      const newCallId = await createCashCall(testData)
      
      console.log('Debug - CNTXT cash call created successfully:', newCallId)
      
      setTestResult(`✅ CNTXT cash call created successfully with ID: ${newCallId}`)
      
      // Reload data to see the new cash call
      setTimeout(() => {
        window.location.reload()
      }, 2000)
      
    } catch (err) {
      console.error('Error creating CNTXT cash call:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setTestResult(`❌ Failed to create CNTXT cash call: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const verifyCNTXTSettings = () => {
    if (!userProfile) {
      setTestResult('❌ No user profile available')
      return
    }

    const userRole = userProfile.role
    const userAffiliateId = userProfile.affiliate_company_id

    console.log('Debug - Verifying CNTXT settings:', {
      userRole,
      userAffiliateId,
      userEmail: userProfile.email
    })

    // Find CNTXT affiliate
    const cntxtAffiliate = affiliates.find(a => 
      a.name.toLowerCase().includes('cntxt') || 
      a.company_code.toLowerCase().includes('cntxt')
    )

    if (!cntxtAffiliate) {
      setTestResult('❌ CNTXT affiliate not found in database')
      return
    }

    if (userRole !== 'affiliate') {
      setTestResult(`❌ User role is '${userRole}', should be 'affiliate'`)
      return
    }

    if (!userAffiliateId) {
      setTestResult('❌ User has no affiliate_company_id assigned')
      return
    }

    if (userAffiliateId !== cntxtAffiliate.id) {
      setTestResult(`❌ User affiliate_company_id (${userAffiliateId}) doesn't match CNTXT affiliate ID (${cntxtAffiliate.id})`)
      return
    }

    setTestResult(`✅ CNTXT settings verified correctly! User is affiliate for ${cntxtAffiliate.name}`)
  }

  const getCNTXTAffiliateName = () => {
    const cntxtAffiliate = affiliates.find(a => 
      a.name.toLowerCase().includes('cntxt') || 
      a.company_code.toLowerCase().includes('cntxt')
    )
    return cntxtAffiliate ? `${cntxtAffiliate.name} (${cntxtAffiliate.company_code})` : 'Not found'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">CNTXT User Debug</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Information */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">CNTXT User Information</h2>
            
            {loading ? (
              <p>Loading user data...</p>
            ) : userProfile ? (
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Role:</span>
                  <span className={`ml-2 px-2 py-1 text-xs rounded ${
                    userProfile.role === 'affiliate' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {userProfile.role || 'unknown'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Email:</span>
                  <span className="ml-2">{userProfile.email}</span>
                </div>
                <div>
                  <span className="font-medium">CNTXT Affiliate:</span>
                  <span className="ml-2">{getCNTXTAffiliateName()}</span>
                </div>
                <div>
                  <span className="font-medium">Affiliate ID:</span>
                  <span className="ml-2 font-mono text-sm">{userProfile.affiliate_company_id || 'None'}</span>
                </div>
                <div>
                  <span className="font-medium">Cash Calls Visible:</span>
                  <span className="ml-2 text-lg font-bold">{cashCalls.length}</span>
                </div>
              </div>
            ) : (
              <p className="text-red-600">No user profile available</p>
            )}
          </div>

          {/* Test Actions */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">CNTXT Tests</h2>
            
            <div className="space-y-4">
              <button
                onClick={verifyCNTXTSettings}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Verify CNTXT Settings
              </button>
              
              <button
                onClick={createCNTXTCashCall}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Create CNTXT Test Cash Call
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

        {/* CNTXT Cash Calls */}
        <div className="mt-6 bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">CNTXT Cash Calls</h2>

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
            <p className="text-gray-600">No cash calls visible to this CNTXT user.</p>
          )}
        </div>

        {/* Debug Information */}
        <div className="mt-6 bg-gray-100 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <div className="text-sm font-mono space-y-2">
            <div>User ID: {user?.uid || 'Not authenticated'}</div>
            <div>User Role: {userProfile?.role || 'unknown'}</div>
            <div>User Affiliate ID: {userProfile?.affiliate_company_id || 'None'}</div>
            <div>CNTXT Cash Calls: {cashCalls.length}</div>
            <div>Available Affiliates: {affiliates.length}</div>
            <div>CNTXT Affiliate Found: {affiliates.find(a => a.name.toLowerCase().includes('cntxt')) ? 'Yes' : 'No'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
