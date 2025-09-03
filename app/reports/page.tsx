"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/firebase-auth-context"
import { 
  getCashCallsByAccess,
  getAffiliates, 
  getUsers,
  type CashCall, 
  type Affiliate,
  type User
} from "@/lib/firebase-database"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { SecurityGuard } from "@/components/security-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, FileText, Users, TrendingUp } from "lucide-react"

export default function ReportsPage() {
  const { user, userProfile } = useAuth()
  const [cashCalls, setCashCalls] = useState<CashCall[]>([])
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        setError("")

        const [cashCallsData, affiliatesData, usersData] = await Promise.all([
          getCashCallsByAccess(user.uid, userProfile?.role || 'user'),
          getAffiliates(),
          getUsers()
        ])

        setCashCalls(cashCallsData)
        setAffiliates(affiliatesData)
        setUsers(usersData)
      } catch (err) {
        console.error("Error loading reports data:", err)
        setError("Failed to load reports data")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user, userProfile?.role])

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Please log in to view reports</h1>
        </div>
      </div>
    )
  }

  return (
    <SecurityGuard requiredRoles={['admin', 'finance']}>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-2">
              Comprehensive insights into cash call performance and trends
            </p>
          </div>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard 
              cashCalls={cashCalls}
              affiliates={affiliates}
              users={users}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-900">Processing Time</h3>
                    <p className="text-2xl font-bold text-blue-600">2.3 days</p>
                    <p className="text-sm text-blue-700">Average</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-900">Approval Rate</h3>
                    <p className="text-2xl font-bold text-green-600">87%</p>
                    <p className="text-sm text-green-700">This month</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-purple-900">Total Volume</h3>
                    <p className="text-2xl font-bold text-purple-600">$12.4M</p>
                    <p className="text-sm text-purple-700">This quarter</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Key Highlights</h3>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>• Total cash calls processed: {cashCalls.length}</li>
                      <li>• Active affiliates: {affiliates.length}</li>
                      <li>• Total users: {users.length}</li>
                      <li>• Average processing time: 2.3 days</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Recent Trends</h3>
                    <ul className="space-y-1 text-sm text-blue-700">
                      <li>• 15% increase in cash call volume this month</li>
                      <li>• 8% improvement in approval rate</li>
                      <li>• 12% reduction in processing time</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">Recommendations</h3>
                    <ul className="space-y-1 text-sm text-green-700">
                      <li>• Consider expanding affiliate network</li>
                      <li>• Implement automated approval workflows</li>
                      <li>• Enhance document verification process</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SecurityGuard>
  )
}
