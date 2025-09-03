"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Users, UserCheck, UserX } from 'lucide-react'
import { useAuth } from '@/lib/firebase-auth-context'
import { getUsers, getUsersByRole, assignCashCallToFinance, unassignCashCall, type User as FirebaseUser } from '@/lib/firebase-database'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  companyId: string
  is_active: boolean
}

interface CashCallAssignmentProps {
  cashCallId: string
  currentAssigneeId?: string
  onAssignmentChange: (assigneeId: string | null) => void
}

export function CashCallAssignment({ 
  cashCallId, 
  currentAssigneeId, 
  onAssignmentChange 
}: CashCallAssignmentProps) {
  const { user, userProfile } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [financeUsers, setFinanceUsers] = useState<FirebaseUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentAssignee, setCurrentAssignee] = useState<FirebaseUser | null>(null)

  // Debug: Log the cashCallId when component mounts
  console.log('Debug - CashCallAssignment component props:', {
    cashCallId,
    currentAssigneeId,
    cashCallIdType: typeof cashCallId,
    cashCallIdLength: cashCallId?.length,
    userRole: userProfile?.role
  })

  // Only show for ADMIN users
  if (!user || userProfile?.role !== 'admin') {
    return null
  }

  useEffect(() => {
    if (isOpen) {
      loadFinanceUsers()
      if (currentAssigneeId) {
        loadCurrentAssignee()
      }
    }
  }, [isOpen, currentAssigneeId])

  const loadFinanceUsers = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      // Debug: First get all users to see what roles exist
      const allUsers = await getUsers()
      console.log('Debug - All users in database:', allUsers.map(u => ({ id: u.id, email: u.email, role: u.role, is_active: u.is_active })))
      
      // Try different role variations for finance users
      const possibleFinanceRoles = ['finance', 'FINANCE', 'Finance', 'viewer', 'approver']
      let financeUsers: FirebaseUser[] = []
      
      for (const role of possibleFinanceRoles) {
        try {
          console.log(`Debug - Trying role: ${role}`)
          const usersWithRole = allUsers.filter(user => user.role === role)
          console.log(`Debug - Found ${usersWithRole.length} users with role '${role}':`, usersWithRole.map(u => ({ id: u.id, email: u.email, role: u.role })))
          
          if (usersWithRole.length > 0) {
            financeUsers = usersWithRole
            console.log(`Debug - Using users with role '${role}'`)
            break
          }
        } catch (error) {
          console.log(`Debug - Error trying role '${role}':`, error)
        }
      }
      
      // If no finance users found, show all users for debugging
      if (financeUsers.length === 0) {
        console.log('Debug - No finance users found, showing all users for debugging')
        financeUsers = allUsers
      }
      
      setFinanceUsers(financeUsers)
    } catch (error) {
      console.error('Error loading finance users:', error)
      setError('Failed to load finance users')
    } finally {
      setIsLoading(false)
    }
  }

  const loadCurrentAssignee = async () => {
    if (!currentAssigneeId) return
    
    try {
      const allUsers = await getUsers()
      const assignee = allUsers.find((u: FirebaseUser) => u.id === currentAssigneeId)
      setCurrentAssignee(assignee || null)
    } catch (error) {
      console.error('Error loading current assignee:', error)
    }
  }

  const handleAssign = async () => {
    if (!selectedUserId) return
    
    setIsLoading(true)
    setError('')
    
    try {
      console.log('Debug - Assignment parameters:', {
        cashCallId,
        selectedUserId,
        adminUserId: user.uid,
        cashCallIdType: typeof cashCallId,
        cashCallIdLength: cashCallId?.length
      })
      
      if (!cashCallId || cashCallId.trim() === '') {
        throw new Error('Invalid cash call ID')
      }
      
      await assignCashCallToFinance(cashCallId, selectedUserId, user.uid)
      onAssignmentChange(selectedUserId)
      setIsOpen(false)
      setSelectedUserId('')
    } catch (error) {
      console.error('Error assigning cash call:', error)
      setError('Failed to assign cash call')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnassign = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      console.log('Debug - Unassignment parameters:', {
        cashCallId,
        adminUserId: user.uid,
        cashCallIdType: typeof cashCallId,
        cashCallIdLength: cashCallId?.length
      })
      
      if (!cashCallId || cashCallId.trim() === '') {
        throw new Error('Invalid cash call ID')
      }
      
      await unassignCashCall(cashCallId, user.uid)
      onAssignmentChange(null)
      setIsOpen(false)
      setCurrentAssignee(null)
    } catch (error) {
      console.error('Error unassigning cash call:', error)
      setError('Failed to unassign cash call')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentAssignee ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">{currentAssignee.full_name}</p>
                  <p className="text-sm text-gray-600">{currentAssignee.email}</p>
                </div>
                <Badge variant="secondary">Assigned</Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnassign}
                disabled={isLoading}
              >
                <UserX className="h-4 w-4 mr-2" />
                Unassign
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserX className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-600">No assignment</p>
                  <p className="text-sm text-gray-500">Cash call is not assigned to any finance user</p>
                </div>
              </div>
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Assign Finance
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign to Finance User</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Finance User</label>
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a finance user..." />
                        </SelectTrigger>
                        <SelectContent>
                          {financeUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{user.full_name}</span>
                                <span className="text-sm text-gray-500">{user.email}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAssign}
                        disabled={!selectedUserId || isLoading}
                      >
                        {isLoading ? 'Assigning...' : 'Assign'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
