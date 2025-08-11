'use client'

import { useState, useEffect } from 'react'
import { getAffiliates } from '@/lib/enhanced-database'

export default function TestAffiliates() {
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const loadAffiliates = async () => {
      try {
        const data = await getAffiliates()
        console.log('Affiliates loaded:', data)
        setAffiliates(data)
      } catch (err) {
        console.error('Error loading affiliates:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadAffiliates()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Affiliates</h1>
        
        <div className="bg-white rounded-lg p-6 shadow-sm">
          {loading && <p>Loading affiliates...</p>}
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-red-800 font-semibold">Error:</h3>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          )}

          {affiliates.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Available Affiliates ({affiliates.length})</h2>
              <div className="space-y-4">
                {affiliates.map((affiliate) => (
                  <div key={affiliate.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{affiliate.name}</h3>
                        <p className="text-sm text-gray-600">ID: {affiliate.id}</p>
                        <p className="text-sm text-gray-600">Code: {affiliate.company_code}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          {affiliate.status || 'active'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && affiliates.length === 0 && !error && (
            <p className="text-gray-600">No affiliates found in the database.</p>
          )}
        </div>
      </div>
    </div>
  )
} 