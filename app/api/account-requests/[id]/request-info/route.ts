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
    const { message } = body

    // Validation
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Update account request status to in_review
    const { error } = await supabase
      .from('account_requests')
      .update({
        status: 'in_review',
        review_notes: `Information requested: ${message}`
      })
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update account request' },
        { status: 500 }
      )
    }

    // Log the information request
    const { error: logError } = await supabase
      .from('activity_logs')
      .insert([{
        user_id: null, // No user ID since request is still pending
        action: 'information_requested',
        resource_type: 'account_request',
        resource_id: id,
        details: {
          message: message
        }
      }])

    if (logError) {
      console.error('Log error:', logError)
      // Don't fail the whole operation for this
    }

    // TODO: Send email to user requesting more information
    // await sendInformationRequestEmail(accountRequest.email, { message })

    return NextResponse.json({
      success: true,
      message: 'Information request sent successfully'
    })

  } catch (error) {
    console.error('Error requesting information:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
