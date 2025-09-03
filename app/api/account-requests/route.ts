import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      fullName,
      position,
      department,
      phone,
      affiliateCompanyId,
      reasonForAccess,
      managerName,
      managerEmail
    } = body

    // Validation
    if (!email || !fullName || !position || !department || !reasonForAccess || !managerName || !managerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if email already exists in users or pending requests
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    const { data: existingRequest } = await supabase
      .from('account_requests')
      .select('id')
      .eq('email', email)
      .eq('status', 'pending')
      .single()

    if (existingRequest) {
      return NextResponse.json(
        { error: 'A pending request with this email already exists' },
        { status: 400 }
      )
    }

    // Create account request
    const { data: newRequest, error } = await supabase
      .from('account_requests')
      .insert([{
        email,
        full_name: fullName,
        position,
        department,
        phone,
        affiliate_company_id: affiliateCompanyId === 'none' ? null : affiliateCompanyId,
        reason_for_access: reasonForAccess,
        manager_name: managerName,
        manager_email: managerEmail,
        status: 'pending'
      }])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create account request' },
        { status: 500 }
      )
    }

    // Send notification to admin users (optional - can be implemented later)
    // await notifyAdminsOfNewRequest(newRequest)

    return NextResponse.json({
      success: true,
      message: 'Account request submitted successfully',
      requestId: newRequest.id
    })

  } catch (error) {
    console.error('Error processing account request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // This endpoint is for admins to view account requests
    // Authentication and authorization should be handled here
    
    const { data: requests, error } = await supabase
      .from('account_requests')
      .select(`
        *,
        affiliate:affiliates(name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch account requests' },
        { status: 500 }
      )
    }

    return NextResponse.json({ requests })

  } catch (error) {
    console.error('Error fetching account requests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
