"use client"

import { useState, useEffect } from "react"
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
  type CashCall, 
  type Affiliate,
  type User
} from "@/lib/firebase-database"
import { AdminSettings } from "@/components/admin-settings"
import { ReportingDashboard } from "@/components/reporting-dashboard"
import { ExportButton } from "@/components/export-functions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AffiliateProfile } from "@/components/affiliate-profile"
import { AuditMode } from "@/components/audit-mode"
import { AnimatedLoading } from "@/components/animated-loading"

interface FilterState {
  search: string
  status: string
  affiliate: string
  approver: string
  dateFrom: string
  dateTo: string
  amountMin: string
  amountMax: string
}

export default function Dashboard() {
  const { user, userProfile, signOut } = useAuth()
  const [cashCalls, setCashCalls] = useState<CashCall[]>([])
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [filteredCashCalls, setFilteredCashCalls] = useState<CashCall[]>([])
  const [filters, setFilters] = useState<FilterState>({
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
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [activeView, setActiveView] = useState<"dashboard" | "reports" | "affiliate" | "audit">("dashboard")
  const [selectedAffiliateId, setSelectedAffiliateId] = useState<string | null>(null)

  // New cash call form state
  const [newCashCall, setNewCashCall] = useState({
    affiliateId: "",
    amountRequested: "",
    description: "",
    justification: "",
  })

  // Check authentication on mount
  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
  }, [user, router])

  // Load cash calls and affiliates when user is set
  useEffect(() => {
    if (user?.uid) {
      loadData()
    }
  }, [user])

  useEffect(() => {
    applyFilters()
  }, [filters, cashCalls])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError("")
      setIsRefreshing(true)

      const [cashCallsData, affiliatesData, usersData] = await Promise.all([
        getCashCalls(),
        getAffiliates(),
        getUsers(),
      ])

      setCashCalls(cashCallsData)
      setAffiliates(affiliatesData)
      setUsers(usersData)
      setFilteredCashCalls(cashCallsData)
    } catch (err) {
      console.error("Error loading data:", err)
      setError("Failed to load data. Please try refreshing the page.")
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
    if (!newCashCall.affiliateId || !newCashCall.amountRequested) {
      setError("Please fill in all required fields")
      return
    }

    if (!user?.uid) {
      setError("You must be logged in to create a cash call")
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
        affiliate_id: newCashCall.affiliateId,
        amount_requested: amount,
        description: newCashCall.description || undefined,
        created_by: user.uid,
        status: (isDraft ? "draft" : "under_review") as "draft" | "under_review",
        currency: "USD",
        exchange_rate: 1,
        priority: "medium" as const,
        compliance_status: "pending" as const,
      }

      const newCallId = await createCashCall(cashCallData)

      // Add the new cash call to the list
      const newCall = {
        id: newCallId,
        ...cashCallData,
        created_at: new Date(),
        updated_at: new Date(),
      } as CashCall

      setCashCalls([newCall, ...cashCalls])

      // Reset form and close dialog
      setNewCashCall({ affiliateId: "", amountRequested: "", description: "", justification: "" })
      setIsNewCashCallOpen(false)

      setError("")
    } catch (err) {
      console.error("Error creating cash call:", err)
      setError("Failed to create cash call. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleStatusChange = async (cashCallId: string, newStatus: string) => {
    if (!user?.uid) {
      setError("You must be logged in to update cash calls")
      return
    }

    try {
      setError("")
      await updateCashCall(cashCallId, { status: newStatus as any }, user.uid)

      // Update the cash call in the list
      setCashCalls(cashCalls.map((call) => (call.id === cashCallId ? { ...call, status: newStatus as any } : call)))
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

  const handleRowClick = (cashCallId: string) => {
    router.push(`/cash-call/${cashCallId}`)
  }

  const handleAffiliateClick = (affiliateId: string) => {
    setSelectedAffiliateId(affiliateId)
    setActiveView("affiliate")
  }

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
                {userProfile?.role?.charAt(0).toUpperCase() + userProfile?.role?.slice(1)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AdminSettings currentUser={userProfile} onDataChange={loadData} />

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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="aramco-card-bg border-l-4 border-l-[#0033A0] hover:scale-105 transition-all duration-300">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Cash Calls</CardTitle>
              <TrendingUp className="h-4 w-4 text-[#0033A0]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#0033A0]">{cashCalls.length}</div>
            </CardContent>
          </Card>

          <Card className="aramco-card-bg border-l-4 border-l-[#00A3E0] hover:scale-105 transition-all duration-300">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Under Review</CardTitle>
              <Clock className="h-4 w-4 text-[#00A3E0]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#00A3E0]">
                {cashCalls.filter((c) => c.status === "under_review").length}
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
                {cashCalls.filter((c) => c.status === "approved").length}
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
                ${cashCalls.reduce((sum, call) => sum + call.amount_requested, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content with Tabs */}
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)} className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <TabsList className="grid w-full max-w-3xl grid-cols-5 bg-white/80 backdrop-blur-sm">
              <TabsTrigger
                value="dashboard"
                onClick={() => setActiveView("dashboard")}
                className="data-[state=active]:bg-[#0033A0] data-[state=active]:text-white"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                onClick={() => setActiveView("reports")}
                className="data-[state=active]:bg-[#0033A0] data-[state=active]:text-white"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Reports
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
            {/* Filters and Actions */}
            <Card className="aramco-card-bg">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  <div className="flex flex-col md:flex-row gap-4 flex-1">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search by affiliate, ID, or description..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#00A3E0] focus:ring-[#00A3E0]"
                      />
                    </div>

                    <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10 bg-transparent relative"
                        >
                          <Filter className="h-4 w-4 mr-2" />
                          Advanced Filters
                          {activeFiltersCount > 0 && (
                            <Badge className="ml-2 bg-[#0033A0] text-white text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5">
                              {activeFiltersCount}
                            </Badge>
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl aramco-card-bg">
                        <DialogHeader>
                          <DialogTitle className="text-white">Advanced Filters</DialogTitle>
                          <DialogDescription className="text-white/80">
                            Filter cash calls by various criteria
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-white">Status</Label>
                            <Select
                              value={filters.status}
                              onValueChange={(value) => setFilters({ ...filters, status: value })}
                            >
                              <SelectTrigger className="enhanced-select">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-gray-300">
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="under_review">Under Review</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-white">Affiliate</Label>
                            <Select
                              value={filters.affiliate}
                              onValueChange={(value) => setFilters({ ...filters, affiliate: value })}
                            >
                              <SelectTrigger className="enhanced-select">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-gray-300">
                                <SelectItem value="all">All Affiliates</SelectItem>
                                {affiliates.map((affiliate) => (
                                  <SelectItem key={affiliate.id} value={affiliate.id}>
                                    {affiliate.name} ({affiliate.company_code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-white">Approver</Label>
                            <Select
                              value={filters.approver}
                              onValueChange={(value) => setFilters({ ...filters, approver: value })}
                            >
                              <SelectTrigger className="enhanced-select">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-gray-300">
                                <SelectItem value="all">All Approvers</SelectItem>
                                {users
                                  .filter((u) => u.role !== "viewer")
                                  .map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.full_name || user.email}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-white">Date From</Label>
                            <Input
                              type="date"
                              value={filters.dateFrom}
                              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                              className="enhanced-input"
                            />
                          </div>

                          <div>
                            <Label className="text-white">Date To</Label>
                            <Input
                              type="date"
                              value={filters.dateTo}
                              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                              className="enhanced-input"
                            />
                          </div>

                          <div>
                            <Label className="text-white">Min Amount ($)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={filters.amountMin}
                              onChange={(e) => setFilters({ ...filters, amountMin: e.target.value })}
                              placeholder="0.00"
                              className="enhanced-input"
                            />
                          </div>

                          <div>
                            <Label className="text-white">Max Amount ($)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={filters.amountMax}
                              onChange={(e) => setFilters({ ...filters, amountMax: e.target.value })}
                              placeholder="999999.99"
                              className="enhanced-input"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between pt-4">
                          <Button
                            onClick={clearFilters}
                            variant="outline"
                            className="border-gray-400 text-gray-300 hover:bg-gray-700 bg-transparent"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Clear All
                          </Button>
                          <Button onClick={() => setIsFilterOpen(false)} className="aramco-button-primary text-white">
                            Apply Filters
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
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
                          Add a new cash call request for an affiliate.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
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
                  <div className="text-sm text-gray-600">
                    Showing {filteredCashCalls.length} of {cashCalls.length} records
                    {activeFiltersCount > 0 && (
                      <span className="ml-2 text-[#0033A0]">
                        ({activeFiltersCount} filter{activeFiltersCount !== 1 ? "s" : ""} active)
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-4 px-4 font-semibold text-[#0033A0]">ID</th>
                        <th className="text-left py-4 px-4 font-semibold text-[#0033A0]">Affiliate Name</th>
                        <th className="text-left py-4 px-4 font-semibold text-[#0033A0]">Amount Requested</th>
                        <th className="text-left py-4 px-4 font-semibold text-[#0033A0]">Status</th>
                        <th className="text-left py-4 px-4 font-semibold text-[#0033A0]">Created</th>
                        <th className="text-left py-4 px-4 font-semibold text-[#0033A0]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCashCalls.map((cashCall) => (
                        <tr
                          key={cashCall.id}
                          className="border-b border-gray-100 hover:bg-[#0033A0]/5 transition-colors cursor-pointer"
                          onClick={() => handleRowClick(cashCall.id)}
                        >
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

          <TabsContent value="reports" className="space-y-6">
                            <ReportingDashboard cashCalls={cashCalls} affiliates={affiliates} />
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
