'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase-auth-context'
import { getAffiliates, createAffiliate } from '@/lib/firebase-database'

export default function CreateMissingAffiliate() {
  const { user, userProfile } = useAuth()
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [affiliateName, setAffiliateName] = useState('')
  const [companyCode, setCompanyCode] = useState('')
  const [targetAffiliateId, setTargetAffiliateId] = useState<string>('')
  const [targetUserEmail, setTargetUserEmail] = useState<string>('')

  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid || !userProfile) {
        setError('Please log in first')
        return
      }

      try {
        setLoading(true)
        setError('')

        const affiliatesData = await getAffiliates()
        setAffiliates(affiliatesData)
        
        // Check for URL parameters first
        const urlParams = new URLSearchParams(window.location.search)
        const affiliateIdParam = urlParams.get('affiliateId')
        const userEmailParam = urlParams.get('userEmail')
        
        if (affiliateIdParam) {
          setTargetAffiliateId(affiliateIdParam)
          setCompanyCode(affiliateIdParam)
          // Auto-fill affiliate name if it's a common pattern
          const suggestedName = affiliateIdParam.toUpperCase()
          setAffiliateName(suggestedName)
        } else if (userProfile.affiliate_company_id) {
          // Fall back to user's own affiliate ID
          setTargetAffiliateId(userProfile.affiliate_company_id)
          setCompanyCode(userProfile.affiliate_company_id)
          const suggestedName = userProfile.affiliate_company_id.toUpperCase()
          setAffiliateName(suggestedName)
        }
        
        if (userEmailParam) {
          setTargetUserEmail(userEmailParam)
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

  const handleCreateAffiliate = async () => {
    const affiliateId = targetAffiliateId || userProfile?.affiliate_company_id
    if (!affiliateId || !affiliateName.trim()) {
      setError('Please fill in the affiliate name')
      return
    }

    try {
      setCreating(true)
      setError('')
      setSuccess('')

      const affiliateData = {
        id: affiliateId,
        name: affiliateName.trim(),
        company_code: companyCode.trim() || affiliateId,
        description: `Affiliate company for ${affiliateName.trim()}`,
        is_active: true,
        status: 'active' as const,
        risk_level: 'medium' as const,
        created_at: new Date(),
        updated_at: new Date(),
      }

      console.log('Creating affiliate with data:', affiliateData)

      await createAffiliate(affiliateData)
      
      setSuccess(`✅ Affiliate "${affiliateName}" created successfully!`)
      
      // Reload affiliates list
      const updatedAffiliates = await getAffiliates()
      setAffiliates(updatedAffiliates)

    } catch (err) {
      console.error('Error creating affiliate:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setCreating(false)
    }
  }

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Create Missing Affiliate</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold">Not Authenticated</h2>
            <p className="text-red-600 mt-2">Please log in first.</p>
          </div>
        </div>
      </div>
    )
  }

  // Only allow admin users to access management pages
  if (userProfile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Create Missing Affiliate</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold">Access Denied</h2>
            <p className="text-red-600 mt-2">Only admin users can access management pages.</p>
          </div>
        </div>
      </div>
    )
  }

  const userAffiliate = affiliates.find(a => a.id === userProfile.affiliate_company_id)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create Missing Affiliate</h1>
        
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
          </div>
        </div>

        {/* Status */}
        {userAffiliate ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h2 className="text-green-800 font-semibold">✅ Affiliate Already Exists</h2>
            <p className="text-green-600 mt-2">
              Your affiliate company "{userAffiliate.name}" already exists in the database. 
              You should now be able to create cash calls.
            </p>
            <div className="mt-4">
              <a 
                href="/dashboard" 
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 inline-block"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        ) : (targetAffiliateId || userProfile.affiliate_company_id) ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h2 className="text-yellow-800 font-semibold">❌ Affiliate Missing</h2>
                          <p className="text-yellow-600 mt-2">
                {targetUserEmail ? (
                  <>User <strong>{targetUserEmail}</strong> has affiliate_company_id: <strong>{targetAffiliateId}</strong>, but this affiliate doesn't exist in the database.</>
                ) : (
                  <>Your user has affiliate_company_id: <strong>{targetAffiliateId || userProfile.affiliate_company_id}</strong>, but this affiliate doesn't exist in the database.</>
                )}
              </p>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-red-800 font-semibold">❌ No Affiliate ID</h2>
            <p className="text-red-600 mt-2">
              Your user doesn't have an affiliate_company_id assigned. Please contact an administrator.
            </p>
          </div>
        )}

        {/* Create Affiliate Form */}
        {!userAffiliate && (targetAffiliateId || userProfile.affiliate_company_id) && (
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <h2 className="text-xl font-semibold mb-4">Create Missing Affiliate</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Affiliate Name *
                </label>
                <input
                  type="text"
                  value={affiliateName}
                  onChange={(e) => setAffiliateName(e.target.value)}
                  placeholder="Enter affiliate company name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Code
                </label>
                <input
                  type="text"
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value)}
                  placeholder="Enter company code (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Affiliate ID:</strong> {targetAffiliateId || userProfile.affiliate_company_id}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  This ID will be used to link user accounts to this affiliate company.
                </p>
              </div>
              <button
                onClick={handleCreateAffiliate}
                disabled={creating || !affiliateName.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Affiliate'}
              </button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h2 className="text-green-800 font-semibold">Success!</h2>
            <p className="text-green-600 mt-2">{success}</p>
            <div className="mt-4">
              <a 
                href="/dashboard" 
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 inline-block"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-red-800 font-semibold">Error</h2>
            <p className="text-red-600 mt-2">{error}</p>
          </div>
        )}

        {/* Available Affiliates */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
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
      </div>
    </div>
  )
}
