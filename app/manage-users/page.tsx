'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase-auth-context'
import { getUsers, getAffiliates, updateUser, deleteUser } from '@/lib/firebase-database'
import { AccountRequestsManager } from '@/components/account-requests-manager'

export default function ManageUsers() {
  const { user, userProfile } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [accountRequests, setAccountRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [filters, setFilters] = useState({
    role: 'all',
    affiliate: 'all',
    search: ''
  })
  const [showRequests, setShowRequests] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid || !userProfile) {
        setError('Please log in first')
        return
      }

      // Only allow admin users to manage users
      if (userProfile.role !== 'admin') {
        setError('Only admin users can manage users')
        return
      }

      try {
        setLoading(true)
        setError('')

        console.log('=== LOADING USERS FOR MANAGEMENT ===')
        
        const [usersData, affiliatesData, requestsData] = await Promise.all([
          getUsers(),
          getAffiliates(),
          fetch('/api/account-requests').then(res => res.json()).then(data => data.requests || [])
        ])
        
        setUsers(usersData)
        setAffiliates(affiliatesData)
        setAccountRequests(requestsData)
        
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

  const handleDeleteUser = async (userId: string) => {
    try {
      setDeleting(userId)
      setError('')
      setSuccess('')

      console.log('Deleting user:', userId)
      await deleteUser(userId)
      
      setSuccess(`✅ User deleted successfully!`)
      setShowDeleteConfirm(null)
      
      // Reload users list
      const updatedUsers = await getUsers()
      setUsers(updatedUsers)

    } catch (err) {
      console.error('Error deleting user:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setShowDeleteConfirm(null)
    } finally {
      setDeleting(null)
    }
  }

  const handleUpdateUser = async (userId: string) => {
    try {
      setUpdating(userId)
      setError('')
      setSuccess('')

      console.log('Updating user:', userId, editForm)
      await updateUser(userId, editForm)
      
      setSuccess(`✅ User updated successfully!`)
      setEditingUser(null)
      setEditForm({})
      
      // Reload users list
      const updatedUsers = await getUsers()
      setUsers(updatedUsers)

    } catch (err) {
      console.error('Error updating user:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setUpdating(null)
    }
  }

  const startEditUser = (user: any) => {
    setEditingUser(user.id)
    setEditForm({
      full_name: user.full_name || '',
      role: user.role || 'viewer',
      affiliate_company_id: user.affiliate_company_id || '',
      position: user.position || '',
      phone: user.phone || '',
      is_active: user.is_active !== false
    })
  }

  const cancelEdit = () => {
    setEditingUser(null)
    setEditForm({})
  }

  // Account Request Management Functions
  const handleApproveRequest = async (requestId: string, approvalData: any) => {
    try {
      setError("")
      setSuccess("")

      // Create user account with Firebase Auth
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          ...approvalData
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create account')
      }

      setSuccess(`✅ Account created successfully for ${approvalData.email || 'user'}!`)
      
      // Reload data
      const [usersData, requestsData] = await Promise.all([
        getUsers(),
        fetch('/api/account-requests').then(res => res.json()).then(data => data.requests || [])
      ])
      
      setUsers(usersData)
      setAccountRequests(requestsData)

    } catch (err) {
      console.error('Error creating account:', err)
      setError(err instanceof Error ? err.message : 'Failed to create account')
    }
  }

  const handleRejectRequest = async (requestId: string, rejectionData: any) => {
    try {
      setError("")
      setSuccess("")

      const response = await fetch(`/api/account-requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rejectionData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject request')
      }

      setSuccess(`✅ Account request rejected successfully!`)
      
      // Reload requests
      const requestsData = await fetch('/api/account-requests').then(res => res.json()).then(data => data.requests || [])
      setAccountRequests(requestsData)

    } catch (err) {
      console.error('Error rejecting request:', err)
      setError(err instanceof Error ? err.message : 'Failed to reject request')
    }
  }

  const handleRequestMoreInfo = async (requestId: string, message: string) => {
    try {
      setError("")
      setSuccess("")

      const response = await fetch(`/api/account-requests/${requestId}/request-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to request more info')
      }

      setSuccess(`✅ Information request sent successfully!`)
      
      // Reload requests
      const requestsData = await fetch('/api/account-requests').then(res => res.json()).then(data => data.requests || [])
      setAccountRequests(requestsData)

    } catch (err) {
      console.error('Error requesting more info:', err)
      setError(err instanceof Error ? err.message : 'Failed to request more info')
    }
  }

  // Filter users based on current filters
  const filteredUsers = users.filter(user => {
    if (filters.role !== 'all' && user.role !== filters.role) return false
    if (filters.affiliate !== 'all' && user.affiliate_company_id !== filters.affiliate) return false
    if (filters.search && !user.email.toLowerCase().includes(filters.search.toLowerCase()) && 
        !user.full_name?.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  // Group users by role
  const usersByRole = {
    admin: filteredUsers.filter(u => u.role === 'admin'),
    approver: filteredUsers.filter(u => u.role === 'approver'),
    affiliate: filteredUsers.filter(u => u.role === 'affiliate'),
    viewer: filteredUsers.filter(u => u.role === 'viewer')
  }

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Manage Users</h1>
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
          <h1 className="text-3xl font-bold mb-8">Manage Users</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold">Access Denied</h2>
            <p className="text-red-600 mt-2">Only admin users can manage users.</p>
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
          <h1 className="text-3xl font-bold">User Management</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setShowRequests(false)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !showRequests 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Manage Users ({users.length})
          </button>
          <button
            onClick={() => setShowRequests(true)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showRequests 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-gray-800 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Account Requests ({accountRequests.filter(r => r.status === 'pending').length} pending)
          </button>
        </div>

        {/* Conditional Content */}
        {showRequests ? (
          <AccountRequestsManager
            requests={accountRequests}
            affiliates={affiliates}
            onApprove={handleApproveRequest}
            onReject={handleRejectRequest}
            onRequestMoreInfo={handleRequestMoreInfo}
          />
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-8">Manage Users</h1>
        
        {/* Summary */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="font-semibold text-blue-800">Total Users</div>
              <div className="text-2xl font-bold text-blue-600">{users.length}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="font-semibold text-red-800">Admins</div>
              <div className="text-2xl font-bold text-red-600">{usersByRole.admin.length}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="font-semibold text-yellow-800">Approvers</div>
              <div className="text-2xl font-bold text-yellow-600">{usersByRole.approver.length}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="font-semibold text-green-800">Affiliates</div>
              <div className="text-2xl font-bold text-green-600">{usersByRole.affiliate.length}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="font-semibold text-gray-800">Viewers</div>
              <div className="text-2xl font-bold text-gray-600">{usersByRole.viewer.length}</div>
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
                placeholder="Search by email or name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={filters.role}
                onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="approver">Approver</option>
                <option value="affiliate">Affiliate</option>
                <option value="viewer">Viewer</option>
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
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ role: 'all', affiliate: 'all', search: '' })}
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

        {/* Users List */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            Users ({filteredUsers.length} of {users.length})
          </h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading users...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="space-y-4">
              {filteredUsers.map((user) => {
                const affiliate = affiliates.find(a => a.id === user.affiliate_company_id)
                const isEditing = editingUser === user.id
                
                return (
                  <div key={user.id} className={`p-4 border rounded-lg ${
                    user.is_active === false ? 'border-gray-200 bg-gray-50' : 'border-gray-200 bg-white'
                  }`}>
                    {isEditing ? (
                      // Edit Form
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                              type="text"
                              value={editForm.full_name || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select
                              value={editForm.role || 'viewer'}
                              onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="admin">Admin</option>
                              <option value="approver">Approver</option>
                              <option value="affiliate">Affiliate</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Affiliate</label>
                            <select
                              value={editForm.affiliate_company_id || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, affiliate_company_id: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">No Affiliate</option>
                              {affiliates.map(affiliate => (
                                <option key={affiliate.id} value={affiliate.id}>
                                  {affiliate.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                            <input
                              type="text"
                              value={editForm.position || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, position: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editForm.is_active !== false}
                              onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.checked }))}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">Active</span>
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateUser(user.id)}
                            disabled={updating === user.id}
                            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                          >
                            {updating === user.id ? 'Updating...' : 'Save Changes'}
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
                            <h3 className="text-lg font-semibold">{user.email}</h3>
                            <span className={`px-2 py-1 text-xs rounded ${
                              user.role === 'admin' ? 'bg-red-100 text-red-800' :
                              user.role === 'approver' ? 'bg-yellow-100 text-yellow-800' :
                              user.role === 'affiliate' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role}
                            </span>
                            {user.is_active === false && (
                              <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Name:</span>
                              <span className="ml-2">{user.full_name || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Affiliate:</span>
                              <span className="ml-2">{affiliate?.name || 'None'}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Position:</span>
                              <span className="ml-2">{user.position || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            User ID: {user.id}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditUser(user)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(user.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Delete Confirmation */}
                    {showDeleteConfirm === user.id && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 font-semibold mb-2">
                          Are you sure you want to delete user "{user.email}"?
                        </p>
                        <p className="text-red-600 text-sm mb-3">
                          This action cannot be undone. The user will be permanently removed from the database.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deleting === user.id}
                            className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                          >
                            {deleting === user.id ? 'Deleting...' : 'Yes, Delete'}
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
              <p className="text-gray-600">No users found matching the current filters.</p>
            </div>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  )
}
