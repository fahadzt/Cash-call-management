import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Clock, CheckCircle, DollarSign } from "lucide-react"
import type { CashCall } from "@/lib/firebase-database"

interface DashboardStatsProps {
  cashCalls: CashCall[]
}

export const DashboardStats = ({ cashCalls }: DashboardStatsProps) => {
  const totalCalls = cashCalls.length
  const underReview = cashCalls.filter(c => c.status === "under_review").length
  const approved = cashCalls.filter(c => c.status === "approved").length
  const totalAmount = cashCalls.reduce((sum, call) => sum + call.amount_requested, 0)
  const pendingAmount = cashCalls
    .filter(call => call.status === 'under_review')
    .reduce((sum, call) => sum + call.amount_requested, 0)
  const approvalRate = totalCalls > 0 ? Math.round((approved / totalCalls) * 100) : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card className="aramco-card-bg border-l-4 border-l-[#0033A0] hover:scale-105 transition-all duration-300">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600">Total Cash Calls</CardTitle>
          <TrendingUp className="h-4 w-4 text-[#0033A0]" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-[#0033A0]">{totalCalls}</div>
          <div className="text-sm text-gray-500 mt-1">
            {totalCalls > 0 ? `${Math.round((underReview / totalCalls) * 100)}% pending review` : 'No cash calls yet'}
          </div>
        </CardContent>
      </Card>

      <Card className="aramco-card-bg border-l-4 border-l-[#00A3E0] hover:scale-105 transition-all duration-300">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600">Under Review</CardTitle>
          <Clock className="h-4 w-4 text-[#00A3E0]" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-[#00A3E0]">{underReview}</div>
          <div className="text-sm text-gray-500 mt-1">
            ${pendingAmount.toLocaleString()} pending
          </div>
        </CardContent>
      </Card>

      <Card className="aramco-card-bg border-l-4 border-l-[#00843D] hover:scale-105 transition-all duration-300">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
          <CheckCircle className="h-4 w-4 text-[#00843D]" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-[#00843D]">{approved}</div>
          <div className="text-sm text-gray-500 mt-1">
            {totalCalls > 0 ? `${approvalRate}% approval rate` : 'No cash calls yet'}
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
            ${totalAmount.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Pending: ${pendingAmount.toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
