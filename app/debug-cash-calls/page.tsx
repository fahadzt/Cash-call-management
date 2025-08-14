'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase-auth-context'
import { getCashCalls, getAffiliates } from '@/lib/firebase-database'

export default function DebugCashCallsPage() {
  const { user, userProfile } = useAuth()
  const [allCashCalls, setAllCashCalls] = useState<any[]>([])
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const loadData = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      console.log('Debug - Starting to load data...')
      
      const [allCalls, affiliatesData] = await Promise.all([
        getCashCalls(),
        getAffiliates()
      ])

      console.log('Debug - Data loaded successfully:', {
        cashCalls: allCalls.length,
        affiliates: affiliatesData.length
      })

      setAllCashCalls(allCalls)
      setAffiliates(affiliatesData)
    } catch (error: any) {
      console.error('Error loading data:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Debug Cash Calls</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">User Info:</h2>
        <div>Email: {user?.email || 'Not logged in'}</div>
        <div>Role: {userProfile?.role || 'Not loaded'}</div>
        <div>Affiliate ID: {userProfile?.affiliate_company_id || 'Not set'}</div>
      </div>

      <div className="mb-6">
        <button 
          onClick={loadData} 
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Refresh Data'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">All Cash Calls ({allCashCalls.length})</h2>
        {allCashCalls.length === 0 ? (
          <div className="text-gray-500">No cash calls found</div>
        ) : (
          <div className="space-y-2">
            {allCashCalls.map(cashCall => (
              <div 
                key={cashCall.id} 
                className={`p-3 border rounded ${
                  cashCall.affiliate_id === userProfile?.affiliate_company_id 
                    ? 'bg-green-100 border-green-300' 
                    : 'bg-gray-100 border-gray-300'
                }`}
              >
                <div className="font-medium">{cashCall.call_number}</div>
                <div className="text-sm text-gray-600">
                  Affiliate ID: {cashCall.affiliate_id} | 
                  Amount: ${cashCall.amount_requested} | 
                  Status: {cashCall.status}
                  {cashCall.affiliate_id === userProfile?.affiliate_company_id && (
                    <span className="ml-2 text-green-600 font-bold">← YOUR COMPANY</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-2">Available Affiliates ({affiliates.length})</h2>
        {affiliates.length === 0 ? (
          <div className="text-gray-500">No affiliates found</div>
        ) : (
          <div className="space-y-2">
            {affiliates.map(affiliate => (
              <div 
                key={affiliate.id} 
                className={`p-3 border rounded ${
                  affiliate.id === userProfile?.affiliate_company_id 
                    ? 'bg-green-100 border-green-300' 
                    : 'bg-gray-100 border-gray-300'
                }`}
              >
                <div className="font-medium">{affiliate.name}</div>
                <div className="text-sm text-gray-600">
                  ID: {affiliate.id} | Code: {affiliate.company_code}
                  {affiliate.id === userProfile?.affiliate_company_id && (
                    <span className="ml-2 text-green-600 font-bold">← YOUR COMPANY</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
