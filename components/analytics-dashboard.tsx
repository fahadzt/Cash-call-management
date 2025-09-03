"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  FileText,
  BarChart3,
  PieChart,
  Activity,
  Download,
  Calendar,
  Filter
} from "lucide-react"
import { type CashCall, type Affiliate, type User } from "@/lib/firebase-database"

interface AnalyticsDashboardProps {
  cashCalls: CashCall[]
  affiliates: Affiliate[]
  users: User[]
  isLoading: boolean
}

interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor: string[]
    borderColor: string[]
  }[]
}

export function AnalyticsDashboard({ cashCalls, affiliates, users, isLoading }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [selectedAffiliate, setSelectedAffiliate] = useState<string>('all')
  const [selectedMetric, setSelectedMetric] = useState<'amount' | 'count' | 'status'>('amount')

  // Format currency function for better readability
  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`
    } else {
      return `$${amount.toLocaleString()}`
    }
  }

  // Calculate date range
  const dateRange = useMemo(() => {
    const now = new Date()
    const ranges = {
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      '1y': new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    }
    return ranges[timeRange]
  }, [timeRange])

  // Filter data based on time range and affiliate
  const filteredData = useMemo(() => {
    return cashCalls.filter(cc => {
      const created = cc.created_at?.toDate?.() || new Date(cc.created_at)
      const inTimeRange = created >= dateRange
      const inAffiliate = selectedAffiliate === 'all' || cc.affiliate_id === selectedAffiliate
      return inTimeRange && inAffiliate
    })
  }, [cashCalls, dateRange, selectedAffiliate])

  // Calculate key metrics
  const metrics = useMemo(() => {
    const totalAmount = filteredData.reduce((sum, cc) => sum + (cc.amount_requested || 0), 0)
    const totalCount = filteredData.length
    const pendingCount = filteredData.filter(cc => cc.status === 'pending').length
    const approvedCount = filteredData.filter(cc => cc.status === 'approved').length
    const rejectedCount = filteredData.filter(cc => cc.status === 'rejected').length
    const avgAmount = totalCount > 0 ? totalAmount / totalCount : 0
    const approvalRate = totalCount > 0 ? (approvedCount / totalCount) * 100 : 0

    return {
      totalAmount,
      totalCount,
      pendingCount,
      approvedCount,
      rejectedCount,
      avgAmount,
      approvalRate
    }
  }, [filteredData])

  // Generate chart data
  const chartData = useMemo(() => {
    if (selectedMetric === 'status') {
      return {
        labels: ['Pending', 'Approved', 'Rejected'],
        datasets: [{
          label: 'Cash Calls by Status',
          data: [metrics.pendingCount, metrics.approvedCount, metrics.rejectedCount],
          backgroundColor: ['#fbbf24', '#10b981', '#ef4444'],
          borderColor: ['#f59e0b', '#059669', '#dc2626']
        }]
      }
    }

    // Monthly trend data
    const months = []
    const data = []
    const now = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = month.toLocaleDateString('en-US', { month: 'short' })
      months.push(monthKey)
      
      const monthData = filteredData.filter(cc => {
        const created = cc.created_at?.toDate?.() || new Date(cc.created_at)
        return created.getMonth() === month.getMonth() && created.getFullYear() === month.getFullYear()
      })
      
      if (selectedMetric === 'amount') {
        data.push(monthData.reduce((sum, cc) => sum + (cc.amount_requested || 0), 0))
      } else {
        data.push(monthData.length)
      }
    }

    return {
      labels: months,
      datasets: [{
        label: selectedMetric === 'amount' ? 'Total Amount ($)' : 'Number of Cash Calls',
        data,
        backgroundColor: 'rgba(0, 51, 160, 0.2)',
        borderColor: 'rgba(0, 51, 160, 1)'
      }]
    }
  }, [filteredData, selectedMetric, metrics])

  // Export data function
  const exportData = () => {
    const csvContent = [
      ['Date', 'Call Number', 'Affiliate', 'Amount', 'Status', 'Description'],
      ...filteredData.map(cc => [
        cc.created_at?.toDate?.()?.toLocaleDateString() || new Date(cc.created_at).toLocaleDateString(),
        cc.call_number,
        affiliates.find(a => a.id === cc.affiliate_id)?.name || 'Unknown',
        cc.amount_requested?.toString() || '0',
        cc.status,
        cc.description || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cash-calls-analytics-${timeRange}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Analytics Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Time Range</label>
              <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Affiliate</label>
              <Select value={selectedAffiliate} onValueChange={setSelectedAffiliate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Affiliates</SelectItem>
                  {affiliates.map(affiliate => (
                    <SelectItem key={affiliate.id} value={affiliate.id}>
                      {affiliate.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Metric</label>
              <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="count">Count</SelectItem>
                  <SelectItem value="status">Status Distribution</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button onClick={exportData} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.totalAmount)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cash Calls</p>
                <p className="text-2xl font-bold">{metrics.totalCount}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approval Rate</p>
                <p className="text-2xl font-bold">{metrics.approvalRate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.avgAmount)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Pending</Badge>
                  <span className="text-sm text-muted-foreground">
                    {metrics.pendingCount} calls
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {metrics.totalCount > 0 ? ((metrics.pendingCount / metrics.totalCount) * 100).toFixed(1) : 0}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default">Approved</Badge>
                  <span className="text-sm text-muted-foreground">
                    {metrics.approvedCount} calls
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {metrics.totalCount > 0 ? ((metrics.approvedCount / metrics.totalCount) * 100).toFixed(1) : 0}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Rejected</Badge>
                  <span className="text-sm text-muted-foreground">
                    {metrics.rejectedCount} calls
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {metrics.totalCount > 0 ? ((metrics.rejectedCount / metrics.totalCount) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {selectedMetric === 'amount' ? 'Monthly Amount Trend' : 'Monthly Count Trend'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chartData.labels.map((label, index) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-[#0033A0] h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.max((chartData.datasets[0].data[index] / Math.max(...chartData.datasets[0].data)) * 100, 5)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-muted-foreground w-16 text-right">
                      {selectedMetric === 'amount' 
                        ? formatCurrency(chartData.datasets[0].data[index])
                        : chartData.datasets[0].data[index]
                      }
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
