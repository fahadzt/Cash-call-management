import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

const firebaseApp = initializeApp(firebaseConfig)
const auth = getAuth(firebaseApp)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      requestId,
      role,
      affiliateCompanyId,
      notes,
      sendWelcomeEmail,
      temporaryPassword
    } = body

    // Validation
    if (!requestId || !role || !temporaryPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get the account request
    const { data: accountRequest, error: requestError } = await supabase
      .from('account_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (requestError || !accountRequest) {
      return NextResponse.json(
        { error: 'Account request not found' },
        { status: 404 }
      )
    }

    if (accountRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Account request is not pending' },
        { status: 400 }
      )
    }

    // Create user in Firebase Auth
    let firebaseUser
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        accountRequest.email,
        temporaryPassword
      )
      firebaseUser = userCredential.user
    } catch (firebaseError: any) {
      console.error('Firebase auth error:', firebaseError)
      return NextResponse.json(
        { error: `Failed to create user: ${firebaseError.message}` },
        { status: 500 }
      )
    }

    // Create user profile in database
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: firebaseUser.uid,
        email: accountRequest.email,
        full_name: accountRequest.full_name,
        role: role,
        affiliate_company_id: affiliateCompanyId === 'none' ? null : affiliateCompanyId,
        position: accountRequest.position,
        department: accountRequest.department,
        phone: accountRequest.phone,
        is_active: true,
        created_at: new Date().toISOString()
      }])

    if (profileError) {
      console.error('Database profile error:', profileError)
      // Note: In production, you might want to delete the Firebase user if profile creation fails
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    // Update account request status
    const { error: updateError } = await supabase
      .from('account_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        assigned_role: role,
        review_notes: notes
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Database update error:', updateError)
      // Don't fail the whole operation for this
    }

    // Log the account creation
    const { error: logError } = await supabase
      .from('activity_logs')
      .insert([{
        user_id: firebaseUser.uid,
        action: 'account_created',
        resource_type: 'user',
        resource_id: firebaseUser.uid,
        details: {
          role: role,
          affiliate_company_id: affiliateCompanyId,
          created_by_admin: true,
          request_id: requestId
        }
      }])

    if (logError) {
      console.error('Log error:', logError)
      // Don't fail the whole operation for this
    }

    // Send welcome email if requested
    if (sendWelcomeEmail) {
      try {
        // This would integrate with your email service
        // await sendWelcomeEmail(accountRequest.email, {
        //   fullName: accountRequest.full_name,
        //   temporaryPassword: temporaryPassword,
        //   loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`
        // })
        console.log('Welcome email would be sent to:', accountRequest.email)
      } catch (emailError) {
        console.error('Email error:', emailError)
        // Don't fail the whole operation for this
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User account created successfully',
      userId: firebaseUser.uid,
      email: accountRequest.email
    })

  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
