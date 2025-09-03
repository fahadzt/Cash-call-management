import { NextRequest, NextResponse } from 'next/server'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    const body = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    // Validate updateable fields
    const allowedFields = ['is_active', 'department', 'position', 'phone', 'role']
    const updates: any = {}
    
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        updates[key] = value
      }
    }
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }
    
    // Add updated timestamp
    updates.updated_at = serverTimestamp()
    
    // Update user document
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, updates)
    
    return NextResponse.json({ 
      message: 'User updated successfully',
      userId,
      updates 
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}
