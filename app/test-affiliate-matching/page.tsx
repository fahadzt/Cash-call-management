'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase-auth-context'
import { getCashCalls, getAffiliates } from '@/lib/firebase-database'

export default function TestAffiliateMatchingPage() {
  const { user, userProfile } = useAuth()
  const [cashCalls, setCashCalls] = useState<any[]>([])
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [matchingCalls, setMatchingCalls] = useState<any[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [calls, affs] = await Promise.all([
          getCashCalls(),
          getAffiliates()
        ])
        
        setCashCalls(calls)
        setAffiliates(affs)
        
        // Find cash calls that match user's affiliate ID
        const matching = calls.filter(call => call.affiliate_id === userProfile?.affiliate_company_id)
        setMatchingCalls(matching)
        
        console.log('Affiliate Matching Test:', {
          userAffiliateId: userProfile?.affiliate_company_id,
          totalCashCalls: calls.length,
          matchingCashCalls: matching.length,
          allCashCallAffiliateIds: calls.map(c => c.affiliate_id),
          userAffiliateFound: affs.find(a => a.id === userProfile?.affiliate_company_id)
        })
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    
    if (user && userProfile) {
      loadData()
    }
  }, [user, userProfile])

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Affiliate ID Matching Test</h1>
      
      <div className="mb-6 p-4 bg-blue-100 rounded">
        <h2 className="font-bold mb-2">Your Profile:</h2>
        <div>Email: {user?.email}</div>
        <div>Role: {userProfile?.role}</div>
        <div>Affiliate ID: <strong>{userProfile?.affiliate_company_id || 'NOT SET'}</strong></div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Matching Cash Calls ({matchingCalls.length})</h2>
        {matchingCalls.length === 0 ? (
          <div className="text-red-600 font-bold">❌ NO MATCHING CASH CALLS FOUND!</div>
        ) : (
          <div className="text-green-600 font-bold">✅ Found {matchingCalls.length} matching cash calls</div>
        )}
        
        {matchingCalls.map(call => (
          <div key={call.id} className="p-3 bg-green-100 border border-green-300 rounded mb-2">
            <div className="font-medium">{call.call_number}</div>
            <div className="text-sm">Affiliate ID: {call.affiliate_id} | Amount: ${call.amount_requested}</div>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">All Cash Calls ({cashCalls.length})</h2>
        {cashCalls.map(call => (
          <div 
            key={call.id} 
            className={`p-3 border rounded mb-2 ${
              call.affiliate_id === userProfile?.affiliate_company_id 
                ? 'bg-green-100 border-green-300' 
                : 'bg-gray-100 border-gray-300'
            }`}
          >
            <div className="font-medium">{call.call_number}</div>
            <div className="text-sm">
              Affiliate ID: <strong>{call.affiliate_id}</strong> | 
              Amount: ${call.amount_requested} | 
              Status: {call.status}
              {call.affiliate_id === userProfile?.affiliate_company_id && (
                <span className="ml-2 text-green-600 font-bold">← MATCHES YOUR ID</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-2">Available Affiliate IDs</h2>
        {affiliates.map(aff => (
          <div 
            key={aff.id} 
            className={`p-3 border rounded mb-2 ${
              aff.id === userProfile?.affiliate_company_id 
                ? 'bg-green-100 border-green-300' 
                : 'bg-gray-100 border-gray-300'
            }`}
          >
            <div className="font-medium">{aff.name}</div>
            <div className="text-sm">
              ID: <strong>{aff.id}</strong> | Code: {aff.company_code}
              {aff.id === userProfile?.affiliate_company_id && (
                <span className="ml-2 text-green-600 font-bold">← YOUR COMPANY</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
