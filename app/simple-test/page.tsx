'use client'

import { useState } from 'react'

export default function SimpleTest() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testSupabase = async () => {
    setLoading(true)
    setResult('')

    try {
      // Import supabase dynamically to avoid any import issues
      const { createClient } = await import('@supabase/supabase-js')
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      console.log('Environment variables:')
      console.log('URL:', supabaseUrl)
      console.log('Key exists:', !!supabaseKey)
      
      if (!supabaseUrl || !supabaseKey) {
        setResult('❌ Environment variables are missing!')
        return
      }

      const supabase = createClient(supabaseUrl, supabaseKey)
      
      console.log('Testing basic query...')
      
      // Test 1: Simple query
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .limit(1)
      
      console.log('Query result:', { data, error })
      
      if (error) {
        setResult(`❌ Query failed: ${error.message}`)
        return
      }
      
      setResult(`✅ Query successful! Found ${data?.length || 0} affiliates`)
      
    } catch (err) {
      console.error('Exception caught:', err)
      setResult(`❌ Exception: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Simple Supabase Test</h1>
        
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <button
            onClick={testSupabase}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-6"
          >
            {loading ? 'Testing...' : 'Test Supabase Connection'}
          </button>

          {result && (
            <div className={`p-4 rounded-lg ${
              result.startsWith('✅') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <p className={result.startsWith('✅') ? 'text-green-800' : 'text-red-800'}>
                {result}
              </p>
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Environment Variables:</h3>
            <div className="text-sm space-y-1">
              <div>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</div>
              <div>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 