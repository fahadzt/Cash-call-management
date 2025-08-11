"use client"

import { useState, useEffect } from "react"
import { getAffiliates, getCashCallsEnhanced } from "@/lib/enhanced-database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function DatabaseTest() {
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [cashCalls, setCashCalls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadData = async () => {
    try {
      setLoading(true)
      setError("")
      
      const [affiliatesData, cashCallsData] = await Promise.all([
        getAffiliates(),
        getCashCallsEnhanced("test-user-id")
      ])
      
      setAffiliates(affiliatesData)
      setCashCalls(cashCallsData)
    } catch (err) {
      console.error("Error loading data:", err)
      setError("Failed to load data from enhanced database")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading enhanced database data...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-600">Error: {error}</div>
          <Button onClick={loadData} className="mt-2">Retry</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Enhanced Database Test
            <Button onClick={loadData} variant="outline" size="sm">
              Refresh Data
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 mb-4">
            This component tests the enhanced database functions and shows the updated affiliate data.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Affiliates ({affiliates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {affiliates.length === 0 ? (
            <div className="text-gray-500">No affiliates found</div>
          ) : (
            <div className="space-y-4">
              {affiliates.map((affiliate) => (
                <div key={affiliate.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{affiliate.name}</h3>
                    <Badge variant={affiliate.status === 'active' ? 'default' : 'secondary'}>
                      {affiliate.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Company Code:</span> {affiliate.company_code}
                    </div>
                    <div>
                      <span className="font-medium">Risk Level:</span> {affiliate.risk_level || 'Not set'}
                    </div>
                    <div>
                      <span className="font-medium">Financial Rating:</span> {affiliate.financial_rating || 'Not set'}
                    </div>
                    <div>
                      <span className="font-medium">Partnership Type:</span> {affiliate.partnership_type || 'Not set'}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Address:</span> {affiliate.address || 'Not set'}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Website:</span> {affiliate.website || 'Not set'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cash Calls ({cashCalls.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {cashCalls.length === 0 ? (
            <div className="text-gray-500">No cash calls found</div>
          ) : (
            <div className="space-y-4">
              {cashCalls.map((cashCall) => (
                <div key={cashCall.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{cashCall.title || cashCall.call_number}</h3>
                    <div className="flex gap-2">
                      <Badge variant="outline">{cashCall.status}</Badge>
                      {cashCall.priority && (
                        <Badge variant="secondary">{cashCall.priority}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Amount:</span> ${cashCall.amount_requested?.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Affiliate:</span> {cashCall.affiliate_name}
                    </div>
                    <div>
                      <span className="font-medium">Category:</span> {cashCall.category || 'Not set'}
                    </div>
                    <div>
                      <span className="font-medium">Comments:</span> {cashCall.comment_count || 0}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Description:</span> {cashCall.description || 'No description'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 