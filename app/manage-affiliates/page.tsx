'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase-auth-context'
import { getAffiliates, deleteAffiliate, updateAffiliate, getUsers } from '@/lib/firebase-database'

export default function ManageAffiliates() {
  const { user, userProfile } = useAuth()
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid || !userProfile) {
        setError('Please log in first')
        return
      }

      // Only allow admin users to manage affiliates
      if (userProfile.role !== 'admin') {
        setError('Only admin users can manage affiliates')
        return
      }

      try {
        setLoading(true)
        setError('')

        console.log('=== LOADING AFFILIATES FOR MANAGEMENT ===')
        
        const [affiliatesData, usersData] = await Promise.all([
          getAffiliates(),
          getUsers()
        ])
        
        setAffiliates(affiliatesData)
        setUsers(usersData)
        
        console.log('All Affiliates:', affiliatesData.map(a => ({ 
          id: a.id, 
          name: a.name, 
          is_active: a.is_active 
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

  const handleDeleteAffiliate = async (affiliateId: string) => {
    try {
      setDeleting(affiliateId)
      setError('')
      setSuccess('')

      // Check if any users are assigned to this affiliate
      const usersWithAffiliate = users.filter(u => 
        u.role === 'affiliate' && u.affiliate_company_id === affiliateId
      )

      if (usersWithAffiliate.length > 0) {
        setError(`Cannot delete affiliate. ${usersWithAffiliate.length} user(s) are assigned to this affiliate: ${usersWithAffiliate.map(u => u.email).join(', ')}`)
        setShowDeleteConfirm(null)
        return
      }

      console.log('Deleting affiliate:', affiliateId)
      await deleteAffiliate(affiliateId)
      
      setSuccess(`✅ Affiliate deleted successfully!`)
      setShowDeleteConfirm(null)
      
      // Reload affiliates list
      const updatedAffiliates = await getAffiliates()
      setAffiliates(updatedAffiliates)

    } catch (err) {
      console.error('Error deleting affiliate:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setShowDeleteConfirm(null)
    } finally {
      setDeleting(null)
    }
  }

  const handleToggleActive = async (affiliateId: string, currentStatus: boolean) => {
    try {
      setError('')
      setSuccess('')

      const newStatus = !currentStatus
      console.log(`Toggling affiliate ${affiliateId} from ${currentStatus} to ${newStatus}`)
      
      await updateAffiliate(affiliateId, { is_active: newStatus })
      
      setSuccess(`✅ Affiliate ${newStatus ? 'activated' : 'deactivated'} successfully!`)
      
      // Reload affiliates list
      const updatedAffiliates = await getAffiliates()
      setAffiliates(updatedAffiliates)

    } catch (err) {
      console.error('Error updating affiliate:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Manage Affiliates</h1>
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
          <h1 className="text-3xl font-bold mb-8">Manage Affiliates</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold">Access Denied</h2>
            <p className="text-red-600 mt-2">Only admin users can manage affiliates.</p>
          </div>
        </div>
      </div>
    )
  }

  const activeAffiliates = affiliates.filter(a => a.is_active)
  const inactiveAffiliates = affiliates.filter(a => !a.is_active)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
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
        <h1 className="text-3xl font-bold mb-8">Manage Affiliates</h1>
        
        {/* Summary */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="font-semibold text-blue-800">Total Affiliates</div>
              <div className="text-2xl font-bold text-blue-600">{affiliates.length}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="font-semibold text-green-800">Active Affiliates</div>
              <div className="text-2xl font-bold text-green-600">{activeAffiliates.length}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="font-semibold text-gray-800">Inactive Affiliates</div>
              <div className="text-2xl font-bold text-gray-600">{inactiveAffiliates.length}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="font-semibold text-yellow-800">Can Delete</div>
              <div className="text-2xl font-bold text-yellow-600">
                {inactiveAffiliates.filter(a => 
                  !users.some(u => u.role === 'affiliate' && u.affiliate_company_id === a.id)
                ).length}
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h2 className="text-green-800 font-semibold">Success!</h2>
            <p className="text-green-600 mt-2">{success}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-red-800 font-semibold">Error</h2>
            <p className="text-red-600 mt-2">{error}</p>
          </div>
        )}

        {/* Inactive Affiliates (Can Delete) */}
        {inactiveAffiliates.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Inactive Affiliates ({inactiveAffiliates.length})
            </h2>
            <div className="space-y-4">
              {inactiveAffiliates.map((affiliate) => {
                const usersWithAffiliate = users.filter(u => 
                  u.role === 'affiliate' && u.affiliate_company_id === affiliate.id
                )
                const canDelete = usersWithAffiliate.length === 0
                
                return (
                  <div key={affiliate.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">{affiliate.name}</h3>
                          <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                          {!canDelete && (
                            <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">
                              Has Users
                            </span>
                          )}
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
                        </div>
                        {usersWithAffiliate.length > 0 && (
                          <div className="mt-2 text-sm text-red-600">
                            <strong>Users assigned:</strong> {usersWithAffiliate.map(u => u.email).join(', ')}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleActive(affiliate.id, false)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          Activate
                        </button>
                        {canDelete ? (
                          <button
                            onClick={() => setShowDeleteConfirm(affiliate.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          >
                            Delete
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500 px-3 py-1">
                            Cannot delete (has users)
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Delete Confirmation */}
                    {showDeleteConfirm === affiliate.id && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 font-semibold mb-2">
                          Are you sure you want to delete "{affiliate.name}"?
                        </p>
                        <p className="text-red-600 text-sm mb-3">
                          This action cannot be undone. The affiliate will be permanently removed from the database.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteAffiliate(affiliate.id)}
                            disabled={deleting === affiliate.id}
                            className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                          >
                            {deleting === affiliate.id ? 'Deleting...' : 'Yes, Delete'}
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Active Affiliates */}
        {activeAffiliates.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <h2 className="text-xl font-semibold mb-4 text-green-800">
              Active Affiliates ({activeAffiliates.length})
            </h2>
            <div className="space-y-4">
              {activeAffiliates.map((affiliate) => {
                const usersWithAffiliate = users.filter(u => 
                  u.role === 'affiliate' && u.affiliate_company_id === affiliate.id
                )
                
                return (
                  <div key={affiliate.id} className="p-4 border border-green-200 rounded-lg bg-green-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">{affiliate.name}</h3>
                          <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                            Active
                          </span>
                          {usersWithAffiliate.length > 0 && (
                            <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                              {usersWithAffiliate.length} User(s)
                            </span>
                          )}
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
                        </div>
                        {usersWithAffiliate.length > 0 && (
                          <div className="mt-2 text-sm text-green-600">
                            <strong>Users:</strong> {usersWithAffiliate.map(u => u.email).join(', ')}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleActive(affiliate.id, true)}
                          className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                        >
                          Deactivate
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* No Affiliates */}
        {affiliates.length === 0 && !loading && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-center py-8">
              <p className="text-gray-600">No affiliates found in database.</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading affiliates...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
