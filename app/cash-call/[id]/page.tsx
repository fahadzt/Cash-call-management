"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Building2,
  User,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Download,
  Upload,
  Edit,
  Save,
  X,
  AlertCircle,
  MessageSquare,
  Shield,
  BarChart3,
} from "lucide-react"
import { useAuth } from "@/lib/firebase-auth-context"
import { ExportButton } from "@/components/export-functions"
import { AnimatedLoading } from "@/components/animated-loading"
import { DocumentUpload, DocumentList } from "@/components/document-upload"
import { DocumentDebug } from "@/components/document-debug"
import { CashCallAssignment } from "@/components/cash-call-assignment"
import { 
  getCashCall, 
  getCashCalls, 
  updateCashCall,
  createComment,
  getComments,
  getAffiliate,
  getDocumentsForCashCall,
  getActivityLogs,
  logActivity,
  type CashCall,
  type Document,
  type Comment,
  type ActivityLog
} from "@/lib/firebase-database"

export default function CashCallDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const cashCallId = params.id as string
  const { user, userProfile, loading } = useAuth()

  const [cashCall, setCashCall] = useState<CashCall | null>(null)
  const [affiliate, setAffiliate] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [newComment, setNewComment] = useState("")
  const [isPostingComment, setIsPostingComment] = useState(false)
  const [allCashCalls, setAllCashCalls] = useState<CashCall[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [activeTab, setActiveTab] = useState("details")
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isLoadingActivity, setIsLoadingActivity] = useState(false)
  const [showAdminOverrideDialog, setShowAdminOverrideDialog] = useState(false)
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(null)
  const [showAllActivities, setShowAllActivities] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    description: "",
    amount_requested: 0,
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!loading && user && cashCallId) {
      loadCashCall()
    }
  }, [user, cashCallId, loading])

  const handlePostComment = async () => {
    if (!newComment.trim() || !cashCall || !user) return

    try {
      setIsPostingComment(true)
      setError("")

      const commentId = await createComment({
        cash_call_id: cashCall.id,
        user_id: user.uid,
        content: newComment.trim(),
        is_internal: false,
        is_private: false,
      })

      // Log activity
      await logActivity({
        user_id: user.uid,
        action: 'commented',
        entity_type: 'cash_call',
        entity_id: cashCall.id,
        metadata: { comment_id: commentId }
      })

      // Refresh comments
      await loadComments()
      
      setNewComment("")
      setSuccess("Comment posted successfully")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error posting comment:", err)
      setError("Failed to post comment")
    } finally {
      setIsPostingComment(false)
    }
  }

  const loadCashCall = async () => {
    try {
      setIsLoading(true)
      setError("")

      const [data, allData, documentsData] = await Promise.all([
        getCashCall(cashCallId), 
        getCashCalls(),
        getDocumentsForCashCall(cashCallId, user?.uid, userProfile?.role)
      ])

      if (!data) {
        setError("Cash call not found")
        return
      }

      setCashCall(data)
      setAllCashCalls(allData)
      setDocuments(documentsData)
      setEditForm({
        description: data.description || "",
        amount_requested: data.amount_requested,
      })

      // Load affiliate data
      if (data.affiliate_id) {
        try {
          const affiliateData = await getAffiliate(data.affiliate_id)
          if (affiliateData) {
            setAffiliate(affiliateData)
          } else {
            console.warn(`Affiliate with ID ${data.affiliate_id} not found - this is normal for test data`)
            setAffiliate(null)
          }
        } catch (err) {
          console.warn("Error loading affiliate data - this is normal for test data:", err)
          setAffiliate(null)
        }
      }

      // Load comments and activity logs
      loadComments()
      loadActivityLogs()
    } catch (err) {
      console.error("Error loading cash call:", err)
      setError("Failed to load cash call details")
    } finally {
      setIsLoading(false)
    }
  }

  const loadComments = async () => {
    try {
      setIsLoadingComments(true)
      const commentsData = await getComments(cashCallId)
      setComments(commentsData)
    } catch (err) {
      console.error("Error loading comments:", err)
    } finally {
      setIsLoadingComments(false)
    }
  }

  const loadActivityLogs = async () => {
    try {
      setIsLoadingActivity(true)
      const logs = await getActivityLogs({ entity_id: cashCallId, entity_type: 'cash_call' })
      setActivityLogs(logs)
    } catch (err) {
      console.error("Error loading activity logs:", err)
    } finally {
      setIsLoadingActivity(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!cashCall || !user) return

    try {
      setError("")
      await updateCashCall(cashCall.id, { status: newStatus as any }, user.uid)
      
      // Log activity
      await logActivity({
        user_id: user.uid,
        action: 'status_changed',
        entity_type: 'cash_call',
        entity_id: cashCall.id,
        old_values: { status: cashCall.status },
        new_values: { status: newStatus }
      })
      
      // Reload the cash call to get updated data
      const updatedCall = await getCashCall(cashCall.id)
      if (updatedCall) {
        setCashCall(updatedCall)
      }
      
      // Refresh activity logs
      await loadActivityLogs()
      
      setSuccess(`Status updated to ${newStatus}`)
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error updating status:", err)
      setError("Failed to update status")
    }
  }

  const handleAdminStatusChange = (newStatus: string) => {
    setPendingStatusChange(newStatus)
    setShowAdminOverrideDialog(true)
  }

  const confirmAdminStatusChange = async () => {
    if (!pendingStatusChange) return
    
    try {
      setError("")
      
      // Update the cash call status
      await updateCashCall(cashCall!.id, { status: pendingStatusChange as any }, user!.uid)
      
      // Log activity with admin override note
      await logActivity({
        user_id: user!.uid,
        action: 'status_changed',
        entity_type: 'cash_call',
        entity_id: cashCall!.id,
        old_values: { status: cashCall!.status },
        new_values: { status: pendingStatusChange },
        metadata: { admin_override: true }
      })
      
      // Reload the cash call to get updated data
      const updatedCall = await getCashCall(cashCall!.id)
      if (updatedCall) {
        setCashCall(updatedCall)
      }
      
      // Refresh activity logs
      await loadActivityLogs()
      
      setSuccess(`Admin override: Status changed to ${pendingStatusChange}`)
      setTimeout(() => setSuccess(""), 5000)
    } catch (err) {
      console.error("Error updating status:", err)
      setError("Failed to update status")
    } finally {
      setShowAdminOverrideDialog(false)
      setPendingStatusChange(null)
    }
  }

  const handleSaveEdit = async () => {
    if (!cashCall || !user) return

    // Only admin users can edit cash calls
    if (userProfile?.role?.toLowerCase() !== "admin") {
      setError("Only admin users can edit cash calls")
      return
    }

    try {
      setIsSaving(true)
      setError("")

      const updates = {
        description: editForm.description,
        amount_requested: editForm.amount_requested,
      }

      await updateCashCall(cashCall.id, updates, user.uid)
      
      // Log activity
      await logActivity({
        user_id: user.uid,
        action: 'updated',
        entity_type: 'cash_call',
        entity_id: cashCall.id,
        old_values: { 
          description: cashCall.description,
          amount_requested: cashCall.amount_requested 
        },
        new_values: updates
      })
      
      // Reload the cash call to get updated data
      const updatedCall = await getCashCall(cashCall.id)
      if (updatedCall) {
        setCashCall(updatedCall)
      }
      
      // Refresh activity logs
      await loadActivityLogs()
      
      setIsEditing(false)
      setSuccess("Cash call updated successfully")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error updating cash call:", err)
      setError("Failed to update cash call")
    } finally {
      setIsSaving(false)
    }
  }

  // Document management functions
  const handleDocumentUploaded = async (document: Document) => {
    setDocuments(prev => [document, ...prev])
    
    // Log activity
    if (user) {
      try {
        await logActivity({
          user_id: user.uid,
          action: 'document_uploaded',
          entity_type: 'cash_call',
          entity_id: cashCallId,
          metadata: { document_id: document.id, document_name: document.original_name }
        })
        await loadActivityLogs()
      } catch (err) {
        console.error("Error logging document upload activity:", err)
      }
    }
  }

  const handleDocumentDeleted = async (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId))
    
    // Log activity
    if (user) {
      try {
        await logActivity({
          user_id: user.uid,
          action: 'document_deleted',
          entity_type: 'cash_call',
          entity_id: cashCallId,
          metadata: { document_id: documentId }
        })
        await loadActivityLogs()
      } catch (err) {
        console.error("Error logging document deletion activity:", err)
      }
    }
  }

  const handleDocumentUpdated = async (updatedDocument: Document) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === updatedDocument.id ? updatedDocument : doc
    ))
    
    // Log activity
    if (user) {
      try {
        await logActivity({
          user_id: user.uid,
          action: 'document_updated',
          entity_type: 'cash_call',
          entity_id: cashCallId,
          metadata: { document_id: updatedDocument.id, document_name: updatedDocument.original_name }
        })
        await loadActivityLogs()
      } catch (err) {
        console.error("Error logging document update activity:", err)
      }
    }
  }

  // Check if user can manage documents
  const canManageDocuments = () => {
    if (!userProfile) return false
    return userProfile.role === 'admin' || userProfile.role === 'approver' || 
           (userProfile.role === 'affiliate' && cashCall?.created_by === user?.uid)
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-500 text-white"
      case "under_review":
        return "bg-yellow-500 text-white"
      case "finance_review":
        return "bg-yellow-500 text-white"
      case "ready_for_cfo":
        return "bg-orange-500 text-white"
      case "approved":
        return "bg-green-500 text-white"
      case "paid":
        return "bg-blue-500 text-white"
      case "rejected":
        return "bg-red-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case "draft":
        return "Draft"
      case "under_review":
        return "Under Review"
      case "finance_review":
        return "Finance Review"
      case "ready_for_cfo":
        return "Ready for CFO"
      case "approved":
        return "Approved"
      case "paid":
        return "Paid"
      case "rejected":
        return "Rejected"
      default:
        return status
    }
  }

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "created":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "submitted":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "paid":
        return <DollarSign className="h-4 w-4 text-green-600" />
      case "updated":
        return <Edit className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleString()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (loading) {
    return <AnimatedLoading message="Checking authentication..." />
  }

  if (isLoading) {
    return <AnimatedLoading message="Loading Cash Call Details..." />
  }

  if (error && !cashCall) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Cash Call</h2>
              <p className="text-red-400 mb-4">{error}</p>
              <Button onClick={() => router.push("/dashboard")} className="aramco-button-primary text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
                      </div>
        </div>
      </div>

      {/* Admin Override Confirmation Dialog intentionally omitted in error state to avoid referencing null cashCall. */}
    </div>
  )
}

  if (!cashCall) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Image
              src="/images/aramco-digital-new.png"
              alt="Aramco Digital"
              width={200}
              height={60}
              className="h-10 w-auto"
            />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <ExportButton cashCalls={[cashCall]} selectedCashCall={cashCall} variant="detailed" />
                <Button
                  onClick={() => router.push("/dashboard")}
                  variant="outline"
                  className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0033A0] to-[#00A3E0] bg-clip-text text-transparent">
                  Cash Call Details
                </h1>
                <p className="text-gray-600">{cashCall.call_number}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Success/Error Messages */}
      {error && (
        <div className="mx-6 mt-6 mb-4">
          <div className="max-w-6xl mx-auto">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
                <Button
                  onClick={() => setError("")}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300"
                >
                  ×
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mx-6 mt-6 mb-4">
          <div className="max-w-6xl mx-auto">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <p className="text-green-400 text-sm">{success}</p>
                </div>
                <Button
                  onClick={() => setSuccess("")}
                  variant="ghost"
                  size="sm"
                  className="text-green-400 hover:text-green-300"
                >
                  ×
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-[#0033A0] text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Cash Call Information
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusBadgeClass(cashCall.status)}>
                    {getStatusDisplayName(cashCall.status)}
                  </Badge>
                  {!isEditing && userProfile?.role?.toLowerCase() === "admin" && (
                    <Button
                      onClick={() => setIsEditing(true)}
                      size="sm"
                      variant="outline"
                      className="border-[#00A3E0] text-[#00A3E0] hover:bg-[#00A3E0]/10"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-700 font-medium">Call Number</Label>
                      <div className="text-[#00A3E0] font-bold text-lg">{cashCall.call_number}</div>
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium">Affiliate</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Building2 className="h-4 w-4 text-[#0033A0]" />
                        <span className="text-gray-800">{affiliate?.name || "Unknown Affiliate"}</span>
                        <Badge className="bg-[#0033A0] text-white text-xs">{affiliate?.company_code || "N/A"}</Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium">Created By</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4 text-[#0033A0]" />
                        <span className="text-gray-800">{userProfile?.full_name || user?.email || "Unknown"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-700 font-medium">Amount Requested</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editForm.amount_requested}
                          onChange={(e) =>
                            setEditForm({ ...editForm, amount_requested: Number.parseFloat(e.target.value) || 0 })
                          }
                          className="mt-1 bg-white border-gray-300 text-gray-900"
                        />
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <DollarSign className="h-4 w-4 text-[#84BD00]" />
                          <span className="text-[#84BD00] font-bold text-lg">
                            ${cashCall.amount_requested.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium">Created Date</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-[#0033A0]" />
                        <span className="text-gray-800">{formatDate(cashCall.created_at)}</span>
                      </div>
                    </div>
                    {cashCall.approved_at && (
                      <div>
                        <Label className="text-gray-700 font-medium">Approved Date</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-gray-800">{formatDate(cashCall.approved_at)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-700 font-medium">Description</Label>
                    {isEditing ? (
                      <Textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Enter description"
                        className="mt-1 bg-white border-gray-300 text-gray-900 min-h-[100px]"
                      />
                    ) : (
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-gray-800">{cashCall.description || "No description provided"}</p>
                      </div>
                    )}
                  </div>

                  {/* Justification field removed - not in Firebase schema */}
                </div>

                {isEditing && (
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <Button onClick={handleSaveEdit} disabled={isSaving} className="aramco-button-primary text-white">
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                                      <Button
                    onClick={() => {
                      setIsEditing(false)
                      setEditForm({
                        description: cashCall.description || "",
                        amount_requested: cashCall.amount_requested,
                      })
                    }}
                    variant="outline"
                    className="border-gray-400 text-gray-600 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary Metrics */}
            <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#0033A0] text-xl flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-[#0033A0]">{documents.length}</div>
                    <div className="text-sm text-gray-600">Documents</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{comments.length}</div>
                    <div className="text-sm text-gray-600">Comments</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{activityLogs.length}</div>
                    <div className="text-sm text-gray-600">Activities</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {cashCall.due_date ? 
                        Math.ceil((new Date(cashCall.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
                        'N/A'
                      }
                    </div>
                    <div className="text-sm text-gray-600">Days Remaining</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#0033A0] text-xl flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-700 font-medium">Currency</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-gray-800 font-medium">{cashCall.currency || "USD"}</span>
                        {cashCall.original_currency && cashCall.original_currency !== cashCall.currency && (
                          <Badge variant="outline" className="text-xs">
                            Original: {cashCall.original_currency}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium">Exchange Rate</Label>
                      <div className="text-gray-800 mt-1">
                        {cashCall.exchange_rate ? `1 ${cashCall.original_currency || 'USD'} = ${cashCall.exchange_rate} ${cashCall.currency}` : "N/A"}
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium">Original Amount</Label>
                      <div className="text-gray-800 mt-1">
                        {cashCall.amount_in_original_currency ? 
                          `${cashCall.original_currency || 'USD'} ${cashCall.amount_in_original_currency.toLocaleString()}` : 
                          "N/A"
                        }
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-700 font-medium">Payment Terms</Label>
                      <div className="text-gray-800 mt-1">
                        {cashCall.payment_terms || "Standard terms"}
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium">Payment Method</Label>
                      <div className="text-gray-800 mt-1">
                        {cashCall.payment_method || "Bank transfer"}
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium">Priority</Label>
                      <div className="mt-1">
                        <Badge className={
                          cashCall.priority === 'urgent' ? 'bg-red-500 text-white' :
                          cashCall.priority === 'high' ? 'bg-orange-500 text-white' :
                          cashCall.priority === 'medium' ? 'bg-yellow-500 text-white' :
                          'bg-green-500 text-white'
                        }>
                          {cashCall.priority?.charAt(0).toUpperCase() + cashCall.priority?.slice(1) || 'Low'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                {cashCall.bank_account_info && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <Label className="text-gray-700 font-medium mb-2 block">Bank Account Information</Label>
                    <div className="text-sm text-gray-600">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(cashCall.bank_account_info, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Risk & Compliance */}
            <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#0033A0] text-xl flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Risk & Compliance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-700 font-medium">Compliance Status</Label>
                      <div className="mt-1">
                        <Badge className={
                          cashCall.compliance_status === 'approved' ? 'bg-green-500 text-white' :
                          cashCall.compliance_status === 'rejected' ? 'bg-red-500 text-white' :
                          cashCall.compliance_status === 'under_review' ? 'bg-yellow-500 text-white' :
                          'bg-gray-500 text-white'
                        }>
                          {cashCall.compliance_status?.charAt(0).toUpperCase() + cashCall.compliance_status?.slice(1) || 'Pending'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium">Risk Assessment</Label>
                      <div className="text-gray-800 mt-1">
                        {cashCall.risk_assessment || "No risk assessment available"}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-700 font-medium">Category</Label>
                      <div className="text-gray-800 mt-1">
                        {cashCall.category || "General"}
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium">Subcategory</Label>
                      <div className="text-gray-800 mt-1">
                        {cashCall.subcategory || "N/A"}
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium">Tags</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {cashCall.tags && cashCall.tags.length > 0 ? (
                          cashCall.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">No tags</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {cashCall.rejection_reason && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <Label className="text-red-700 font-medium mb-2 block">Rejection Reason</Label>
                    <p className="text-red-600">{cashCall.rejection_reason}</p>
                  </div>
                )}
                
                {cashCall.internal_notes && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Label className="text-blue-700 font-medium mb-2 block">Internal Notes</Label>
                    <p className="text-blue-600">{cashCall.internal_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assignment (Admin Only) */}
            {userProfile?.role?.toLowerCase() === 'admin' && (
              <CashCallAssignment
                cashCallId={cashCall.id}
                currentAssigneeId={cashCall.assigneeUserId}
                onAssignmentChange={(assigneeId) => {
                  setCashCall(prev => prev ? { ...prev, assigneeUserId: assigneeId || undefined } : null)
                }}
              />
            )}

            {/* Documents */}
            <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#0033A0] text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {canManageDocuments() && (
                  <DocumentUpload
                    cashCallId={cashCall.id}
                    userId={user?.uid || ""}
                    onDocumentUploaded={handleDocumentUploaded}
                    onDocumentDeleted={handleDocumentDeleted}
                    onDocumentUpdated={handleDocumentUpdated}
                  />
                )}
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Uploaded Documents</h3>
                  <DocumentList
                    documents={documents}
                    onDocumentDeleted={handleDocumentDeleted}
                    onDocumentUpdated={handleDocumentUpdated}
                    canDelete={canManageDocuments()}
                  />
                  
                  {/* Debug Panel - Remove this in production */}
                  {userProfile?.role === 'admin' && (
                    <div className="mt-6">
                      <DocumentDebug cashCallId={cashCallId} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Comments */}
            <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#0033A0] text-xl flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comments ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Comment Input */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <Label className="text-gray-700 font-medium mb-2 block">Add Comment</Label>
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Enter your comment..."
                    className="mb-3 bg-white border-gray-300 text-gray-900 min-h-[80px]"
                  />
                  <div className="flex justify-between items-center">
                    <Button
                      onClick={handlePostComment}
                      disabled={!newComment.trim() || isPostingComment}
                      className="aramco-button-primary text-white"
                    >
                      {isPostingComment ? "Posting..." : "Post Comment"}
                    </Button>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Public
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                {isLoadingComments ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0033A0] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading comments...</p>
                  </div>
                ) : comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-[#0033A0]" />
                            <span className="font-medium text-gray-800">
                              {comment.user_id === user?.uid ? "You" : "User"}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {comment.is_internal ? "Internal" : "Public"}
                            </Badge>
                            {comment.is_private && (
                              <Badge variant="outline" className="text-xs bg-red-50 text-red-600">
                                Private
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                        {comment.attachments && comment.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {comment.attachments.map((attachment, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                Attachment {index + 1}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No comments yet. Be the first to comment!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">


            {/* Actions */}
            <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#0033A0] text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cashCall.status === "draft" && (
                  <Button
                    onClick={() => handleStatusChange("under_review")}
                    className="w-full bg-[#00A3E0] hover:bg-[#0033A0] text-white"
                  >
                    Submit for Review
                  </Button>
                )}
                {/* CFO Actions */}
                {(cashCall.status === "under_review" || cashCall.status === "ready_for_cfo") && (userProfile?.role?.toLowerCase() === "cfo" || userProfile?.role === "approver") && (
                  <>
                    <Button
                      onClick={() => handleStatusChange("approved")}
                      className="w-full bg-[#00843D] hover:bg-[#84BD00] text-white"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleStatusChange("rejected")}
                      className="w-full bg-red-500 hover:bg-red-600 text-white"
                    >
                      Reject
                    </Button>
                  </>
                )}
                {cashCall.status === "approved" && (userProfile?.role?.toLowerCase() === "cfo" || userProfile?.role === "approver") && (
                  <Button
                    onClick={() => handleStatusChange("paid")}
                    className="w-full bg-[#84BD00] hover:bg-[#00843D] text-white"
                  >
                    Mark as Paid
                  </Button>
                )}

                {/* Admin Override Actions */}
                {userProfile?.role?.toLowerCase() === "admin" && (
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-3">Admin Override</div>
                    

                    
                    {/* Status Change Options */}
                    <div className="space-y-2">
                      <Button
                        onClick={() => handleAdminStatusChange("draft")}
                        variant="outline"
                        className="w-full text-gray-700 border-gray-300 hover:bg-gray-50"
                        size="sm"
                      >
                        Set to Draft
                      </Button>
                      <Button
                        onClick={() => handleAdminStatusChange("under_review")}
                        variant="outline"
                        className="w-full text-gray-700 border-gray-300 hover:bg-gray-50"
                        size="sm"
                      >
                        Set to Under Review
                      </Button>
                      <Button
                        onClick={() => handleAdminStatusChange("finance_review")}
                        variant="outline"
                        className="w-full text-gray-700 border-gray-300 hover:bg-gray-50"
                        size="sm"
                      >
                        Set to Finance Review
                      </Button>
                      <Button
                        onClick={() => handleAdminStatusChange("ready_for_cfo")}
                        variant="outline"
                        className="w-full text-gray-700 border-gray-300 hover:bg-gray-50"
                        size="sm"
                      >
                        Set to Ready for CFO
                      </Button>
                      <Button
                        onClick={() => handleAdminStatusChange("approved")}
                        variant="outline"
                        className="w-full text-green-700 border-green-300 hover:bg-green-50"
                        size="sm"
                      >
                        Set to Approved
                      </Button>
                      <Button
                        onClick={() => handleAdminStatusChange("rejected")}
                        variant="outline"
                        className="w-full text-red-700 border-red-300 hover:bg-red-50"
                        size="sm"
                      >
                        Set to Rejected
                      </Button>
                      <Button
                        onClick={() => handleAdminStatusChange("paid")}
                        variant="outline"
                        className="w-full text-blue-700 border-blue-300 hover:bg-blue-50"
                        size="sm"
                      >
                        Set to Paid
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Assistant */}
            {/* Removed AIAssistant component */}

            {/* Activity Timeline */}
            <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#0033A0] text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Activity Timeline ({activityLogs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingActivity ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0033A0] mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">Loading activity...</p>
                  </div>
                ) : activityLogs.length > 0 ? (
                  <div className="space-y-3">
                    {(showAllActivities ? activityLogs : activityLogs.slice(0, 10)).map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                        <div className="flex-shrink-0 mt-1">
                          {getActivityIcon(log.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 font-medium">
                            {log.action === 'created' && 'Cash call created'}
                            {log.action === 'status_changed' && 'Status updated'}
                            {log.action === 'commented' && 'Comment added'}
                            {log.action === 'updated' && 'Details updated'}
                            {log.action === 'document_uploaded' && 'Document uploaded'}
                            {log.action === 'approved' && 'Cash call approved'}
                            {log.action === 'rejected' && 'Cash call rejected'}
                            {log.action === 'paid' && 'Payment processed'}
                            {!['created', 'status_changed', 'commented', 'updated', 'document_uploaded', 'approved', 'rejected', 'paid'].includes(log.action) && log.action}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(log.created_at)}
                          </p>
                          {log.new_values && log.action === 'status_changed' && (
                            <div className="mt-1">
                              <Badge className={getStatusBadgeClass(log.new_values.status) + ' text-xs'}>
                                {getStatusDisplayName(log.new_values.status)}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {activityLogs.length > 10 && (
                      <div className="text-center pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs"
                          onClick={() => setShowAllActivities(!showAllActivities)}
                        >
                          {showAllActivities ? `Show Less` : `View All (${activityLogs.length})`}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">No activity recorded</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Admin Override Confirmation Dialog */}
      {showAdminOverrideDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Override Confirmation</h3>
            <p className="text-gray-600 mb-6">
              You are about to change the cash call status from <strong>{cashCall?.status}</strong> to <strong>{pendingStatusChange}</strong>.
              <br /><br />
              This action will be logged as an admin override and cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  console.log('Cancel clicked')
                  setShowAdminOverrideDialog(false)
                  setPendingStatusChange(null)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  console.log('Confirm override clicked - starting function')
                  try {
                    await confirmAdminStatusChange()
                    console.log('Confirm override function completed')
                  } catch (error) {
                    console.error('Error in confirm override:', error)
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Confirm Override
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
