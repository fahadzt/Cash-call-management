"use client"

import { useState, useMemo, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  Legend,
  ComposedChart,
  ScatterChart,
  Scatter
} from "recharts"
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  BarChart3, 
  PieChartIcon, 
  Download, 
  Share2, 
  Calendar, 
  Target, 
  AlertTriangle, 
  TrendingDown,
  ArrowLeft,
  BarChartIcon,
  LineChartIcon,
  PieChart as PieChartIcon2,
  Activity,
  Filter,
  RefreshCw
} from "lucide-react"
import { useAuth } from "@/lib/firebase-auth-context"
import { getCashCalls, getAffiliates, getCashCallsForUser } from "@/lib/firebase-database"
import type { CashCall, Affiliate } from "@/lib/firebase-database"
import { useEffect } from "react"

interface ChartType {
  id: string
  label: string
  icon: React.ReactNode
}

const chartTypes: ChartType[] = [
  { id: 'bar', label: 'Bar', icon: <BarChartIcon className="h-4 w-4" /> },
  { id: 'line', label: 'Line', icon: <LineChartIcon className="h-4 w-4" /> },
  { id: 'area', label: 'Area', icon: <Activity className="h-4 w-4" /> }
]

interface FilterState {
  timeRange: string
  affiliate: string
  status: string
  chartType: 'bar' | 'line' | 'area' | 'composed' | 'scatter'
}

export default function ReportsPage() {
  const { user, userProfile, signOut } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [cashCalls, setCashCalls] = useState<CashCall[]>([])
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [activeTab, setActiveTab] = useState("overview")
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar')
  const [filters, setFilters] = useState<FilterState>({
    timeRange: "6months",
    affiliate: "all",
    status: "all",
    chartType: 'bar'
  })
  const [isExporting, setIsExporting] = useState(false)
  const router = useRouter()

  // Chart refs for PDF export
  const monthlyChartRef = useRef<HTMLDivElement>(null)
  const statusChartRef = useRef<HTMLDivElement>(null)
  const affiliateChartRef = useRef<HTMLDivElement>(null)

  // Memoized filtered cash calls
  const filteredCashCalls = useMemo(() => {
    const now = new Date()
    const startDate = new Date()

    switch (filters.timeRange) {
      case "1month":
        startDate.setMonth(now.getMonth() - 1)
        break
      case "3months":
        startDate.setMonth(now.getMonth() - 3)
        break
      case "6months":
        startDate.setMonth(now.getMonth() - 6)
        break
      case "1year":
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        return cashCalls
    }

    let filtered = cashCalls.filter((call) => new Date(call.created_at) >= startDate)

    // Apply affiliate filter
    if (filters.affiliate !== "all") {
      filtered = filtered.filter((call) => call.affiliate_id === filters.affiliate)
    }

    // Apply status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((call) => call.status === filters.status)
    }

    return filtered
  }, [cashCalls, filters])

  // Cash Call Analytics Data - generated from real cash call data
  const cashCallAnalyticsData = useMemo(() => {
    if (!filteredCashCalls.length) return []
    
    const monthlyData = filteredCashCalls.reduce((acc, call) => {
      const date = new Date(call.created_at)
      const month = date.toLocaleString('default', { month: 'short' })
      
      if (!acc[month]) {
        acc[month] = { month, created: 0, approved: 0, pending: 0, amount: 0 }
      }
      
      acc[month].created++
      acc[month].amount += call.amount_requested
      
      if (call.status === 'approved' || call.status === 'paid') {
        acc[month].approved++
      } else if (call.status === 'under_review' || call.status === 'draft') {
        acc[month].pending++
      }
      
      return acc
    }, {} as Record<string, { month: string; created: number; approved: number; pending: number; amount: number }>)
    
    return Object.values(monthlyData).slice(-6) // Last 6 months
  }, [filteredCashCalls])

  const statusDistributionData = useMemo(() => {
    if (!filteredCashCalls.length) return []
    
    const statusCounts = filteredCashCalls.reduce((acc, call) => {
      acc[call.status] = (acc[call.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const colors = {
      'approved': '#10B981',
      'under_review': '#F59E0B', 
      'draft': '#6B7280',
      'rejected': '#EF4444',
      'paid': '#3B82F6'
    }
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count,
      color: colors[status as keyof typeof colors] || '#6B7280'
    }))
  }, [filteredCashCalls])

  const affiliateDistributionData = useMemo(() => {
    if (!filteredCashCalls.length || !affiliates.length) return []
    
    const affiliateCounts = filteredCashCalls.reduce((acc, call) => {
      const affiliate = affiliates.find(a => a.id === call.affiliate_id)
      const name = affiliate?.name || 'Unknown'
      acc[name] = (acc[name] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
    
    return Object.entries(affiliateCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([name, count], index) => ({
        name,
        value: count,
        color: colors[index % colors.length]
      }))
  }, [filteredCashCalls, affiliates])

  // Enhanced analytics calculations
  const analytics = useMemo(() => {
    const totalAmount = filteredCashCalls.reduce((sum, call) => sum + call.amount_requested, 0)
    const approvedAmount = filteredCashCalls
      .filter((call) => call.status === "approved" || call.status === "paid")
      .reduce((sum, call) => sum + call.amount_requested, 0)
    const approvalRate = filteredCashCalls.length > 0
      ? Math.round((filteredCashCalls.filter((call) => call.status === "approved" || call.status === "paid").length / filteredCashCalls.length) * 100)
      : 0
    const avgAmount = filteredCashCalls.length > 0 ? Math.round(totalAmount / filteredCashCalls.length) : 0

    // Trend analysis
    const currentPeriod = filteredCashCalls.length
    const previousPeriod = Math.max(0, currentPeriod - Math.floor(currentPeriod * 0.3)) // Rough estimate
    const growthRate = previousPeriod > 0 ? ((currentPeriod - previousPeriod) / previousPeriod) * 100 : 0

    // Performance metrics
    const avgApprovalTime = filteredCashCalls
      .filter(call => call.approved_at)
      .reduce((sum, call) => {
        const approvalTime = Math.floor(
          (new Date(call.approved_at!).getTime() - new Date(call.created_at).getTime()) / (1000 * 60 * 60 * 24)
        )
        return sum + approvalTime
      }, 0) / Math.max(1, filteredCashCalls.filter(call => call.approved_at).length)

    return {
      totalAmount,
      approvedAmount,
      approvalRate,
      avgAmount,
      growthRate,
      trend: growthRate > 0 ? 'up' : 'down',
      pendingAmount: filteredCashCalls
        .filter(call => call.status === 'under_review')
        .reduce((sum, call) => sum + call.amount_requested, 0),
      avgApprovalTime: Math.round(avgApprovalTime),
      totalRequests: filteredCashCalls.length,
      rejectedAmount: filteredCashCalls
        .filter(call => call.status === 'rejected')
        .reduce((sum, call) => sum + call.amount_requested, 0)
    }
  }, [filteredCashCalls])

  const scatterData = useMemo(() => 
    filteredCashCalls.map(call => {
      const affiliate = affiliates.find(aff => aff.id === call.affiliate_id)
      return {
        amount: call.amount_requested,
        daysSinceCreated: Math.floor((new Date().getTime() - new Date(call.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        status: call.status,
        affiliate: affiliate?.name || 'Unknown'
      }
    })
  , [filteredCashCalls, affiliates])

  // Export functionality
  const exportToCSV = useCallback(() => {
    setIsExporting(true)
    
    const csvData = [
      ['Month', 'Cash Calls', 'Total Amount', 'Average Amount', 'Approved', 'Pending'],
      ...cashCallAnalyticsData.map(row => [
        row.month,
        row.created.toString(),
        `$${row.amount.toLocaleString()}`,
        `$${Math.round(row.amount / row.created).toLocaleString()}`,
        row.approved.toString(),
        row.pending.toString()
      ])
    ]

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cash-call-reports-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    setTimeout(() => setIsExporting(false), 1000)
  }, [cashCallAnalyticsData])

  const renderChart = (data: any[], title: string, description: string) => {
    if (!data.length) {
      return (
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-gray-900 text-lg font-semibold flex items-center gap-2">
              <BarChartIcon className="h-5 w-5 text-gray-700" />
              {title}
            </CardTitle>
            <p className="text-gray-600 text-sm mt-1">{description}</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-center h-64 text-gray-500">
              No data available for the selected filters
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900 text-lg font-semibold flex items-center gap-2">
                <BarChartIcon className="h-5 w-5 text-gray-700" />
                {title}
              </CardTitle>
              <p className="text-gray-600 text-sm mt-1">{description}</p>
            </div>
            <div className="flex gap-2">
              {chartTypes.map((type) => (
                <Button
                  key={type.id}
                  variant={chartType === type.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType(type.id as 'bar' | 'line' | 'area')}
                  className={chartType === type.id 
                    ? "bg-white text-green-600 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                  }
                >
                  {type.icon}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={350}>
            {chartType === 'bar' ? (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="month" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={['dataMin', 'dataMax']}
                  ticks={data.map(d => d.month)}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 'dataMax + 1']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '10px' }}
                />
                <Bar dataKey="created" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="approved" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : chartType === 'line' ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="month" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={['dataMin', 'dataMax']}
                  ticks={data.map(d => d.month)}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 'dataMax + 1']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '10px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="created" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="approved" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="pending" 
                  stroke="#F59E0B" 
                  strokeWidth={3}
                  dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#F59E0B', strokeWidth: 2 }}
                />
              </LineChart>
            ) : (
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="month" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={['dataMin', 'dataMax']}
                  ticks={data.map(d => d.month)}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 'dataMax + 1']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '10px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="created" 
                  stackId="1"
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.8}
                />
                <Area 
                  type="monotone" 
                  dataKey="approved" 
                  stackId="1"
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.8}
                />
                <Area 
                  type="monotone" 
                  dataKey="pending" 
                  stackId="1"
                  stroke="#F59E0B" 
                  fill="#F59E0B" 
                  fillOpacity={0.8}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>
    )
  }

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    
    const loadData = async () => {
      try {
        setIsLoading(true)
        
        // Load cash calls and affiliates based on user role
        const [cashCallsData, affiliatesData] = await Promise.all([
          getCashCallsForUser(user.uid, userProfile?.role || 'viewer', userProfile?.affiliate_company_id),
          getAffiliates()
        ])
        
        setCashCalls(cashCallsData)
        setAffiliates(affiliatesData)
      } catch (error) {
        console.error('Error loading reports data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [user, userProfile, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0033A0] via-[#0047B3] to-[#0052CC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0033A0] via-[#0047B3] to-[#0052CC]">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="text-white">
                <h1 className="text-xl font-semibold">Cash Call Reports</h1>
                <p className="text-sm text-white/80">Comprehensive analytics and insights</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={isExporting}
                className="text-white border-white/30 hover:bg-white/20"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Export CSV"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/settings")}
                className="text-white hover:bg-white/20"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.reload()}
              className="text-white hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={filters.timeRange} onValueChange={(value) => setFilters(prev => ({ ...prev, timeRange: value }))}>
              <SelectTrigger className="bg-white/20 border-white/30 text-white">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.affiliate} onValueChange={(value) => setFilters(prev => ({ ...prev, affiliate: value }))}>
              <SelectTrigger className="bg-white/20 border-white/30 text-white">
                <SelectValue placeholder="Affiliate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Affiliates</SelectItem>
                {affiliates.map((affiliate) => (
                  <SelectItem key={affiliate.id} value={affiliate.id}>
                    {affiliate.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="bg-white/20 border-white/30 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.chartType} onValueChange={(value) => setFilters(prev => ({ ...prev, chartType: value as any }))}>
              <SelectTrigger className="bg-white/20 border-white/30 text-white">
                <SelectValue placeholder="Chart Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="area">Area Chart</SelectItem>
                <SelectItem value="composed">Composed Chart</SelectItem>
                <SelectItem value="scatter">Scatter Plot</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Analytics Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Cash Calls</p>
                  <p className="text-white text-2xl font-bold">{analytics.totalRequests}</p>
                </div>
                <div className="bg-green-500/20 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Amount</p>
                  <p className="text-white text-2xl font-bold">${analytics.totalAmount.toLocaleString()}</p>
                </div>
                <div className="bg-blue-500/20 p-3 rounded-full">
                  <TrendingUp className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Approval Rate</p>
                  <p className="text-white text-2xl font-bold">{analytics.approvalRate}%</p>
                </div>
                <div className="bg-yellow-500/20 p-3 rounded-full">
                  <CheckCircle className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Avg Approval Time</p>
                  <p className="text-white text-2xl font-bold">{analytics.avgApprovalTime}d</p>
                </div>
                <div className="bg-purple-500/20 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-md border border-white/20">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-[#0033A0] data-[state=active]:text-white text-white rounded-md transition-all duration-200"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="data-[state=active]:bg-[#0033A0] data-[state=active]:text-white text-white rounded-md transition-all duration-200"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="affiliates" 
              className="data-[state=active]:bg-[#0033A0] data-[state=active]:text-white text-white rounded-md transition-all duration-200"
            >
              <Target className="h-4 w-4 mr-2" />
              Affiliates
            </TabsTrigger>
            <TabsTrigger 
              value="performance" 
              className="data-[state=active]:bg-[#0033A0] data-[state=active]:text-white text-white rounded-md transition-all duration-200"
            >
              <Activity className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6">
              {renderChart(cashCallAnalyticsData, "Cash Call Trends", "Monthly cash call creation and approval trends")}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-white text-lg font-semibold flex items-center gap-2">
                      <PieChartIcon2 className="h-5 w-5 text-white/80" />
                      Status Distribution
                    </CardTitle>
                    <p className="text-white/60 text-sm mt-1">Current cash call status breakdown</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusDistributionData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {statusDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-white text-lg font-semibold flex items-center gap-2">
                      <Target className="h-5 w-5 text-white/80" />
                      Affiliate Distribution
                    </CardTitle>
                    <p className="text-white/60 text-sm mt-1">Cash calls by affiliate company</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={affiliateDistributionData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {affiliateDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <div className="grid gap-6">
              {renderChart(cashCallAnalyticsData, "Cash Call Analytics", "Interactive visualization of cash call data")}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-white text-lg font-semibold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-white/80" />
                      Amount Trends
                    </CardTitle>
                    <p className="text-white/60 text-sm mt-1">Cash call amounts over time</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={cashCallAnalyticsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                        <XAxis dataKey="month" stroke="#ffffff80" />
                        <YAxis stroke="#ffffff80" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(0, 51, 160, 0.9)', 
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            color: 'white'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#10B981" 
                          fill="#10B981" 
                          fillOpacity={0.6}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-white text-lg font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-white/80" />
                      Performance Metrics
                    </CardTitle>
                    <p className="text-white/60 text-sm mt-1">Key performance indicators</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-white/80">Pending Amount:</span>
                        <span className="text-white font-semibold">${analytics.pendingAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/80">Rejected Amount:</span>
                        <span className="text-white font-semibold">${analytics.rejectedAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/80">Average Amount:</span>
                        <span className="text-white font-semibold">${analytics.avgAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/80">Growth Rate:</span>
                        <span className={`font-semibold ${analytics.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                          {analytics.growthRate > 0 ? '+' : ''}{analytics.growthRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Affiliates Tab */}
          <TabsContent value="affiliates" className="mt-6">
            <div className="grid gap-6">
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-lg font-semibold flex items-center gap-2">
                    <Target className="h-5 w-5 text-white/80" />
                    Affiliate Performance
                  </CardTitle>
                  <p className="text-white/60 text-sm mt-1">Cash call distribution and performance by affiliate</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={affiliateDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                      <XAxis dataKey="name" stroke="#ffffff80" />
                      <YAxis stroke="#ffffff80" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 51, 160, 0.9)', 
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                      />
                      <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="mt-6">
            <div className="grid gap-6">
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-lg font-semibold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-white/80" />
                    Cash Call Performance Analysis
                  </CardTitle>
                  <p className="text-white/60 text-sm mt-1">Amount vs. processing time correlation</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <ResponsiveContainer width="100%" height={400}>
                    <ScatterChart data={scatterData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                      <XAxis 
                        type="number" 
                        dataKey="amount" 
                        name="Amount" 
                        stroke="#ffffff80"
                        domain={['dataMin', 'dataMax']}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="daysSinceCreated" 
                        name="Days Since Created" 
                        stroke="#ffffff80"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 51, 160, 0.9)', 
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                      />
                      <Scatter dataKey="amount" fill="#10B981" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
