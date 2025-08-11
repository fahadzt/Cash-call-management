'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugSupabase() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const testSupabaseConnection = async () => {
    setLoading(true)
    setError('')
    setResults({})

    try {
      const tests = {}

      // Test 1: Basic connection test
      try {
        console.log('Testing basic Supabase connection...')
        const { data, error } = await supabase.from('affiliates').select('count').limit(1)
        
        tests.basicConnection = {
          success: !error,
          error: error,
          data: data,
          message: error ? 'Connection failed' : 'Connection successful'
        }
        console.log('Basic connection test result:', tests.basicConnection)
      } catch (err) {
        tests.basicConnection = {
          success: false,
          error: err,
          message: 'Exception occurred during connection test'
        }
        console.error('Basic connection test exception:', err)
      }

      // Test 2: Test affiliates table
      try {
        console.log('Testing affiliates table...')
        const { data, error } = await supabase
          .from('affiliates')
          .select('*')
          .limit(5)
        
        tests.affiliatesTable = {
          success: !error,
          error: error,
          data: data,
          count: data?.length || 0,
          message: error ? `Error: ${error.message}` : `Found ${data?.length || 0} affiliates`
        }
        console.log('Affiliates table test result:', tests.affiliatesTable)
      } catch (err) {
        tests.affiliatesTable = {
          success: false,
          error: err,
          message: 'Exception occurred during affiliates test'
        }
        console.error('Affiliates table test exception:', err)
      }

      // Test 3: Test cash_calls table
      try {
        console.log('Testing cash_calls table...')
        const { data, error } = await supabase
          .from('cash_calls')
          .select('*')
          .limit(5)
        
        tests.cashCallsTable = {
          success: !error,
          error: error,
          data: data,
          count: data?.length || 0,
          message: error ? `Error: ${error.message}` : `Found ${data?.length || 0} cash calls`
        }
        console.log('Cash calls table test result:', tests.cashCallsTable)
      } catch (err) {
        tests.cashCallsTable = {
          success: false,
          error: err,
          message: 'Exception occurred during cash calls test'
        }
        console.error('Cash calls table test exception:', err)
      }

      // Test 4: Test insert operation
      try {
        console.log('Testing insert operation...')
        
        // First, get a valid affiliate ID
        const { data: affiliates } = await supabase
          .from('affiliates')
          .select('id')
          .limit(1)
        
        if (affiliates && affiliates.length > 0) {
          const testData = {
            call_number: `DEBUG-${Date.now()}`,
            affiliate_id: affiliates[0].id,
            amount_requested: 100.00,
            description: 'Debug test cash call',
            created_by: 'debug-user'
          }
          
          console.log('Attempting to insert test data:', testData)
          
          const { data, error } = await supabase
            .from('cash_calls')
            .insert([testData])
            .select()
            .single()
          
          tests.insertTest = {
            success: !error,
            error: error,
            data: data,
            message: error ? `Insert failed: ${error.message}` : 'Insert successful'
          }
          
          // Clean up test data
          if (data?.id) {
            await supabase
              .from('cash_calls')
              .delete()
              .eq('id', data.id)
            console.log('Cleaned up test data')
          }
        } else {
          tests.insertTest = {
            success: false,
            error: null,
            message: 'No affiliates found to test insert'
          }
        }
        console.log('Insert test result:', tests.insertTest)
      } catch (err) {
        tests.insertTest = {
          success: false,
          error: err,
          message: 'Exception occurred during insert test'
        }
        console.error('Insert test exception:', err)
      }

      // Test 5: Check environment variables
      tests.environment = {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Not set',
        message: process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
          ? 'Environment variables are configured' 
          : 'Environment variables are missing'
      }

      setResults(tests)
      console.log('All tests completed:', tests)
    } catch (err) {
      console.error('Error in testSupabaseConnection:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Supabase Debug Test</h1>
        
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <button
            onClick={testSupabaseConnection}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-6"
          >
            {loading ? 'Testing...' : 'Run Supabase Debug Tests'}
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
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Status:</span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {testResult.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      {testResult.message}
                    </div>
                    
                    {testResult.count !== undefined && (
                      <div className="text-sm text-gray-600">
                        Count: {testResult.count}
                      </div>
                    )}
                    
                    {testResult.error && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                        <span className="font-medium text-red-800">Error Details:</span>
                        <pre className="text-red-600 mt-1 text-xs overflow-auto">
                          {JSON.stringify(testResult.error, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {testResult.data && testResult.data.length > 0 && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                        <span className="font-medium text-green-800">Sample Data:</span>
                        <pre className="text-green-600 mt-1 text-xs overflow-auto">
                          {JSON.stringify(testResult.data.slice(0, 2), null, 2)}
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