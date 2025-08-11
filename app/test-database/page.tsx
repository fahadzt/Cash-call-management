"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getUsers, getAffiliates, type User, type Affiliate } from "@/lib/firebase-database"

export default function TestDatabasePage() {
  const [users, setUsers] = useState<User[]>([])
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [usersData, affiliatesData] = await Promise.all([
        getUsers(),
        getAffiliates()
      ])
      setUsers(usersData)
      setAffiliates(affiliatesData)
    } catch (error) {
      console.error("Error loading data:", error)
      setMessage("Error loading data")
    } finally {
      setIsLoading(false)
    }
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#0033A0] to-[#00A3E0] bg-clip-text text-transparent mb-4">
            Firebase Database Viewer
          </h1>
          <p className="text-gray-600 mb-6">
            View your real Firebase database contents
          </p>
        </div>

        {/* Controls */}
        <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#0033A0]">Database Viewer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={loadData} 
                disabled={isLoading}
                variant="outline"
                className="border-[#00A3E0] text-[#00A3E0] hover:bg-[#00A3E0]/10"
              >
                {isLoading ? "Loading..." : "Refresh Data"}
              </Button>
            </div>
            {message && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800">{message}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Users Section */}
        <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#0033A0] flex items-center gap-2">
              Users ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {users.length > 0 ? (
              <div className="grid gap-4">
                {users.map((user) => (
                  <div key={user.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.full_name}</h3>
                        <p className="text-gray-600">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`${
                            user.role === 'admin' ? 'bg-red-500' :
                            user.role === 'approver' ? 'bg-blue-500' :
                            user.role === 'affiliate' ? 'bg-green-500' :
                            'bg-gray-500'
                          } text-white`}>
                            {user.role}
                          </Badge>
                          {user.department && (
                            <span className="text-sm text-gray-500">{user.department}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>Created: {user.created_at.toLocaleDateString()}</p>
                        <p>Active: {user.is_active ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No users found. Create real users through the signup process.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Affiliates Section */}
        <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#0033A0] flex items-center gap-2">
              Affiliates ({affiliates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {affiliates.length > 0 ? (
              <div className="grid gap-4">
                {affiliates.map((affiliate) => (
                  <div key={affiliate.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{affiliate.name}</h3>
                        <p className="text-gray-600">{affiliate.legal_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-[#0033A0] text-white">
                            {affiliate.company_code}
                          </Badge>
                          <Badge className={`${
                            affiliate.status === 'active' ? 'bg-green-500' :
                            affiliate.status === 'inactive' ? 'bg-gray-500' :
                            'bg-red-500'
                          } text-white`}>
                            {affiliate.status}
                          </Badge>
                          <Badge className={`${
                            affiliate.risk_level === 'low' ? 'bg-green-500' :
                            affiliate.risk_level === 'medium' ? 'bg-yellow-500' :
                            affiliate.risk_level === 'high' ? 'bg-orange-500' :
                            'bg-red-500'
                          } text-white`}>
                            {affiliate.risk_level} risk
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>{affiliate.city}, {affiliate.country}</p>
                        <p>Rating: {affiliate.financial_rating}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No affiliates found. Create real affiliates through the Admin Settings.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Firebase Emulator Info */}
        <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#0033A0]">Firebase Emulator Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Firebase Emulator UI:</strong> <a href="http://127.0.0.1:4000" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">http://127.0.0.1:4000</a></p>
              <p><strong>Firestore:</strong> <a href="http://127.0.0.1:4000/firestore" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">http://127.0.0.1:4000/firestore</a></p>
              <p><strong>Authentication:</strong> <a href="http://127.0.0.1:4000/auth" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">http://127.0.0.1:4000/auth</a></p>
              <p><strong>Storage:</strong> <a href="http://127.0.0.1:4000/storage" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">http://127.0.0.1:4000/storage</a></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 