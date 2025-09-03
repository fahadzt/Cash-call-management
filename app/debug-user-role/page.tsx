"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase-auth-context'
import { getUserProfile, updateUser, getUsers } from '@/lib/firebase-database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

export default function DebugUserRole() {
  const { user, userProfile } = useAuth()
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [newRole, setNewRole] = useState<string>('')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const users = await getUsers()
      setAllUsers(users)
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const updateUserRole = async () => {
    if (!selectedUser || !newRole) return

    setIsUpdating(true)
    try {
      await updateUser(selectedUser, { role: newRole })
      alert('User role updated successfully!')
      loadUsers()
    } catch (error) {
      console.error('Error updating user role:', error)
      alert('Error updating user role')
    } finally {
      setIsUpdating(false)
    }
  }

  const setFinanceRole = async (userId: string) => {
    setIsUpdating(true)
    try {
      await updateUser(userId, { role: 'finance' })
      alert('User role set to finance successfully!')
      loadUsers()
    } catch (error) {
      console.error('Error setting finance role:', error)
      alert('Error setting finance role')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold">Debug User Role</h1>

      {/* Current User Info */}
      <Card>
        <CardHeader>
          <CardTitle>Current User</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>User ID:</strong> {user?.uid}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Name:</strong> {userProfile?.full_name}</p>
            <p><strong>Role:</strong> 
              <Badge className="ml-2">
                {userProfile?.role || 'undefined'}
              </Badge>
            </p>
            <p><strong>Is Finance:</strong> {userProfile?.role === 'finance' ? 'YES' : 'NO'}</p>
          </div>
        </CardContent>
      </Card>

      {/* All Users */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-semibold">{user.full_name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <Badge className="mt-1">
                    {user.role}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {user.role !== 'finance' && (
                    <Button
                      size="sm"
                      onClick={() => setFinanceRole(user.id)}
                      disabled={isUpdating}
                    >
                      Set Finance
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Update User Role */}
      <Card>
        <CardHeader>
          <CardTitle>Update User Role</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select User</label>
              <Select onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} ({user.email}) - {user.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">New Role</label>
              <Select onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="affiliate">Affiliate</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="approver">Approver</SelectItem>
                  <SelectItem value="cfo">CFO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={updateUserRole}
              disabled={!selectedUser || !newRole || isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Update Role'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
