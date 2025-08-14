'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase-auth-context'
import { getAffiliates, getUsers } from '@/lib/firebase-database'

export default function CheckAllAffiliates() {
  const { user, userProfile } = useAuth()
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid || !userProfile) {
        setError('Please log in first')
        return
      }

      // Only allow admin users to view all users
      if (userProfile.role !== 'admin') {
        setError('Only admin users can view all affiliates')
        return
      }

      try {
        setLoading(true)
        setError('')

        console.log('=== CHECKING ALL AFFILIATES ===')
        
        const [affiliatesData, usersData] = await Promise.all([
          getAffiliates(),
          getUsers()
        ])
        
        setAffiliates(affiliatesData)
        setUsers(usersData)
        
        console.log('All Affiliates:', affiliatesData.map(a => ({ id: a.id, name: a.name })))
        console.log('All Users:', usersData.map(u => ({ 
          email: u.email, 
          role: u.role, 
          affiliate_company_id: u.affiliate_company_id 
        })))

      } catch (err) {
        console.error('Error loading data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, userProfile])

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Check All Affiliates</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold">Not Authenticated</h2>
            <p className="text-red-600 mt-2">Please log in first.</p>
          </div>
        </div>
      </div>
    )
  }

  if (userProfile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Check All Affiliates</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold">Access Denied</h2>
            <p className="text-red-600 mt-2">Only admin users can view all affiliates.</p>
          </div>
        </div>
      </div>
    )
  }

  // Analyze users and their affiliates
  const affiliateUsers = users.filter(u => u.role === 'affiliate' && u.affiliate_company_id)
  const missingAffiliates = affiliateUsers.filter(u => 
    !affiliates.find(a => a.id === u.affiliate_company_id)
  )
  const validAffiliates = affiliateUsers.filter(u => 
    affiliates.find(a => a.id === u.affiliate_company_id)
  )

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Check All Affiliates</h1>
        
        {/* Summary */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="font-semibold text-blue-800">Total Affiliates</div>
              <div className="text-2xl font-bold text-blue-600">{affiliates.length}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="font-semibold text-green-800">Valid Affiliate Users</div>
              <div className="text-2xl font-bold text-green-600">{validAffiliates.length}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="font-semibold text-red-800">Missing Affiliates</div>
              <div className="text-2xl font-bold text-red-600">{missingAffiliates.length}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="font-semibold text-gray-800">Total Affiliate Users</div>
              <div className="text-2xl font-bold text-gray-600">{affiliateUsers.length}</div>
            </div>
          </div>
        </div>

        {/* Missing Affiliates */}
        {missingAffiliates.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <h2 className="text-xl font-semibold mb-4 text-red-800">
              ❌ Missing Affiliates ({missingAffiliates.length})
            </h2>
            <div className="space-y-4">
              {missingAffiliates.map((user) => (
                <div key={user.id} className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-red-800">{user.email}</div>
                      <div className="text-sm text-red-600">
                        Affiliate ID: <span className="font-mono">{user.affiliate_company_id}</span>
                      </div>
                      <div className="text-sm text-red-600">
                        Role: {user.role} | Full Name: {user.full_name || 'N/A'}
                      </div>
                    </div>
                    <div className="text-right">
                      <a 
                        href={`/create-missing-affiliate?affiliateId=${user.affiliate_company_id}&userEmail=${user.email}`}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                      >
                        Create Affiliate
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Valid Affiliates */}
        {validAffiliates.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <h2 className="text-xl font-semibold mb-4 text-green-800">
              ✅ Valid Affiliate Users ({validAffiliates.length})
            </h2>
            <div className="space-y-3">
              {validAffiliates.map((user) => {
                const affiliate = affiliates.find(a => a.id === user.affiliate_company_id)
                return (
                  <div key={user.id} className="p-3 border border-green-200 rounded-lg bg-green-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-green-800">{user.email}</div>
                        <div className="text-sm text-green-600">
                          Affiliate: <span className="font-semibold">{affiliate?.name}</span> 
                          (<span className="font-mono">{user.affiliate_company_id}</span>)
                        </div>
                        <div className="text-sm text-green-600">
                          Role: {user.role} | Full Name: {user.full_name || 'N/A'}
                        </div>
                      </div>
                      <div className="text-green-600 text-sm">
                        ✅ Working
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* All Affiliates */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4">All Affiliates in Database ({affiliates.length})</h2>
          {loading ? (
            <p>Loading...</p>
          ) : affiliates.length > 0 ? (
            <div className="space-y-3">
              {affiliates.map((affiliate) => {
                const usersWithThisAffiliate = users.filter(u => 
                  u.role === 'affiliate' && u.affiliate_company_id === affiliate.id
                )
                return (
                  <div key={affiliate.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{affiliate.name}</div>
                        <div className="text-sm text-gray-600">
                          ID: <span className="font-mono">{affiliate.id}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Company Code: {affiliate.company_code || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">
                          Users: {usersWithThisAffiliate.length} ({usersWithThisAffiliate.map(u => u.email).join(', ')})
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {usersWithThisAffiliate.length > 0 ? '✅ In Use' : '⚠️ No Users'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-600">No affiliates found in database.</p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold">Error</h2>
            <p className="text-red-600 mt-2">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
