"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Shield, Search, Filter, RefreshCw, FileText, X } from "lucide-react"
import { useAuth } from "@/lib/firebase-auth-context"
import { 
  getActivityLogs, 
  getCashCalls, 
  getUsers,
  type ActivityLog,
  type CashCall,
  type User
} from "@/lib/firebase-database"

interface AuditModeProps {
  currentUser: User | null
}

interface AuditFilters {
  search: string
  cashCallId: string
  userId: string
  action: string
  dateFrom: string
  dateTo: string
}

export function AuditMode({ currentUser }: AuditModeProps) {
  const [auditLog, setAuditLog] = useState<ActivityLog[]>([])
  const [filteredAuditLog, setFilteredAuditLog] = useState<ActivityLog[]>([])
  const [cashCalls, setCashCalls] = useState<CashCall[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [filters, setFilters] = useState<AuditFilters>({
    search: "",
    cashCallId: "all",
    userId: "all",
    action: "all",
    dateFrom: "",
    dateTo: "",
  })

  useEffect(() => {
    if (currentUser?.role === "admin") {
      loadAuditData()
    }
  }, [currentUser])

  useEffect(() => {
    applyFilters()
  }, [filters, auditLog])

  const loadAuditData = async () => {
    try {
      setIsLoading(true)
      setError("")

      const [auditData, cashCallsData, usersData] = await Promise.all([
        getActivityLogs(),
        getCashCalls(),
        getUsers(),
      ])

      setAuditLog(auditData)
      setCashCalls(cashCallsData)
      setUsers(usersData)
    } catch (err) {
      console.error("Error loading audit data:", err)
      setError("Failed to load audit data")
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...auditLog]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        (entry) =>
          entry.action.toLowerCase().includes(searchLower) ||
          entry.entity_type.toLowerCase().includes(searchLower) ||
          (entry.old_values && JSON.stringify(entry.old_values).toLowerCase().includes(searchLower)) ||
          (entry.new_values && JSON.stringify(entry.new_values).toLowerCase().includes(searchLower))
      )
    }

    // Cash call filter
    if (filters.cashCallId !== "all") {
      filtered = filtered.filter((entry) => entry.entity_id === filters.cashCallId && entry.entity_type === "cash_call")
    }

    // User filter
    if (filters.userId !== "all") {
      filtered = filtered.filter((entry) => entry.user_id === filters.userId)
    }

    // Action filter
    if (filters.action !== "all") {
      filtered = filtered.filter((entry) => entry.action === filters.action)
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      filtered = filtered.filter((entry) => entry.created_at >= fromDate)
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter((entry) => entry.created_at <= toDate)
    }

    setFilteredAuditLog(filtered)
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      cashCallId: "all",
      userId: "all",
      action: "all",
      dateFrom: "",
      dateTo: "",
    })
  }

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case "created":
        return "bg-blue-500 text-white"
      case "updated":
        return "bg-yellow-500 text-white"
      case "status_changed":
        return "bg-green-500 text-white"
      case "deleted":
        return "bg-red-500 text-white"
      case "approved":
        return "bg-green-600 text-white"
      case "rejected":
        return "bg-red-600 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getActionDisplayName = (action: string) => {
    switch (action) {
      case "created":
        return "Created"
      case "updated":
        return "Updated"
      case "status_changed":
        return "Status Changed"
      case "deleted":
        return "Deleted"
      case "approved":
        return "Approved"
      case "rejected":
        return "Rejected"
      default:
        return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleString()
  }

  const getCashCallNumber = (cashCallId: string) => {
    const cashCall = cashCalls.find((call) => call.id === cashCallId)
    return cashCall?.call_number || cashCallId
  }

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    return user?.full_name || user?.email || userId
  }

  const formatValue = (value: any) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">Empty</span>
    }
    if (typeof value === 'object') {
      return <span className="max-w-xs truncate block">{JSON.stringify(value)}</span>
    }
    return <span className="max-w-xs truncate block">{String(value)}</span>
  }

  if (currentUser?.role !== "admin") {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Access Denied</h3>
        <p className="text-gray-600">Only administrators can access the audit mode.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading audit data...</div>
      </div>
    )
  }

  const activeFiltersCount = Object.values(filters).filter(
    (value, index) => value !== "" && (index === 0 || value !== "all"),
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0033A0] to-[#00A3E0] bg-clip-text text-transparent flex items-center gap-2">
            <Shield className="h-6 w-6 text-[#0033A0]" />
            Audit Mode
          </h1>
          <p className="text-gray-600">Track all changes and modifications to cash call records</p>
        </div>
        <Button
          onClick={loadAuditData}
          variant="outline"
          className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10 bg-transparent"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Filters */}
      <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-[#0033A0] text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Audit Filters
            {activeFiltersCount > 0 && (
              <Badge className="bg-[#0033A0] text-white text-xs px-2 py-1">{activeFiltersCount} active</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label className="text-gray-700 text-sm">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search changes..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10 bg-white border-gray-300 text-gray-900"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-700 text-sm">Cash Call</Label>
              <Select
                value={filters.cashCallId}
                onValueChange={(value) => setFilters({ ...filters, cashCallId: value })}
              >
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  <SelectItem value="all">All Cash Calls</SelectItem>
                  {cashCalls.map((cashCall) => (
                    <SelectItem key={cashCall.id} value={cashCall.id}>
                      {cashCall.call_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-700 text-sm">User</Label>
              <Select value={filters.userId} onValueChange={(value) => setFilters({ ...filters, userId: value })}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-700 text-sm">Action</Label>
              <Select
                value={filters.action}
                onValueChange={(value) => setFilters({ ...filters, action: value })}
              >
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="updated">Updated</SelectItem>
                  <SelectItem value="status_changed">Status Changed</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-700 text-sm">Date From</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>

            <div>
              <Label className="text-gray-700 text-sm">Date To</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <div className="flex justify-end mt-4">
              <Button
                onClick={clearFilters}
                variant="outline"
                size="sm"
                className="border-gray-400 text-gray-600 hover:bg-gray-100 bg-transparent"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#0033A0] text-xl">Audit Log</CardTitle>
            <div className="text-sm text-gray-600">
              Showing {filteredAuditLog.length} of {auditLog.length} entries
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAuditLog.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-[#0033A0]">Cash Call</th>
                    <th className="text-left py-4 px-4 font-semibold text-[#0033A0]">Field Changed</th>
                    <th className="text-left py-4 px-4 font-semibold text-[#0033A0]">Old Value</th>
                    <th className="text-left py-4 px-4 font-semibold text-[#0033A0]">New Value</th>
                    <th className="text-left py-4 px-4 font-semibold text-[#0033A0]">Changed By</th>
                    <th className="text-left py-4 px-4 font-semibold text-[#0033A0]">Type</th>
                    <th className="text-left py-4 px-4 font-semibold text-[#0033A0]">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuditLog.map((entry) => (
                    <tr key={entry.id} className="border-b border-gray-100 hover:bg-[#0033A0]/5 transition-colors">
                      <td className="py-4 px-4 font-semibold text-[#00A3E0]">
                        {getCashCallNumber(entry.entity_id)}
                      </td>
                      <td className="py-4 px-4 text-gray-800 font-medium">{entry.action}</td>
                      <td className="py-4 px-4 text-gray-600">
                        {entry.old_values ? (
                          <span className="max-w-xs truncate block">
                            {formatValue(entry.old_values)}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Empty</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-gray-800">
                        {entry.new_values ? (
                          <span className="max-w-xs truncate block">
                            {formatValue(entry.new_values)}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Empty</span>
                        )}
                      </td>
                                             <td className="py-4 px-4 text-gray-700">{entry.user_id ? getUserName(entry.user_id) : 'Unknown'}</td>
                      <td className="py-4 px-4">
                        <Badge className={getActionBadgeClass(entry.action)}>
                          {getActionDisplayName(entry.action)}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-gray-600 text-sm">{formatDate(entry.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {auditLog.length === 0
                  ? "No audit entries found"
                  : activeFiltersCount > 0
                    ? "No entries match your filter criteria"
                    : "No audit entries to display"}
              </p>
              {activeFiltersCount > 0 && auditLog.length > 0 && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="mt-4 border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10 bg-transparent"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
