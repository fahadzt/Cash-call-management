"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  UserPlus, 
  Eye, 
  AlertTriangle,
  Building2,
  Mail,
  Phone,
  Briefcase,
  Users
} from 'lucide-react'

interface AccountRequest {
  id: string
  email: string
  full_name: string
  position: string
  department: string
  phone: string
  affiliate_company_id: string | null
  reason_for_access: string
  manager_name: string
  manager_email: string
  status: 'pending' | 'approved' | 'rejected' | 'in_review'
  requested_at: string
  affiliate?: { name: string }
}

interface Affiliate {
  id: string
  name: string
}

interface AccountRequestsManagerProps {
  requests: AccountRequest[]
  affiliates: Affiliate[]
  onApprove: (requestId: string, approvalData: any) => Promise<void>
  onReject: (requestId: string, rejectionData: any) => Promise<void>
  onRequestMoreInfo: (requestId: string, message: string) => Promise<void>
}

export function AccountRequestsManager({ 
  requests, 
  affiliates, 
  onApprove, 
  onReject, 
  onRequestMoreInfo 
}: AccountRequestsManagerProps) {
  const [selectedRequest, setSelectedRequest] = useState<AccountRequest | null>(null)
  const [approvalForm, setApprovalForm] = useState({
    role: 'viewer',
    affiliateCompanyId: '',
    notes: '',
    sendWelcomeEmail: true,
    temporaryPassword: ''
  })
  const [rejectionForm, setRejectionForm] = useState({
    reason: '',
    notes: ''
  })
  const [moreInfoForm, setMoreInfoForm] = useState({
    message: ''
  })
  const [isProcessing, setIsProcessing] = useState(false)

  const generateTemporaryPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const handleApprove = async (requestId: string) => {
    if (!selectedRequest) return

    setIsProcessing(true)
    try {
      // Generate temporary password if not already set
      if (!approvalForm.temporaryPassword) {
        setApprovalForm(prev => ({ ...prev, temporaryPassword: generateTemporaryPassword() }))
      }

      await onApprove(requestId, {
        ...approvalForm,
        temporaryPassword: approvalForm.temporaryPassword || generateTemporaryPassword()
      })

      setSelectedRequest(null)
      setApprovalForm({
        role: 'viewer',
        affiliateCompanyId: '',
        notes: '',
        sendWelcomeEmail: true,
        temporaryPassword: ''
      })
    } catch (error) {
      console.error('Error approving request:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async (requestId: string) => {
    if (!selectedRequest) return

    setIsProcessing(true)
    try {
      await onReject(requestId, rejectionForm)
      setSelectedRequest(null)
      setRejectionForm({ reason: '', notes: '' })
    } catch (error) {
      console.error('Error rejecting request:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRequestMoreInfo = async (requestId: string) => {
    if (!selectedRequest) return

    setIsProcessing(true)
    try {
      await onRequestMoreInfo(requestId, moreInfoForm.message)
      setSelectedRequest(null)
      setMoreInfoForm({ message: '' })
    } catch (error) {
      console.error('Error requesting more info:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
      case 'in_review':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800"><Eye className="w-3 h-3 mr-1" />In Review</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const approvedRequests = requests.filter(r => r.status === 'approved')
  const rejectedRequests = requests.filter(r => r.status === 'rejected')

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedRequests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedRequests.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Account Requests List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Account Requests ({pendingRequests.length} pending)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending account requests
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{request.full_name}</h3>
                        {getStatusBadge(request.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span>{request.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-gray-500" />
                          <span>{request.position} at {request.department}</span>
                        </div>
                        {request.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span>{request.phone}</span>
                          </div>
                        )}
                        {request.affiliate_company_id && (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-500" />
                            <span>{request.affiliate?.name || 'Unknown Affiliate'}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3">
                        <div className="text-sm font-medium text-gray-700 mb-1">Reason for Access:</div>
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{request.reason_for_access}</p>
                      </div>
                      
                      <div className="mt-3 text-xs text-gray-500">
                        <div>Manager: {request.manager_name} ({request.manager_email})</div>
                        <div>Requested: {new Date(request.requested_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setSelectedRequest(request)}
                        variant="outline"
                        size="sm"
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Review Account Request</h3>
              
              {/* Request Details */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium mb-2">Request Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Name:</span> {selectedRequest.full_name}</div>
                  <div><span className="font-medium">Email:</span> {selectedRequest.email}</div>
                  <div><span className="font-medium">Position:</span> {selectedRequest.position}</div>
                  <div><span className="font-medium">Department:</span> {selectedRequest.department}</div>
                  {selectedRequest.phone && <div><span className="font-medium">Phone:</span> {selectedRequest.phone}</div>}
                  {selectedRequest.affiliate_company_id && (
                    <div><span className="font-medium">Affiliate:</span> {selectedRequest.affiliate?.name}</div>
                  )}
                </div>
              </div>

              {/* Approval Form */}
              <div className="space-y-4 mb-6">
                <div>
                  <Label htmlFor="role">Assigned Role *</Label>
                  <Select
                    value={approvalForm.role}
                    onValueChange={(value) => setApprovalForm(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                      <SelectItem value="affiliate">Affiliate - Manage own cash calls</SelectItem>
                      <SelectItem value="approver">Approver - Review and approve cash calls</SelectItem>
                      <SelectItem value="admin">Admin - Full system access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="affiliateCompany">Affiliate Company</Label>
                  <Select
                    value={approvalForm.affiliateCompanyId}
                    onValueChange={(value) => setApprovalForm(prev => ({ ...prev, affiliateCompanyId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select affiliate company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Affiliate Company</SelectItem>
                      {affiliates.map((affiliate) => (
                        <SelectItem key={affiliate.id} value={affiliate.id}>
                          {affiliate.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Approval Notes</Label>
                  <Textarea
                    id="notes"
                    value={approvalForm.notes}
                    onChange={(e) => setApprovalForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Optional notes about this approval..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sendWelcomeEmail"
                    checked={approvalForm.sendWelcomeEmail}
                    onChange={(e) => setApprovalForm(prev => ({ ...prev, sendWelcomeEmail: e.target.checked }))}
                  />
                  <Label htmlFor="sendWelcomeEmail">Send welcome email with credentials</Label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => handleApprove(selectedRequest.id)}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? 'Creating Account...' : 'Approve & Create Account'}
                </Button>
                <Button
                  onClick={() => setSelectedRequest(null)}
                  variant="outline"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
