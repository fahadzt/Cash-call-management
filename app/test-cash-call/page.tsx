'use client'

import { useState } from 'react'
import { createCashCallEnhanced } from '@/lib/enhanced-database'
import { mockAuth } from '@/lib/mock-auth'

export default function TestCashCall() {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testCreateCashCall = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      // Get current user
      const session = await mockAuth.getSession()
      const user = session.data.session?.user

      if (!user) {
        setError('No user found')
        return
      }

      console.log('Current user:', user)

      const cashCallData = {
        call_number: `CC-TEST-${Date.now()}`,
        affiliate_id: 'affiliate-1', // Use a known affiliate ID
        amount_requested: 1000,
        description: 'Test cash call',
        created_by: user.id,
      }

      console.log('Creating cash call with data:', cashCallData)

      const newCall = await createCashCallEnhanced(cashCallData)
      
      console.log('Cash call created successfully:', newCall)
      setResult(newCall)
    } catch (err) {
      console.error('Error creating cash call:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Cash Call Creation</h1>
        
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <button
            onClick={testCreateCashCall}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Test Create Cash Call'}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-red-800 font-semibold">Error:</h3>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-green-800 font-semibold">Success!</h3>
              <pre className="text-green-600 mt-1 text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 