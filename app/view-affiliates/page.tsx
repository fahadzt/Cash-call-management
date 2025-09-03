'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase-auth-context'
import { getAffiliates } from '@/lib/firebase-database'

export default function ViewAffiliates() {
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

        console.log('=== LOADING ALL AFFILIATES ===')
        
        const affiliatesData = await getAffiliates()
        setAffiliates(affiliatesData)
        
        console.log('All Affiliates:', affiliatesData.map(a => ({ 
          id: a.id, 
          name: a.name, 
          company_code: a.company_code,
          is_active: a.is_active 
        })))

      } catch (err) {
        console.error('Error loading affiliates:', err)
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
          <h1 className="text-3xl font-bold mb-8">View All Affiliates</h1>
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
          <h1 className="text-3xl font-bold mb-8">View All Affiliates</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold">Access Denied</h2>
            <p className="text-red-600 mt-2">Only admin users can access management pages.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
        <h1 className="text-3xl font-bold mb-8">All Affiliates in Database</h1>
        
        {/* Summary */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="font-semibold text-blue-800">Total Affiliates</div>
              <div className="text-2xl font-bold text-blue-600">{affiliates.length}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="font-semibold text-green-800">Active Affiliates</div>
              <div className="text-2xl font-bold text-green-600">
                {affiliates.filter(a => a.is_active).length}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="font-semibold text-gray-800">Inactive Affiliates</div>
              <div className="text-2xl font-bold text-gray-600">
                {affiliates.filter(a => !a.is_active).length}
              </div>
            </div>
          </div>
        </div>

        {/* Affiliates List */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Affiliates List</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading affiliates...</p>
            </div>
          ) : affiliates.length > 0 ? (
            <div className="space-y-4">
              {affiliates.map((affiliate, index) => (
                <div key={affiliate.id} className={`p-4 border rounded-lg ${
                  affiliate.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-gray-500">#{index + 1}</span>
                        <h3 className="text-lg font-semibold">{affiliate.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded ${
                          affiliate.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {affiliate.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">ID:</span>
                          <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                            {affiliate.id}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Company Code:</span>
                          <span className="ml-2">{affiliate.company_code || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Status:</span>
                          <span className="ml-2">{affiliate.status || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Risk Level:</span>
                          <span className="ml-2">{affiliate.risk_level || 'N/A'}</span>
                        </div>
                      </div>
                      {affiliate.description && (
                        <div className="mt-2">
                          <span className="font-medium text-gray-700">Description:</span>
                          <span className="ml-2 text-gray-600">{affiliate.description}</span>
                        </div>
                      )}
                      <div className="mt-2 text-xs text-gray-500">
                        Created: {affiliate.created_at ? new Date(affiliate.created_at).toLocaleDateString() : 'N/A'}
                        {affiliate.updated_at && (
                          <span className="ml-4">
                            Updated: {new Date(affiliate.updated_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No affiliates found in database.</p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-6">
            <h2 className="text-red-800 font-semibold">Error</h2>
            <p className="text-red-600 mt-2">{error}</p>
          </div>
        )}

        {/* Console Instructions */}
        <div className="mt-6 bg-gray-100 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Console Information</h2>
          <p className="text-sm text-gray-600 mb-2">
            Open your browser's developer tools (F12) and check the console for detailed affiliate information.
          </p>
          <p className="text-sm text-gray-600">
            Look for messages starting with "=== LOADING ALL AFFILIATES ===" to see all the data.
          </p>
        </div>
      </div>
    </div>
  )
}
