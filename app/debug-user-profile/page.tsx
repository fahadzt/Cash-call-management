'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase-auth-context'
import { getAffiliates } from '@/lib/firebase-database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

export default function DebugUserProfile() {
  const { user, userProfile } = useAuth()
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadAffiliates = async () => {
    setIsLoading(true)
    try {
      const affiliatesData = await getAffiliates()
      setAffiliates(affiliatesData)
    } catch (error) {
      console.error('Error loading affiliates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAffiliates()
  }, [])

  const userAffiliate = affiliates.find(aff => aff.id === userProfile?.affiliate_company_id)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[#0033A0]">Debug User Profile</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>User Profile Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div><strong>User ID:</strong> {user?.uid || 'Not available'}</div>
            <div><strong>Email:</strong> {user?.email || 'Not available'}</div>
            <div><strong>Role:</strong> {userProfile?.role || 'Not available'}</div>
            <div><strong>Affiliate Company ID:</strong> {userProfile?.affiliate_company_id || 'Not set'}</div>
            <div><strong>Full Name:</strong> {userProfile?.full_name || 'Not available'}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Available Affiliates</CardTitle>
            <Button onClick={loadAffiliates} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {affiliates.length === 0 ? (
            <div className="text-gray-500">No affiliates found</div>
          ) : (
            <div className="space-y-2">
              {affiliates.map(affiliate => (
                <div 
                  key={affiliate.id} 
                  className={`p-3 border rounded-md ${
                    affiliate.id === userProfile?.affiliate_company_id 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="font-medium">{affiliate.name}</div>
                  <div className="text-sm text-gray-600">ID: {affiliate.id}</div>
                  <div className="text-sm text-gray-600">Code: {affiliate.company_code}</div>
                  {affiliate.id === userProfile?.affiliate_company_id && (
                    <div className="text-sm text-green-600 font-medium">✓ Your Company</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {!userProfile?.affiliate_company_id ? (
              <div className="text-red-600">
                ❌ <strong>Issue:</strong> Your user profile doesn't have an affiliate_company_id set.
              </div>
            ) : !userAffiliate ? (
              <div className="text-red-600">
                ❌ <strong>Issue:</strong> Your affiliate_company_id ({userProfile.affiliate_company_id}) doesn't match any affiliate in the database.
              </div>
            ) : (
              <div className="text-green-600">
                ✅ <strong>Success:</strong> Your company is correctly set to {userAffiliate.name}
              </div>
            )}
            
            {userProfile?.role !== 'affiliate' && (
              <div className="text-yellow-600">
                ⚠️ <strong>Note:</strong> Your role is '{userProfile?.role}', not 'affiliate'. The affiliate restrictions only apply to affiliate users.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
