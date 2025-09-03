"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  Search,
  LogOut,
  Filter,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  Eye,
  BarChart3,
  Shield,
  CheckSquare,
  Settings,
  FileText,
  Users,
  BookOpen,
} from "lucide-react"
import { useAuth } from "@/lib/firebase-auth-context"
import { 
  getCashCallsByAccess,
  getAffiliates, 
  createCashCall,
  updateCashCall,
  getUsers,
  signOutUser,
  seedSampleData,
  getStatusOptions,
  getCashCallsForUser,
  getDocumentsForCashCall,
  assignCashCallToFinance,
  unassignCashCall,
  getDocumentRequirements,
  type CashCall, 
  type Affiliate,
  type User,
  type StatusOption,
  type DocumentRequirement
} from "@/lib/firebase-database"
import { AdminSettings } from "@/components/admin-settings"

import { ExportButton } from "@/components/export-functions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AffiliateProfile } from "@/components/affiliate-profile"
import { AuditMode } from "@/components/audit-mode"
import { AnimatedLoading } from "@/components/animated-loading"
import { NotificationProvider, NotificationBell, useStatusChangeNotifications, useNotifications } from "@/components/notification-system"
import { BulkImportExport } from "@/components/bulk-import-export"
import { AdvancedSearch, SearchFilter } from "@/components/advanced-search"
import { DashboardCustomization, DashboardWidget } from "@/components/dashboard-customization"


// Use the SearchFilter interface from advanced-search component
type FilterState = SearchFilter

function DashboardContent() {
  const { user, userProfile, signOut } = useAuth()
  const { notifyStatusChange } = useStatusChangeNotifications()
  const { loadNotifications } = useNotifications()
  const [cashCalls, setCashCalls] = useState<CashCall[]>([])
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([])
  const [filteredCashCalls, setFilteredCashCalls] = useState<CashCall[]>([])
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [documentCounts, setDocumentCounts] = useState<Record<string, number>>({})
  const [filters, setFilters] = useState<FilterState>({
    name: "",
    search: "",
    status: "all",
    affiliate: "all",
    approver: "all",
    dateFrom: "",
    dateTo: "",
    amountMin: "",
    amountMax: "",
  })
  const [isNewCashCallOpen, setIsNewCashCallOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false)
  const [selectedCashCallForAssignment, setSelectedCashCallForAssignment] = useState<CashCall | null>(null)
  const [selectedAssignee, setSelectedAssignee] = useState<string>("")
  const [isAssigning, setIsAssigning] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [retryCount, setRetryCount] = useState(0)
  const [dashboardLayout, setDashboardLayout] = useState<DashboardWidget[]>([])
  const [lastError, setLastError] = useState<string | null>(null)
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [activeView, setActiveView] = useState<"dashboard" | "affiliate" | "audit">("dashboard")
  const [selectedAffiliateId, setSelectedAffiliateId] = useState<string | null>(null)
  
  // Bulk operations state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isBulkActionOpen, setIsBulkActionOpen] = useState(false)

  // New cash call form state
  const [newCashCall, setNewCashCall] = useState({
    affiliateId: "",
    amountRequested: "",
    description: "",
    justification: "",
    cashCallType: "opex" as "opex" | "capex",
  })
  
  // Mandatory documents state for affiliates
  const [mandatoryDocuments, setMandatoryDocuments] = useState<Record<string, File | null>>({})
  
  const [documentErrors, setDocumentErrors] = useState<string[]>([])
  
  // Document requirements state
  const [documentRequirements, setDocumentRequirements] = useState<DocumentRequirement[]>([])
  
  // Editable document field titles (fallback)
  const [documentTitles, setDocumentTitles] = useState({
    invoice: "Invoice Document",
    contract: "Contract Document", 
    approval: "Approval Document"
  })

  // Debug dialog state changes
  useEffect(() => {
    console.log('Debug - Dialog state changed:', {
      isNewCashCallOpen,
      userRole: userProfile?.role,
      userAffiliateId: userProfile?.affiliate_company_id,
      newCashCallAffiliateId: newCashCall.affiliateId
    })
  }, [isNewCashCallOpen, userProfile?.role, userProfile?.affiliate_company_id, newCashCall.affiliateId])

  // Check authentication on mount
  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
  }, [user, router])

  // Auto-set affiliate ID for affiliate users when dialog opens
  useEffect(() => {
    if (isNewCashCallOpen && userProfile?.role === 'affiliate' && userProfile?.affiliate_company_id) {
      console.log('Debug - Auto-setting affiliateId:', userProfile.affiliate_company_id)
      setNewCashCall(prev => ({
        ...prev,
        affiliateId: userProfile.affiliate_company_id || ''
      }))
    }
  }, [isNewCashCallOpen, userProfile?.role, userProfile?.affiliate_company_id])

  // Load document requirements when cash call type changes
  useEffect(() => {
    const loadRequirementsForType = async () => {
      if (userProfile?.role === 'affiliate' && userProfile?.affiliate_company_id && newCashCall.cashCallType) {
        try {
          console.log('Debug - Loading requirements for cash call type:', newCashCall.cashCallType)
          const requirements = await getDocumentRequirements(userProfile.affiliate_company_id, newCashCall.cashCallType)
          setDocumentRequirements(requirements)
          console.log('Debug - Updated document requirements:', requirements)
        } catch (error) {
          console.error('Error loading document requirements for type:', error)
        }
      }
    }
    
    loadRequirementsForType()
  }, [newCashCall.cashCallType, userProfile?.role, userProfile?.affiliate_company_id])

  // Debug: Log when userProfile changes
  useEffect(() => {
    console.log('Debug - userProfile changed:', {
      role: userProfile?.role,
      affiliate_company_id: userProfile?.affiliate_company_id,
      email: userProfile?.email
    })
  }, [userProfile])

  // Load cash calls and affiliates when user is set
  useEffect(() => {
    if (user?.uid) {
      loadData()
      // Load notifications for the user
      loadNotifications(user.uid)
    }
  }, [user, loadNotifications])

  // Load saved dashboard layout
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-layout')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setDashboardLayout(parsed)
      } catch (error) {
        console.error('Failed to load dashboard layout:', error)
      }
    }
  }, [])

  useEffect(() => {
    applyFilters()
    setCurrentPage(1) // Reset to first page when filters change
  }, [filters, cashCalls])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 'n':
            e.preventDefault()
            setIsNewCashCallOpen(true)
            break
          case 'f':
            e.preventDefault()
            setIsFilterOpen(true)
            break
          case 'r':
            e.preventDefault()
            handleRefresh()
            break
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError("")
      setIsRefreshing(true)
      setLastError(null)

      if (!user || !userProfile) {
        setError("User not authenticated")
        return
      }

      // Use new role-based access control
      const [cashCallsData, affiliatesData, statusOptionsData, usersData] = await Promise.all([
        getCashCallsByAccess(user.uid),
        getAffiliates(),
        getStatusOptions(),
        getUsers(),
      ])

      // Load document requirements for affiliate users
      let documentRequirementsData: DocumentRequirement[] = []
      if (userProfile.role === 'affiliate' && userProfile.affiliate_company_id) {
        try {
          documentRequirementsData = await getDocumentRequirements(userProfile.affiliate_company_id)
          console.log('Debug - Document requirements loaded:', documentRequirementsData.length)
          console.log('Debug - Document requirements details:', documentRequirementsData)
        } catch (error) {
          console.error('Error loading document requirements:', error)
        }
      } else {
        console.log('Debug - Not loading document requirements:', {
          role: userProfile.role,
          affiliateId: userProfile.affiliate_company_id
        })
      }

      console.log('Debug - Loaded data:', {
        userRole: userProfile.role,
        userAffiliateId: userProfile.affiliate_company_id,
        cashCallsCount: cashCallsData.length,
        cashCalls: cashCallsData.map(cc => ({ id: cc.id, affiliate_id: cc.affiliate_id, status: cc.status })),
        affiliatesCount: affiliatesData.length,
        usersCount: usersData.length
      })

      setCashCalls(cashCallsData)
      setAffiliates(affiliatesData)
      setStatusOptions(statusOptionsData)
      setUsers(usersData)
      setDocumentRequirements(documentRequirementsData)

      // Load document counts for each cash call
      const documentCountsData: Record<string, number> = {}
      await Promise.all(
        cashCallsData.map(async (cashCall) => {
          try {
            const documents = await getDocumentsForCashCall(cashCall.id, user?.uid, userProfile?.role)
            documentCountsData[cashCall.id] = documents.length
          } catch (error) {
            console.error(`Error loading documents for cash call ${cashCall.id}:`, error)
            documentCountsData[cashCall.id] = 0
          }
        })
      )
      setDocumentCounts(documentCountsData)

      // Set active tab to first cash call if available
      if (cashCallsData.length > 0 && !activeTab) {
        setActiveTab(cashCallsData[0].id)
      }
    } catch (err) {
      console.error("Error loading data:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to load data"
      setLastError(errorMessage)
      setRetryCount(prev => prev + 1)
      
      if (retryCount < 3) {
        setError(`Failed to load data (attempt ${retryCount + 1}/3). Retrying...`)
        setTimeout(() => loadData(), 1000 * (retryCount + 1))
      } else {
        setError("Failed to load data after multiple attempts. Please check your connection and try again.")
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleLayoutChange = (widgets: DashboardWidget[]) => {
    setDashboardLayout(widgets)
  }

  // Helper function to check if user can approve/reject cash calls
  const canApproveReject = () => {
    return userProfile?.role?.toLowerCase() === 'approver' || userProfile?.role?.toLowerCase() === 'cfo'
  }

  // Helper function to check if user can send cash calls to CFO
  const canSendToCFO = () => {
    return userProfile?.role?.toLowerCase() === 'finance'
  }

  // Helper function to check if user can submit cash calls
  const canSubmit = () => {
    return userProfile?.role === 'admin' || userProfile?.role === 'affiliate'
  }

  const renderDashboardWidget = (widget: DashboardWidget) => {
    const stats = {
      totalCalls: memoizedStats.totalCalls,
      underReview: memoizedStats.underReview,
      approved: memoizedStats.approved,
      totalAmount: memoizedStats.totalAmount,
      pendingAmount: memoizedStats.pendingAmount
    }

    if (!widget.visible) return null

    switch (widget.type) {
      case 'stats':
        return (
          <Card key={widget.id} className="aramco-card-bg border-l-4 hover:scale-105 transition-all duration-300"
                style={{
                  borderLeftColor: widget.id === 'total-calls' ? '#0033A0' :
                                  widget.id === 'under-review' ? '#00A3E0' :
                                  widget.id === 'approved' ? '#00843D' : '#84BD00'
                }}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">{widget.title}</CardTitle>
              {widget.id === 'total-calls' && <TrendingUp className="h-4 w-4 text-[#0033A0]" />}
              {widget.id === 'under-review' && <Clock className="h-4 w-4 text-[#00A3E0]" />}
              {widget.id === 'approved' && <CheckCircle className="h-4 w-4 text-[#00843D]" />}
              {widget.id === 'total-amount' && <DollarSign className="h-4 w-4 text-[#84BD00]" />}
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${
                widget.id === 'total-calls' ? 'text-[#0033A0]' :
                widget.id === 'under-review' ? 'text-[#00A3E0]' :
                widget.id === 'approved' ? 'text-[#00843D]' : 'text-[#84BD00]'
              }`}>
                {widget.id === 'total-calls' && stats.totalCalls}
                {widget.id === 'under-review' && stats.underReview}
                {widget.id === 'approved' && stats.approved}
                {widget.id === 'total-amount' && `$${stats.totalAmount.toLocaleString()}`}
              </div>
              {widget.id === 'approved' && (
                <div className="text-sm text-gray-500 mt-1">
                  {stats.totalCalls > 0 
                    ? `${Math.round((stats.approved / stats.totalCalls) * 100)}% approval rate`
                    : 'No cash calls yet'
                  }
                </div>
              )}
              {widget.id === 'total-amount' && (
                <div className="text-sm text-gray-500 mt-1">
                  Pending: ${stats.pendingAmount.toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        )
      case 'chart':
        return (
          <Card key={widget.id} className="aramco-card-bg">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">{widget.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32">
                <BarChart3 className="h-8 w-8 text-[#00A3E0]" />
                <span className="ml-2 text-gray-500">Chart Widget</span>
              </div>
            </CardContent>
          </Card>
        )
      case 'recent':
        return (
          <Card key={widget.id} className="aramco-card-bg">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">{widget.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cashCalls.slice(0, 5).map((call, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium text-sm">{call.call_number}</div>
                      <div className="text-xs text-gray-500">{call.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">${call.amount_requested.toLocaleString()}</div>
                      <Badge variant={call.status === 'approved' ? 'default' : 'secondary'} className="text-xs">
                        {call.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      default:
        return (
          <Card key={widget.id} className="aramco-card-bg">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">{widget.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32 text-gray-500">
                Widget Content
              </div>
            </CardContent>
          </Card>
        )
    }
  }

  const applyFilters = () => {
    let filtered = [...cashCalls]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        (call) =>
          call.call_number.toLowerCase().includes(searchLower) ||
          call.title?.toLowerCase().includes(searchLower) ||
          call.description?.toLowerCase().includes(searchLower) ||
          affiliates.find((aff) => aff.id === call.affiliate_id)?.name.toLowerCase().includes(searchLower)
      )
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((call) => call.status === filters.status)
    }

    // Affiliate filter
    if (filters.affiliate !== "all") {
      filtered = filtered.filter((call) => call.affiliate_id === filters.affiliate)
    }

    // Approver filter
    if (filters.approver !== "all") {
      filtered = filtered.filter((call) => call.approved_by === filters.approver)
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      filtered = filtered.filter((call) => new Date(call.created_at) >= fromDate)
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999) // End of day
      filtered = filtered.filter((call) => new Date(call.created_at) <= toDate)
    }

    // Amount range filter
    if (filters.amountMin) {
      const minAmount = Number.parseFloat(filters.amountMin)
      if (!isNaN(minAmount)) {
        filtered = filtered.filter((call) => call.amount_requested >= minAmount)
      }
    }

    if (filters.amountMax) {
      const maxAmount = Number.parseFloat(filters.amountMax)
      if (!isNaN(maxAmount)) {
        filtered = filtered.filter((call) => call.amount_requested <= maxAmount)
      }
    }

    setFilteredCashCalls(filtered)
  }

  const clearFilters = () => {
    setFilters({
      name: "",
      search: "",
      status: "all",
      affiliate: "all",
      approver: "all",
      dateFrom: "",
      dateTo: "",
      amountMin: "",
      amountMax: "",
    })
  }

  const handleLogout = async () => {
    await signOut()
    router.push("/")
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

  const handleDocumentUpload = (documentType: string, file: File) => {
    setMandatoryDocuments(prev => ({
      ...prev,
      [documentType]: file
    }))
    
    // Clear error for this document type
    setDocumentErrors(prev => prev.filter(error => !error.includes(documentType)))
  }

  const validateMandatoryDocuments = () => {
    console.log('=== VALIDATION FUNCTION CALLED ===')
    const errors: string[] = []
    
    console.log('Debug - Validating documents:', {
      documentRequirementsCount: documentRequirements.length,
      mandatoryDocuments: mandatoryDocuments,
      userRole: userProfile?.role
    })
    
    if (documentRequirements.length > 0) {
      // Use configured document requirements
      const requiredRequirements = documentRequirements.filter(req => req.is_required)
      console.log('Debug - Required requirements:', requiredRequirements)
      
      requiredRequirements.forEach(requirement => {
        console.log('Debug - Checking requirement:', {
          documentType: requirement.document_type,
          title: requirement.title,
          hasFile: !!mandatoryDocuments[requirement.document_type]
        })
        
        if (!mandatoryDocuments[requirement.document_type]) {
          errors.push(`${requirement.title} is required`)
        }
      })
    } else {
      console.log('Debug - No document requirements found, using fallback validation')
      // Fallback to hardcoded validation
      if (!mandatoryDocuments.invoice) {
        errors.push(`${documentTitles.invoice} is required`)
      }
      if (!mandatoryDocuments.contract) {
        errors.push(`${documentTitles.contract} is required`)
      }
      if (!mandatoryDocuments.approval) {
        errors.push(`${documentTitles.approval} is required`)
      }
    }
    
    console.log('Debug - Validation errors:', errors)
    console.log('Debug - Validation result:', errors.length === 0)
    setDocumentErrors(errors)
    return errors.length === 0
  }

  const handleTitleEdit = (documentType: 'invoice' | 'contract' | 'approval', newTitle: string) => {
    setDocumentTitles(prev => ({
      ...prev,
      [documentType]: newTitle
    }))
  }

  const handleCreateCashCall = async (isDraft = false) => {
    // Check authentication first
    if (!user?.uid) {
      setError("You must be logged in to create a cash call")
      return
    }

    // Check if user profile is loaded
    if (!userProfile) {
      setError("User profile not loaded. Please refresh the page and try again.")
      return
    }

    // For affiliate users, validate mandatory documents when submitting (not for drafts)
    if (userProfile?.role === 'affiliate') {
      console.log('Debug - About to validate documents for affiliate')
      console.log('Debug - Is draft mode:', isDraft)
      console.log('Debug - Document requirements:', documentRequirements)
      console.log('Debug - Mandatory documents:', mandatoryDocuments)
      
      const isValid = validateMandatoryDocuments()
      console.log('Debug - Document validation result:', isValid)
      
      if (!isValid && !isDraft) {
        console.log('Debug - Validation failed, blocking submission')
        setError("Please upload all required documents before submitting")
        return
      }
      
      if (!isValid && isDraft) {
        console.log('Debug - Draft mode, allowing creation without documents')
      }
      
      if (isValid) {
        console.log('Debug - Validation passed, proceeding with submission')
      }
    }



    // For affiliate users, automatically set their affiliate company ID
    const affiliateId = userProfile?.role === 'affiliate' 
      ? userProfile.affiliate_company_id 
      : newCashCall.affiliateId

    console.log('Debug - Creating cash call:', {
      userRole: userProfile?.role,
      userAffiliateId: userProfile?.affiliate_company_id,
      newCashCallAffiliateId: newCashCall.affiliateId,
      finalAffiliateId: affiliateId,
      amountRequested: newCashCall.amountRequested,
      userId: user.uid,
      isAuthenticated: !!user.uid
    })

    if (!affiliateId || !newCashCall.amountRequested) {
      setError("Please fill in all required fields")
      console.log('Debug - Validation failed:', { affiliateId, amountRequested: newCashCall.amountRequested })
      return
    }

    // Enforce affiliate company restrictions
    if (userProfile?.role === 'affiliate' && userProfile?.affiliate_company_id !== affiliateId) {
      setError("You can only create cash calls for your own affiliate company")
      return
    }

    const amount = Number.parseFloat(newCashCall.amountRequested)
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount")
      return
    }

    setIsCreating(true)
    setError("")

    try {
      const cashCallData = {
        call_number: `CC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        affiliate_id: affiliateId,
        affiliateCompanyId: affiliateId,
        amount_requested: amount,
        description: newCashCall.description || undefined,
        created_by: user.uid,
        createdByUserId: user.uid,
        status: (isDraft ? "draft" : "under_review") as "draft" | "under_review",
        currency: "USD",
        exchange_rate: 1,
        priority: "medium" as const,
        compliance_status: "pending" as const,
      }

      console.log('Debug - Attempting to create cash call with data:', cashCallData)

      const newCallId = await createCashCall(cashCallData)

      console.log('Debug - Cash call created successfully:', {
        newCallId,
        cashCallData,
        userAffiliateId: userProfile?.affiliate_company_id
      })

      console.log('Debug - Reloading data after cash call creation...')
      // Reload data to ensure we have the latest state from the database
      await loadData()
      console.log('Debug - Data reloaded after cash call creation')

      // Reset form and close dialog
      setNewCashCall({ affiliateId: "", amountRequested: "", description: "", justification: "", cashCallType: "opex" })
      setMandatoryDocuments({})
      setDocumentErrors([])
      setIsNewCashCallOpen(false)

      setError("")
    } catch (err: any) {
      console.error("Error creating cash call:", err)
      
      // Handle specific Firebase permission errors
      if (err.code === 'permission-denied' || err.message?.includes('permission')) {
        setError("Permission denied. Please check your authentication status and try again.")
      } else if (err.code === 'unauthenticated') {
        setError("You are not authenticated. Please log in again.")
      } else if (err.code === 'not-found') {
        setError("Required data not found. Please refresh the page and try again.")
      } else if (err.message?.includes('activity_logs')) {
        setError("Cash call created but activity logging failed. The cash call should still be available.")
      } else {
        setError(`Failed to create cash call: ${err.message || 'Unknown error'}`)
      }
    } finally {
      setIsCreating(false)
    }
  }

  const handleStatusChange = async (cashCallId: string, newStatus: string) => {
    if (!user?.uid) {
      setError("You must be logged in to update cash calls")
      return
    }

    // Check if user can modify this cash call
    const cashCall = cashCalls.find(call => call.id === cashCallId)
    if (!cashCall) {
      setError("Cash call not found")
      return
    }

    // Enforce role-based access control for status changes
    if (newStatus === 'approved' || newStatus === 'rejected' || newStatus === 'paid') {
      if (!canApproveReject()) {
        setError("You don't have permission to approve, reject, or mark cash calls as paid")
        return
      }
    }

    if (newStatus === 'under_review') {
      if (!canSubmit()) {
        setError("You don't have permission to submit cash calls for review")
        return
      }
    }

    if (newStatus === 'ready_for_cfo') {
      if (!canSendToCFO()) {
        setError("You don't have permission to send cash calls to CFO")
        return
      }
    }

    // Enforce affiliate-specific access control
    if (userProfile?.role === 'affiliate' && cashCall.affiliate_id !== userProfile.affiliate_company_id) {
      setError("You can only update cash calls for your own affiliate company")
      return
    }

    try {
      setError("")
      const oldStatus = cashCall.status || 'unknown'
      await updateCashCall(cashCallId, { status: newStatus as any }, user.uid)

      // Update the cash call in the list
      setCashCalls(cashCalls.map((call) => (call.id === cashCallId ? { ...call, status: newStatus as any } : call)))
      
      // Send notification
      const affiliateName = affiliates.find(aff => aff.id === cashCall.affiliate_id)?.name || 'Unknown Affiliate'
      notifyStatusChange(cashCallId, oldStatus, newStatus, affiliateName)
      
      // Refresh notifications after status change
      await loadNotifications(user.uid)
    } catch (err) {
      console.error("Error updating status:", err)
      setError("Failed to update status. Please try again.")
    }
  }

  const handleRefresh = async () => {
    if (user?.uid) {
      await loadData()
      // Refresh notifications when data is refreshed
      await loadNotifications(user.uid)
    }
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredCashCalls.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCashCalls = filteredCashCalls.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Bulk operations
  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedItems.size === paginatedCashCalls.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(paginatedCashCalls.map(item => item.id)))
    }
  }

  const handleBulkAction = async (action: 'approve' | 'reject' | 'mark-paid') => {
    if (!user?.uid || selectedItems.size === 0) return

    // Check if user has permission to perform bulk actions
    if (!canApproveReject()) {
      setError("You don't have permission to perform bulk approval/rejection actions")
      return
    }

    // Check if user can modify all selected cash calls
    const selectedCashCalls = cashCalls.filter(call => selectedItems.has(call.id))
    
    if (userProfile?.role === 'affiliate') {
      const unauthorizedCalls = selectedCashCalls.filter(call => call.affiliate_id !== userProfile.affiliate_company_id)
      if (unauthorizedCalls.length > 0) {
        setError("You can only update cash calls for your own affiliate company")
        return
      }
    }

    try {
      setError("")
      const promises = Array.from(selectedItems).map(itemId => {
        const newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'paid'
        return updateCashCall(itemId, { status: newStatus as any }, user.uid!)
      })

      await Promise.all(promises)
      
      // Update local state
      setCashCalls(cashCalls.map(call => 
        selectedItems.has(call.id) 
          ? { ...call, status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'paid' as any }
          : call
      ))
      
      setSelectedItems(new Set())
      setIsBulkActionOpen(false)
    } catch (err) {
      console.error("Error performing bulk action:", err)
      setError("Failed to perform bulk action. Please try again.")
    }
  }

  const handleAssignmentClick = (cashCall: CashCall) => {
    setSelectedCashCallForAssignment(cashCall)
    setSelectedAssignee(cashCall.assigneeUserId || "unassigned")
    setIsAssignmentDialogOpen(true)
  }

  const handleAssignCashCall = async () => {
    if (!selectedCashCallForAssignment || !user?.uid) return
    
    console.log('Current user ID:', user.uid)
    console.log('Current userProfile:', userProfile)
    
    setIsAssigning(true)
    try {
      if (selectedAssignee && selectedAssignee !== "unassigned") {
        // Assign to finance user
        await assignCashCallToFinance(
          selectedCashCallForAssignment.id,
          selectedAssignee,
          user.uid
        )
      } else {
        // Unassign
        await unassignCashCall(
          selectedCashCallForAssignment.id,
          user.uid
        )
      }
      
      await loadData()
      setIsAssignmentDialogOpen(false)
      setSelectedCashCallForAssignment(null)
      setSelectedAssignee("")
    } catch (error) {
      console.error('Error assigning cash call:', error)
    } finally {
      setIsAssigning(false)
    }
  }

  const getFinanceUsers = () => {
    console.log('All users:', users.map(u => ({ name: u.full_name, role: (u as any).role, is_active: u.is_active })))
    console.log('User roles found:', [...new Set(users.map(u => (u as any).role))])
    console.log('Detailed user roles:', users.map(u => ({ name: u.full_name, role: (u as any).role })))
    
    // Temporarily show all active users to see what's available
    const allActiveUsers = users.filter(user => user.is_active)
    console.log('All active users:', allActiveUsers.map(u => ({ name: u.full_name, role: (u as any).role })))
    
    const financeUsers = users.filter(user => {
      return ((user as any).role === 'viewer' || (user as any).role === 'finance' || (user as any).role === 'FINANCE') && user.is_active
    })
    console.log('Finance users found:', financeUsers.map(u => u.full_name))
    return financeUsers
  }

  const handleRowClick = (cashCallId: string) => {
    router.push(`/cash-call/${cashCallId}`)
  }

  // Memoized calculations for better performance
  const memoizedStats = useMemo(() => ({
    totalCalls: cashCalls.length,
    underReview: cashCalls.filter(c => c.status === "under_review").length,
    approved: cashCalls.filter(c => c.status === "approved").length,
    totalAmount: cashCalls.reduce((sum, call) => sum + call.amount_requested, 0),
    pendingAmount: cashCalls
      .filter(call => call.status === 'under_review')
      .reduce((sum, call) => sum + call.amount_requested, 0)
  }), [cashCalls])

  const handleAffiliateClick = useCallback((affiliateId: string) => {
    setSelectedAffiliateId(affiliateId)
    setActiveView("affiliate")
  }, [])

  if (isLoading) {
    return <AnimatedLoading message="Loading Dashboard..." />
  }

  if (!user) {
    return null // This shouldn't happen as we redirect to login
  }

  const activeFiltersCount = Object.values(filters).filter(
    (value, index) => value !== "" && (index === 0 || value !== "all"),
  ).length

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
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0033A0] to-[#00A3E0] bg-clip-text text-transparent">
                Cash Call Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome back, {userProfile?.full_name || user.email} •{" "}
                {userProfile?.role ? userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1) : 'User'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            
            <AdminSettings currentUser={userProfile} onDataChange={loadData} />

            {userProfile?.role !== 'affiliate' && (
              <Button
                onClick={() => router.push('/reports')}
                variant="outline"
                size="sm"
                className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10 bg-transparent"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Reports
              </Button>
            )}

            {userProfile?.role === 'admin' && (
              <>
                <Button
                  onClick={() => router.push('/manage-roles')}
                  variant="outline"
                  size="sm"
                  className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10 bg-transparent"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Manage Roles
                </Button>
                <Button
                  onClick={() => router.push('/settings')}
                  variant="outline"
                  size="sm"
                  className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10 bg-transparent"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </>
            )}

            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10 bg-transparent"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={handleLogout}
              className="border border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10 bg-transparent enhanced-button"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="mx-6 mt-6 mb-4">
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
      )}

      <div className="p-6">
        {/* Quick Actions Bar */}
        <Card className="aramco-card-bg mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#0033A0]">Quick Actions:</span>
              </div>
              
              <BulkImportExport
                cashCalls={cashCalls}
                affiliates={affiliates}
                onImport={async (data) => {
                  // Handle bulk import
                  console.log('Importing data:', data)
                  // TODO: Implement bulk import logic
                }}
                onExport={(format) => {
                  // Handle bulk export
                  console.log('Exporting in format:', format)
                  // TODO: Implement bulk export logic
                }}
              />
              
              <DashboardCustomization
                cashCalls={cashCalls}
                affiliates={affiliates}
                onLayoutChange={handleLayoutChange}
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/checklist')}
                className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Checklists
              </Button>



              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsNewCashCallOpen(true)}
                className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Cash Call (Ctrl+N)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10"
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh (Ctrl+R)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Dashboard Widgets */}
        <div className="mb-8">
          {dashboardLayout.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dashboardLayout
                .filter(widget => widget.visible)
                .map(widget => renderDashboardWidget(widget))
              }
            </div>
          ) : null}
        </div>

        {/* Main Content with Tabs */}
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)} className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <TabsList className="grid w-full max-w-3xl grid-cols-4 bg-white/80 backdrop-blur-sm">
              <TabsTrigger
                value="dashboard"
                onClick={() => setActiveView("dashboard")}
                className="data-[state=active]:bg-[#0033A0] data-[state=active]:text-white"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger
                value="checklist"
                className="data-[state=active]:bg-[#0033A0] data-[state=active]:text-white"
                onClick={() => router.push("/checklist")}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Checklist
              </TabsTrigger>
              {userProfile?.role === "admin" && (
                <TabsTrigger
                  value="audit"
                  onClick={() => setActiveView("audit")}
                  className="data-[state=active]:bg-[#0033A0] data-[state=active]:text-white"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Audit
                </TabsTrigger>
              )}
            </TabsList>
            
            <div className="flex justify-end w-full">
              <ExportButton cashCalls={cashCalls} variant="summary" />
            </div>
          </div>

          <TabsContent value="dashboard" className="space-y-6">


            {/* Quick Access for Finance Users */}
            {userProfile?.role === 'finance' && (
              <Card className="aramco-card-bg">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[#0033A0] mb-2">Financial Package Generator</h3>
                      <p className="text-gray-600">Generate comprehensive financial packages for cash call reviews</p>
                    </div>
                    <Button 
                      onClick={() => router.push('/financial-packages')}
                      className="aramco-button-primary text-white enhanced-button"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Generate Packages
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Advanced Search and Actions */}
            <Card className="aramco-card-bg">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  <div className="flex-1">
                    <AdvancedSearch
                      filters={filters}
                      onFiltersChange={setFilters}
                      affiliates={affiliates.filter(affiliate => {
                        // If user is affiliate, only show their own company
                        if (userProfile?.role === 'affiliate') {
                          return affiliate.id === userProfile.affiliate_company_id
                        }
                        // Admin and approver can see all affiliates
                        return true
                      })}
                      users={users}
                      cashCalls={cashCalls}
                    />
                  </div>

                  <Dialog open={isNewCashCallOpen} onOpenChange={setIsNewCashCallOpen}>
                    <DialogTrigger asChild>
                      <Button className="aramco-button-primary text-white enhanced-button">
                        <Plus className="h-4 w-4 mr-2" />
                        New Cash Call
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md aramco-card-bg max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-white">Create New Cash Call</DialogTitle>
                        <DialogDescription className="text-white/80">
                          {userProfile?.role === 'affiliate' 
                            ? 'Add a new cash call request for your company.'
                            : 'Add a new cash call request for an affiliate.'
                          }
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {userProfile?.role === 'affiliate' ? (
                          // For affiliate users, show their company as read-only
                          <div>
                                                         <Label htmlFor="affiliateId" className="text-white font-medium mb-2 block">
                               Company
                             </Label>
                                                       <div className="p-3 bg-white/10 backdrop-blur-sm rounded-md border border-white/20 text-white">
                             <div className="text-white font-medium">
                               {(() => {
                                 const affiliate = affiliates.find(aff => aff.id === userProfile.affiliate_company_id)
                                 console.log('Debug - userProfile.affiliate_company_id:', userProfile.affiliate_company_id)
                                 console.log('Debug - available affiliates:', affiliates.map(aff => ({ id: aff.id, name: aff.name })))
                                 console.log('Debug - found affiliate:', affiliate)
                                 
                                 // If affiliate not found, try to determine from userProfile data
                                 if (!affiliate && userProfile?.affiliate_company_id) {
                                   // Check if it's a known affiliate ID pattern
                                   if (userProfile.affiliate_company_id === 'cntxt-003') {
                                     return 'CNTXT'
                                   } else if (userProfile.affiliate_company_id === 'cyberani-001') {
                                     return 'Cyberani'
                                   } else if (userProfile.affiliate_company_id === 'nextera-002') {
                                     return 'NextEra'
                                   } else if (userProfile.affiliate_company_id === 'plantdigital-004') {
                                     return 'Plant Digital'
                                   }
                                 }
                                 
                                 return affiliate?.name || 'Company not found'
                               })()}
                             </div>
                             <div className="text-sm text-white/70">
                               {(() => {
                                 const affiliate = affiliates.find(aff => aff.id === userProfile.affiliate_company_id)
                                 if (!affiliate && userProfile?.affiliate_company_id) {
                                   // Fallback company codes
                                   if (userProfile.affiliate_company_id === 'cntxt-003') {
                                     return 'CNTXT-003'
                                   } else if (userProfile.affiliate_company_id === 'cyberani-001') {
                                     return 'CYBERANI-001'
                                   } else if (userProfile.affiliate_company_id === 'nextera-002') {
                                     return 'NEXTERA-002'
                                   } else if (userProfile.affiliate_company_id === 'plantdigital-004') {
                                     return 'PLANTDIGITAL-004'
                                   }
                                 }
                                 return affiliate?.company_code || ''
                               })()}
                             </div>
                           </div>
                          </div>
                        ) : (
                          // For admin/approver users, show affiliate selection
                          <div>
                            <Label htmlFor="affiliateId" className="text-white font-medium mb-2 block">
                              Affiliate *
                            </Label>
                            <Select
                              value={newCashCall.affiliateId}
                              onValueChange={(value) => setNewCashCall({ ...newCashCall, affiliateId: value })}
                            >
                              <SelectTrigger className="enhanced-select">
                                <SelectValue placeholder="Select an affiliate" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-gray-300">
                                {affiliates.map((affiliate) => (
                                  <SelectItem
                                    key={affiliate.id}
                                    value={affiliate.id}
                                    className="text-gray-700 hover:bg-[#0033A0]/10"
                                  >
                                    {affiliate.name} ({affiliate.company_code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div>
                          <Label htmlFor="cashCallType" className="text-white font-medium mb-2 block">
                            Cash Call Type *
                          </Label>
                          <Select
                            value={newCashCall.cashCallType || 'opex'}
                            onValueChange={(value) => setNewCashCall({ ...newCashCall, cashCallType: value as 'opex' | 'capex' })}
                          >
                            <SelectTrigger className="enhanced-select">
                              <SelectValue placeholder="Select cash call type" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-300">
                              <SelectItem value="opex" className="text-gray-700 hover:bg-[#0033A0]/10">
                                OPEX (Operating Expenses)
                              </SelectItem>
                              <SelectItem value="capex" className="text-gray-700 hover:bg-[#0033A0]/10">
                                CAPEX (Capital Expenses)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="amountRequested" className="text-white font-medium mb-2 block">
                            Amount Requested *
                          </Label>
                          <Input
                            id="amountRequested"
                            type="number"
                            step="0.01"
                            min="0"
                            value={newCashCall.amountRequested}
                            onChange={(e) => setNewCashCall({ ...newCashCall, amountRequested: e.target.value })}
                            placeholder="Enter amount"
                            className="enhanced-input"
                          />
                        </div>

                        <div>
                          <Label htmlFor="description" className="text-white font-medium mb-2 block">
                            Description
                          </Label>
                          <Textarea
                            id="description"
                            value={newCashCall.description}
                            onChange={(e) => setNewCashCall({ ...newCashCall, description: e.target.value })}
                            placeholder="Enter description (optional)"
                            className="enhanced-input min-h-[80px] resize-none"
                          />
                        </div>

                        <div>
                          <Label htmlFor="justification" className="text-white font-medium mb-2 block">
                            Justification
                          </Label>
                          <Textarea
                            id="justification"
                            value={newCashCall.justification}
                            onChange={(e) => setNewCashCall({ ...newCashCall, justification: e.target.value })}
                            placeholder="Enter justification (optional)"
                            className="enhanced-input min-h-[80px] resize-none"
                          />
                        </div>

                        {/* Mandatory Documents Section for Affiliates */}
                        {userProfile?.role === 'affiliate' && (
                          <div className="text-xs text-gray-500 mb-2">
                            Debug: {documentRequirements.length} document requirements loaded
                          </div>
                        )}
                        {userProfile?.role === 'affiliate' && (
                          <div className="space-y-4">
                            <div className="border-t border-white/20 pt-4">
                              <h3 className="text-white font-semibold mb-3">Required Documents *</h3>
                              <p className="text-white/70 text-sm mb-4">
                                The following documents are required before submitting your cash call request.
                              </p>
                            </div>

                            {documentRequirements.length > 0 ? (
                              // Use configured document requirements
                              documentRequirements
                                .filter(req => req.is_required)
                                .sort((a, b) => a.order_index - b.order_index)
                                .map((requirement) => (
                                  <div key={requirement.id}>
                                    <div className="flex items-center gap-2 mb-3">
                                      <Label className="text-white font-medium text-base flex-1">
                                        {requirement.title}
                                        <span className="text-red-400 ml-1">*</span>
                                      </Label>
                                    </div>
                                    <div className="relative">
                                      <div className="border-2 border-dashed border-white/30 rounded-lg p-6 hover:border-[#00A3E0] transition-colors duration-200 bg-white/5">
                                        <Input
                                          type="file"
                                          accept={requirement.file_types.map(type => `.${type}`).join(',')}
                                          onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                              // Check file size
                                              const maxSize = (requirement.max_file_size || 10) * 1024 * 1024 // Convert MB to bytes
                                              if (file.size > maxSize) {
                                                alert(`File size exceeds maximum allowed size of ${requirement.max_file_size || 10}MB`)
                                                return
                                              }
                                              // Check file type
                                              const fileExtension = file.name.split('.').pop()?.toLowerCase()
                                              if (!requirement.file_types.includes(fileExtension || '')) {
                                                alert(`File type not allowed. Allowed types: ${requirement.file_types.join(', ')}`)
                                                return
                                              }
                                              handleDocumentUpload(requirement.document_type as any, file)
                                            }
                                          }}
                                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="text-center">
                                          <div className="text-white/60 mb-2">
                                            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                          </div>
                                          <div className="text-white font-medium mb-1">Click to upload {requirement.title}</div>
                                          <div className="text-white/60 text-sm">
                                            {requirement.file_types.map(type => type.toUpperCase()).join(', ')} 
                                            {requirement.max_file_size && ` (Max ${requirement.max_file_size}MB)`}
                                          </div>
                                          {requirement.description && (
                                            <div className="text-white/50 text-xs mt-1">{requirement.description}</div>
                                          )}
                                        </div>
                                      </div>
                                                                             {mandatoryDocuments[requirement.document_type] && (
                                         <div className="mt-3 p-3 bg-green-500/20 border border-green-500/30 rounded-md">
                                           <div className="flex items-center text-green-400">
                                             <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                             </svg>
                                             <span className="font-medium">
                                               {mandatoryDocuments[requirement.document_type]?.name}
                                             </span>
                                           </div>
                                         </div>
                                       )}
                                    </div>
                                  </div>
                                ))
                            ) : (
                              // Fallback to editable document titles (for backward compatibility)
                              <>
                                {/* Invoice Document */}
                                <div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <Label className="text-white font-medium text-base flex-1">
                                      <Input
                                        value={documentTitles.invoice}
                                        onChange={(e) => handleTitleEdit('invoice', e.target.value)}
                                        className="bg-transparent border-none text-white font-medium text-base p-0 h-auto focus:ring-0 focus:border-none hover:bg-white/10 rounded px-2 py-1 transition-colors"
                                        placeholder="Document Title"
                                      />
                                      <span className="text-red-400 ml-1">*</span>
                                    </Label>
                                    <div className="text-white/60 text-xs">Click to edit</div>
                                  </div>
                                  <div className="relative">
                                    <div className="border-2 border-dashed border-white/30 rounded-lg p-6 hover:border-[#00A3E0] transition-colors duration-200 bg-white/5">
                                      <Input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0]
                                          if (file) handleDocumentUpload('invoice', file)
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                      />
                                      <div className="text-center">
                                        <div className="text-white/60 mb-2">
                                          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                          </svg>
                                        </div>
                                        <div className="text-white font-medium mb-1">Click to upload {documentTitles.invoice}</div>
                                        <div className="text-white/60 text-sm">PDF, DOC, DOCX, JPG, PNG (No size limit)</div>
                                      </div>
                                    </div>
                                    {mandatoryDocuments.invoice && (
                                      <div className="mt-3 p-3 bg-green-500/20 border border-green-500/30 rounded-md">
                                        <div className="flex items-center text-green-400">
                                          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                          </svg>
                                          <span className="font-medium">{mandatoryDocuments.invoice.name}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Contract Document */}
                                <div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <Label className="text-white font-medium text-base flex-1">
                                      <Input
                                        value={documentTitles.contract}
                                        onChange={(e) => handleTitleEdit('contract', e.target.value)}
                                        className="bg-transparent border-none text-white font-medium text-base p-0 h-auto focus:ring-0 focus:border-none hover:bg-white/10 rounded px-2 py-1 transition-colors"
                                        placeholder="Document Title"
                                      />
                                      <span className="text-red-400 ml-1">*</span>
                                    </Label>
                                    <div className="text-white/60 text-xs">Click to edit</div>
                                  </div>
                                  <div className="relative">
                                    <div className="border-2 border-dashed border-white/30 rounded-lg p-6 hover:border-[#00A3E0] transition-colors duration-200 bg-white/5">
                                      <Input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0]
                                          if (file) handleDocumentUpload('contract', file)
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                      />
                                      <div className="text-center">
                                        <div className="text-white/60 mb-2">
                                          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                          </svg>
                                        </div>
                                        <div className="text-white font-medium mb-1">Click to upload {documentTitles.contract}</div>
                                        <div className="text-white/60 text-sm">PDF, DOC, DOCX, JPG, PNG (No size limit)</div>
                                      </div>
                                    </div>
                                    {mandatoryDocuments.contract && (
                                      <div className="mt-3 p-3 bg-green-500/20 border border-green-500/30 rounded-md">
                                        <div className="flex items-center text-green-400">
                                          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                          </svg>
                                          <span className="font-medium">{mandatoryDocuments.contract.name}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Approval Document */}
                                <div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <Label className="text-white font-medium text-base flex-1">
                                      <Input
                                        value={documentTitles.approval}
                                        onChange={(e) => handleTitleEdit('approval', e.target.value)}
                                        className="bg-transparent border-none text-white font-medium text-base p-0 h-auto focus:ring-0 focus:border-none hover:bg-white/10 rounded px-2 py-1 transition-colors"
                                        placeholder="Document Title"
                                      />
                                      <span className="text-red-400 ml-1">*</span>
                                    </Label>
                                    <div className="text-white/60 text-xs">Click to edit</div>
                                  </div>
                                  <div className="relative">
                                    <div className="border-2 border-dashed border-white/30 rounded-lg p-6 hover:border-[#00A3E0] transition-colors duration-200 bg-white/5">
                                      <Input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0]
                                          if (file) handleDocumentUpload('approval', file)
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                      />
                                      <div className="text-center">
                                        <div className="text-white/60 mb-2">
                                          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                          </svg>
                                        </div>
                                        <div className="text-white font-medium mb-1">Click to upload {documentTitles.approval}</div>
                                        <div className="text-white/60 text-sm">PDF, DOC, DOCX, JPG, PNG (No size limit)</div>
                                      </div>
                                    </div>
                                    {mandatoryDocuments.approval && (
                                      <div className="mt-3 p-3 bg-green-500/20 border border-green-500/30 rounded-md">
                                        <div className="flex items-center text-green-400">
                                          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                          </svg>
                                          <span className="font-medium">{mandatoryDocuments.approval.name}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}

                            {/* Document Errors */}
                            {documentErrors.length > 0 && (
                              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-md">
                                <div className="text-red-400 text-sm font-medium mb-1">Missing Required Documents:</div>
                                <ul className="text-red-300 text-sm space-y-1">
                                  {documentErrors.map((error, index) => (
                                    <li key={index}>• {error}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Debug Info */}
                            {userProfile?.role === 'affiliate' && (
                              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                                <div className="text-blue-400 text-sm font-medium mb-1">Debug Info:</div>
                                <div className="text-blue-300 text-xs space-y-1">
                                  <div>• Document Requirements Loaded: {documentRequirements.length}</div>
                                  <div>• Required Documents: {documentRequirements.filter(r => r.is_required).length}</div>
                                  <div>• Documents Uploaded: {Object.keys(mandatoryDocuments).length}</div>
                                  <div>• Validation Errors: {documentErrors.length}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleCreateCashCall(true)}
                            variant="outline"
                            className="flex-1 border-[#00A3E0] text-[#00A3E0] hover:bg-[#00A3E0]/10"
                            disabled={isCreating}
                          >
                            {isCreating ? "Saving..." : "Save Draft"}
                          </Button>
                          <Button
                            onClick={() => handleCreateCashCall(false)}
                            className="flex-1 aramco-button-primary text-white enhanced-button"
                            disabled={isCreating}
                          >
                            {isCreating ? "Creating..." : "Create & Submit"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Assignment Dialog */}
            <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-[#0033A0]">Assign Cash Call</DialogTitle>
                </DialogHeader>
                {selectedCashCallForAssignment && (
                  <div className="px-6 py-2">
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Cash Call:</strong> {selectedCashCallForAssignment.call_number}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Affiliate:</strong> {affiliates.find(aff => aff.id === selectedCashCallForAssignment.affiliate_id)?.name || "Unknown"}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Amount:</strong> ${selectedCashCallForAssignment.amount_requested.toLocaleString()}
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="assignee" className="text-[#0033A0] font-medium">
                      Assign to Finance User
                    </Label>
                    <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a finance user" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {getFinanceUsers().map((financeUser) => (
                          <SelectItem key={financeUser.id} value={financeUser.id}>
                            {financeUser.full_name} ({financeUser.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleAssignCashCall}
                      disabled={isAssigning}
                      className="flex-1 bg-[#0033A0] hover:bg-[#0033A0]/90 text-white"
                    >
                      {isAssigning ? "Assigning..." : "Assign"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsAssignmentDialogOpen(false)}
                      disabled={isAssigning}
                      className="flex-1 border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Cash Calls Table */}
            <Card className="aramco-card-bg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[#0033A0] text-xl">Cash Call Records</CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                      Showing {filteredCashCalls.length} of {cashCalls.length} records
                      {activeFiltersCount > 0 && (
                        <span className="ml-2 text-[#0033A0]">
                          ({activeFiltersCount} filter{activeFiltersCount !== 1 ? "s" : ""} active)
                        </span>
                      )}
                    </div>
                    
                    {/* Bulk Actions */}
                    {selectedItems.size > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#0033A0] font-medium">
                          {selectedItems.size} selected
                        </span>
                        {canApproveReject() && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleBulkAction('approve')}
                              className="bg-[#00843D] hover:bg-[#84BD00] text-white"
                            >
                              Approve Selected
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBulkAction('reject')}
                              className="border-red-500 text-red-500 hover:bg-red-500/10"
                            >
                              Reject Selected
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedItems(new Set())}
                          className="border-gray-400 text-gray-600"
                        >
                          Clear Selection
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        {canApproveReject() && (
                          <th className="text-left py-4 px-4 font-semibold text-[#0033A0] w-12">
                            <input
                              type="checkbox"
                              checked={selectedItems.size > 0 && selectedItems.size === paginatedCashCalls.length}
                              onChange={handleSelectAll}
                              className="rounded border-[#0033A0] text-[#0033A0] focus:ring-[#0033A0]"
                            />
                          </th>
                        )}
                        <th className="text-left py-4 px-4 font-semibold text-[#0033A0]">ID</th>
                        <th className="text-left py-4 px-4 font-semibold text-[#0033A0]">Affiliate Name</th>
                        <th className="text-left py-4 px-4 font-semibold text-[#0033A0]">Amount Requested</th>
                        <th className="text-left py-4 px-4 font-semibold text-[#0033A0]">Status</th>
                        <th className="text-left py-4 px-4 font-semibold text-[#0033A0]">Assigned To</th>
                        <th className="text-left py-4 px-4 font-semibold text-[#0033A0]">Documents</th>
                        <th className="text-left py-4 px-4 font-semibold text-[#0033A0]">Created</th>
                        <th className="text-left py-4 px-4 font-semibold text-[#0033A0]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCashCalls.map((cashCall) => (
                        <tr
                          key={cashCall.id}
                          className="border-b border-gray-100 hover:bg-[#0033A0]/5 transition-colors cursor-pointer"
                          onClick={() => handleRowClick(cashCall.id)}
                        >
                          {canApproveReject() && (
                            <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedItems.has(cashCall.id)}
                                onChange={() => handleSelectItem(cashCall.id)}
                                className="rounded border-[#0033A0] text-[#0033A0] focus:ring-[#0033A0]"
                              />
                            </td>
                          )}
                          <td className="py-4 px-4 font-semibold text-[#00A3E0]">{cashCall.call_number}</td>
                          <td className="py-4 px-4 text-gray-700 font-medium">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAffiliateClick(cashCall.affiliate_id)
                              }}
                              className="text-[#00A3E0] hover:text-[#0033A0] hover:underline font-semibold"
                            >
                              {affiliates.find(aff => aff.id === cashCall.affiliate_id)?.name || "Unknown Affiliate"}
                            </button>
                          </td>
                          <td className="py-4 px-4 font-bold text-gray-800">
                            ${cashCall.amount_requested.toLocaleString()}
                          </td>
                          <td className="py-4 px-4">
                            <Badge className={getStatusBadgeClass(cashCall.status)}>
                              {getStatusDisplayName(cashCall.status)}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-gray-600">
                            {cashCall.assigneeUserId ? (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 text-[#0033A0]" />
                                <span className="text-sm">
                                  {users.find(u => u.id === cashCall.assigneeUserId)?.full_name || "Unknown User"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Unassigned</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-gray-600">
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3 text-[#0033A0]" />
                              <span className="text-sm">
                                {documentCounts[cashCall.id] || 0}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-gray-600">
                            {new Date(cashCall.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRowClick(cashCall.id)
                                }}
                                className="text-xs border-[#00A3E0] text-[#00A3E0] hover:bg-[#00A3E0]/10"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              {cashCall.status === "draft" && canSubmit() && (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleStatusChange(cashCall.id, "under_review")
                                  }}
                                  className="text-xs bg-[#00A3E0] hover:bg-[#0033A0] text-white"
                                >
                                  Submit
                                </Button>
                              )}
                              {cashCall.status === "under_review" && canApproveReject() && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleStatusChange(cashCall.id, "approved")
                                    }}
                                    className="text-xs bg-[#00843D] hover:bg-[#84BD00] text-white"
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleStatusChange(cashCall.id, "rejected")
                                    }}
                                    className="text-xs bg-red-500 hover:bg-red-600 text-white"
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              {cashCall.status === "finance_review" && canSendToCFO() && (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleStatusChange(cashCall.id, "ready_for_cfo")
                                  }}
                                  className="text-xs bg-[#00A3E0] hover:bg-[#0033A0] text-white"
                                >
                                  Send to CFO
                                </Button>
                              )}
                              {cashCall.status === "ready_for_cfo" && canApproveReject() && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleStatusChange(cashCall.id, "approved")
                                    }}
                                    className="text-xs bg-[#00843D] hover:bg-[#84BD00] text-white"
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleStatusChange(cashCall.id, "rejected")
                                    }}
                                    className="text-xs bg-red-500 hover:bg-red-600 text-white"
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              {cashCall.status === "approved" && canApproveReject() && (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleStatusChange(cashCall.id, "paid")
                                  }}
                                  className="text-xs bg-[#84BD00] hover:bg-[#00843D] text-white"
                                >
                                  Mark Paid
                                </Button>
                              )}
                              {/* Assignment button for admin users */}
                              {userProfile?.role === 'admin' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAssignmentClick(cashCall)
                                  }}
                                  className="text-xs border-[#00A3E0] text-[#00A3E0] hover:bg-[#00A3E0]/10"
                                >
                                  <Users className="h-3 w-3 mr-1" />
                                  {cashCall.assigneeUserId ? 'Reassign' : 'Assign'}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredCashCalls.length)} of {filteredCashCalls.length} results
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10"
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className={
                              currentPage === page
                                ? "bg-[#0033A0] text-white"
                                : "border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10"
                            }
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}

                {filteredCashCalls.length === 0 && !isLoading && (
                  <div className="text-center py-12">
                    <div className="text-gray-500 mb-4">
                      {cashCalls.length === 0
                        ? "No cash calls yet. Create your first cash call to get started!"
                        : activeFiltersCount > 0
                          ? "No cash calls found matching your filter criteria."
                          : "No cash calls found."}
                    </div>
                    {cashCalls.length === 0 && (
                      <Button
                        onClick={() => setIsNewCashCallOpen(true)}
                        className="aramco-button-primary text-white enhanced-button"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Cash Call
                      </Button>
                    )}
                    {activeFiltersCount > 0 && cashCalls.length > 0 && (
                      <Button
                        onClick={clearFilters}
                        variant="outline"
                        className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10 bg-transparent"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear Filters
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>



          <TabsContent value="affiliate" className="space-y-6">
            {selectedAffiliateId && (
              <AffiliateProfile
                affiliateId={selectedAffiliateId}
                onBack={() => {
                  setActiveView("dashboard")
                  setSelectedAffiliateId(null)
                }}
              />
            )}
          </TabsContent>

          {userProfile?.role === "admin" && (
            <TabsContent value="audit" className="space-y-6">
              <AuditMode currentUser={userProfile} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <NotificationProvider>
      <DashboardContent />
    </NotificationProvider>
  )
}
