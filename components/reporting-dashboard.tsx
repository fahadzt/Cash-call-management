"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ComposedChart, ScatterChart, Scatter } from "recharts"
import { TrendingUp, DollarSign, Clock, CheckCircle, BarChart3, PieChartIcon, Download, Share2, Calendar, Target, AlertTriangle, TrendingDown } from "lucide-react"
import type { CashCall, Affiliate } from "@/lib/firebase-database"
import { EnhancedPDFExport } from "./enhanced-pdf-export"
import { useRef } from "react"

interface ReportingDashboardProps {
  cashCalls: CashCall[]
  affiliates: Affiliate[]
}

interface FilterState {
  timeRange: string
  affiliate: string
  status: string
  chartType: 'bar' | 'line' | 'area' | 'composed' | 'scatter'
}

export function ReportingDashboard({ cashCalls, affiliates }: ReportingDashboardProps) {
  const [filters, setFilters] = useState<FilterState>({
    timeRange: "6months",
    affiliate: "all",
    status: "all",
    chartType: 'bar'
  })
  const [selectedAffiliate, setSelectedAffiliate] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  // Chart refs for PDF export
  const monthlyChartRef = useRef<HTMLDivElement>(null)
  const statusChartRef = useRef<HTMLDivElement>(null)
  const approvalChartRef = useRef<HTMLDivElement>(null)

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

  // Memoized monthly data with trend analysis
  const monthlyData = useMemo(() => {
    const monthlyData: { [key: string]: { count: number; amount: number } } = {}

    filteredCashCalls.forEach((call) => {
      const date = new Date(call.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { count: 0, amount: 0 }
      }
      
      monthlyData[monthKey].count += 1
      monthlyData[monthKey].amount += call.amount_requested
    })

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        count: data.count,
        amount: data.amount,
        avgAmount: Math.round(data.amount / data.count)
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
  }, [filteredCashCalls])

  // Memoized status distribution data
  const statusData = useMemo(() => {
    const statusCounts: { [key: string]: { count: number; amount: number } } = {}

    filteredCashCalls.forEach((call) => {
      if (!statusCounts[call.status]) {
        statusCounts[call.status] = { count: 0, amount: 0 }
      }
      statusCounts[call.status].count += 1
      statusCounts[call.status].amount += call.amount_requested
    })

    const colors = {
      draft: "#6B7280",
      under_review: "#F59E0B",
      approved: "#10B981",
      paid: "#059669",
      rejected: "#EF4444",
    }

    return Object.entries(statusCounts).map(([status, data]) => ({
      name: status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      value: data.count,
      amount: data.amount,
      color: colors[status as keyof typeof colors] || "#6B7280",
    }))
  }, [filteredCashCalls])

  // Memoized approval time data
  const approvalTimeData = useMemo(() => {
    console.log('Calculating approval time data...')
    console.log('Filtered cash calls:', filteredCashCalls.length)
    console.log('Sample cash call:', filteredCashCalls[0])
    console.log('Affiliates:', affiliates.length)
    console.log('Sample affiliate:', affiliates[0])
    
    const affiliateData: { [key: string]: { total: number; count: number; name: string; amounts: number[]; pendingCount: number } } = {}

    // First, collect all affiliates that have cash calls
    filteredCashCalls.forEach((call) => {
      console.log('Processing call:', call.call_number, 'affiliate_id:', call.affiliate_id, 'status:', call.status)
      
      // Try to find affiliate by ID first, then fall back to affiliate object if it exists
      let affiliateName = 'Unknown Affiliate'
      let affiliate = affiliates.find(aff => aff.id === call.affiliate_id)
      
      if (affiliate) {
        affiliateName = affiliate.name
      } else if ((call as any).affiliate && (call as any).affiliate.name) {
        affiliateName = (call as any).affiliate.name
      }
      
      console.log('Found affiliate name:', affiliateName)
      
      if (!affiliateData[call.affiliate_id]) {
        affiliateData[call.affiliate_id] = { 
          total: 0, 
          count: 0, 
          name: affiliateName, 
          amounts: [],
          pendingCount: 0
        }
      }
      
      // Count ALL calls for this affiliate (not just pending/approved)
      if (call.status === 'under_review' || call.status === 'draft') {
        affiliateData[call.affiliate_id].pendingCount += 1
        console.log('Added pending call for:', affiliateName)
      } else if (call.status === 'approved' || call.status === 'paid') {
        // For approved/paid calls, calculate approval time
        const approvalTime = call.approved_at ? 
          Math.floor((new Date(call.approved_at).getTime() - new Date(call.created_at).getTime()) / (1000 * 60 * 60 * 24)) :
          0 // Default to 0 if no approved_at date
        
        affiliateData[call.affiliate_id].total += approvalTime
        affiliateData[call.affiliate_id].count += 1
        affiliateData[call.affiliate_id].amounts.push(call.amount_requested)
        console.log('Added approved call for:', affiliateName, 'approval time:', approvalTime, 'days')
      } else if (call.status === 'rejected') {
        // Count rejected calls as pending for display purposes
        affiliateData[call.affiliate_id].pendingCount += 1
        console.log('Added rejected call for:', affiliateName)
      }
    })

    console.log('Affiliate data before processing:', affiliateData)

    // Convert to array and handle cases with no approved calls
    const result = Object.entries(affiliateData)
      .map(([id, data]) => {
        const avgDays = data.count > 0 ? Math.round(data.total / data.count) : 0
        const totalAmount = data.amounts.reduce((sum, amount) => sum + amount, 0)
        
        return {
          affiliate: data.name.length > 20 ? data.name.substring(0, 20) + "..." : data.name,
          avgDays: avgDays,
          totalAmount: totalAmount,
          count: data.count,
          pendingCount: data.pendingCount,
          totalCalls: data.count + data.pendingCount
        }
      })
      .filter(item => item.totalCalls > 0) // Only show affiliates with any cash calls
      .sort((a, b) => {
        // Sort by total calls first, then by approved calls
        if (a.totalCalls !== b.totalCalls) return b.totalCalls - a.totalCalls
        return b.count - a.count
      })
      .slice(0, 10)

    console.log('Final approval time data:', result)
    return result
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

    // Anomaly detection
    const amounts = filteredCashCalls.map(call => call.amount_requested)
    const mean = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0
    const variance = amounts.length > 0 ? amounts.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / amounts.length : 0
    const stdDev = Math.sqrt(variance)
    const anomalies = filteredCashCalls.filter(call => Math.abs(call.amount_requested - mean) > 2 * stdDev)

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
      anomalies: anomalies.length,
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
      ['Month', 'Cash Calls', 'Total Amount', 'Average Amount'],
      ...monthlyData.map(row => [
        row.month,
        row.count.toString(),
        `$${row.amount.toLocaleString()}`,
        `$${row.avgAmount.toLocaleString()}`
      ])
    ]

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cash-call-report-${filters.timeRange}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    setIsExporting(false)
  }, [monthlyData, filters.timeRange])

  const exportToPDF = useCallback(() => {
    setIsExporting(true)
    
    // Simple PDF generation using browser print
    const printContent = `
      <html>
        <head>
          <title>Cash Call Analytics Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
            .metric { text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            .metric-value { font-size: 24px; font-weight: bold; color: #0033A0; }
            .metric-label { font-size: 12px; color: #666; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Cash Call Analytics Report</h1>
            <p>Period: ${filters.timeRange} | Generated: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="metrics">
            <div class="metric">
              <div class="metric-value">${filteredCashCalls.length}</div>
              <div class="metric-label">Total Requests</div>
            </div>
            <div class="metric">
              <div class="metric-value">$${analytics.totalAmount.toLocaleString()}</div>
              <div class="metric-label">Total Amount</div>
            </div>
            <div class="metric">
              <div class="metric-value">${analytics.approvalRate}%</div>
              <div class="metric-label">Approval Rate</div>
            </div>
            <div class="metric">
              <div class="metric-value">$${analytics.avgAmount.toLocaleString()}</div>
              <div class="metric-label">Average Amount</div>
            </div>
          </div>
          
          <h2>Monthly Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Cash Calls</th>
                <th>Total Amount</th>
                <th>Average Amount</th>
              </tr>
            </thead>
            <tbody>
              ${monthlyData.map(row => `
                <tr>
                  <td>${row.month}</td>
                  <td>${row.count}</td>
                  <td>$${row.amount.toLocaleString()}</td>
                  <td>$${row.avgAmount.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
    
    setIsExporting(false)
  }, [filteredCashCalls.length, analytics, filters.timeRange, monthlyData])

  // Chart click handlers
  const handleChartClick = useCallback((data: any) => {
    if (data.affiliate) {
      setSelectedAffiliate(data.affiliate)
    }
  }, [])

  const handleStatusClick = useCallback((data: any) => {
    const status = data.name.toLowerCase().replace(' ', '_')
    setFilters(prev => ({ ...prev, status }))
  }, [])

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Export Options */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#0033A0] to-[#00A3E0] bg-clip-text text-transparent">
            Analytics & Reporting
          </h2>
          <p className="text-gray-600">Insights and trends for cash call management</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <Button
              onClick={exportToCSV}
              disabled={isExporting}
              variant="outline"
              size="sm"
              className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'CSV'}
            </Button>
            <EnhancedPDFExport
              monthlyData={monthlyData}
              statusData={statusData}
              approvalTimeData={approvalTimeData}
              analytics={analytics}
              filters={filters}
              chartType={filters.chartType}
              isExporting={isExporting}
              monthlyChartRef={monthlyChartRef}
              statusChartRef={statusChartRef}
              approvalChartRef={approvalChartRef}
            />
          </div>
        </div>
      </div>

      {/* Additional Filters - Moved to Top */}
      <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-[#0033A0] text-lg">Filters & Chart Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Time Range</label>
              <Select value={filters.timeRange} onValueChange={(value) => setFilters(prev => ({ ...prev, timeRange: value }))}>
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  <SelectItem value="1month">Last Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Chart Type</label>
              <Select value={filters.chartType} onValueChange={(value) => setFilters(prev => ({ ...prev, chartType: value as any }))}>
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                  <SelectItem value="composed">Composed Chart</SelectItem>
                  <SelectItem value="scatter">Scatter Plot</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Filter by Affiliate</label>
              <Select 
                value={filters.affiliate} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, affiliate: value }))}
              >
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="All Affiliates" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  <SelectItem value="all">All Affiliates</SelectItem>
                  {affiliates.map((affiliate) => (
                    <SelectItem key={affiliate.id} value={affiliate.id}>
                      {affiliate.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Filter by Status</label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="All Statuses" />
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
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Summary Cards with Trends */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg border-l-4 border-l-[#0033A0]">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">Total Requests</CardTitle>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-[#0033A0]" />
              {analytics.trend === 'up' ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#0033A0]">{filteredCashCalls.length}</div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-gray-500">Cash calls in period</p>
              <Badge variant="outline" className="text-xs">
                {analytics.growthRate > 0 ? '+' : ''}{analytics.growthRate.toFixed(1)}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg border-l-4 border-l-[#00A3E0]">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-[#00A3E0]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#00A3E0]">${analytics.totalAmount.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-gray-500">Requested funding</p>
              <Badge variant="outline" className="text-xs">
                ${analytics.pendingAmount.toLocaleString()} pending
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg border-l-4 border-l-[#00843D]">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">Approval Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-[#00843D]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#00843D]">{analytics.approvalRate}%</div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-gray-500">Approved or paid</p>
              <Badge variant="outline" className="text-xs">
                ${analytics.approvedAmount.toLocaleString()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg border-l-4 border-l-[#84BD00]">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">Average Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-[#84BD00]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#84BD00]">${analytics.avgAmount.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-gray-500">Per request</p>
              {analytics.anomalies > 0 && (
                <Badge variant="outline" className="text-xs text-orange-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {analytics.anomalies} anomalies
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Charts with Interactive Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dynamic Monthly Chart */}
        <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#0033A0] text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monthly Cash Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={monthlyChartRef} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {filters.chartType === 'line' ? (
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                    <YAxis stroke="#6B7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#0033A0" strokeWidth={2} />
                    <Line type="monotone" dataKey="avgAmount" stroke="#00A3E0" strokeWidth={2} />
                  </LineChart>
                ) : filters.chartType === 'area' ? (
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                    <YAxis stroke="#6B7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#0033A0" fill="#0033A0" fillOpacity={0.3} />
                  </AreaChart>
                ) : filters.chartType === 'composed' ? (
                  <ComposedChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                    <YAxis stroke="#6B7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="count" fill="#0033A0" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="avgAmount" stroke="#00A3E0" strokeWidth={2} />
                  </ComposedChart>
                ) : filters.chartType === 'scatter' ? (
                  <ScatterChart data={scatterData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" dataKey="daysSinceCreated" name="Days Since Created" stroke="#6B7280" fontSize={12} />
                    <YAxis type="number" dataKey="amount" name="Amount" stroke="#6B7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                      formatter={(value, name, props) => [
                        `$${value?.toLocaleString()}`,
                        `${props.payload.affiliate} - ${props.payload.status}`
                      ]}
                    />
                    <Scatter dataKey="amount" fill="#0033A0" />
                  </ScatterChart>
                ) : (
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                    <YAxis stroke="#6B7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="count" fill="#0033A0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Status Distribution Chart */}
        <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#0033A0] text-lg flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={statusChartRef} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    onClick={handleStatusClick}
                    style={{ cursor: 'pointer' }}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value} calls ($${props.payload.amount?.toLocaleString()})`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Approval Time Chart with Drill-down */}
      <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#0033A0] text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Average Approval Time by Affiliate
              {selectedAffiliate && (
                <Badge variant="outline" className="ml-2">
                  {selectedAffiliate}
                </Badge>
              )}
            </CardTitle>
            {selectedAffiliate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAffiliate(null)}
                className="text-xs"
              >
                Clear Selection
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {approvalTimeData.length > 0 ? (
            <div ref={approvalChartRef} className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={approvalTimeData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" stroke="#6B7280" fontSize={12} />
                  <YAxis type="category" dataKey="affiliate" stroke="#6B7280" fontSize={12} width={150} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                    formatter={(value, name, props) => {
                      const data = props.payload
                      if (data.count > 0) {
                        return [
                          `${value} days (${data.count} approved, ${data.pendingCount} pending, $${data.totalAmount?.toLocaleString()})`,
                          "Avg Approval Time"
                        ]
                      } else {
                        return [
                          `${data.pendingCount} pending calls (no approvals yet)`,
                          "Pending Calls"
                        ]
                      }
                    }}
                  />
                  <Bar 
                    dataKey="avgDays" 
                    fill="#00A3E0"
                    radius={[0, 4, 4, 0]}
                    onClick={handleChartClick}
                    style={{ cursor: 'pointer' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No cash call data available</p>
                <p className="text-gray-400 text-sm">Cash calls will appear here when created</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>




    </div>
  )
}
