import { useMemo } from 'react'
import type { CashCall, Affiliate } from '@/lib/firebase-database'

interface AnalyticsResult {
  totalAmount: number
  approvedAmount: number
  approvalRate: number
  avgAmount: number
  growthRate: number
  trend: 'up' | 'down'
  anomalies: number
  pendingAmount: number
  totalRequests: number
  rejectedAmount: number
  avgApprovalTime: number
}

interface UseAnalyticsProps {
  cashCalls: CashCall[]
  affiliates: Affiliate[]
  timeRange: string
}

export const useAnalytics = ({ cashCalls, affiliates, timeRange }: UseAnalyticsProps): AnalyticsResult => {
  return useMemo(() => {
    const totalAmount = cashCalls.reduce((sum, call) => sum + call.amount_requested, 0)
    const approvedAmount = cashCalls
      .filter((call) => call.status === "approved" || call.status === "paid")
      .reduce((sum, call) => sum + call.amount_requested, 0)
    const rejectedAmount = cashCalls
      .filter((call) => call.status === "rejected")
      .reduce((sum, call) => sum + call.amount_requested, 0)
    const approvalRate = cashCalls.length > 0
      ? Math.round((cashCalls.filter((call) => call.status === "approved" || call.status === "paid").length / cashCalls.length) * 100)
      : 0
    const avgAmount = cashCalls.length > 0 ? Math.round(totalAmount / cashCalls.length) : 0

    // Trend analysis
    const currentPeriod = cashCalls.length
    const previousPeriod = Math.max(0, currentPeriod - Math.floor(currentPeriod * 0.3)) // Rough estimate
    const growthRate = previousPeriod > 0 ? ((currentPeriod - previousPeriod) / previousPeriod) * 100 : 0

    // Anomaly detection
    const amounts = cashCalls.map(call => call.amount_requested)
    const mean = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0
    const variance = amounts.length > 0 ? amounts.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / amounts.length : 0
    const stdDev = Math.sqrt(variance)
    const anomalies = cashCalls.filter(call => Math.abs(call.amount_requested - mean) > 2 * stdDev)

    // Average approval time
    const approvedCalls = cashCalls.filter(call => call.approved_at)
    const totalApprovalTime = approvedCalls.reduce((sum, call) => {
      const approvalTime = Math.floor(
        (new Date(call.approved_at!).getTime() - new Date(call.created_at).getTime()) / (1000 * 60 * 60 * 24)
      )
      return sum + approvalTime
    }, 0)
    const avgApprovalTime = approvedCalls.length > 0 ? Math.round(totalApprovalTime / approvedCalls.length) : 0

    return {
      totalAmount,
      approvedAmount,
      rejectedAmount,
      approvalRate,
      avgAmount,
      growthRate,
      trend: growthRate > 0 ? 'up' : 'down',
      anomalies: anomalies.length,
      pendingAmount: cashCalls
        .filter(call => call.status === 'under_review')
        .reduce((sum, call) => sum + call.amount_requested, 0),
      totalRequests: cashCalls.length,
      avgApprovalTime
    }
  }, [cashCalls, affiliates, timeRange])
}
