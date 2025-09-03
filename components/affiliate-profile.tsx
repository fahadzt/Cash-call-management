"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, Mail, Phone, MapPin, DollarSign, FileText, Calendar, ArrowLeft, TrendingUp } from "lucide-react"
import { mockDb, type Affiliate, type CashCall } from "@/lib/mock-database"

interface AffiliateProfileProps {
  affiliateId: string
  onBack: () => void
}

export function AffiliateProfile({ affiliateId, onBack }: AffiliateProfileProps) {
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null)
  const [cashCalls, setCashCalls] = useState<CashCall[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadAffiliateData()
  }, [affiliateId])

  const loadAffiliateData = async () => {
    try {
      setIsLoading(true)
      setError("")

      const [affiliates, allCashCalls] = await Promise.all([
        mockDb.getAffiliates(),
        mockDb.getCashCalls("admin-1"), // Get all cash calls
      ])

      const foundAffiliate = affiliates.find((aff) => aff.id === affiliateId)
      if (!foundAffiliate) {
        setError("Affiliate not found")
        return
      }

      const affiliateCashCalls = allCashCalls.filter((call) => call.affiliate_id === affiliateId)

      setAffiliate(foundAffiliate)
      setCashCalls(affiliateCashCalls)
    } catch (err) {
      console.error("Error loading affiliate data:", err)
      setError("Failed to load affiliate data")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-500 text-white"
      case "under_review":
        return "bg-yellow-500 text-white"
      case "finance_review":
        return "bg-yellow-500 text-white"
      case "ready_for_cfo":
        return "bg-orange-500 text-white"
      case "approved":
        return "bg-green-500 text-white"
      case "paid":
        return "bg-blue-500 text-white"
      case "rejected":
        return "bg-red-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case "draft":
        return "Draft"
      case "under_review":
        return "Under Review"
      case "finance_review":
        return "Finance Review"
      case "ready_for_cfo":
        return "Ready for CFO"
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const totalFunding = cashCalls
    .filter((call) => call.status === "paid")
    .reduce((sum, call) => sum + call.amount_requested, 0)

  const totalRequested = cashCalls.reduce((sum, call) => sum + call.amount_requested, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading affiliate profile...</div>
      </div>
    )
  }

  if (error || !affiliate) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">{error || "Affiliate not found"}</div>
        <Button onClick={onBack} className="aramco-button-primary text-white">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10 bg-transparent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0033A0] to-[#00A3E0] bg-clip-text text-transparent">
              Affiliate Profile
            </h1>
            <p className="text-gray-600">{affiliate.name}</p>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-[#0033A0] text-xl flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Affiliate Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-gray-700 font-medium text-sm">Company Name</label>
                <div className="text-gray-900 font-semibold text-lg">{affiliate.name}</div>
              </div>
              <div>
                <label className="text-gray-700 font-medium text-sm">Company Code</label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-[#0033A0] text-white">{affiliate.company_code}</Badge>
                </div>
              </div>
              <div>
                <label className="text-gray-700 font-medium text-sm">Contact Email</label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4 text-[#00A3E0]" />
                  <span className="text-gray-800">{affiliate.contact_email || "Not provided"}</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-gray-700 font-medium text-sm">Contact Phone</label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="h-4 w-4 text-[#00A3E0]" />
                  <span className="text-gray-800">{affiliate.contact_phone || "Not provided"}</span>
                </div>
              </div>
              <div>
                <label className="text-gray-700 font-medium text-sm">Address</label>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-[#00A3E0]" />
                  <span className="text-gray-800">{affiliate.address || "Not provided"}</span>
                </div>
              </div>
              <div>
                <label className="text-gray-700 font-medium text-sm">Member Since</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-[#00A3E0]" />
                  <span className="text-gray-800">{formatDate(affiliate.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg border-l-4 border-l-[#0033A0]">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">Total Cash Calls</CardTitle>
            <FileText className="h-4 w-4 text-[#0033A0]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#0033A0]">{cashCalls.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg border-l-4 border-l-[#00A3E0]">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">Total Requested</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#00A3E0]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#00A3E0]">${totalRequested.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg border-l-4 border-l-[#84BD00]">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">Total Funding Received</CardTitle>
            <DollarSign className="h-4 w-4 text-[#84BD00]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#84BD00]">${totalFunding.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg border-l-4 border-l-[#00843D]">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#00843D]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#00843D]">
              {cashCalls.length > 0
                ? Math.round((cashCalls.filter((c) => c.status === "paid").length / cashCalls.length) * 100)
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Calls History */}
      <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-[#0033A0] text-xl">Cash Call History</CardTitle>
        </CardHeader>
        <CardContent>
          {cashCalls.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-[#0033A0]">Call Number</th>
                    <th className="text-left py-4 px-4 font-semibold text-[#0033A0]">Amount</th>
                    <th className="text-left py-4 px-4 font-semibold text-[#0033A0]">Status</th>
                    <th className="text-left py-4 px-4 font-semibold text-[#0033A0]">Created</th>
                    <th className="text-left py-4 px-4 font-semibold text-[#0033A0]">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {cashCalls.map((cashCall) => (
                    <tr key={cashCall.id} className="border-b border-gray-100 hover:bg-[#0033A0]/5 transition-colors">
                      <td className="py-4 px-4 font-semibold text-[#00A3E0]">{cashCall.call_number}</td>
                      <td className="py-4 px-4 font-bold text-gray-800">
                        ${cashCall.amount_requested.toLocaleString()}
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={getStatusBadgeClass(cashCall.status)}>
                          {getStatusDisplayName(cashCall.status)}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{formatDate(cashCall.created_at)}</td>
                      <td className="py-4 px-4 text-gray-600">
                        {cashCall.description ? (
                          <span className="truncate max-w-xs block">{cashCall.description}</span>
                        ) : (
                          <span className="text-gray-400 italic">No description</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No cash calls submitted yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
