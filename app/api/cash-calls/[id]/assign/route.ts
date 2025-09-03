import { NextRequest, NextResponse } from 'next/server'
import { assignCashCallToFinance, unassignCashCall } from '@/lib/firebase-database'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cashCallId = params.id
    const body = await request.json()
    const { assigneeUserId, adminUserId } = body
    
    if (!adminUserId) {
      return NextResponse.json(
        { error: 'Admin user ID is required' },
        { status: 400 }
      )
    }
    
    if (assigneeUserId) {
      // Assign to specific user
      await assignCashCallToFinance(cashCallId, assigneeUserId, adminUserId)
      return NextResponse.json({ 
        message: 'Cash call assigned successfully',
        assigneeUserId 
      })
    } else {
      // Unassign
      await unassignCashCall(cashCallId, adminUserId)
      return NextResponse.json({ 
        message: 'Cash call unassigned successfully' 
      })
    }
  } catch (error: any) {
    console.error('Error assigning cash call:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to assign cash call' },
      { status: 500 }
    )
  }
}
