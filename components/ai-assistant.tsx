"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bot, AlertTriangle, CheckCircle, Info, DollarSign, Calendar, FileText, Users } from "lucide-react"
import type { CashCall } from "@/lib/mock-database"

interface AIAssistantProps {
  cashCall: CashCall
  allCashCalls: CashCall[]
}

interface AIInsight {
  type: "warning" | "info" | "success"
  title: string
  message: string
  icon: React.ReactNode
}

export function AIAssistant({ cashCall, allCashCalls }: AIAssistantProps) {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(true)

  useEffect(() => {
    analyzeCase()
  }, [cashCall, allCashCalls])

  const analyzeCase = async () => {
    setIsAnalyzing(true)

    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const newInsights: AIInsight[] = []

    // Check for missing attachments
    if (!cashCall.attachments || cashCall.attachments.length === 0) {
      newInsights.push({
        type: "warning",
        title: "Missing Attachments",
        message:
          "This cash call has no supporting documents. Consider adding relevant attachments to strengthen the request.",
        icon: <FileText className="h-4 w-4" />,
      })
    }

    // Check for incomplete information
    if (!cashCall.description || cashCall.description.length < 20) {
      newInsights.push({
        type: "warning",
        title: "Incomplete Description",
        message: "The description is too brief. A more detailed explanation would help with approval.",
        icon: <Info className="h-4 w-4" />,
      })
    }

    if (!cashCall.justification || cashCall.justification.length < 30) {
      newInsights.push({
        type: "warning",
        title: "Insufficient Justification",
        message: "The business justification needs more detail to support the funding request.",
        icon: <Info className="h-4 w-4" />,
      })
    }

    // Check for duplicate requests
    const duplicates = allCashCalls.filter(
      (call) =>
        call.id !== cashCall.id &&
        call.affiliate_id === cashCall.affiliate_id &&
        Math.abs(call.amount_requested - cashCall.amount_requested) < 1000 &&
        Math.abs(new Date(call.created_at).getTime() - new Date(cashCall.created_at).getTime()) <
          30 * 24 * 60 * 60 * 1000, // 30 days
    )

    if (duplicates.length > 0) {
      newInsights.push({
        type: "warning",
        title: "Potential Duplicate Request",
        message: `Found ${duplicates.length} similar request(s) from the same affiliate with similar amounts in the past 30 days.`,
        icon: <Users className="h-4 w-4" />,
      })
    }

    // Amount analysis
    const affiliateCalls = allCashCalls.filter((call) => call.affiliate_id === cashCall.affiliate_id)
    const avgAmount = affiliateCalls.reduce((sum, call) => sum + call.amount_requested, 0) / affiliateCalls.length

    if (cashCall.amount_requested > avgAmount * 2) {
      newInsights.push({
        type: "info",
        title: "Above Average Request",
        message: `This request is ${Math.round((cashCall.amount_requested / avgAmount - 1) * 100)}% higher than this affiliate's average request amount.`,
        icon: <DollarSign className="h-4 w-4" />,
      })
    }

    // Approval recommendation
    const affiliateSuccessRate = affiliateCalls.filter((call) => call.status === "paid").length / affiliateCalls.length

    if (affiliateSuccessRate > 0.8) {
      newInsights.push({
        type: "success",
        title: "Reliable Affiliate",
        message: `This affiliate has a ${Math.round(affiliateSuccessRate * 100)}% success rate with previous cash calls.`,
        icon: <CheckCircle className="h-4 w-4" />,
      })
    } else if (affiliateSuccessRate < 0.5) {
      newInsights.push({
        type: "warning",
        title: "Low Success Rate",
        message: `This affiliate has only a ${Math.round(affiliateSuccessRate * 100)}% success rate with previous requests.`,
        icon: <AlertTriangle className="h-4 w-4" />,
      })
    }

    // Timeline analysis
    if (cashCall.status === "under_review") {
      const daysSinceSubmission = Math.floor(
        (new Date().getTime() - new Date(cashCall.created_at).getTime()) / (1000 * 60 * 60 * 24),
      )

      if (daysSinceSubmission > 7) {
        newInsights.push({
          type: "info",
          title: "Review Timeline",
          message: `This request has been under review for ${daysSinceSubmission} days. Consider expediting the review process.`,
          icon: <Calendar className="h-4 w-4" />,
        })
      }
    }

    setInsights(newInsights)
    setIsAnalyzing(false)
  }

  const getInsightBadgeClass = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-yellow-500 text-white"
      case "success":
        return "bg-green-500 text-white"
      case "info":
        return "bg-blue-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  return (
    <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
      <CardHeader>
        <CardTitle className="text-[#0033A0] text-lg flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isAnalyzing ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0033A0]"></div>
              <span className="text-gray-600">Analyzing cash call...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.length > 0 ? (
              <>
                <div className="text-sm text-gray-600 mb-4">
                  AI analysis complete. Found {insights.length} insight{insights.length !== 1 ? "s" : ""}.
                </div>
                {insights.map((insight, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 border border-gray-200">
                        {insight.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-gray-800 font-medium text-sm">{insight.title}</h4>
                          <Badge className={getInsightBadgeClass(insight.type)}>
                            {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">{insight.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">All Good!</h3>
                <p className="text-gray-600">No issues detected with this cash call.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
