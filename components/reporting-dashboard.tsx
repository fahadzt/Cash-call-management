"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, DollarSign, Clock, CheckCircle, BarChart3, PieChartIcon } from "lucide-react"
import type { CashCall, Affiliate } from "@/lib/firebase-database"

interface ReportingDashboardProps {
  cashCalls: CashCall[]
  affiliates: Affiliate[]
}

export function ReportingDashboard({ cashCalls, affiliates }: ReportingDashboardProps) {
  const [timeRange, setTimeRange] = useState("6months")

  // Filter cash calls based on time range
  const getFilteredCashCalls = () => {
    const now = new Date()
    const startDate = new Date()

    switch (timeRange) {
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

    return cashCalls.filter((call) => new Date(call.created_at) >= startDate)
  }

  const filteredCashCalls = getFilteredCashCalls()

  // Monthly cash calls data
  const getMonthlyData = () => {
    const monthlyData: { [key: string]: number } = {}

    filteredCashCalls.forEach((call) => {
      const date = new Date(call.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1
    })

    return Object.entries(monthlyData)
      .map(([month, count]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        count,
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
  }

  // Status distribution data
  const getStatusData = () => {
    const statusCounts: { [key: string]: number } = {}

    filteredCashCalls.forEach((call) => {
      statusCounts[call.status] = (statusCounts[call.status] || 0) + 1
    })

    const colors = {
      draft: "#6B7280",
      under_review: "#F59E0B",
      approved: "#10B981",
      paid: "#059669",
      rejected: "#EF4444",
    }

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      value: count,
      color: colors[status as keyof typeof colors] || "#6B7280",
    }))
  }

  // Average approval time by affiliate
  const getApprovalTimeData = () => {
    const affiliateData: { [key: string]: { total: number; count: number; name: string } } = {}

    filteredCashCalls
      .filter((call) => call.approved_at)
      .forEach((call) => {
        // Find the affiliate name from the affiliates array
        const affiliate = affiliates.find(aff => aff.id === call.affiliate_id)
        if (affiliate) {
          const approvalTime = Math.floor(
            (new Date(call.approved_at!).getTime() - new Date(call.created_at).getTime()) / (1000 * 60 * 60 * 24),
          )

          if (!affiliateData[call.affiliate_id]) {
            affiliateData[call.affiliate_id] = { total: 0, count: 0, name: affiliate.name }
          }

          affiliateData[call.affiliate_id].total += approvalTime
          affiliateData[call.affiliate_id].count += 1
        }
      })

    return Object.entries(affiliateData)
      .map(([id, data]) => ({
        affiliate: data.name.length > 20 ? data.name.substring(0, 20) + "..." : data.name,
        avgDays: Math.round(data.total / data.count),
      }))
      .sort((a, b) => b.avgDays - a.avgDays)
      .slice(0, 10) // Top 10
  }

  const monthlyData = getMonthlyData()
  const statusData = getStatusData()
  const approvalTimeData = getApprovalTimeData()

  // Calculate summary metrics
  const totalAmount = filteredCashCalls.reduce((sum, call) => sum + call.amount_requested, 0)
  const approvedAmount = filteredCashCalls
    .filter((call) => call.status === "approved" || call.status === "paid")
    .reduce((sum, call) => sum + call.amount_requested, 0)
  const approvalRate =
    filteredCashCalls.length > 0
      ? Math.round(
          (filteredCashCalls.filter((call) => call.status === "approved" || call.status === "paid").length /
            filteredCashCalls.length) *
            100,
        )
      : 0
  const avgAmount = filteredCashCalls.length > 0 ? Math.round(totalAmount / filteredCashCalls.length) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#0033A0] to-[#00A3E0] bg-clip-text text-transparent">
            Analytics & Reporting
          </h2>
          <p className="text-gray-600">Insights and trends for cash call management</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48 bg-white border-gray-300">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg border-l-4 border-l-[#0033A0]">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">Total Requests</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#0033A0]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#0033A0]">{filteredCashCalls.length}</div>
            <p className="text-xs text-gray-500 mt-1">Cash calls in period</p>
          </CardContent>
        </Card>

        <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg border-l-4 border-l-[#00A3E0]">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-[#00A3E0]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#00A3E0]">${totalAmount.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Requested funding</p>
          </CardContent>
        </Card>

        <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg border-l-4 border-l-[#00843D]">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">Approval Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-[#00843D]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#00843D]">{approvalRate}%</div>
            <p className="text-xs text-gray-500 mt-1">Approved or paid</p>
          </CardContent>
        </Card>

        <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg border-l-4 border-l-[#84BD00]">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">Average Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-[#84BD00]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#84BD00]">${avgAmount.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Per request</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Cash Calls Chart */}
        <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#0033A0] text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monthly Cash Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
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
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution Chart */}
        <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#0033A0] text-lg flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approval Time Chart */}
      <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-[#0033A0] text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Average Approval Time by Affiliate
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approvalTimeData.length > 0 ? (
            <div className="h-96">
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
                    formatter={(value) => [`${value} days`, "Avg Approval Time"]}
                  />
                  <Bar dataKey="avgDays" fill="#00A3E0" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No approval data available</p>
                <p className="text-gray-400 text-sm">Approved cash calls will appear here</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
