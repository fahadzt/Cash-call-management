import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { reason, notes } = body

    // Validation
    if (!reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      )
    }

    // Update account request status to rejected
    const { error } = await supabase
      .from('account_requests')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        review_notes: notes || `Rejected: ${reason}`
      })
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to reject account request' },
        { status: 500 }
      )
    }

    // Log the rejection
    const { error: logError } = await supabase
      .from('activity_logs')
      .insert([{
        user_id: null, // No user ID since request was rejected
        action: 'account_request_rejected',
        resource_type: 'account_request',
        resource_id: id,
        details: {
          reason: reason,
          notes: notes
        }
      }])

    if (logError) {
      console.error('Log error:', logError)
      // Don't fail the whole operation for this
    }

    // TODO: Send rejection email to user
    // await sendRejectionEmail(accountRequest.email, { reason, notes })

    return NextResponse.json({
      success: true,
      message: 'Account request rejected successfully'
    })

  } catch (error) {
    console.error('Error rejecting account request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
