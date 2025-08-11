'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestDatabaseStructure() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const testDatabaseStructure = async () => {
    setLoading(true)
    setError('')
    setResults({})

    try {
      const tests = {}

      // Test 1: Check if cash_calls table exists
      try {
        const { data: cashCallsData, error: cashCallsError } = await supabase
          .from('cash_calls')
          .select('*')
          .limit(1)
        
        tests.cashCallsTable = {
          exists: !cashCallsError || cashCallsError.code !== 'PGRST116',
          error: cashCallsError,
          data: cashCallsData
        }
      } catch (err) {
        tests.cashCallsTable = {
          exists: false,
          error: err
        }
      }

      // Test 2: Check if affiliates table exists
      try {
        const { data: affiliatesData, error: affiliatesError } = await supabase
          .from('affiliates')
          .select('*')
          .limit(1)
        
        tests.affiliatesTable = {
          exists: !affiliatesError || affiliatesError.code !== 'PGRST116',
          error: affiliatesError,
          data: affiliatesData
        }
      } catch (err) {
        tests.affiliatesTable = {
          exists: false,
          error: err
        }
      }

      // Test 3: Try to get table structure
      try {
        const { data: structureData, error: structureError } = await supabase
          .rpc('get_table_structure', { table_name: 'cash_calls' })
        
        tests.tableStructure = {
          success: !structureError,
          error: structureError,
          data: structureData
        }
      } catch (err) {
        tests.tableStructure = {
          success: false,
          error: err
        }
      }

      // Test 4: Check RLS policies
      try {
        const { data: policiesData, error: policiesError } = await supabase
          .from('cash_calls')
          .select('*')
          .limit(1)
        
        tests.rlsPolicies = {
          accessible: !policiesError || policiesError.code !== 'PGRST301',
          error: policiesError
        }
      } catch (err) {
        tests.rlsPolicies = {
          accessible: false,
          error: err
        }
      }

      // Test 5: Try a simple insert
      try {
        const testData = {
          call_number: `TEST-${Date.now()}`,
          affiliate_id: 'test-affiliate-id',
          amount_requested: 100,
          description: 'Test cash call',
          created_by: 'test-user'
        }

        const { data: insertData, error: insertError } = await supabase
          .from('cash_calls')
          .insert([testData])
          .select()
          .single()

        tests.insertTest = {
          success: !insertError,
          error: insertError,
          data: insertData
        }

        // Clean up test data
        if (insertData?.id) {
          await supabase
            .from('cash_calls')
            .delete()
            .eq('id', insertData.id)
        }
      } catch (err) {
        tests.insertTest = {
          success: false,
          error: err
        }
      }

      setResults(tests)
      console.log('Database structure test results:', tests)
    } catch (err) {
      console.error('Error testing database structure:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Database Structure Test</h1>
        
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <button
            onClick={testDatabaseStructure}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-6"
          >
            {loading ? 'Testing...' : 'Test Database Structure'}
          </button>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-red-800 font-semibold">Error:</h3>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          )}

          {Object.keys(results).length > 0 && (
            <div className="space-y-6">
              {Object.entries(results).map(([testName, testResult]: [string, any]) => (
                <div key={testName} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2 capitalize">
                    {testName.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  
                  <div className="space-y-2">
                    {testResult.exists !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Exists:</span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          testResult.exists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {testResult.exists ? 'Yes' : 'No'}
                        </span>
                      </div>
                    )}
                    
                    {testResult.success !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Success:</span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {testResult.success ? 'Yes' : 'No'}
                        </span>
                      </div>
                    )}
                    
                    {testResult.accessible !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Accessible:</span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          testResult.accessible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {testResult.accessible ? 'Yes' : 'No'}
                        </span>
                      </div>
                    )}
                    
                    {testResult.error && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                        <span className="font-medium text-red-800">Error:</span>
                        <pre className="text-red-600 mt-1 text-xs overflow-auto">
                          {JSON.stringify(testResult.error, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {testResult.data && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                        <span className="font-medium text-green-800">Data:</span>
                        <pre className="text-green-600 mt-1 text-xs overflow-auto">
                          {JSON.stringify(testResult.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 