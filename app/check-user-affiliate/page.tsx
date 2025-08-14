'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase-auth-context'
import { getAffiliates } from '@/lib/firebase-database'

export default function CheckUserAffiliate() {
  const { user, userProfile } = useAuth()
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid || !userProfile) {
        setError('Please log in first')
        return
      }

      try {
        setLoading(true)
        setError('')

        console.log('=== USER AFFILIATE CHECK ===')
        console.log('User Profile:', userProfile)
        
        const affiliatesData = await getAffiliates()
        setAffiliates(affiliatesData)
        
        console.log('All Affiliates:', affiliatesData.map(a => ({ id: a.id, name: a.name, company_code: a.company_code })))
        
        const userAffiliate = affiliatesData.find(a => a.id === userProfile.affiliate_company_id)
        console.log('User Affiliate Found:', userAffiliate)
        
        if (!userAffiliate) {
          console.log('❌ ISSUE: User affiliate company not found!')
          console.log('User affiliate_company_id:', userProfile.affiliate_company_id)
          console.log('Available affiliate IDs:', affiliatesData.map(a => a.id))
        } else {
          console.log('✅ User affiliate company found:', userAffiliate)
        }

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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Check User Affiliate</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold">Not Authenticated</h2>
            <p className="text-red-600 mt-2">Please log in first.</p>
          </div>
        </div>
      </div>
    )
  }

  // Only allow admin users to access debug pages
  if (userProfile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Check User Affiliate</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold">Access Denied</h2>
            <p className="text-red-600 mt-2">Only admin users can access debug pages.</p>
          </div>
        </div>
      </div>
    )
  }

  const userAffiliate = affiliates.find(a => a.id === userProfile.affiliate_company_id)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Check User Affiliate</h1>
        
        {/* User Information */}
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
              <span className="font-medium">User ID:</span>
              <span className="ml-2 font-mono text-xs">{user.uid}</span>
            </div>
          </div>
        </div>

        {/* Affiliate Status */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4">Affiliate Status</h2>
          {loading ? (
            <p>Loading...</p>
          ) : userAffiliate ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-green-800 font-semibold">✅ Affiliate Found</h3>
              <div className="mt-2 text-sm">
                <div><strong>Name:</strong> {userAffiliate.name}</div>
                <div><strong>ID:</strong> {userAffiliate.id}</div>
                <div><strong>Company Code:</strong> {userAffiliate.company_code || 'N/A'}</div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-red-800 font-semibold">❌ Affiliate Not Found</h3>
              <p className="text-red-600 mt-2">
                Your user has affiliate_company_id: <strong>{userProfile.affiliate_company_id}</strong>, 
                but this affiliate doesn't exist in the database.
              </p>
            </div>
          )}
        </div>

        {/* Available Affiliates */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4">Available Affiliates ({affiliates.length})</h2>
          {loading ? (
            <p>Loading...</p>
          ) : affiliates.length > 0 ? (
            <div className="space-y-3">
              {affiliates.map((affiliate) => (
                <div key={affiliate.id} className={`p-3 border rounded-lg ${
                  affiliate.id === userProfile.affiliate_company_id ? 'border-green-300 bg-green-50' : 'border-gray-200'
                }`}>
                  <div className="text-sm">
                    <div className="font-semibold">{affiliate.name}</div>
                    <div>ID: <span className="font-mono">{affiliate.id}</span></div>
                    <div>Company Code: {affiliate.company_code || 'N/A'}</div>
                    {affiliate.id === userProfile.affiliate_company_id && (
                      <div className="text-green-600 text-xs mt-1">← This is your assigned affiliate</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No affiliates found in database.</p>
          )}
        </div>

        {/* Solutions */}
        {!userAffiliate && userProfile.affiliate_company_id && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-yellow-800">How to Fix This</h2>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-yellow-800">Option 1: Create the Missing Affiliate</h3>
                <p className="text-yellow-700 mt-1">
                  Go to Firebase Console → Firestore → affiliates collection and create a new document with ID: <strong>{userProfile.affiliate_company_id}</strong>
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-yellow-800">Option 2: Update User's Affiliate ID</h3>
                <p className="text-yellow-700 mt-1">
                  Go to Firebase Console → Firestore → users collection, find your user document, and update the <strong>affiliate_company_id</strong> field to match an existing affiliate ID.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-yellow-800">Option 3: Use Admin Panel</h3>
                <p className="text-yellow-700 mt-1">
                  If you have admin access, you can use the admin panel to create affiliates or update user settings.
                </p>
              </div>
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
      </div>
    </div>
  )
}
