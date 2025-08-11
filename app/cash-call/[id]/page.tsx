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
} from "lucide-react"
import { useAuth } from "@/lib/firebase-auth-context"
import { ExportButton } from "@/components/export-functions"
import { AnimatedLoading } from "@/components/animated-loading"
import { 
  getCashCall, 
  getCashCalls, 
  updateCashCall,
  createComment,
  getComments,
  getAffiliate,
  type CashCall
} from "@/lib/firebase-database"

export default function CashCallDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const cashCallId = params.id as string
  const { user, userProfile } = useAuth()

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

  // Edit form state
  const [editForm, setEditForm] = useState({
    description: "",
    amount_requested: 0,
  })

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
  }, [user, router])

  useEffect(() => {
    if (user && cashCallId) {
      loadCashCall()
    }
  }, [user, cashCallId])

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

      // Refresh comments
      const comments = await getComments(cashCall.id)
      
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

      const [data, allData] = await Promise.all([
        getCashCall(cashCallId), 
        getCashCalls()
      ])

      if (!data) {
        setError("Cash call not found")
        return
      }

      setCashCall(data)
      setAllCashCalls(allData)
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
            console.warn(`Affiliate with ID ${data.affiliate_id} not found`)
            setAffiliate(null)
          }
        } catch (err) {
          console.error("Error loading affiliate:", err)
          setAffiliate(null)
        }
      }
    } catch (err) {
      console.error("Error loading cash call:", err)
      setError("Failed to load cash call details")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!cashCall || !user) return

    try {
      setError("")
      await updateCashCall(cashCall.id, { status: newStatus as any }, user.uid)
      
      // Reload the cash call to get updated data
      const updatedCall = await getCashCall(cashCall.id)
      if (updatedCall) {
        setCashCall(updatedCall)
      }
      
      setSuccess(`Status updated to ${newStatus}`)
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error updating status:", err)
      setError("Failed to update status")
    }
  }

  const handleSaveEdit = async () => {
    if (!cashCall || !user) return

    try {
      setIsSaving(true)
      setError("")

      const updates = {
        description: editForm.description,
        amount_requested: editForm.amount_requested,
      }

      await updateCashCall(cashCall.id, updates, user.uid)
      
      // Reload the cash call to get updated data
      const updatedCall = await getCashCall(cashCall.id)
      if (updatedCall) {
        setCashCall(updatedCall)
      }
      
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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "draft":
        return "status-draft enhanced-badge"
      case "under_review":
        return "status-review enhanced-badge"
      case "approved":
        return "status-approved enhanced-badge"
      case "paid":
        return "status-paid enhanced-badge"
      case "rejected":
        return "status-rejected enhanced-badge"
      default:
        return "status-draft enhanced-badge"
    }
  }

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case "draft":
        return "Draft"
      case "under_review":
        return "Under Review"
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
                  {!isEditing && (cashCall.status === "draft" || userProfile?.role !== "affiliate") && (
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

            {/* Attachments - Simplified for now */}
            <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#0033A0] text-xl flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Attachments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No attachments uploaded</p>
                </div>
              </CardContent>
            </Card>

            {/* Comments */}
            <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#0033A0] text-xl flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comments
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
                  <Button
                    onClick={handlePostComment}
                    disabled={!newComment.trim() || isPostingComment}
                    className="aramco-button-primary text-white"
                  >
                    {isPostingComment ? "Posting..." : "Post Comment"}
                  </Button>
                </div>

                {/* Comments List */}
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No comments yet. Be the first to comment!</p>
                </div>
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
                {cashCall.status === "under_review" && userProfile?.role !== "affiliate" && (
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
                {cashCall.status === "approved" && userProfile?.role !== "affiliate" && (
                  <Button
                    onClick={() => handleStatusChange("paid")}
                    className="w-full bg-[#84BD00] hover:bg-[#00843D] text-white"
                  >
                    Mark as Paid
                  </Button>
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
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">No activity recorded</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
