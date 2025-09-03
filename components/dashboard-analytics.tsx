"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
  Activity
} from "lucide-react"
import { type CashCall, type Affiliate, type User } from "@/lib/firebase-database"

interface DashboardAnalyticsProps {
  cashCalls: CashCall[]
  affiliates: Affiliate[]
  users: User[]
  isLoading: boolean
}

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
  color: string
}

function MetricCard({ title, value, change, icon, color }: MetricCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <div className="flex items-center mt-2">
                {change >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(change)}% from last month
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardAnalytics({ cashCalls, affiliates, users, isLoading }: DashboardAnalyticsProps) {
  const [metrics, setMetrics] = useState({
    totalCashCalls: 0,
    totalAmount: 0,
    pendingCashCalls: 0,
    approvedCashCalls: 0,
    rejectedCashCalls: 0,
    averageProcessingTime: 0,
    totalAffiliates: 0,
    activeUsers: 0
  })

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

  const [statusDistribution, setStatusDistribution] = useState<Record<string, number>>({})
  const [monthlyTrends, setMonthlyTrends] = useState<Record<string, number>>({})

  useEffect(() => {
    if (isLoading) return

    // Calculate metrics
    const totalCashCalls = cashCalls.length
    const totalAmount = cashCalls.reduce((sum, cc) => sum + (cc.amount_requested || 0), 0)
    const pendingCashCalls = cashCalls.filter(cc => cc.status === 'pending').length
    const approvedCashCalls = cashCalls.filter(cc => cc.status === 'approved').length
    const rejectedCashCalls = cashCalls.filter(cc => cc.status === 'rejected').length
    const totalAffiliates = affiliates.length
    const activeUsers = users.filter(u => u.is_active).length

    // Calculate average processing time (simplified)
    const processedCalls = cashCalls.filter(cc => cc.status === 'approved' || cc.status === 'rejected')
    const avgProcessingTime = processedCalls.length > 0 ? 
      processedCalls.reduce((sum, cc) => {
        const created = cc.created_at?.toDate?.() || new Date(cc.created_at)
        const updated = cc.updated_at?.toDate?.() || new Date(cc.updated_at)
        return sum + (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24) // days
      }, 0) / processedCalls.length : 0

    setMetrics({
      totalCashCalls,
      totalAmount,
      pendingCashCalls,
      approvedCashCalls,
      rejectedCashCalls,
      averageProcessingTime: Math.round(avgProcessingTime * 10) / 10,
      totalAffiliates,
      activeUsers
    })

    // Calculate status distribution
    const statusCounts: Record<string, number> = {}
    cashCalls.forEach(cc => {
      statusCounts[cc.status] = (statusCounts[cc.status] || 0) + 1
    })
    setStatusDistribution(statusCounts)

    // Calculate monthly trends (last 6 months)
    const monthlyData: Record<string, number> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      const monthCalls = cashCalls.filter(cc => {
        const created = cc.created_at?.toDate?.() || new Date(cc.created_at)
        return created.getMonth() === month.getMonth() && created.getFullYear() === month.getFullYear()
      })
      monthlyData[monthKey] = monthCalls.length
    }
    setMonthlyTrends(monthlyData)

  }, [cashCalls, affiliates, users, isLoading])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Cash Calls"
          value={metrics.totalCashCalls}
          change={12}
          icon={<FileText className="h-6 w-6 text-white" />}
          color="bg-blue-500"
        />
        <MetricCard
          title="Total Amount"
          value={formatCurrency(metrics.totalAmount)}
          change={8}
          icon={<DollarSign className="h-6 w-6 text-white" />}
          color="bg-green-500"
        />
        <MetricCard
          title="Pending Calls"
          value={metrics.pendingCashCalls}
          change={-5}
          icon={<Clock className="h-6 w-6 text-white" />}
          color="bg-yellow-500"
        />
        <MetricCard
          title="Approved Calls"
          value={metrics.approvedCashCalls}
          change={15}
          icon={<CheckCircle className="h-6 w-6 text-white" />}
          color="bg-emerald-500"
        />
      </div>

      {/* Status Overview */}
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
              {Object.entries(statusDistribution).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={status === 'approved' ? 'default' : status === 'pending' ? 'secondary' : 'destructive'}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {count} calls
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={(count / metrics.totalCashCalls) * 100} 
                      className="w-20"
                    />
                    <span className="text-sm font-medium">
                      {((count / metrics.totalCashCalls) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monthly Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(monthlyTrends).map(([month, count]) => (
                <div key={month} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{month}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.max((count / Math.max(...Object.values(monthlyTrends))) * 100, 5)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Active Affiliates"
          value={metrics.totalAffiliates}
          icon={<Users className="h-6 w-6 text-white" />}
          color="bg-purple-500"
        />
        <MetricCard
          title="Active Users"
          value={metrics.activeUsers}
          icon={<Activity className="h-6 w-6 text-white" />}
          color="bg-indigo-500"
        />
        <MetricCard
          title="Avg Processing Time"
          value={`${metrics.averageProcessingTime} days`}
          icon={<Clock className="h-6 w-6 text-white" />}
          color="bg-orange-500"
        />
      </div>
    </div>
  )
}
