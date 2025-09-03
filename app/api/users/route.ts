import { NextRequest, NextResponse } from 'next/server'
import { getUsersByRole } from '@/lib/firebase-database'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') as 'FINANCE' | 'CFO' | 'ADMIN' | 'AFFILIATE'
    
    if (!role) {
      return NextResponse.json(
        { error: 'Role parameter is required' },
        { status: 400 }
      )
    }
    
    if (!['FINANCE', 'CFO', 'ADMIN', 'AFFILIATE'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: FINANCE, CFO, ADMIN, AFFILIATE' },
        { status: 400 }
      )
    }
    
    const users = await getUsersByRole(role)
    
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error getting users by role:', error)
    return NextResponse.json(
      { error: 'Failed to get users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, full_name, role, department, position, phone, company_id, is_active } = body
    
    // Validate required fields
    if (!email || !full_name || !role) {
      return NextResponse.json(
        { error: 'Email, full_name, and role are required' },
        { status: 400 }
      )
    }
    
    // Validate role
    if (!['admin', 'viewer', 'approver', 'affiliate'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: admin, viewer, approver, affiliate' },
        { status: 400 }
      )
    }
    
    // Create user document
    const userData = {
      email,
      full_name,
      role,
      department: department || 'Finance',
      position: position || '',
      phone: phone || '',
      company_id: company_id || 'parent-company',
      is_active: is_active !== false, // Default to true
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    }
    
    const docRef = await addDoc(collection(db, 'users'), userData)
    
    const createdUser = {
      id: docRef.id,
      ...userData,
      created_at: new Date(),
      updated_at: new Date()
    }
    
    return NextResponse.json(createdUser, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
