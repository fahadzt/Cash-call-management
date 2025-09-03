'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase-auth-context'
import { getCashCalls, getAffiliates, getUsers, updateCashCall, deleteCashCall } from '@/lib/firebase-database'

export default function ManageCashCalls() {
  const { user, userProfile } = useAuth()
  const [cashCalls, setCashCalls] = useState<any[]>([])
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [editingCashCall, setEditingCashCall] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [filters, setFilters] = useState({
    status: 'all',
    affiliate: 'all',
    priority: 'all',
    search: '',
    dateFrom: '',
    dateTo: ''
  })

  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid || !userProfile) {
        setError('Please log in first')
        return
      }

      // Only allow admin users to manage cash calls
      if (userProfile.role !== 'admin') {
        setError('Only admin users can manage cash calls')
        return
      }

      try {
        setLoading(true)
        setError('')

        console.log('=== LOADING CASH CALLS FOR MANAGEMENT ===')
        
        const [cashCallsData, affiliatesData, usersData] = await Promise.all([
          getCashCalls(),
          getAffiliates(),
          getUsers()
        ])
        
        setCashCalls(cashCallsData)
        setAffiliates(affiliatesData)
        setUsers(usersData)
        
        console.log('All Cash Calls:', cashCallsData.map(cc => ({ 
          id: cc.id, 
          call_number: cc.call_number, 
          status: cc.status,
          affiliate_id: cc.affiliate_id 
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

  const handleDeleteCashCall = async (cashCallId: string) => {
    try {
      setDeleting(cashCallId)
      setError('')
      setSuccess('')

      console.log('Deleting cash call:', cashCallId)
      await deleteCashCall(cashCallId, user!.uid)
      
      setSuccess(`✅ Cash call deleted successfully!`)
      setShowDeleteConfirm(null)
      
      // Reload cash calls list
      const updatedCashCalls = await getCashCalls()
      setCashCalls(updatedCashCalls)

    } catch (err) {
      console.error('Error deleting cash call:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setShowDeleteConfirm(null)
    } finally {
      setDeleting(null)
    }
  }

  const handleUpdateCashCall = async (cashCallId: string) => {
    try {
      setUpdating(cashCallId)
      setError('')
      setSuccess('')

      console.log('Updating cash call:', cashCallId, editForm)
      await updateCashCall(cashCallId, editForm, user!.uid)
      
      setSuccess(`✅ Cash call updated successfully!`)
      setEditingCashCall(null)
      setEditForm({})
      
      // Reload cash calls list
      const updatedCashCalls = await getCashCalls()
      setCashCalls(updatedCashCalls)

    } catch (err) {
      console.error('Error updating cash call:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setUpdating(null)
    }
  }

  const startEditCashCall = (cashCall: any) => {
    setEditingCashCall(cashCall.id)
    setEditForm({
      call_number: cashCall.call_number || '',
      title: cashCall.title || '',
      description: cashCall.description || '',
      amount_requested: cashCall.amount_requested || '',
      status: cashCall.status || 'draft',
      priority: cashCall.priority || 'medium',
      currency: cashCall.currency || 'USD',
      exchange_rate: cashCall.exchange_rate || 1,
      compliance_status: cashCall.compliance_status || 'pending',
      justification: cashCall.justification || ''
    })
  }

  const cancelEdit = () => {
    setEditingCashCall(null)
    setEditForm({})
  }

  // Filter cash calls based on current filters
  const filteredCashCalls = cashCalls.filter(cashCall => {
    if (filters.status !== 'all' && cashCall.status !== filters.status) return false
    if (filters.affiliate !== 'all' && cashCall.affiliate_id !== filters.affiliate) return false
    if (filters.priority !== 'all' && cashCall.priority !== filters.priority) return false
    if (filters.search && !cashCall.call_number.toLowerCase().includes(filters.search.toLowerCase()) && 
        !cashCall.title?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !cashCall.description?.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.dateFrom && new Date(cashCall.created_at) < new Date(filters.dateFrom)) return false
    if (filters.dateTo && new Date(cashCall.created_at) > new Date(filters.dateTo)) return false
    return true
  })

  // Group cash calls by status
  const cashCallsByStatus = {
    draft: filteredCashCalls.filter(cc => cc.status === 'draft'),
    under_review: filteredCashCalls.filter(cc => cc.status === 'under_review'),
    approved: filteredCashCalls.filter(cc => cc.status === 'approved'),
    rejected: filteredCashCalls.filter(cc => cc.status === 'rejected'),
    completed: filteredCashCalls.filter(cc => cc.status === 'completed')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'under_review': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Manage Cash Calls</h1>
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
          <h1 className="text-3xl font-bold mb-8">Manage Cash Calls</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold">Access Denied</h2>
            <p className="text-red-600 mt-2">Only admin users can manage cash calls.</p>
          </div>
        </div>
      </div>
    )
  }

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
        <h1 className="text-3xl font-bold mb-8">Manage Cash Calls</h1>
        
        {/* Summary */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 text-sm">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="font-semibold text-blue-800">Total Cash Calls</div>
              <div className="text-2xl font-bold text-blue-600">{cashCalls.length}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="font-semibold text-gray-800">Draft</div>
              <div className="text-2xl font-bold text-gray-600">{cashCallsByStatus.draft.length}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="font-semibold text-yellow-800">Under Review</div>
              <div className="text-2xl font-bold text-yellow-600">{cashCallsByStatus.under_review.length}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="font-semibold text-green-800">Approved</div>
              <div className="text-2xl font-bold text-green-600">{cashCallsByStatus.approved.length}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="font-semibold text-red-800">Rejected</div>
              <div className="text-2xl font-bold text-red-600">{cashCallsByStatus.rejected.length}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="font-semibold text-blue-800">Completed</div>
              <div className="text-2xl font-bold text-blue-600">{cashCallsByStatus.completed.length}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search by call number, title, or description"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Affiliate</label>
              <select
                value={filters.affiliate}
                onChange={(e) => setFilters(prev => ({ ...prev, affiliate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Affiliates</option>
                {affiliates.map(affiliate => (
                  <option key={affiliate.id} value={affiliate.id}>
                    {affiliate.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: 'all', affiliate: 'all', priority: 'all', search: '', dateFrom: '', dateTo: '' })}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Clear Filters
              </button>
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

        {/* Cash Calls List */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            Cash Calls ({filteredCashCalls.length} of {cashCalls.length})
          </h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading cash calls...</p>
            </div>
          ) : filteredCashCalls.length > 0 ? (
            <div className="space-y-4">
              {filteredCashCalls.map((cashCall) => {
                const affiliate = affiliates.find(a => a.id === cashCall.affiliate_id)
                const createdByUser = users.find(u => u.id === cashCall.created_by)
                const approvedByUser = users.find(u => u.id === cashCall.approved_by)
                const isEditing = editingCashCall === cashCall.id
                
                return (
                  <div key={cashCall.id} className="p-4 border border-gray-200 rounded-lg bg-white">
                    {isEditing ? (
                      // Edit Form
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Call Number</label>
                            <input
                              type="text"
                              value={editForm.call_number || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, call_number: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                              type="text"
                              value={editForm.title || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Requested</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editForm.amount_requested || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, amount_requested: parseFloat(e.target.value) || 0 }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                              value={editForm.status || 'draft'}
                              onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="draft">Draft</option>
                              <option value="under_review">Under Review</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <select
                              value={editForm.priority || 'medium'}
                              onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="critical">Critical</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                            <select
                              value={editForm.currency || 'USD'}
                              onChange={(e) => setEditForm(prev => ({ ...prev, currency: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="USD">USD</option>
                              <option value="EUR">EUR</option>
                              <option value="GBP">GBP</option>
                              <option value="SAR">SAR</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            value={editForm.description || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Justification</label>
                          <textarea
                            value={editForm.justification || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, justification: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateCashCall(cashCall.id)}
                            disabled={updating === cashCall.id}
                            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                          >
                            {updating === cashCall.id ? 'Updating...' : 'Save Changes'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Display Mode
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{cashCall.call_number}</h3>
                            <span className={`px-2 py-1 text-xs rounded ${getStatusColor(cashCall.status)}`}>
                              {cashCall.status.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(cashCall.priority)}`}>
                              {cashCall.priority}
                            </span>
                          </div>
                          {cashCall.title && (
                            <div className="text-sm font-medium text-gray-800 mb-1">{cashCall.title}</div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Amount:</span>
                              <span className="ml-2">{cashCall.currency} {cashCall.amount_requested?.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Affiliate:</span>
                              <span className="ml-2">{affiliate?.name || 'Unknown'}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Created by:</span>
                              <span className="ml-2">{createdByUser?.email || 'Unknown'}</span>
                            </div>
                          </div>
                          {cashCall.description && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">Description:</span> {cashCall.description}
                            </div>
                          )}
                          <div className="mt-2 text-xs text-gray-500">
                            Created: {new Date(cashCall.created_at).toLocaleDateString()}
                            {cashCall.updated_at && (
                              <span className="ml-4">
                                Updated: {new Date(cashCall.updated_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditCashCall(cashCall)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(cashCall.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Delete Confirmation */}
                    {showDeleteConfirm === cashCall.id && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 font-semibold mb-2">
                          Are you sure you want to delete cash call "{cashCall.call_number}"?
                        </p>
                        <p className="text-red-600 text-sm mb-3">
                          This action cannot be undone. The cash call will be permanently removed from the database.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteCashCall(cashCall.id)}
                            disabled={deleting === cashCall.id}
                            className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                          >
                            {deleting === cashCall.id ? 'Deleting...' : 'Yes, Delete'}
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
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No cash calls found matching the current filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
