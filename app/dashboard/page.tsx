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
} from "lucide-react"
import { useAuth } from "@/lib/firebase-auth-context"
import { 
  getCashCalls, 
  getAffiliates, 
  createCashCall,
  updateCashCall,
  getUsers,
  signOutUser,
  seedSampleData,
  getStatusOptions,
  getCashCallsForUser,
  type CashCall, 
  type Affiliate,
  type User,
  type StatusOption
} from "@/lib/firebase-database"
import { AdminSettings } from "@/components/admin-settings"

import { ExportButton } from "@/components/export-functions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AffiliateProfile } from "@/components/affiliate-profile"
import { AuditMode } from "@/components/audit-mode"
import { AnimatedLoading } from "@/components/animated-loading"
import { NotificationProvider, NotificationBell, useStatusChangeNotifications } from "@/components/notification-system"
import { BulkImportExport } from "@/components/bulk-import-export"
import { AdvancedSearch, SearchFilter } from "@/components/advanced-search"
import { DashboardCustomization, DashboardWidget } from "@/components/dashboard-customization"

// Use the SearchFilter interface from advanced-search component
type FilterState = SearchFilter

function DashboardContent() {
  const { user, userProfile, signOut } = useAuth()
  const { notifyStatusChange } = useStatusChangeNotifications()
  const [cashCalls, setCashCalls] = useState<CashCall[]>([])
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([])
  const [filteredCashCalls, setFilteredCashCalls] = useState<CashCall[]>([])
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
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
  const [isCreating, setIsCreating] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [retryCount, setRetryCount] = useState(0)
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
    }
  }, [user])

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

      // Use role-based access control
      const [cashCallsData, affiliatesData, statusOptionsData] = await Promise.all([
        getCashCallsForUser(user.uid, userProfile.role || 'viewer', userProfile.affiliate_company_id),
        getAffiliates(),
        getStatusOptions(),
      ])

      console.log('Debug - Loaded data:', {
        userRole: userProfile.role,
        userAffiliateId: userProfile.affiliate_company_id,
        cashCallsCount: cashCallsData.length,
        cashCalls: cashCallsData.map(cc => ({ id: cc.id, affiliate_id: cc.affiliate_id, status: cc.status })),
        affiliatesCount: affiliatesData.length
      })

      setCashCalls(cashCallsData)
      setAffiliates(affiliatesData)
      setStatusOptions(statusOptionsData)

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
        amount_requested: amount,
        description: newCashCall.description || undefined,
        created_by: user.uid,
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
      setNewCashCall({ affiliateId: "", amountRequested: "", description: "", justification: "" })
      setIsNewCashCallOpen(false)

      setError("")
    } catch (err: any) {
      console.error("Error creating cash call:", err)
      
      // Handle specific Firebase permission errors
      if (err.code === 'permission-denied' || err.message?.includes('permission')) {
        setError("Permission denied. Please check your authentication status and try again.")
      } else if (err.code === 'unauthenticated') {
        setError("You are not authenticated. Please log in again.")
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

    // Enforce role-based access control
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
    } catch (err) {
      console.error("Error updating status:", err)
      setError("Failed to update status. Please try again.")
    }
  }

  const handleRefresh = () => {
    if (user?.uid) {
      loadData()
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

            <Button
              onClick={() => router.push('/reports')}
              variant="outline"
              size="sm"
              className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10 bg-transparent"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Reports
            </Button>

            {userProfile?.role === 'admin' && (
              <Button
                onClick={() => router.push('/settings')}
                variant="outline"
                size="sm"
                className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10 bg-transparent"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
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
                onLayoutChange={(widgets) => {
                  console.log('Layout changed:', widgets)
                  // TODO: Implement layout change logic
                }}
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="aramco-card-bg border-l-4 border-l-[#0033A0] hover:scale-105 transition-all duration-300">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Cash Calls</CardTitle>
              <TrendingUp className="h-4 w-4 text-[#0033A0]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#0033A0]">{memoizedStats.totalCalls}</div>
            </CardContent>
          </Card>

          <Card className="aramco-card-bg border-l-4 border-l-[#00A3E0] hover:scale-105 transition-all duration-300">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Under Review</CardTitle>
              <Clock className="h-4 w-4 text-[#00A3E0]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#00A3E0]">
                {memoizedStats.underReview}
              </div>
            </CardContent>
          </Card>

          <Card className="aramco-card-bg border-l-4 border-l-[#00843D] hover:scale-105 transition-all duration-300">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-[#00843D]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#00843D]">
                {memoizedStats.approved}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {memoizedStats.totalCalls > 0 
                  ? `${Math.round((memoizedStats.approved / memoizedStats.totalCalls) * 100)}% approval rate`
                  : 'No cash calls yet'
                }
              </div>
            </CardContent>
          </Card>

          <Card className="aramco-card-bg border-l-4 border-l-[#84BD00] hover:scale-105 transition-all duration-300">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-[#84BD00]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#84BD00]">
                ${memoizedStats.totalAmount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Pending: ${memoizedStats.pendingAmount.toLocaleString()}
              </div>
            </CardContent>
          </Card>
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
                    <DialogContent className="sm:max-w-md aramco-card-bg">
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
                        {userProfile?.role !== "viewer" && (
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
                          {userProfile?.role !== "viewer" && (
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
                              {cashCall.status === "draft" && (
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
                              {cashCall.status === "under_review" && userProfile?.role !== "viewer" && (
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
                              {cashCall.status === "approved" && userProfile?.role !== "viewer" && (
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
