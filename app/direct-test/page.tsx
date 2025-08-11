'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DirectTest() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<string>('')

  const testDirectInsert = async () => {
    setLoading(true)
    setResult('')
    setStep('')

    try {
      // Step 1: Check if we can query affiliates
      setStep('Step 1: Querying affiliates...')
      const { data: affiliates, error: affiliatesError } = await supabase
        .from('affiliates')
        .select('id, name')
        .limit(1)
      
      console.log('Affiliates query result:', { affiliates, affiliatesError })
      
      if (affiliatesError) {
        setResult(`❌ Failed to query affiliates: ${affiliatesError.message}`)
        return
      }

      if (!affiliates || affiliates.length === 0) {
        setResult('❌ No affiliates found in database')
        return
      }

      const affiliateId = affiliates[0].id
      console.log('Using affiliate ID:', affiliateId)

      // Step 2: Try to insert a cash call
      setStep('Step 2: Inserting cash call...')
      const testData = {
        call_number: `DIRECT-${Date.now()}`,
        affiliate_id: affiliateId,
        amount_requested: 500.00,
        description: 'Direct test cash call',
        created_by: 'direct-test-user'
      }

      console.log('Attempting to insert:', testData)

      const { data: insertData, error: insertError } = await supabase
        .from('cash_calls')
        .insert([testData])
        .select()
        .single()

      console.log('Insert result:', { insertData, insertError })

      if (insertError) {
        setResult(`❌ Insert failed: ${insertError.message}`)
        return
      }

      // Step 3: Clean up
      setStep('Step 3: Cleaning up...')
      if (insertData?.id) {
        const { error: deleteError } = await supabase
          .from('cash_calls')
          .delete()
          .eq('id', insertData.id)
        
        if (deleteError) {
          console.warn('Cleanup failed:', deleteError)
        }
      }

      setResult(`✅ Success! Cash call created and cleaned up. ID: ${insertData.id}`)
      
    } catch (err) {
      console.error('Exception in direct test:', err)
      setResult(`❌ Exception: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
      setStep('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Direct Supabase Test</h1>
        
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <button
            onClick={testDirectInsert}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 mb-6"
          >
            {loading ? 'Testing...' : 'Test Direct Insert'}
          </button>

          {step && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">{step}</p>
            </div>
          )}

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
            <h3 className="font-semibold mb-2">What this test does:</h3>
            <ul className="text-sm space-y-1">
              <li>• Queries affiliates table directly</li>
              <li>• Inserts a test cash call using raw Supabase</li>
              <li>• Cleans up the test data</li>
              <li>• Shows detailed error messages</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 