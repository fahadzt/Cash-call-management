import { NextRequest, NextResponse } from 'next/server'
import { getCashCallsByAccess } from '@/lib/firebase-database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const scope = searchParams.get('scope') as 'mine' | 'affiliate' | 'all'
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    const cashCalls = await getCashCallsByAccess(userId, scope)
    
    return NextResponse.json(cashCalls)
  } catch (error: any) {
    console.error('Error getting cash calls:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get cash calls' },
      { status: 500 }
    )
  }
}
