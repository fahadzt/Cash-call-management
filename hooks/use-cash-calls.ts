import { useState, useEffect, useCallback } from 'react'
import { getCashCalls, createCashCall, updateCashCall } from '@/lib/firebase-database'
import type { CashCall } from '@/lib/firebase-database'

interface UseCashCallsReturn {
  cashCalls: CashCall[]
  loading: boolean
  error: string
  refresh: () => Promise<void>
  createNewCashCall: (data: any) => Promise<string>
  updateCashCallStatus: (id: string, status: string, userId: string) => Promise<void>
}

export const useCashCalls = (): UseCashCallsReturn => {
  const [cashCalls, setCashCalls] = useState<CashCall[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadCashCalls = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getCashCalls()
      setCashCalls(data)
    } catch (err) {
      console.error('Error loading cash calls:', err)
      setError('Failed to load cash calls')
    } finally {
      setLoading(false)
    }
  }, [])

  const createNewCashCall = useCallback(async (data: any) => {
    try {
      setError('')
      const newCallId = await createCashCall(data)
      
      // Add to local state
      const newCall = {
        id: newCallId,
        ...data,
        created_at: new Date(),
        updated_at: new Date(),
      } as CashCall
      
      setCashCalls(prev => [newCall, ...prev])
      return newCallId
    } catch (err) {
      console.error('Error creating cash call:', err)
      setError('Failed to create cash call')
      throw err
    }
  }, [])

  const updateCashCallStatus = useCallback(async (id: string, status: string, userId: string) => {
    try {
      setError('')
      await updateCashCall(id, { status: status as any }, userId)
      
      // Update local state
      setCashCalls(prev => 
        prev.map(call => 
          call.id === id ? { ...call, status: status as any } : call
        )
      )
    } catch (err) {
      console.error('Error updating cash call:', err)
      setError('Failed to update cash call')
      throw err
    }
  }, [])

  useEffect(() => {
    loadCashCalls()
  }, [loadCashCalls])

  return {
    cashCalls,
    loading,
    error,
    refresh: loadCashCalls,
    createNewCashCall,
    updateCashCallStatus,
  }
}
