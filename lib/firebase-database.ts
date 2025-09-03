import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  writeBatch,
  runTransaction,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
  DocumentReference,
  CollectionReference,
  Query,
  QuerySnapshot,
  DocumentSnapshot,
  WriteBatch,
  Transaction,
  FieldValue,
  increment,
  arrayUnion,
  arrayRemove,
  setDoc,
  doc as firestoreDoc,
} from 'firebase/firestore'
import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  StorageReference,
} from 'firebase/storage'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth'
import { db, auth, storage } from './firebase'

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'approver' | 'affiliate' | 'viewer' | 'finance' | 'cfo'
  companyId: string // For tenant isolation - AFFILIATE users have their company ID, internal users have parent company ID
  affiliate_company_id?: string // Link to affiliate company for affiliate users (legacy field)
  department?: string
  position?: string
  phone?: string
  is_active: boolean
  last_login?: Date
  created_at: Date
  updated_at: Date
  avatar_url?: string
  preferences?: {
    theme?: 'light' | 'dark' | 'system'
    notifications?: boolean
    language?: string
  }
}

export interface Affiliate {
  id: string
  name: string
  company_code: string
  legal_name?: string
  tax_id?: string
  registration_number?: string
  contact_email?: string
  contact_phone?: string
  address?: string
  country?: string
  city?: string
  postal_code?: string
  website?: string
  status: 'active' | 'inactive' | 'suspended'
  partnership_type?: string
  partnership_start_date?: Date
  partnership_end_date?: Date
  financial_rating?: string
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  created_at: Date
  updated_at: Date
  logo_url?: string
  documents?: string[]
}

export interface CashCall {
  id: string
  call_number: string
  title?: string
  affiliate_id: string
  affiliateCompanyId: string // For tenant isolation - matches affiliate_id but more explicit
  amount_requested: number
  status: 'draft' | 'under_review' | 'submitted' | 'finance_review' | 'ready_for_cfo' | 'approved' | 'paid' | 'rejected'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category?: string
  subcategory?: string
  description?: string
  currency: string
  exchange_rate: number
  amount_in_original_currency?: number
  original_currency?: string
  payment_terms?: string
  payment_method?: string
  bank_account_info?: any
  supporting_documents?: string[]
  rejection_reason?: string
  internal_notes?: string
  external_notes?: string
  tags?: string[]
  risk_assessment?: string
  compliance_status: 'pending' | 'approved' | 'rejected' | 'under_review'
  created_by: string
  createdByUserId: string // For consistency with new naming
  assigneeUserId?: string // For assignment system - nullable
  created_at: Date
  updated_at: Date
  due_date?: Date
  approved_at?: Date
  approved_by?: string
  paid_at?: Date
  workflow_step?: number
  total_approved_amount?: number
  remaining_amount?: number
}

export interface Comment {
  id: string
  cash_call_id: string
  user_id: string
  parent_comment_id?: string
  content: string
  is_internal: boolean
  is_private: boolean
  created_at: Date
  updated_at: Date
  attachments?: string[]
  likes?: string[]
  replies_count?: number
}

export interface ActivityLog {
  id: string
  user_id?: string
  action: string
  entity_type: string
  entity_id: string
  old_values?: any
  new_values?: any
  ip_address?: string
  user_agent?: string
  session_id?: string
  created_at: Date
  metadata?: any
}

export interface Committee {
  id: string
  name: string
  description?: string
  color: string
  order_index: number
  is_active: boolean
  created_at: Date
  updated_at: Date
  members?: string[]
}

export interface ChecklistTemplate {
  id: string
  name: string
  description?: string
  committee_id: string
  is_default: boolean
  created_by?: string
  created_at: Date
  updated_at: Date
  version?: number
}

export interface DocumentRequirement {
  id: string
  affiliate_id?: string // Optional - if null, applies to all affiliates
  document_type: string
  title: string
  description?: string
  is_required: boolean
  file_types: string[]
  max_file_size?: number // in MB
  order_index: number
  created_by: string
  created_at: Date
  updated_at: Date
  is_global?: boolean // Flag to indicate if this applies to all affiliates
  applies_to: 'opex' | 'capex' | 'both' // Which type of cash call this applies to
}

export interface ChecklistItem {
  id: string
  template_id?: string
  committee_id: string
  item_number: string
  title: string
  description?: string
  document_requirements?: string
  is_required: boolean
  order_index: number
  created_at: Date
  updated_at: Date
  estimated_time?: number
  dependencies?: string[]
}

export interface AffiliateChecklist {
  id: string
  affiliate_id: string
  cash_call_id?: string // Optional link to cash call record
  template_id?: string
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold'
  created_by?: string
  created_at: Date
  updated_at: Date
  progress_percentage?: number
  total_items?: number
  completed_items?: number
}

export interface ChecklistResponse {
  id: string
  affiliate_checklist_id: string
  checklist_item_id: string
  status: 'not_started' | 'in_progress' | 'under_review' | 'needs_revision' | 'on_hold' | 'approved' | 'completed' | 'rejected' | 'blocked' | 'pending_info' | 'waiting_approval' | 'escalated'
  response?: string
  submitted_by?: string
  reviewed_by?: string
  reviewed_at?: Date
  review_notes?: string
  attachments?: string[]
  created_at: Date
  updated_at: Date
  completion_time?: number
}

export interface Stakeholder {
  id: string
  cash_call_id: string
  user_id: string
  role: 'reviewer' | 'approver' | 'observer'
  permissions?: any
  notification_preferences?: any
  assigned_by?: string
  assigned_at: Date
  removed_at?: Date
  is_active: boolean
  approval_order?: number
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  entity_type?: string
  entity_id?: string
  is_read: boolean
  created_at: Date
  read_at?: Date
  action_url?: string
  priority: 'low' | 'medium' | 'high'
}

export interface DashboardStats {
  total_cash_calls: number
  pending_approvals: number
  total_amount: number
  recent_activities: ActivityLog[]
  upcoming_deadlines: CashCall[]
  checklist_progress: {
    total: number
    completed: number
    percentage: number
  }
}

// =====================================================
// AUTHENTICATION OPERATIONS
// =====================================================

export async function signUp(email: string, password: string, userData: Partial<User>): Promise<UserCredential> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    
    // Create user profile in Firestore - filter out undefined values
    const userDoc = {
      id: userCredential.user.uid,
      email: email,
      full_name: userData.full_name || '',
      role: userData.role || 'viewer',
      companyId: 'parent-company', // Default company ID for internal users
      affiliate_company_id: userData.affiliate_company_id || null,
      position: userData.position || null,
      phone: userData.phone || null,
      is_active: true,
      created_at: serverTimestamp() as FieldValue,
      updated_at: serverTimestamp() as FieldValue,
      preferences: {
        theme: 'system',
        notifications: true,
        language: 'en'
      }
    }

    // Only add optional fields if they have values
    if (userData.department) {
      userDoc.department = userData.department
    }

    await setDoc(doc(db, 'users', userCredential.user.uid), userDoc)
    
    return userCredential
  } catch (error) {
    console.error('Error in signUp:', error)
    throw error
  }
}

export async function signIn(email: string, password: string): Promise<UserCredential> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    
    // Update last login
    await updateDoc(doc(db, 'users', userCredential.user.uid), {
      last_login: serverTimestamp(),
      updated_at: serverTimestamp()
    })

    return userCredential
  } catch (error) {
    console.error('Error signing in:', error)
    throw error
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth)
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error) {
    console.error('Error resetting password:', error)
    throw error
  }
}

export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback)
}

// =====================================================
// USER OPERATIONS
// =====================================================

export async function getUsers(): Promise<User[]> {
  try {
    const usersRef = collection(db, 'users')
    const q = query(usersRef, orderBy('full_name', 'asc'))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate(),
      updated_at: doc.data().updated_at?.toDate(),
      last_login: doc.data().last_login?.toDate()
    })) as User[]
  } catch (error) {
    console.error('Error fetching users:', error)
    throw error
  }
}

export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    
    if (!userDoc.exists()) {
      return null
    }

    return {
      id: userDoc.id,
      ...userDoc.data(),
      created_at: userDoc.data().created_at?.toDate(),
      updated_at: userDoc.data().updated_at?.toDate(),
      last_login: userDoc.data().last_login?.toDate()
    } as User
  } catch (error) {
    console.error('Error fetching user profile:', error)
    throw error
  }
}

export async function getUser(userId: string): Promise<User> {
  try {
    console.log('getUser called with userId:', userId)
    
    if (!userId) {
      throw new Error('User ID is required')
    }
    
    const userDoc = await getDoc(doc(db, 'users', userId))
    
    if (!userDoc.exists()) {
      throw new Error('User not found')
    }

    const data = userDoc.data()
    console.log('User document data:', data)

    // Ensure all required fields have fallback values
    const user: User = {
      id: userDoc.id,
      email: data.email || '',
      full_name: data.full_name || '',
      role: data.role || 'viewer',
      companyId: data.companyId || data.affiliate_company_id || 'parent-company',
      affiliate_company_id: data.affiliate_company_id || null,
      department: data.department || null,
      position: data.position || null,
      phone: data.phone || null,
      is_active: data.is_active !== false, // Default to true if not set
      last_login: data.last_login?.toDate() || null,
      created_at: data.created_at?.toDate() || new Date(),
      updated_at: data.updated_at?.toDate() || new Date(),
      avatar_url: data.avatar_url || null,
      preferences: data.preferences || {}
    }
    
    console.log('Processed user object:', user)
    return user
  } catch (error) {
    console.error('Error fetching user:', error)
    throw error
  }
}

export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      ...updates,
      updated_at: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw error
  }
}

export async function updateUserRole(userId: string, role: User['role']): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      role,
      updated_at: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    throw error
  }
}



// Function to send in-app notifications
export async function sendInAppNotification(
  userId: string, 
  notification: {
    type: string
    title: string
    message: string
    cashCallId?: string
    assignedBy?: string
    timestamp: Date
  }
): Promise<void> {
  try {
    const notificationRef = collection(db, 'notifications')
    await addDoc(notificationRef, {
      user_id: userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      cash_call_id: notification.cashCallId || null,
      assigned_by: notification.assignedBy || null,
      read: false,
      created_at: serverTimestamp(),
      timestamp: notification.timestamp
    })
    console.log('Notification sent to user:', userId)
  } catch (error) {
    console.error('Error sending notification:', error)
    // Don't throw error to avoid breaking the assignment process
  }
}

// Function to get notifications for a user
export async function getUserNotifications(userId: string): Promise<any[]> {
  try {
    // Simplified query without ordering to avoid index requirement
    const q = query(
      collection(db, 'notifications'),
      where('user_id', '==', userId),
      limit(50)
    )
    
    const querySnapshot = await getDocs(q)
    const notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate(),
      timestamp: doc.data().timestamp?.toDate()
    }))
    
    // Sort in memory instead of in the query
    notifications.sort((a, b) => {
      const dateA = a.created_at || a.timestamp || new Date(0)
      const dateB = b.created_at || b.timestamp || new Date(0)
      return dateB.getTime() - dateA.getTime()
    })
    
    return notifications
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
}

// Function to mark notification as read
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, 'notifications', notificationId)
    await updateDoc(notificationRef, {
      read: true,
      updated_at: serverTimestamp()
    })
  } catch (error) {
    console.error('Error marking notification as read:', error)
  }
}

// Function to delete notification
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, 'notifications', notificationId)
    await deleteDoc(notificationRef)
  } catch (error) {
    console.error('Error deleting notification:', error)
    throw error
  }
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    
    // Get current data for activity log
    const currentDoc = await getDoc(userRef)
    const oldValues = currentDoc.exists() ? currentDoc.data() : null
    
    await updateDoc(userRef, {
      ...updates,
      updated_at: serverTimestamp()
    })

    // Log activity
    await logActivity({
      action: 'user_updated',
      entity_type: 'user',
      entity_id: userId,
      old_values: oldValues,
      new_values: { ...oldValues, ...updates }
    })
  } catch (error) {
    console.error('Error updating user:', error)
    throw error
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    
    // Get current data for activity log
    const currentDoc = await getDoc(userRef)
    const oldValues = currentDoc.exists() ? currentDoc.data() : null
    
    await deleteDoc(userRef)

    // Log activity
    await logActivity({
      action: 'user_deleted',
      entity_type: 'user',
      entity_id: userId,
      old_values: oldValues
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    throw error
  }
}

// =====================================================
// AFFILIATE OPERATIONS
// =====================================================

export async function getAffiliates(): Promise<Affiliate[]> {
  try {
    const affiliatesRef = collection(db, 'affiliates')
    const q = query(affiliatesRef, orderBy('name', 'asc'))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate(),
      updated_at: doc.data().updated_at?.toDate(),
      partnership_start_date: doc.data().partnership_start_date?.toDate(),
      partnership_end_date: doc.data().partnership_end_date?.toDate()
    })) as Affiliate[]
  } catch (error) {
    console.error('Error fetching affiliates:', error)
    throw error
  }
}

export async function getAffiliate(id: string): Promise<Affiliate | null> {
  try {
    const affiliateDoc = await getDoc(doc(db, 'affiliates', id))
    
    if (!affiliateDoc.exists()) {
      return null
    }

    return {
      id: affiliateDoc.id,
      ...affiliateDoc.data(),
      created_at: affiliateDoc.data().created_at?.toDate(),
      updated_at: affiliateDoc.data().updated_at?.toDate(),
      partnership_start_date: affiliateDoc.data().partnership_start_date?.toDate(),
      partnership_end_date: affiliateDoc.data().partnership_end_date?.toDate()
    } as Affiliate
  } catch (error) {
    console.error('Error fetching affiliate:', error)
    throw error
  }
}

export async function createAffiliate(affiliateData: Omit<Affiliate, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  try {
    const affiliatesRef = collection(db, 'affiliates')
    const docRef = await addDoc(affiliatesRef, {
      ...affiliateData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    })
    
    // Log activity
    await logActivity({
      action: 'affiliate_created',
      entity_type: 'affiliate',
      entity_id: docRef.id,
      new_values: affiliateData
    })

    return docRef.id
  } catch (error) {
    console.error('Error creating affiliate:', error)
    throw error
  }
}

export async function updateAffiliate(id: string, updates: Partial<Affiliate>): Promise<void> {
  try {
    const affiliateRef = doc(db, 'affiliates', id)
    
    // Get current data for activity log
    const currentDoc = await getDoc(affiliateRef)
    const oldValues = currentDoc.exists() ? currentDoc.data() : null
    
    await updateDoc(affiliateRef, {
      ...updates,
      updated_at: serverTimestamp()
    })

    // Log activity
    await logActivity({
      action: 'affiliate_updated',
      entity_type: 'affiliate',
      entity_id: id,
      old_values: oldValues,
      new_values: { ...oldValues, ...updates }
    })
  } catch (error) {
    console.error('Error updating affiliate:', error)
    throw error
  }
}

export async function deleteAffiliate(id: string): Promise<void> {
  try {
    const affiliateRef = doc(db, 'affiliates', id)
    
    // Get current data for activity log
    const currentDoc = await getDoc(affiliateRef)
    const oldValues = currentDoc.exists() ? currentDoc.data() : null
    
    await deleteDoc(affiliateRef)

    // Log activity
    await logActivity({
      action: 'affiliate_deleted',
      entity_type: 'affiliate',
      entity_id: id,
      old_values: oldValues
    })
  } catch (error) {
    console.error('Error deleting affiliate:', error)
    throw error
  }
}

// =====================================================
// CASH CALL OPERATIONS
// =====================================================

export async function getCashCalls(filters?: {
  status?: string[]
  affiliate_id?: string
  priority?: string[]
  created_by?: string
  date_from?: Date
  date_to?: Date
  limit?: number
}): Promise<CashCall[]> {
  try {
    const cashCallsRef = collection(db, 'cash_calls')
    let q = query(cashCallsRef, orderBy('created_at', 'desc'))

    // Apply filters
    if (filters?.status && filters.status.length > 0) {
      q = query(q, where('status', 'in', filters.status))
    }
    
    if (filters?.affiliate_id) {
      q = query(q, where('affiliate_id', '==', filters.affiliate_id))
    }
    
    if (filters?.priority && filters.priority.length > 0) {
      q = query(q, where('priority', 'in', filters.priority))
    }
    
    if (filters?.created_by) {
      q = query(q, where('created_by', '==', filters.created_by))
    }
    
    if (filters?.date_from) {
      q = query(q, where('created_at', '>=', filters.date_from))
    }
    
    if (filters?.date_to) {
      q = query(q, where('created_at', '<=', filters.date_to))
    }
    
    if (filters?.limit) {
      q = query(q, limit(filters.limit))
    }

    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate(),
      updated_at: doc.data().updated_at?.toDate(),
      due_date: doc.data().due_date?.toDate(),
      approved_at: doc.data().approved_at?.toDate(),
      paid_at: doc.data().paid_at?.toDate()
    })) as CashCall[]
  } catch (error) {
    console.error('Error fetching cash calls:', error)
    throw error
  }
}

export async function getCashCall(id: string): Promise<CashCall | null> {
  try {
    console.log('getCashCall called with id:', id)
    
    if (!id) {
      throw new Error('Cash call ID is required')
    }
    
    const cashCallDoc = await getDoc(doc(db, 'cash_calls', id))
    
    if (!cashCallDoc.exists()) {
      console.log('Cash call not found:', id)
      return null
    }

    const data = cashCallDoc.data()
    console.log('Cash call document data:', data)

    // Ensure all required fields have fallback values
    const cashCall: CashCall = {
      id: cashCallDoc.id,
      call_number: data.call_number || '',
      title: data.title || '',
      affiliate_id: data.affiliate_id || '',
      affiliateCompanyId: data.affiliateCompanyId || data.affiliate_id || '',
      amount_requested: data.amount_requested || 0,
      status: data.status || 'draft',
      priority: data.priority || 'medium',
      category: data.category || '',
      subcategory: data.subcategory || '',
      description: data.description || '',
      currency: data.currency || 'USD',
      exchange_rate: data.exchange_rate || 1.0,
      amount_in_original_currency: data.amount_in_original_currency || null,
      original_currency: data.original_currency || null,
      payment_terms: data.payment_terms || '',
      payment_method: data.payment_method || '',
      bank_account_info: data.bank_account_info || null,
      supporting_documents: data.supporting_documents || [],
      rejection_reason: data.rejection_reason || '',
      internal_notes: data.internal_notes || '',
      external_notes: data.external_notes || '',
      tags: data.tags || [],
      risk_assessment: data.risk_assessment || '',
      compliance_status: data.compliance_status || 'pending',
      created_by: data.created_by || '',
      createdByUserId: data.createdByUserId || data.created_by || '',
      assigneeUserId: data.assigneeUserId || null,
      created_at: data.created_at?.toDate() || new Date(),
      updated_at: data.updated_at?.toDate() || new Date(),
      due_date: data.due_date?.toDate() || null,
      approved_at: data.approved_at?.toDate() || null,
      approved_by: data.approved_by || null,
      paid_at: data.paid_at?.toDate() || null,
      workflow_step: data.workflow_step || 1,
      total_approved_amount: data.total_approved_amount || 0,
      remaining_amount: data.remaining_amount || 0
    }
    
    console.log('Processed cash call object:', cashCall)
    return cashCall
  } catch (error) {
    console.error('Error fetching cash call:', error)
    throw error
  }
}

export async function createCashCall(cashCallData: Omit<CashCall, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  try {
    console.log('Debug - Creating cash call with data:', {
      call_number: cashCallData.call_number,
      affiliate_id: cashCallData.affiliate_id,
      amount_requested: cashCallData.amount_requested,
      created_by: cashCallData.created_by,
      status: cashCallData.status
    })

    const cashCallsRef = collection(db, 'cash_calls')
    const docRef = await addDoc(cashCallsRef, {
      ...cashCallData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      workflow_step: 1,
      total_approved_amount: 0,
      remaining_amount: cashCallData.amount_requested
    })
    
    console.log('Debug - Cash call created successfully with ID:', docRef.id)
    
    // Log activity (but don't fail if activity_logs collection doesn't exist)
    try {
      await logActivity({
        user_id: cashCallData.created_by,
        action: 'cash_call_created',
        entity_type: 'cash_call',
        entity_id: docRef.id,
        new_values: cashCallData
      })
      console.log('Debug - Activity logged successfully')
    } catch (activityError) {
      console.warn('Activity logging failed (collection may not exist):', activityError)
      // Don't throw - this is not critical for cash call creation
    }

    return docRef.id
  } catch (error) {
    console.error('Error creating cash call:', error)
    throw error
  }
}

export async function updateCashCall(id: string, updates: Partial<CashCall>, userId: string): Promise<void> {
  try {
    const cashCallRef = doc(db, 'cash_calls', id)
    
    // Get current data for activity log
    const currentDoc = await getDoc(cashCallRef)
    const oldValues = currentDoc.exists() ? currentDoc.data() : null
    
    await updateDoc(cashCallRef, {
      ...updates,
      updated_at: serverTimestamp()
    })

    // Log activity (but don't fail if activity_logs collection doesn't exist)
    try {
      await logActivity({
        user_id: userId,
        action: 'cash_call_updated',
        entity_type: 'cash_call',
        entity_id: id,
        old_values: oldValues,
        new_values: { ...oldValues, ...updates }
      })
    } catch (activityError) {
      console.warn('Activity logging failed (collection may not exist):', activityError)
      // Don't throw - this is not critical for cash call updates
    }
  } catch (error) {
    console.error('Error updating cash call:', error)
    throw error
  }
}

export async function deleteCashCall(id: string, userId: string): Promise<void> {
  try {
    const cashCallRef = doc(db, 'cash_calls', id)
    
    // Get current data for activity log
    const currentDoc = await getDoc(cashCallRef)
    const oldValues = currentDoc.exists() ? currentDoc.data() : null
    
    await deleteDoc(cashCallRef)

    // Log activity (but don't fail if activity_logs collection doesn't exist)
    try {
      await logActivity({
        user_id: userId,
        action: 'cash_call_deleted',
        entity_type: 'cash_call',
        entity_id: id,
        old_values: oldValues
      })
    } catch (activityError) {
      console.warn('Activity logging failed (collection may not exist):', activityError)
      // Don't throw - this is not critical for cash call deletion
    }
  } catch (error) {
    console.error('Error deleting cash call:', error)
    throw error
  }
}

// =====================================================
// COMMENT OPERATIONS
// =====================================================

export async function getComments(cashCallId: string): Promise<Comment[]> {
  try {
    const commentsRef = collection(db, 'comments')
    const q = query(
      commentsRef,
      where('cash_call_id', '==', cashCallId),
      orderBy('created_at', 'asc')
    )
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate(),
      updated_at: doc.data().updated_at?.toDate()
    })) as Comment[]
  } catch (error) {
    console.error('Error fetching comments:', error)
    throw error
  }
}

export async function createComment(commentData: Omit<Comment, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  try {
    const commentsRef = collection(db, 'comments')
    const docRef = await addDoc(commentsRef, {
      ...commentData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      replies_count: 0,
      likes: []
    })
    
    // Update cash call's updated_at timestamp
    await updateDoc(doc(db, 'cash_calls', commentData.cash_call_id), {
      updated_at: serverTimestamp()
    })

    return docRef.id
  } catch (error) {
    console.error('Error creating comment:', error)
    throw error
  }
}

export async function updateComment(id: string, updates: Partial<Comment>, userId: string): Promise<void> {
  try {
    const commentRef = doc(db, 'comments', id)
    await updateDoc(commentRef, {
      ...updates,
      updated_at: serverTimestamp()
    })

    // Log activity
    await logActivity({
      user_id: userId,
      action: 'comment_updated',
      entity_type: 'comment',
      entity_id: id,
      new_values: updates
    })
  } catch (error) {
    console.error('Error updating comment:', error)
    throw error
  }
}

export async function deleteComment(id: string, userId: string): Promise<void> {
  try {
    const commentRef = doc(db, 'comments', id)
    await deleteDoc(commentRef)

    // Log activity
    await logActivity({
      user_id: userId,
      action: 'comment_deleted',
      entity_type: 'comment',
      entity_id: id
    })
  } catch (error) {
    console.error('Error deleting comment:', error)
    throw error
  }
}

// =====================================================
// ACTIVITY LOG OPERATIONS
// =====================================================

export async function logActivity(logData: Omit<ActivityLog, 'id' | 'created_at'>): Promise<string> {
  try {
    const activityLogsRef = collection(db, 'activity_logs')
    const docRef = await addDoc(activityLogsRef, {
      ...logData,
      created_at: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error('Error logging activity:', error)
    throw error
  }
}

export async function getActivityLogs(filters?: {
  entity_type?: string
  entity_id?: string
  user_id?: string
  action?: string
  date_from?: Date
  date_to?: Date
  limit?: number
}): Promise<ActivityLog[]> {
  try {
    const activityLogsRef = collection(db, 'activity_logs')
    let q = query(activityLogsRef, orderBy('created_at', 'desc'))

    // Apply filters
    if (filters?.entity_type) {
      q = query(q, where('entity_type', '==', filters.entity_type))
    }
    
    if (filters?.entity_id) {
      q = query(q, where('entity_id', '==', filters.entity_id))
    }
    
    if (filters?.user_id) {
      q = query(q, where('user_id', '==', filters.user_id))
    }
    
    if (filters?.action) {
      q = query(q, where('action', '==', filters.action))
    }
    
    if (filters?.date_from) {
      q = query(q, where('created_at', '>=', filters.date_from))
    }
    
    if (filters?.date_to) {
      q = query(q, where('created_at', '<=', filters.date_to))
    }
    
    if (filters?.limit) {
      q = query(q, limit(filters.limit))
    }

    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate()
    })) as ActivityLog[]
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    throw error
  }
}

// =====================================================
// FILE STORAGE OPERATIONS
// =====================================================

export async function uploadFile(file: File, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    return downloadURL
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
}

export async function deleteFile(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url)
    await deleteObject(storageRef)
  } catch (error) {
    console.error('Error deleting file:', error)
    throw error
  }
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  try {
    const path = `avatars/${userId}/${Date.now()}_${file.name}`
    return await uploadFile(file, path)
  } catch (error) {
    console.error('Error uploading avatar:', error)
    throw error
  }
}



// =====================================================
// REAL-TIME LISTENERS
// =====================================================

export function subscribeToCashCalls(callback: (cashCalls: CashCall[]) => void, filters?: any) {
  const cashCallsRef = collection(db, 'cash_calls')
  let q = query(cashCallsRef, orderBy('created_at', 'desc'))

  // Apply filters if provided
  if (filters) {
    // Add filter logic here
  }

  return onSnapshot(q, (snapshot) => {
    const cashCalls = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate(),
      updated_at: doc.data().updated_at?.toDate(),
      due_date: doc.data().due_date?.toDate(),
      approved_at: doc.data().approved_at?.toDate(),
      paid_at: doc.data().paid_at?.toDate()
    })) as CashCall[]
    
    callback(cashCalls)
  })
}

export function subscribeToComments(cashCallId: string, callback: (comments: Comment[]) => void) {
  const commentsRef = collection(db, 'comments')
  const q = query(
    commentsRef,
    where('cash_call_id', '==', cashCallId),
    orderBy('created_at', 'asc')
  )

  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate(),
      updated_at: doc.data().updated_at?.toDate()
    })) as Comment[]
    
    callback(comments)
  })
}

export function subscribeToActivityLogs(callback: (logs: ActivityLog[]) => void, filters?: any) {
  const activityLogsRef = collection(db, 'activity_logs')
  let q = query(activityLogsRef, orderBy('created_at', 'desc'), limit(50))

  // Apply filters if provided
  if (filters) {
    // Add filter logic here
  }

  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate()
    })) as ActivityLog[]
    
    callback(logs)
  })
}

// =====================================================
// DASHBOARD & ANALYTICS
// =====================================================

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  try {
    // Get total cash calls
    const cashCallsRef = collection(db, 'cash_calls')
    const cashCallsSnapshot = await getDocs(cashCallsRef)
    const totalCashCalls = cashCallsSnapshot.size

    // Get pending approvals
    const pendingQuery = query(cashCallsRef, where('status', '==', 'under_review'))
    const pendingSnapshot = await getDocs(pendingQuery)
    const pendingApprovals = pendingSnapshot.size

    // Calculate total amount
    let totalAmount = 0
    cashCallsSnapshot.docs.forEach(doc => {
      const data = doc.data()
      if (data.status === 'approved' || data.status === 'paid') {
        totalAmount += data.amount_requested || 0
      }
    })

    // Get recent activities
    const activityLogsRef = collection(db, 'activity_logs')
    const recentActivitiesQuery = query(activityLogsRef, orderBy('created_at', 'desc'), limit(10))
    const recentActivitiesSnapshot = await getDocs(recentActivitiesQuery)
    const recentActivities = recentActivitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate()
    })) as ActivityLog[]

    // Get upcoming deadlines
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const upcomingQuery = query(
      cashCallsRef,
      where('due_date', '>=', now),
      where('due_date', '<=', thirtyDaysFromNow),
      orderBy('due_date', 'asc')
    )
    const upcomingSnapshot = await getDocs(upcomingQuery)
    const upcomingDeadlines = upcomingSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate(),
      updated_at: doc.data().updated_at?.toDate(),
      due_date: doc.data().due_date?.toDate(),
      approved_at: doc.data().approved_at?.toDate(),
      paid_at: doc.data().paid_at?.toDate()
    })) as CashCall[]

    // Get checklist progress
    const checklistsRef = collection(db, 'affiliate_checklists')
    const checklistsSnapshot = await getDocs(checklistsRef)
    let totalChecklistItems = 0
    let completedChecklistItems = 0

    checklistsSnapshot.docs.forEach(doc => {
      const data = doc.data()
      totalChecklistItems += data.total_items || 0
      completedChecklistItems += data.completed_items || 0
    })

    const checklistProgress = {
      total: totalChecklistItems,
      completed: completedChecklistItems,
      percentage: totalChecklistItems > 0 ? (completedChecklistItems / totalChecklistItems) * 100 : 0
    }

    return {
      total_cash_calls: totalCashCalls,
      pending_approvals: pendingApprovals,
      total_amount: totalAmount,
      recent_activities: recentActivities,
      upcoming_deadlines: upcomingDeadlines,
      checklist_progress: checklistProgress
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw error
  }
}

// =====================================================
// BATCH OPERATIONS
// =====================================================

export async function batchUpdateCashCalls(updates: Array<{ id: string; updates: Partial<CashCall> }>): Promise<void> {
  try {
    const batch = writeBatch(db)
    
    updates.forEach(({ id, updates: updateData }) => {
      const docRef = doc(db, 'cash_calls', id)
      batch.update(docRef, {
        ...updateData,
        updated_at: serverTimestamp()
      })
    })
    
    await batch.commit()
  } catch (error) {
    console.error('Error in batch update:', error)
    throw error
  }
}

export async function batchDeleteCashCalls(ids: string[]): Promise<void> {
  try {
    const batch = writeBatch(db)
    
    ids.forEach(id => {
      const docRef = doc(db, 'cash_calls', id)
      batch.delete(docRef)
    })
    
    await batch.commit()
  } catch (error) {
    console.error('Error in batch delete:', error)
    throw error
  }
}

// =====================================================
// TRANSACTION OPERATIONS
// =====================================================

export async function approveCashCallWithTransaction(
  cashCallId: string,
  approvedAmount: number,
  userId: string
): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      const cashCallRef = doc(db, 'cash_calls', cashCallId)
      const cashCallDoc = await transaction.get(cashCallRef)
      
      if (!cashCallDoc.exists()) {
        throw new Error('Cash call not found')
      }
      
      const currentData = cashCallDoc.data()
      const currentApprovedAmount = currentData.total_approved_amount || 0
      const newApprovedAmount = currentApprovedAmount + approvedAmount
      const remainingAmount = currentData.amount_requested - newApprovedAmount
      
      // Update cash call
      transaction.update(cashCallRef, {
        total_approved_amount: newApprovedAmount,
        remaining_amount: remainingAmount,
        status: remainingAmount <= 0 ? 'approved' : 'under_review',
        approved_at: serverTimestamp(),
        approved_by: userId,
        updated_at: serverTimestamp()
      })
      
      // Create approval record
      const approvalRef = doc(collection(db, 'cash_call_approvals'))
      transaction.set(approvalRef, {
        cash_call_id: cashCallId,
        approved_by: userId,
        approved_amount: approvedAmount,
        approval_date: serverTimestamp(),
        notes: `Approved ${approvedAmount} of ${currentData.amount_requested}`
      })
    })
    
    // Log activity
    await logActivity({
      user_id: userId,
      action: 'cash_call_approved',
      entity_type: 'cash_call',
      entity_id: cashCallId,
      new_values: { approved_amount: approvedAmount }
    })
  } catch (error) {
    console.error('Error in approval transaction:', error)
    throw error
  }
}

// =====================================================
// SEARCH OPERATIONS
// =====================================================

export async function searchCashCalls(searchTerm: string): Promise<CashCall[]> {
  try {
    const cashCallsRef = collection(db, 'cash_calls')
    
    // Search by call number
    const callNumberQuery = query(
      cashCallsRef,
      where('call_number', '>=', searchTerm),
      where('call_number', '<=', searchTerm + '\uf8ff'),
      limit(10)
    )
    
    // Search by title
    const titleQuery = query(
      cashCallsRef,
      where('title', '>=', searchTerm),
      where('title', '<=', searchTerm + '\uf8ff'),
      limit(10)
    )
    
    const [callNumberSnapshot, titleSnapshot] = await Promise.all([
      getDocs(callNumberQuery),
      getDocs(titleQuery)
    ])
    
    // Combine and deduplicate results
    const allDocs = [...callNumberSnapshot.docs, ...titleSnapshot.docs]
    const uniqueDocs = allDocs.filter((doc, index, self) => 
      index === self.findIndex(d => d.id === doc.id)
    )
    
    return uniqueDocs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate(),
      updated_at: doc.data().updated_at?.toDate(),
      due_date: doc.data().due_date?.toDate(),
      approved_at: doc.data().approved_at?.toDate(),
      paid_at: doc.data().paid_at?.toDate()
    })) as CashCall[]
  } catch (error) {
    console.error('Error searching cash calls:', error)
    throw error
  }
}

// =====================================================
// EXPORT OPERATIONS
// =====================================================

export async function exportCashCallsToCSV(filters?: any): Promise<string> {
  try {
    const cashCalls = await getCashCalls(filters)
    
    // Convert to CSV format
    const headers = [
      'Call Number',
      'Title',
      'Affiliate',
      'Amount Requested',
      'Status',
      'Priority',
      'Created Date',
      'Due Date'
    ]
    
    const csvRows = [headers.join(',')]
    
    cashCalls.forEach(cashCall => {
      const row = [
        cashCall.call_number,
        cashCall.title || '',
        cashCall.affiliate_id,
        cashCall.amount_requested,
        cashCall.status,
        cashCall.priority,
        cashCall.created_at?.toISOString() || '',
        cashCall.due_date?.toISOString() || ''
      ]
      csvRows.push(row.join(','))
    })
    
    return csvRows.join('\n')
  } catch (error) {
    console.error('Error exporting cash calls:', error)
    throw error
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export function generateCallNumber(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `CC-${timestamp}-${random}`
}

export async function seedSampleData(): Promise<void> {
  console.log('Sample data seeding is disabled. Use real data only.')
  return
}

export async function validateUserPermissions(userId: string, resource: string, action: string): Promise<boolean> {
  try {
    const user = await getUserProfile(userId)
    if (!user) return false

    // Admin can do everything
    if (user.role === 'admin') return true

    // CFO can approve/reject cash calls
    if (user.role === 'CFO' && resource === 'cash_calls' && ['approve', 'reject'].includes(action)) {
      return true
    }

    // Affiliate can create and manage their own cash calls
    if (user.role === 'affiliate' && resource === 'cash_calls' && ['create', 'read', 'update'].includes(action)) {
      return true
    }

    // Viewer can only read
    if (user.role === 'viewer' && resource === 'cash_calls' && action === 'read') {
      return true
    }

    return false
  } catch (error) {
    console.error('Error validating user permissions:', error)
    return false
  }
}

export async function sendNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<string> {
  try {
    const notificationsRef = collection(db, 'notifications')
    const docRef = await addDoc(notificationsRef, {
      ...notification,
      created_at: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error('Error sending notification:', error)
    throw error
  }
}

 

// =====================================================
// CHECKLIST OPERATIONS
// =====================================================

export interface ChecklistItem {
  id: string
  itemNo: string
  documentList: string
  status: string
  created_at: Date
  updated_at: Date
}

export interface ChecklistGroup {
  id: string
  name: string
  items: ChecklistItem[]
  created_at: Date
  updated_at: Date
}

export interface AffiliateChecklist {
  id: string
  affiliate_id: string
  affiliate_name: string
  cash_call_id?: string // Link to cash call record
  template_type?: 'CAPEX' | 'OPEX'
  groups: ChecklistGroup[]
  created_at: Date
  updated_at: Date
}

export interface StatusOption {
  id: string
  label: string
  color: string
  description?: string
  created_at: Date
}

// Available checklist items with CAPEX/OPEX applicability
const availableChecklistItems = {
  aramcoDigital: [
    { 
      itemNo: "1", 
      documentList: "Developing Cash Call Package", 
      status: "Not Started",
      applicableTo: ["CAPEX", "OPEX"] // Applies to both
    },
    { 
      itemNo: "2", 
      documentList: "Cash Call Letter from AD CFO", 
      status: "Not Started",
      applicableTo: ["CAPEX", "OPEX"] // Applies to both
    },
    { 
      itemNo: "3", 
      documentList: "Active Bank Certificate", 
      status: "Not Started",
      applicableTo: ["CAPEX", "OPEX"] // Applies to both
    },
    { 
      itemNo: "4", 
      documentList: "Capital Investment Approval", 
      status: "Not Started",
      applicableTo: ["CAPEX"] // CAPEX only
    },
    { 
      itemNo: "5", 
      documentList: "Asset Acquisition Plan", 
      status: "Not Started",
      applicableTo: ["CAPEX"] // CAPEX only
    },
    { 
      itemNo: "6", 
      documentList: "Operational Budget Approval", 
      status: "Not Started",
      applicableTo: ["OPEX"] // OPEX only
    },
  ],
  businessProponent: [
    { 
      itemNo: "1", 
      documentList: "Budget Approval and Funding Authority Check", 
      status: "Not Started",
      applicableTo: ["CAPEX", "OPEX"] // Applies to both
    },
    { 
      itemNo: "2", 
      documentList: "Formation Document (CR, Bylaw etc.)", 
      status: "Not Started",
      applicableTo: ["CAPEX", "OPEX"] // Applies to both
    },
    { 
      itemNo: "3", 
      documentList: "Setting up MPS and Obtaining pre-MPS Clearance", 
      status: "Not Started",
      applicableTo: ["CAPEX", "OPEX"] // Applies to both
    },
    { 
      itemNo: "4", 
      documentList: "Creating Cash Call MPS Workflow", 
      status: "Not Started",
      applicableTo: ["CAPEX", "OPEX"] // Applies to both
    },
    { 
      itemNo: "5", 
      documentList: "Notifying SAO Treasury", 
      status: "Not Started",
      applicableTo: ["CAPEX", "OPEX"] // Applies to both
    },
    { 
      itemNo: "6", 
      documentList: "Capital Expenditure Authorization", 
      status: "Not Started",
      applicableTo: ["CAPEX"] // CAPEX only
    },
    { 
      itemNo: "7", 
      documentList: "Operational Expense Authorization", 
      status: "Not Started",
      applicableTo: ["OPEX"] // OPEX only
    },
  ],
  secondTieredAffiliate: [
    { 
      itemNo: "1", 
      documentList: "Cash Call Letter from CFO/CEO to Capital Owner", 
      status: "Not Started",
      applicableTo: ["CAPEX", "OPEX"] // Applies to both
    },
    { 
      itemNo: "2", 
      documentList: "Approved Business Plan", 
      status: "Not Started",
      applicableTo: ["CAPEX", "OPEX"] // Applies to both
    },
    { 
      itemNo: "3", 
      documentList: "Proof of Budget Approval (e.g. Board Minutes)", 
      status: "Not Started",
      applicableTo: ["CAPEX", "OPEX"] // Applies to both
    },
    { 
      itemNo: "4", 
      documentList: "Active Bank Certificate", 
      status: "Not Started",
      applicableTo: ["CAPEX", "OPEX"] // Applies to both
    },
    { 
      itemNo: "5", 
      documentList: "Shareholders Resolution Signed by SH-Reps", 
      status: "Not Started",
      applicableTo: ["CAPEX", "OPEX"] // Applies to both
    },
    { 
      itemNo: "6", 
      documentList: "Cash Flow Forecast", 
      status: "Not Started",
      applicableTo: ["CAPEX", "OPEX"] // Applies to both
    },
    { 
      itemNo: "7", 
      documentList: "Utilization of Previous Cash Call", 
      status: "Not Started",
      applicableTo: ["CAPEX", "OPEX"] // Applies to both
    },
    { 
      itemNo: "8", 
      documentList: "Asset Valuation Report", 
      status: "Not Started",
      applicableTo: ["CAPEX"] // CAPEX only
    },
    { 
      itemNo: "9", 
      documentList: "Capital Investment Timeline", 
      status: "Not Started",
      applicableTo: ["CAPEX"] // CAPEX only
    },
    { 
      itemNo: "10", 
      documentList: "Operational Expense Breakdown", 
      status: "Not Started",
      applicableTo: ["OPEX"] // OPEX only
    },
    { 
      itemNo: "11", 
      documentList: "Additional Documents (Case By Case) Requested By GF&CD", 
      status: "Not Started",
      applicableTo: ["CAPEX", "OPEX"] // Applies to both
    },
  ],
}

// Legacy templates for backward compatibility
const checklistTemplates = {
  CAPEX: {
    aramcoDigital: availableChecklistItems.aramcoDigital.filter(item => item.applicableTo.includes('CAPEX')),
    businessProponent: availableChecklistItems.businessProponent.filter(item => item.applicableTo.includes('CAPEX')),
    secondTieredAffiliate: availableChecklistItems.secondTieredAffiliate.filter(item => item.applicableTo.includes('CAPEX')),
  },
  OPEX: {
    aramcoDigital: availableChecklistItems.aramcoDigital.filter(item => item.applicableTo.includes('OPEX')),
    businessProponent: availableChecklistItems.businessProponent.filter(item => item.applicableTo.includes('OPEX')),
    secondTieredAffiliate: availableChecklistItems.secondTieredAffiliate.filter(item => item.applicableTo.includes('OPEX')),
  },
}

// Export available items for the UI
export function getAvailableChecklistItems() {
  return availableChecklistItems
}

// Standardized checklist items with updated names (for backward compatibility)
const standardChecklistItems = {
  aramcoDigital: [
    { itemNo: "1", documentList: "Developing Cash Call Package", status: "Not Started" },
    { itemNo: "2", documentList: "Cash Call Letter from AD CFO", status: "Not Started" },
    { itemNo: "3", documentList: "Active Bank Certificate", status: "Not Started" },
  ],
  businessProponent: [
    { itemNo: "1", documentList: "Budget Approval and Funding Authority Check", status: "Not Started" },
    { itemNo: "2", documentList: "Formation Document (CR, Bylaw etc.)", status: "Not Started" },
    { itemNo: "3", documentList: "Setting up MPS and Obtaining pre-MPS Clearance", status: "Not Started" },
    { itemNo: "4", documentList: "Creating Cash Call MPS Workflow", status: "Not Started" },
    { itemNo: "5", documentList: "Notifying SAO Treasury", status: "Not Started" },
  ],
  secondTieredAffiliate: [
    { itemNo: "1", documentList: "Cash Call Letter from CFO/CEO to Capital Owner", status: "Not Started" },
    { itemNo: "2", documentList: "Approved Business Plan", status: "Not Started" },
    { itemNo: "3", documentList: "Proof of Budget Approval (e.g. Board Minutes)", status: "Not Started" },
    { itemNo: "4", documentList: "Active Bank Certificate", status: "Not Started" },
    { itemNo: "5", documentList: "Shareholders Resolution Signed by SH-Reps", status: "Not Started" },
    { itemNo: "6", documentList: "Cash Flow Forecast", status: "Not Started" },
    { itemNo: "7", documentList: "Utilization of Previous Cash Call", status: "Not Started" },
    { itemNo: "8", documentList: "Utilization of Current Cash Call", status: "Not Started" },
    { itemNo: "9", documentList: "Additional Documents (Case By Case) Requested By GF&CD", status: "Not Started" },
  ],
}

// Default status options
const defaultStatusOptions: StatusOption[] = [
  { id: "not_started", label: "Not Started", color: "gray", created_at: new Date() },
  { id: "in_progress", label: "In Progress", color: "yellow", created_at: new Date() },
  { id: "under_review", label: "Under Review", color: "blue", created_at: new Date() },
  { id: "needs_revision", label: "Needs Revision", color: "orange", created_at: new Date() },
  { id: "on_hold", label: "On Hold", color: "purple", created_at: new Date() },
  { id: "approved", label: "Approved", color: "green", created_at: new Date() },
  { id: "completed", label: "Completed", color: "green", created_at: new Date() },
  { id: "rejected", label: "Rejected", color: "red", created_at: new Date() },
  { id: "blocked", label: "Blocked", color: "red", created_at: new Date() },
  { id: "pending_info", label: "Pending Information", color: "orange", created_at: new Date() },
  { id: "waiting_approval", label: "Waiting for Approval", color: "blue", created_at: new Date() },
  { id: "escalated", label: "Escalated", color: "red", created_at: new Date() },
]

// Checklist Functions
export async function getAllChecklists(): Promise<AffiliateChecklist[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'affiliate_checklists'))
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate() || new Date(),
      updated_at: doc.data().updated_at?.toDate() || new Date(),
      groups: doc.data().groups?.map((group: any) => ({
        ...group,
        created_at: group.created_at?.toDate() || new Date(),
        updated_at: group.updated_at?.toDate() || new Date(),
        items: group.items?.map((item: any) => ({
          ...item,
          created_at: item.created_at?.toDate() || new Date(),
          updated_at: item.updated_at?.toDate() || new Date(),
        })) || []
      })) || []
    })) as AffiliateChecklist[]
  } catch (error) {
    console.error('Error getting all checklists:', error)
    return []
  }
}

export async function getChecklistByAffiliate(affiliateId: string): Promise<AffiliateChecklist | null> {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, 'affiliate_checklists'), where('affiliate_id', '==', affiliateId))
    )
    
    if (querySnapshot.empty) return null
    
    const doc = querySnapshot.docs[0]
    const data = doc.data()
    
    return {
      id: doc.id,
      ...data,
      created_at: data.created_at?.toDate() || new Date(),
      updated_at: data.updated_at?.toDate() || new Date(),
      groups: data.groups?.map((group: any) => ({
        ...group,
        created_at: group.created_at?.toDate() || new Date(),
        updated_at: group.updated_at?.toDate() || new Date(),
        items: group.items?.map((item: any) => ({
          ...item,
          created_at: item.created_at?.toDate() || new Date(),
          updated_at: item.updated_at?.toDate() || new Date(),
        })) || []
      })) || []
    } as AffiliateChecklist
  } catch (error) {
    console.error('Error getting checklist by affiliate:', error)
    return null
  }
}

export async function createAffiliateChecklist(
  affiliateId: string, 
  affiliateName: string, 
  selectedItems: {
    aramcoDigital: string[],
    businessProponent: string[],
    secondTieredAffiliate: string[]
  },
  templateType: 'CAPEX' | 'OPEX',
  cashCallId?: string // Optional cash call ID to link the checklist
): Promise<AffiliateChecklist> {
  try {
    // Check if we're in a browser environment and have access to Firebase
    if (typeof window === 'undefined') {
      throw new Error('Firebase functions can only be called from the browser')
    }

    const timestamp = new Date()
    const uniqueId = Date.now().toString()

    // Filter items based on selection
    const getSelectedItemsForGroup = (groupKey: keyof typeof availableChecklistItems, selectedItemNos: string[]) => {
      return availableChecklistItems[groupKey]
        .filter(item => selectedItemNos.includes(item.itemNo))
        .map((item, index) => ({
          id: `item-${groupKey}-${uniqueId}-${index + 1}`,
          itemNo: item.itemNo,
          documentList: item.documentList,
          status: item.status,
          created_at: timestamp,
          updated_at: timestamp,
        }))
    }

    const groupsToCreate: ChecklistGroup[] = [
      {
        id: `group-aramco-${uniqueId}`,
        name: "Aramco Digital Company",
        items: getSelectedItemsForGroup('aramcoDigital', selectedItems.aramcoDigital),
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: `group-business-${uniqueId}`,
        name: "Business Proponent - T&I Affiliate Affairs",
        items: getSelectedItemsForGroup('businessProponent', selectedItems.businessProponent),
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: `group-affiliate-${uniqueId}`,
        name: "2nd Tiered Affiliate",
        items: getSelectedItemsForGroup('secondTieredAffiliate', selectedItems.secondTieredAffiliate),
        created_at: timestamp,
        updated_at: timestamp,
      },
    ]

    const newChecklist: Omit<AffiliateChecklist, 'id'> = {
      affiliate_id: affiliateId,
      affiliate_name: affiliateName,
      template_type: templateType,
      groups: groupsToCreate,
      created_at: timestamp,
      updated_at: timestamp,
      ...(cashCallId && { cash_call_id: cashCallId }), // Only include if cashCallId is provided
    }

    const docRef = await addDoc(collection(db, 'affiliate_checklists'), newChecklist)
    
    // Log activity (only if we're in production or have proper auth)
    try {
      await logActivity({
        action: 'checklist_created',
        entity_type: 'affiliate_checklist',
        entity_id: docRef.id,
        new_values: { affiliate_id: affiliateId, affiliate_name: affiliateName }
      })
    } catch (error) {
      console.warn('Could not log activity (this is normal in development):', error)
    }
    
    return {
      id: docRef.id,
      ...newChecklist
    }
  } catch (error) {
    console.error('Error creating affiliate checklist:', error)
    throw error
  }
}

export async function updateChecklistItem(
  checklistId: string,
  groupId: string,
  itemId: string,
  updates: Partial<ChecklistItem>
): Promise<ChecklistItem> {
  try {
    const checklistRef = doc(db, 'affiliate_checklists', checklistId)
    const checklistDoc = await getDoc(checklistRef)
    
    if (!checklistDoc.exists()) {
      throw new Error('Checklist not found')
    }

    const checklist = checklistDoc.data()
    const updatedGroups = checklist.groups.map((group: any) => {
      if (group.id === groupId) {
        return {
          ...group,
          items: group.items.map((item: any) => {
            if (item.id === itemId) {
              return {
                ...item,
                ...updates,
                updated_at: new Date()
              }
            }
            return item
          }),
          updated_at: new Date()
        }
      }
      return group
    })

    await updateDoc(checklistRef, {
      groups: updatedGroups,
      updated_at: new Date()
    })

    const updatedItem = updatedGroups
      .find((group: any) => group.id === groupId)
      ?.items.find((item: any) => item.id === itemId)

    return updatedItem
  } catch (error) {
    console.error('Error updating checklist item:', error)
    throw error
  }
}

export async function addChecklistItem(
  checklistId: string,
  groupId: string,
  item: Omit<ChecklistItem, 'id'>
): Promise<ChecklistItem> {
  try {
    const checklistRef = doc(db, 'affiliate_checklists', checklistId)
    const checklistDoc = await getDoc(checklistRef)
    
    if (!checklistDoc.exists()) {
      throw new Error('Checklist not found')
    }

    const checklist = checklistDoc.data()
    const newItem: ChecklistItem = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date(),
      updated_at: new Date(),
    }

    const updatedGroups = checklist.groups.map((group: any) => {
      if (group.id === groupId) {
        return {
          ...group,
          items: [...group.items, newItem],
          updated_at: new Date()
        }
      }
      return group
    })

    await updateDoc(checklistRef, {
      groups: updatedGroups,
      updated_at: new Date()
    })

    return newItem
  } catch (error) {
    console.error('Error adding checklist item:', error)
    throw error
  }
}

export async function deleteChecklistItem(
  checklistId: string,
  groupId: string,
  itemId: string
): Promise<void> {
  try {
    const checklistRef = doc(db, 'affiliate_checklists', checklistId)
    const checklistDoc = await getDoc(checklistRef)
    
    if (!checklistDoc.exists()) {
      throw new Error('Checklist not found')
    }

    const checklist = checklistDoc.data()
    const updatedGroups = checklist.groups.map((group: any) => {
      if (group.id === groupId) {
        return {
          ...group,
          items: group.items.filter((item: any) => item.id !== itemId),
          updated_at: new Date()
        }
      }
      return group
    })

    await updateDoc(checklistRef, {
      groups: updatedGroups,
      updated_at: new Date()
    })
  } catch (error) {
    console.error('Error deleting checklist item:', error)
    throw error
  }
}

export async function deleteAffiliateChecklist(checklistId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'affiliate_checklists', checklistId))
  } catch (error) {
    console.error('Error deleting affiliate checklist:', error)
    throw error
  }
}

export async function updateAffiliateChecklistName(
  checklistId: string,
  newName: string
): Promise<AffiliateChecklist> {
  try {
    const checklistRef = doc(db, 'affiliate_checklists', checklistId)
    await updateDoc(checklistRef, {
      affiliate_name: newName,
      updated_at: new Date()
    })

    const updatedDoc = await getDoc(checklistRef)
    return {
      id: updatedDoc.id,
      ...updatedDoc.data(),
      created_at: updatedDoc.data()?.created_at?.toDate() || new Date(),
      updated_at: updatedDoc.data()?.updated_at?.toDate() || new Date(),
    } as AffiliateChecklist
  } catch (error) {
    console.error('Error updating affiliate checklist name:', error)
    throw error
  }
}

export async function updateGroupName(
  checklistId: string,
  groupId: string,
  newName: string
): Promise<ChecklistGroup> {
  try {
    const checklistRef = doc(db, 'affiliate_checklists', checklistId)
    const checklistDoc = await getDoc(checklistRef)
    
    if (!checklistDoc.exists()) {
      throw new Error('Checklist not found')
    }

    const checklist = checklistDoc.data()
    const updatedGroups = checklist.groups.map((group: any) => {
      if (group.id === groupId) {
        return {
          ...group,
          name: newName,
          updated_at: new Date()
        }
      }
      return group
    })

    await updateDoc(checklistRef, {
      groups: updatedGroups,
      updated_at: new Date()
    })

    const updatedGroup = updatedGroups.find((group: any) => group.id === groupId)
    return updatedGroup
  } catch (error) {
    console.error('Error updating group name:', error)
    throw error
  }
}

export async function getStatusOptions(): Promise<StatusOption[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'status_options'))
    
    if (querySnapshot.empty) {
      // Create default status options if none exist
      const batch = writeBatch(db)
      defaultStatusOptions.forEach(option => {
        const docRef = doc(collection(db, 'status_options'))
        batch.set(docRef, option)
      })
      await batch.commit()
      return defaultStatusOptions
    }

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate() || new Date(),
    })) as StatusOption[]
  } catch (error) {
    console.error('Error getting status options:', error)
    return defaultStatusOptions
  }
}

export async function createStatusOption(
  label: string,
  color: string,
  description?: string
): Promise<StatusOption> {
  try {
    const newStatusOption: Omit<StatusOption, 'id'> = {
      label,
      color,
      description,
      created_at: new Date(),
    }

    const docRef = await addDoc(collection(db, 'status_options'), newStatusOption)
    
    return {
      id: docRef.id,
      ...newStatusOption
    }
  } catch (error) {
    console.error('Error creating status option:', error)
    throw error
  }
}

export async function updateStatusOption(
  id: string,
  updates: Partial<Omit<StatusOption, 'id' | 'created_at'>>
): Promise<StatusOption> {
  try {
    const statusOptionRef = doc(db, 'status_options', id)
    await updateDoc(statusOptionRef, {
      ...updates,
      updated_at: new Date()
    })

    const updatedDoc = await getDoc(statusOptionRef)
    return {
      id: updatedDoc.id,
      ...updatedDoc.data(),
      created_at: updatedDoc.data()?.created_at?.toDate() || new Date(),
    } as StatusOption
  } catch (error) {
    console.error('Error updating status option:', error)
    throw error
  }
}

export async function deleteStatusOption(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'status_options', id))
  } catch (error) {
    console.error('Error deleting status option:', error)
    throw error
  }
}

export async function standardizeExistingChecklists(): Promise<void> {
  try {
    const checklists = await getAllChecklists()
    const timestamp = new Date()

    for (const checklist of checklists) {
      const updatedGroups = checklist.groups.map((group, groupIndex) => {
        let standardItems: ChecklistItem[] = []

        switch (groupIndex) {
          case 0:
            standardItems = standardChecklistItems.aramcoDigital.map((item, index) => ({
              id: `item-aramco-${Date.now()}-${index + 1}`,
              ...item,
              created_at: timestamp,
              updated_at: timestamp,
            }))
            break
          case 1:
            standardItems = standardChecklistItems.businessProponent.map((item, index) => ({
              id: `item-business-${Date.now()}-${index + 1}`,
              ...item,
              created_at: timestamp,
              updated_at: timestamp,
            }))
            break
          case 2:
            standardItems = standardChecklistItems.secondTieredAffiliate.map((item, index) => ({
              id: `item-affiliate-${Date.now()}-${index + 1}`,
              ...item,
              created_at: timestamp,
              updated_at: timestamp,
            }))
            break
          default:
            standardItems = group.items
        }

        return {
          ...group,
          items: standardItems,
          updated_at: timestamp,
        }
      })

      await updateDoc(doc(db, 'affiliate_checklists', checklist.id), {
        groups: updatedGroups,
        updated_at: timestamp
      })
    }
  } catch (error) {
    console.error('Error standardizing existing checklists:', error)
    throw error
  }
} 

// Role-based access control functions
export async function getCashCallsForUser(userId: string, userRole: string, affiliateCompanyId?: string) {
  try {
    console.log('Debug - getCashCallsForUser called:', {
      userId,
      userRole,
      affiliateCompanyId
    })

    // Normalize role to lowercase for comparison
    const normalizedRole = userRole.toLowerCase()
    
    if (normalizedRole === 'admin' || normalizedRole === 'approver') {
      // Admins and approvers can see all cash calls
      const allCashCalls = await getCashCalls()
      console.log('Debug - Admin/Approver: returning all cash calls:', allCashCalls.length)
      return allCashCalls
    } else if (normalizedRole === 'affiliate') {
      // Affiliate users can only see their company's cash calls
      if (!affiliateCompanyId) {
        console.warn('Affiliate user has no affiliate_company_id assigned')
        return []
      }
      
      const affiliates = await getAffiliates()
      const userAffiliate = affiliates.find(a => a.id === affiliateCompanyId)
      
      console.log('Debug - Affiliate filtering:', {
        userAffiliateId: affiliateCompanyId,
        userAffiliateFound: !!userAffiliate,
        userAffiliateName: userAffiliate?.name,
        availableAffiliates: affiliates.map(a => ({ id: a.id, name: a.name }))
      })
      
      if (!userAffiliate) {
        console.warn(`Affiliate company with ID ${affiliateCompanyId} not found. Available affiliates:`, affiliates.map(a => ({ id: a.id, name: a.name })))
        // Return empty array instead of throwing error to prevent app crash
        return []
      }

      const cashCalls = await getCashCalls()
      console.log('Debug - All cash calls:', cashCalls.map(cc => ({ id: cc.id, affiliate_id: cc.affiliate_id, call_number: cc.call_number, created_by: cc.created_by })))
      
      // Filter cash calls to only show the affiliate's own company's cash calls
      const filteredCashCalls = cashCalls.filter(cashCall => cashCall.affiliate_id === affiliateCompanyId)
      console.log('Debug - Filtered cash calls for affiliate:', {
        totalCashCalls: cashCalls.length,
        filteredCount: filteredCashCalls.length,
        affiliateId: affiliateCompanyId,
        userAffiliateId: affiliateCompanyId,
        matchingCashCalls: filteredCashCalls.map(cc => ({ id: cc.id, call_number: cc.call_number, created_by: cc.created_by })),
        nonMatchingCashCalls: cashCalls.filter(cc => cc.affiliate_id !== affiliateCompanyId).map(cc => ({ id: cc.id, call_number: cc.call_number, affiliate_id: cc.affiliate_id, created_by: cc.created_by }))
      })
      return filteredCashCalls
    } else {
      // Viewers can see all cash calls (read-only)
      const allCashCalls = await getCashCalls()
      console.log('Debug - Viewer: returning all cash calls:', allCashCalls.length)
      return allCashCalls
    }
  } catch (error) {
    console.error('Error getting cash calls for user:', error)
    throw error
  }
}

export async function canUserAccessCashCall(userId: string, userRole: string, affiliateCompanyId: string | undefined, cashCallId: string) {
  try {
    // Normalize role to lowercase for comparison
    const normalizedRole = userRole.toLowerCase()
    
    if (normalizedRole === 'admin' || normalizedRole === 'approver') {
      return true // Admins and approvers can access all cash calls
    }

    if (normalizedRole === 'affiliate' && affiliateCompanyId) {
      // Get the cash call to check if it belongs to the user's affiliate company
      const cashCalls = await getCashCalls()
      const cashCall = cashCalls.find(cc => cc.id === cashCallId)
      return cashCall?.affiliate_id === affiliateCompanyId
    }

    return false
  } catch (error) {
    console.error('Error checking cash call access:', error)
    return false
  }
}

export async function canUserModifyCashCall(userId: string, userRole: string, affiliateCompanyId: string | undefined, cashCallId: string) {
  try {
    // Normalize role to lowercase for comparison
    const normalizedRole = userRole.toLowerCase()
    
    if (normalizedRole === 'admin' || normalizedRole === 'approver') {
      return true // Admins and approvers can modify all cash calls
    }

    if (normalizedRole === 'affiliate' && affiliateCompanyId) {
      // Affiliate users can only modify their own company's cash calls
      const cashCalls = await getCashCalls()
      const cashCall = cashCalls.find(cc => cc.id === cashCallId)
      return cashCall?.affiliate_id === affiliateCompanyId && cashCall?.created_by === userId
    }

    return false
  } catch (error) {
    console.error('Error checking cash call modification access:', error)
    return false
  }
}

export async function getChecklistsForUser(userId: string, userRole: string, affiliateCompanyId?: string) {
  try {
    // Normalize role to lowercase for comparison
    const normalizedRole = userRole.toLowerCase()
    
    if (normalizedRole === 'admin' || normalizedRole === 'approver') {
      // Admins and approvers can see all checklists
      return await getAllChecklists()
    } else if (normalizedRole === 'affiliate' && affiliateCompanyId) {
      // Affiliate users can only see their company's checklists
      const checklists = await getAllChecklists()
      return checklists.filter(checklist => checklist.affiliate_id === affiliateCompanyId)
    } else if (normalizedRole === 'finance') {
      // Finance users can only see checklists for cash calls assigned to them
      const checklists = await getAllChecklists()
      const assignedCashCalls = await getCashCallsByAccess(userId)
      const assignedCashCallIds = assignedCashCalls.map(cc => cc.id)
      return checklists.filter(checklist => assignedCashCallIds.includes(checklist.cash_call_id))
    } else if (normalizedRole === 'cfo') {
      // CFO users can only see checklists for cash calls ready for their review
      const checklists = await getAllChecklists()
      const cfoCashCalls = await getCashCallsByAccess(userId)
      const cfoCashCallIds = cfoCashCalls.map(cc => cc.id)
      return checklists.filter(checklist => cfoCashCallIds.includes(checklist.cash_call_id))
    } else {
      // Viewers can see all checklists (read-only)
      return await getAllChecklists()
    }
  } catch (error) {
    console.error('Error getting checklists for user:', error)
    throw error
  }
}

export async function canUserAccessChecklist(userId: string, userRole: string, affiliateCompanyId: string | undefined, checklistId: string) {
  try {
    // Normalize role to lowercase for comparison
    const normalizedRole = userRole.toLowerCase()
    
    if (normalizedRole === 'admin' || normalizedRole === 'approver') {
      return true // Admins and approvers can access all checklists
    }

    if (normalizedRole === 'affiliate' && affiliateCompanyId) {
      // Get the checklist to check if it belongs to the user's affiliate company
      const checklists = await getAllChecklists()
      const checklist = checklists.find(cl => cl.id === checklistId)
      return checklist?.affiliate_id === affiliateCompanyId
    }

    if (normalizedRole === 'finance') {
      // Finance users can only access checklists for cash calls assigned to them
      const checklists = await getAllChecklists()
      const checklist = checklists.find(cl => cl.id === checklistId)
      if (!checklist) return false
      
      const assignedCashCalls = await getCashCallsByAccess(userId)
      const assignedCashCallIds = assignedCashCalls.map(cc => cc.id)
      return assignedCashCallIds.includes(checklist.cash_call_id)
    }

    if (normalizedRole === 'cfo') {
      // CFO users can only access checklists for cash calls ready for their review
      const checklists = await getAllChecklists()
      const checklist = checklists.find(cl => cl.id === checklistId)
      if (!checklist) return false
      
      const cfoCashCalls = await getCashCallsByAccess(userId)
      const cfoCashCallIds = cfoCashCalls.map(cc => cc.id)
      return cfoCashCallIds.includes(checklist.cash_call_id)
    }

    return false
  } catch (error) {
    console.error('Error checking checklist access:', error)
    return false
  }
}

export async function canUserModifyChecklist(userId: string, userRole: string, affiliateCompanyId: string | undefined, checklistId: string) {
  try {
    // Normalize role to lowercase for comparison
    const normalizedRole = userRole.toLowerCase()
    
    if (normalizedRole === 'admin' || normalizedRole === 'approver') {
      return true // Admins and approvers can modify all checklists
    }

    if (normalizedRole === 'affiliate' && affiliateCompanyId) {
      // Affiliate users can only modify their own company's checklists
      const checklists = await getAllChecklists()
      const checklist = checklists.find(cl => cl.id === checklistId)
      return checklist?.affiliate_id === affiliateCompanyId
    }

    if (normalizedRole === 'finance') {
      // Finance users can only modify checklists for cash calls assigned to them
      const checklists = await getAllChecklists()
      const checklist = checklists.find(cl => cl.id === checklistId)
      if (!checklist) return false
      
      const assignedCashCalls = await getCashCallsByAccess(userId)
      const assignedCashCallIds = assignedCashCalls.map(cc => cc.id)
      return assignedCashCallIds.includes(checklist.cash_call_id)
    }

    if (normalizedRole === 'cfo') {
      // CFO users can only modify checklists for cash calls ready for their review
      const checklists = await getAllChecklists()
      const checklist = checklists.find(cl => cl.id === checklistId)
      if (!checklist) return false
      
      const cfoCashCalls = await getCashCallsByAccess(userId)
      const cfoCashCallIds = cfoCashCalls.map(cc => cc.id)
      return cfoCashCallIds.includes(checklist.cash_call_id)
    }

    return false
  } catch (error) {
    console.error('Error checking checklist modification access:', error)
    return false
  }
}

// =====================================================
// DOCUMENT UPLOAD FUNCTIONS
// =====================================================

export interface Document {
  id: string
  cash_call_id: string
  filename: string
  original_name: string
  file_size: number
  file_type: string
  download_url: string
  uploaded_by: string
  uploaded_at: Date
  description?: string
  category?: string
  is_public: boolean
}

export async function uploadDocument(
  file: File,
  cashCallId: string,
  userId: string,
  description?: string,
  category?: string,
  isPublic: boolean = true
): Promise<Document> {
  try {
    console.log('=== UPLOAD DEBUG START ===')
    console.log('Starting uploadDocument function...')
    console.log('File:', file.name, 'Size:', file.size, 'Type:', file.type)
    console.log('Cash Call ID:', cashCallId)
    console.log('User ID:', userId)
    console.log('Storage object:', storage)
    console.log('Storage bucket:', storage.app.options.storageBucket)
    
    // Validate file size (removed size limit for flexibility)
    // Note: Firebase Storage has a default limit of 5GB per file
    if (file.size === 0) {
      throw new Error('File cannot be empty')
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not allowed. Please upload PDF, Word, Excel, or image files.')
    }

    console.log('File validation passed')

    // Create unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const uniqueFilename = `${cashCallId}_${timestamp}_${Math.random().toString(36).substring(2)}.${fileExtension}`
    
    // Upload to Firebase Storage with ultra-fast settings
    const storageRef = ref(storage, `cash_calls/${cashCallId}/documents/${uniqueFilename}`)
    console.log('Uploading to path:', `cash_calls/${cashCallId}/documents/${uniqueFilename}`)
    
    // Adaptive timeouts based on file size
    const fileSizeMB = file.size / (1024 * 1024)
    let timeoutMs = 30000 // Default 30 seconds
    
    // Calculate timeout based on file size and estimated upload speed
    if (fileSizeMB > 100) {
      timeoutMs = 300000 // 5 minutes for very large files
    } else if (fileSizeMB > 50) {
      timeoutMs = 180000 // 3 minutes for large files
    } else if (fileSizeMB > 20) {
      timeoutMs = 120000 // 2 minutes for medium files
    } else if (fileSizeMB > 5) {
      timeoutMs = 60000 // 1 minute for small files
    }
    
    console.log(`Upload timeout set to ${timeoutMs/1000} seconds for ${fileSizeMB.toFixed(1)}MB file`)
    
    // Use simple uploadBytes for faster uploads
    const uploadPromise = uploadBytes(storageRef, file)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Upload timeout after ${timeoutMs/1000} seconds - please try again`)), timeoutMs)
    )
    
    const uploadResult = await Promise.race([uploadPromise, timeoutPromise]) as any
    console.log('File uploaded to Storage successfully')
    
    // Get download URL
    console.log('Getting download URL...')
    const downloadURL = await getDownloadURL(uploadResult.ref)
    console.log('Download URL obtained:', downloadURL)
    
    // Create document record in Firestore
    console.log('Creating Firestore document record...')
    const documentData = {
      cash_call_id: cashCallId,
      filename: uniqueFilename,
      original_name: file.name,
      file_size: file.size,
      file_type: file.type,
      download_url: downloadURL,
      uploaded_by: userId,
      uploaded_at: serverTimestamp(),
      description: description || '',
      category: category || 'general',
      is_public: isPublic
    }
    
    const docRef = await addDoc(collection(db, 'documents'), documentData)
    console.log('Document record created in Firestore:', docRef.id)
    
    // Update cash call with document reference (if cash call exists)
    console.log('Updating cash call with document reference...')
    try {
      const cashCallRef = doc(db, 'cash_calls', cashCallId)
      await updateDoc(cashCallRef, {
        supporting_documents: arrayUnion(docRef.id)
      })
      console.log('Cash call updated successfully')
    } catch (cashCallError: any) {
      if (cashCallError.code === 'not-found') {
        console.log('Cash call not found, skipping update. This is normal for test uploads.')
      } else {
        console.warn('Failed to update cash call:', cashCallError)
      }
    }
    
    const result = {
      id: docRef.id,
      ...documentData,
      uploaded_at: new Date()
    }
    
    console.log('Upload completed successfully:', result)
    console.log('=== UPLOAD DEBUG END ===')
    return result
  } catch (error) {
    console.error('=== UPLOAD ERROR ===')
    console.error('Error uploading document:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    console.error('=== UPLOAD ERROR END ===')
    throw error
  }
}

export async function getDocumentsForCashCall(cashCallId: string, userId?: string, userRole?: string): Promise<Document[]> {
  try {
    console.log('Getting documents for cash call:', cashCallId, 'User ID:', userId, 'Role:', userRole)
    
    // First try with ordering (requires index)
    try {
      const q = query(
        collection(db, 'documents'),
        where('cash_call_id', '==', cashCallId),
        orderBy('uploaded_at', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      const documents: Document[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const document = {
          id: doc.id,
          cash_call_id: data.cash_call_id,
          filename: data.filename,
          original_name: data.original_name,
          file_size: data.file_size,
          file_type: data.file_type,
          download_url: data.download_url,
          uploaded_by: data.uploaded_by,
          uploaded_at: data.uploaded_at?.toDate() || new Date(),
          description: data.description,
          category: data.category,
          is_public: data.is_public
        }
        
        // Apply visibility rules
        const canView = canUserViewDocument(document, userId, userRole)
        if (canView) {
          documents.push(document)
        } else {
          console.log('Document filtered out due to visibility rules:', document.original_name)
        }
      })
      
      console.log('Documents returned after filtering:', documents.length)
      return documents
    } catch (indexError: any) {
      // If index is not ready, fall back to simple query and sort in memory
      if (indexError.message.includes('index')) {
        console.log('Index not ready, using fallback query...')
        const q = query(
          collection(db, 'documents'),
          where('cash_call_id', '==', cashCallId)
        )
        
        const querySnapshot = await getDocs(q)
        const documents: Document[] = []
        
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          const document = {
            id: doc.id,
            cash_call_id: data.cash_call_id,
            filename: data.filename,
            original_name: data.original_name,
            file_size: data.file_size,
            file_type: data.file_type,
            download_url: data.download_url,
            uploaded_by: data.uploaded_by,
            uploaded_at: data.uploaded_at?.toDate() || new Date(),
            description: data.description,
            category: data.category,
            is_public: data.is_public
          }
          
          // Apply visibility rules
          const canView = canUserViewDocument(document, userId, userRole)
          if (canView) {
            documents.push(document)
          }
        })
        
        // Sort in memory by uploaded_at descending
        return documents.sort((a, b) => b.uploaded_at.getTime() - a.uploaded_at.getTime())
      }
      
      throw indexError
    }
  } catch (error) {
    console.error('Error getting documents for cash call:', error)
    throw error
  }
}

// Helper function to determine if a user can view a document
function canUserViewDocument(document: Document, userId?: string, userRole?: string): boolean {
  // Admin and approver can view all documents
  if (userRole === 'admin' || userRole === 'approver') {
    return true
  }
  
  // Public documents can be viewed by anyone
  if (document.is_public) {
    return true
  }
  
  // Users can view their own documents
  if (userId && document.uploaded_by === userId) {
    return true
  }
  
  // Affiliate users can view documents from their affiliate
  if (userRole === 'affiliate') {
    // This would need to be enhanced based on your affiliate logic
    return true
  }
  
  return false
}

export async function deleteDocument(documentId: string, cashCallId: string, userId: string): Promise<void> {
  try {
    // Get document details
    const docRef = doc(db, 'documents', documentId)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      throw new Error('Document not found')
    }
    
    const documentData = docSnap.data()
    
    // Delete from Firebase Storage
    const storageRef = ref(storage, `cash_calls/${cashCallId}/documents/${documentData.filename}`)
    await deleteObject(storageRef)
    
    // Delete from Firestore
    await deleteDoc(docRef)
    
    // Remove from cash call's supporting_documents array
    const cashCallRef = doc(db, 'cash_calls', cashCallId)
    await updateDoc(cashCallRef, {
      supporting_documents: arrayRemove(documentId)
    })
  } catch (error) {
    console.error('Error deleting document:', error)
    throw error
  }
}

export async function updateDocumentMetadata(
  documentId: string,
  updates: {
    description?: string
    category?: string
    is_public?: boolean
  }
): Promise<void> {
  try {
    const docRef = doc(db, 'documents', documentId)
    await updateDoc(docRef, {
      ...updates,
      updated_at: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating document metadata:', error)
    throw error
  }
} 

// =====================================================
// ASSIGNMENT & ACCESS CONTROL FUNCTIONS
// =====================================================





/**
 * Map new role names to old role names for backward compatibility
 */
function mapNewRoleToOld(role: string): string {
  const roleMap: Record<string, string> = {
    'finance': 'finance',
    'cfo': 'cfo', 
    'admin': 'admin',
    'affiliate': 'affiliate',
    'viewer': 'viewer',
    'approver': 'approver'
  }
  
  return roleMap[role] || role
}

/**
 * Get users by role for assignment picker
 * Used by ADMIN to assign FINANCE users to cash calls
 */
export async function getUsersByRole(role: 'finance' | 'cfo' | 'admin' | 'affiliate'): Promise<User[]> {
  try {
    // Validate role parameter
    if (!role) {
      throw new Error('Role parameter is required')
    }
    
    console.log('Getting users by role:', role)
    
    // Map new roles to old roles for querying existing users
    let queryRole = mapNewRoleToOld(role)
    
    console.log('Mapped query role:', queryRole)
    
    // Validate query role
    if (!queryRole) {
      throw new Error('Invalid role mapping')
    }
    
    // First try with is_active filter
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', queryRole),
        where('is_active', '==', true),
        orderBy('full_name')
      )
      
      const querySnapshot = await getDocs(q)
      const users: User[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        users.push({
          id: doc.id,
          email: data.email,
          full_name: data.full_name,
          role: data.role,
          companyId: data.companyId,
          affiliate_company_id: data.affiliate_company_id,
          department: data.department,
          position: data.position,
          phone: data.phone,
          is_active: data.is_active,
          last_login: data.last_login?.toDate(),
          created_at: data.created_at?.toDate() || new Date(),
          updated_at: data.updated_at?.toDate() || new Date(),
          avatar_url: data.avatar_url,
          preferences: data.preferences
        })
      })
      
      return users
    } catch (error) {
      console.log('Error with is_active filter, trying without it:', error)
      
      // Fallback: query without is_active filter
      const q = query(
        collection(db, 'users'),
        where('role', '==', queryRole),
        orderBy('full_name')
      )
      
      const querySnapshot = await getDocs(q)
      const users: User[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        // Only include users that are active (or don't have is_active field set to false)
        if (data.is_active !== false) {
          users.push({
            id: doc.id,
            email: data.email,
            full_name: data.full_name,
            role: data.role,
            companyId: data.companyId,
            affiliate_company_id: data.affiliate_company_id,
            department: data.department,
            position: data.position,
            phone: data.phone,
            is_active: data.is_active !== false,
            last_login: data.last_login?.toDate(),
            created_at: data.created_at?.toDate() || new Date(),
            updated_at: data.updated_at?.toDate() || new Date(),
            avatar_url: data.avatar_url,
            preferences: data.preferences
          })
        }
      })
      
      return users
    }
  } catch (error) {
    console.error('Error getting users by role:', error)
    throw error
  }
}

/**
 * Assign a FINANCE user to a cash call (ADMIN only)
 */
export async function assignCashCallToFinance(
  cashCallId: string, 
  assigneeUserId: string, 
  adminUserId: string
): Promise<void> {
  try {
    // Verify admin permissions
    const adminUser = await getUser(adminUserId)
    console.log('Debug - Admin user role:', adminUser.role)
    console.log('Debug - Admin user ID:', adminUserId)
    console.log('Debug - Admin user full profile:', adminUser)
    if (adminUser.role !== 'admin') {
      throw new Error('Only admin users can assign cash calls')
    }
    
    // Verify assignee is a FINANCE user and is active
    const assigneeUser = await getUser(assigneeUserId)
    const assigneeRole = assigneeUser.role === 'viewer' ? 'finance' : assigneeUser.role
    if ((assigneeRole !== 'finance' && assigneeRole !== 'FINANCE') || !assigneeUser.is_active) {
      throw new Error('Assignee must be an active finance user')
    }
    
    // Update cash call with assignee and change status to finance_review
    const cashCallRef = doc(db, 'cash_calls', cashCallId)
    await updateDoc(cashCallRef, {
      assigneeUserId: assigneeUserId,
      status: 'finance_review',
      updated_at: serverTimestamp()
    })
    
    // Log activity
    await addDoc(collection(db, 'activity_logs'), {
      user_id: adminUserId,
      action: 'ASSIGNED_FINANCE',
      entity_type: 'cash_calls',
      entity_id: cashCallId,
      old_values: { assigneeUserId: null },
      new_values: { assigneeUserId: assigneeUserId },
      created_at: serverTimestamp(),
      metadata: {
        assigned_by: adminUserId,
        assigned_to: assigneeUserId
      }
    })
    
    // Get cash call details for better notification
    const cashCall = await getCashCall(cashCallId)
    
    // Send notification to assignee
    await sendInAppNotification(assigneeUserId, {
      type: 'assignment',
      title: 'Cash Call Assigned',
      message: `You have been assigned cash call "${cashCall.call_number}" for ${cashCall.affiliate_id} by ${adminUser.full_name}`,
      cashCallId: cashCallId,
      assignedBy: adminUserId,
      timestamp: new Date()
    })
    
  } catch (error) {
    console.error('Error assigning cash call to finance:', error)
    throw error
  }
}

/**
 * Unassign a cash call (ADMIN only)
 */
export async function unassignCashCall(
  cashCallId: string, 
  adminUserId: string
): Promise<void> {
  try {
    // Verify admin permissions
    const adminUser = await getUser(adminUserId)
    console.log('Debug - Admin user role (unassign):', adminUser.role)
    if (adminUser.role !== 'admin') {
      throw new Error('Only admin users can unassign cash calls')
    }
    
    // Get current assignee for activity log
    const cashCall = await getCashCall(cashCallId)
    const currentAssignee = cashCall.assigneeUserId
    
    // Update cash call to remove assignee and revert status to under_review
    const cashCallRef = doc(db, 'cash_calls', cashCallId)
    await updateDoc(cashCallRef, {
      assigneeUserId: null,
      status: 'under_review',
      updated_at: serverTimestamp()
    })
    
    // Log activity
    await addDoc(collection(db, 'activity_logs'), {
      user_id: adminUserId,
      action: 'UNASSIGNED_FINANCE',
      entity_type: 'cash_calls',
      entity_id: cashCallId,
      old_values: { assigneeUserId: currentAssignee },
      new_values: { assigneeUserId: null },
      created_at: serverTimestamp(),
      metadata: {
        unassigned_by: adminUserId,
        unassigned_from: currentAssignee
      }
    })

    // Send notification to unassigned user if they exist
    if (currentAssignee) {
      await sendInAppNotification(currentAssignee, {
        type: 'unassignment',
        title: 'Cash Call Unassigned',
        message: `Cash call ${cashCallId} has been unassigned from you`,
        cashCallId: cashCallId,
        assignedBy: adminUserId,
        timestamp: new Date()
      })
    }
    
  } catch (error) {
    console.error('Error unassigning cash call:', error)
    throw error
  }
}

/**
 * Get cash calls based on user role and access permissions
 */
export async function getCashCallsByAccess(
  userId: string,
  scope?: 'mine' | 'affiliate' | 'all'
): Promise<CashCall[]> {
  try {
    console.log('getCashCallsByAccess called with userId:', userId, 'scope:', scope)
    
    const user = await getUser(userId)
    console.log('User data:', { 
      id: user.id, 
      role: user.role, 
      companyId: user.companyId, 
      affiliate_company_id: user.affiliate_company_id,
      is_active: user.is_active 
    })
    
    if (!user.is_active) {
      throw new Error('User account is not active')
    }
    
    // Use role directly - no mapping needed
    const role = user.role?.toLowerCase()?.trim()
    console.log('User role:', role)
    console.log('User role type:', typeof role)
    console.log('User role length:', role?.length)
    console.log('Original user role:', user.role)
    
    // Define companyId for affiliate users (needed for fallback filtering)
    const companyId = role === 'affiliate' ? (user.companyId || user.affiliate_company_id) : null
    console.log('User companyId:', companyId)
    
    // For affiliate users, log the exact query we're about to make
    if (role === 'affiliate') {
      console.log('Affiliate user query details:', {
        companyId,
        affiliate_company_id: user.affiliate_company_id,
        queryField: 'affiliate_id',
        queryValue: companyId
      })
    }
    
    let q: Query<DocumentData>
    
    switch (role) {
      case 'affiliate':
        // Affiliate users can only see cash calls from their company
        if (!companyId) {
          console.warn('Affiliate user has no companyId, returning empty array')
          return []
        }
        
        q = query(
          collection(db, 'cash_calls'),
          where('affiliate_id', '==', companyId),
          orderBy('created_at', 'desc')
        )
        break
        
      case 'finance':
      case 'viewer':
        // Finance users see only their assigned cash calls
        q = query(
          collection(db, 'cash_calls'),
          where('assigneeUserId', '==', userId),
          orderBy('created_at', 'desc')
        )
        break
        
      case 'cfo':
      case 'approver':
        // CFO users see only cash calls ready for their review
        q = query(
          collection(db, 'cash_calls'),
          where('status', '==', 'ready_for_cfo'),
          orderBy('created_at', 'desc')
        )
        break
        
      case 'admin':
        // Admin users can see all cash calls
        q = query(
          collection(db, 'cash_calls'),
          orderBy('created_at', 'desc')
        )
        break
        
      default:
        console.error('Invalid user role:', role, 'for user:', user.email)
        throw new Error(`Invalid user role: "${role}" for user: ${user.email}`)
    }
    
    // Try to execute the query with fallback for index building
    let querySnapshot
    
    console.log('Executing query for role:', role, 'with companyId:', companyId)
    try {
      querySnapshot = await getDocs(q)
    } catch (indexError: any) {
      console.log('Index error, trying fallback query:', indexError.message)
      
      // If index is not ready, try a simpler query and sort in memory
      if (indexError.message.includes('index')) {
        const fallbackQuery = query(
          collection(db, 'cash_calls'),
          orderBy('created_at', 'desc')
        )
        
        querySnapshot = await getDocs(fallbackQuery)
        
        // Filter in memory based on the original query conditions
        const filteredDocs = querySnapshot.docs.filter(doc => {
          const data = doc.data()
          
          switch (role) {
            case 'affiliate':
              return data.affiliateCompanyId === companyId || data.affiliate_id === companyId
            case 'finance':
            case 'viewer':
              return data.assigneeUserId === userId
            case 'cfo':
            case 'approver':
              return data.status === 'ready_for_cfo'
            case 'admin':
              return true
            default:
              return false
          }
        })
        
        // Create a new QuerySnapshot-like object with filtered docs
        querySnapshot = {
          docs: filteredDocs,
          forEach: (callback: any) => filteredDocs.forEach(callback)
        }
      } else {
        throw indexError
      }
    }
    
    const cashCalls: CashCall[] = []
    
    console.log('Query returned', querySnapshot.docs.length, 'cash calls')
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      console.log('Cash call found:', {
        id: doc.id,
        affiliate_id: data.affiliate_id,
        affiliateCompanyId: data.affiliateCompanyId,
        call_number: data.call_number,
        status: data.status
      })
      cashCalls.push({
        id: doc.id,
        call_number: data.call_number,
        title: data.title,
        affiliate_id: data.affiliate_id,
        affiliateCompanyId: data.affiliateCompanyId || data.affiliate_id,
        amount_requested: data.amount_requested,
        status: data.status,
        priority: data.priority || 'medium',
        category: data.category,
        subcategory: data.subcategory,
        description: data.description,
        currency: data.currency || 'USD',
        exchange_rate: data.exchange_rate || 1.0,
        amount_in_original_currency: data.amount_in_original_currency,
        original_currency: data.original_currency,
        payment_terms: data.payment_terms,
        payment_method: data.payment_method,
        bank_account_info: data.bank_account_info,
        supporting_documents: data.supporting_documents || [],
        rejection_reason: data.rejection_reason,
        internal_notes: data.internal_notes,
        external_notes: data.external_notes,
        tags: data.tags || [],
        risk_assessment: data.risk_assessment,
        compliance_status: data.compliance_status || 'pending',
        created_by: data.created_by,
        createdByUserId: data.createdByUserId || data.created_by,
        assigneeUserId: data.assigneeUserId,
        created_at: data.created_at?.toDate() || new Date(),
        updated_at: data.updated_at?.toDate() || new Date(),
        due_date: data.due_date?.toDate(),
        approved_at: data.approved_at?.toDate(),
        approved_by: data.approved_by,
        paid_at: data.paid_at?.toDate(),
        workflow_step: data.workflow_step,
        total_approved_amount: data.total_approved_amount,
        remaining_amount: data.remaining_amount
      })
    })
    
    return cashCalls
  } catch (error) {
    console.error('Error getting cash calls by access:', error)
    throw error
  }
}

/**
 * Check if user can perform action on cash call
 */
export async function canUserPerformAction(
  userId: string,
  action: 'view' | 'edit' | 'assign' | 'approve' | 'reject' | 'submit',
  cashCallId: string
): Promise<boolean> {
  try {
    const user = await getUser(userId)
    if (!user.is_active) return false
    
    const cashCall = await getCashCall(cashCallId)
    
    // Use role directly - no mapping needed
    const role = user.role
    
    switch (role) {
      case 'affiliate':
        // Affiliate users can only access their own company's cash calls
        if (cashCall.affiliateCompanyId !== user.companyId) return false
        
        switch (action) {
          case 'view':
            return true
          case 'edit':
            return cashCall.status === 'draft'
          case 'submit':
            return cashCall.status === 'draft' && cashCall.created_by === userId
          default:
            return false
        }
        
      case 'finance':
      case 'viewer':
        switch (action) {
          case 'view':
            return true // Can view all but only modify assigned
          case 'edit':
            return cashCall.assigneeUserId === userId && 
                   ['submitted', 'finance_review'].includes(cashCall.status)
          case 'approve':
            return cashCall.assigneeUserId === userId && 
                   cashCall.status === 'finance_review'
          case 'reject':
            return cashCall.assigneeUserId === userId && 
                   ['submitted', 'finance_review'].includes(cashCall.status)
          default:
            return false
        }
        
      case 'cfo':
      case 'approver':
        switch (action) {
          case 'view':
            return true
          case 'approve':
            return cashCall.status === 'ready_for_cfo'
          case 'reject':
            return cashCall.status === 'ready_for_cfo'
          default:
            return false
        }
        
      case 'admin':
        // Admin can do everything
        return true
        
      default:
        return false
    }
  } catch (error) {
    console.error('Error checking user permissions:', error)
    return false
  }
}

/**
 * Update cash call status (basic function without role validation)
 */
export async function updateCashCallStatus(
  cashCallId: string,
  newStatus: string,
  userId: string
): Promise<CashCall> {
  try {
    const cashCallRef = doc(db, 'cash_calls', cashCallId)
    
    // Get current cash call for activity log
    const currentDoc = await getDoc(cashCallRef)
    if (!currentDoc.exists()) {
      throw new Error('Cash call not found')
    }
    
    const oldData = currentDoc.data()
    const oldStatus = oldData.status
    
    // Prepare update data
    const updateData: any = {
      status: newStatus,
      updated_at: serverTimestamp()
    }
    
    // Add specific fields based on status
    if (newStatus === 'approved') {
      updateData.approved_at = serverTimestamp()
      updateData.approved_by = userId
    } else if (newStatus === 'paid') {
      updateData.paid_at = serverTimestamp()
    }
    
    // Update the cash call
    await updateDoc(cashCallRef, updateData)
    
    // Log activity
    await logActivity({
      user_id: userId,
      action: 'STATUS_CHANGED',
      entity_type: 'cash_calls',
      entity_id: cashCallId,
      old_values: { status: oldStatus },
      new_values: { status: newStatus },
      metadata: {
        changed_by: userId,
        old_status: oldStatus,
        new_status: newStatus
      }
    })
    
    // Return updated cash call
    const updatedDoc = await getDoc(cashCallRef)
    const data = updatedDoc.data()
    
    return {
      id: updatedDoc.id,
      call_number: data.call_number,
      title: data.title,
      affiliate_id: data.affiliate_id,
      affiliateCompanyId: data.affiliateCompanyId || data.affiliate_id,
      amount_requested: data.amount_requested,
      status: data.status,
      priority: data.priority || 'medium',
      category: data.category,
      subcategory: data.subcategory,
      description: data.description,
      currency: data.currency || 'USD',
      exchange_rate: data.exchange_rate || 1.0,
      amount_in_original_currency: data.amount_in_original_currency,
      original_currency: data.original_currency,
      payment_terms: data.payment_terms,
      payment_method: data.payment_method,
      bank_account_info: data.bank_account_info,
      supporting_documents: data.supporting_documents || [],
      rejection_reason: data.rejection_reason,
      internal_notes: data.internal_notes,
      external_notes: data.external_notes,
      tags: data.tags || [],
      risk_assessment: data.risk_assessment,
      compliance_status: data.compliance_status || 'pending',
      created_by: data.created_by,
      createdByUserId: data.createdByUserId || data.created_by,
      assigneeUserId: data.assigneeUserId,
      created_at: data.created_at?.toDate() || new Date(),
      updated_at: data.updated_at?.toDate() || new Date(),
      due_date: data.due_date?.toDate(),
      approved_at: data.approved_at?.toDate(),
      approved_by: data.approved_by,
      paid_at: data.paid_at?.toDate(),
      workflow_step: data.workflow_step,
      total_approved_amount: data.total_approved_amount,
      remaining_amount: data.remaining_amount
    }
  } catch (error) {
    console.error('Error updating cash call status:', error)
    throw error
  }
}

/**
 * Update cash call status with role-based validation
 */
export async function updateCashCallStatusWithAuth(
  cashCallId: string,
  newStatus: string,
  userId: string
): Promise<CashCall> {
  try {
    // Check if user can perform this action
    const canUpdate = await canUserPerformAction(userId, 'edit', cashCallId)
    if (!canUpdate) {
      throw new Error('User does not have permission to update this cash call')
    }
    
    const user = await getUser(userId)
    const cashCall = await getCashCall(cashCallId)
    
    // Use role directly - no mapping needed
    const role = user.role
    
    // Role-specific status transition validation
    switch (role) {
      case 'affiliate':
        if (newStatus !== 'submitted' || cashCall.status !== 'draft') {
          throw new Error('Affiliate users can only submit draft cash calls')
        }
        break
        
      case 'finance':
      case 'viewer':
        if (cashCall.assigneeUserId !== userId) {
          throw new Error('Finance users can only update assigned cash calls')
        }
        if (!['submitted', 'finance_review', 'ready_for_cfo'].includes(newStatus)) {
          throw new Error('Invalid status transition for finance user')
        }
        break
        
      case 'cfo':
      case 'approver':
        if (cashCall.status !== 'ready_for_cfo') {
          throw new Error('CFO can only review cash calls ready for CFO')
        }
        if (!['approved', 'rejected'].includes(newStatus)) {
          throw new Error('CFO can only approve or reject cash calls')
        }
        break
        
      case 'admin':
        // Admin can make any status transition
        break
        
      default:
        throw new Error('Invalid user role for status update')
    }
    
    // Update the cash call status
    return await updateCashCallStatus(cashCallId, newStatus, userId)
    
  } catch (error) {
    console.error('Error updating cash call status with auth:', error)
    throw error
  }
}

// Function to save checklist template items to Firebase
export async function saveChecklistTemplateItems(templateItems: any) {
  try {
    const templateRef = doc(db, 'checklist_templates', 'default')
    await setDoc(templateRef, {
      items: templateItems,
      updated_at: new Date()
    }, { merge: true })
  } catch (error) {
    console.error('Error saving checklist template items:', error)
    throw error
  }
}

// Function to update a specific checklist item in templates
export async function updateChecklistTemplateItem(groupKey: string, itemNo: string, updates: any) {
  try {
    const templateRef = doc(db, 'checklist_templates', 'default')
    const templateDoc = await getDoc(templateRef)
    
    let currentItems = availableChecklistItems
    
    if (templateDoc.exists()) {
      currentItems = templateDoc.data().items || availableChecklistItems
    }
    
    // Update the specific item
    const updatedItems = { ...currentItems }
    if (updatedItems[groupKey]) {
      const itemIndex = updatedItems[groupKey].findIndex((item: any) => item.itemNo === itemNo)
      if (itemIndex !== -1) {
        updatedItems[groupKey][itemIndex] = { ...updatedItems[groupKey][itemIndex], ...updates }
      }
    }
    
    // Save back to Firebase
    await setDoc(templateRef, {
      items: updatedItems,
      updated_at: new Date()
    }, { merge: true })
    
    return updatedItems
  } catch (error) {
    console.error('Error updating checklist template item:', error)
    throw error
  }
}

// Function to add a new checklist item to templates
export async function addChecklistTemplateItem(groupKey: string, newItem: any) {
  try {
    const templateRef = doc(db, 'checklist_templates', 'default')
    const templateDoc = await getDoc(templateRef)
    
    let currentItems = availableChecklistItems
    
    if (templateDoc.exists()) {
      currentItems = templateDoc.data().items || availableChecklistItems
    }
    
    // Add the new item
    const updatedItems = { ...currentItems }
    if (!updatedItems[groupKey]) {
      updatedItems[groupKey] = []
    }
    
    updatedItems[groupKey].push({
      ...newItem,
      status: "Not Started"
    })
    
    // Save back to Firebase
    await setDoc(templateRef, {
      items: updatedItems,
      updated_at: new Date()
    }, { merge: true })
    
    return updatedItems
  } catch (error) {
    console.error('Error adding checklist template item:', error)
    throw error
  }
}

// Function to delete a checklist item from templates
export async function deleteChecklistTemplateItem(groupKey: string, itemNo: string) {
  try {
    const templateRef = doc(db, 'checklist_templates', 'default')
    const templateDoc = await getDoc(templateRef)
    
    let currentItems = availableChecklistItems
    
    if (templateDoc.exists()) {
      currentItems = templateDoc.data().items || availableChecklistItems
    }
    
    // Remove the item
    const updatedItems = { ...currentItems }
    if (updatedItems[groupKey]) {
      updatedItems[groupKey] = updatedItems[groupKey].filter((item: any) => item.itemNo !== itemNo)
    }
    
    // Save back to Firebase
    await setDoc(templateRef, {
      items: updatedItems,
      updated_at: new Date()
    }, { merge: true })
    
    return updatedItems
  } catch (error) {
    console.error('Error deleting checklist template item:', error)
    throw error
  }
}

// =====================================================
// DOCUMENT REQUIREMENTS FUNCTIONS
// =====================================================

// Get document requirements for an affiliate (includes global requirements)
export async function getDocumentRequirements(affiliateId: string, cashCallType?: 'opex' | 'capex'): Promise<DocumentRequirement[]> {
  try {
    // Get both affiliate-specific and global requirements without ordering in Firestore
    const [affiliateSpecificQuery, globalQuery] = await Promise.all([
      getDocs(query(
        collection(db, 'document_requirements'),
        where('affiliate_id', '==', affiliateId)
      )),
      getDocs(query(
        collection(db, 'document_requirements'),
        where('is_global', '==', true)
      ))
    ])

    const affiliateSpecific = affiliateSpecificQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate() || new Date(),
      updated_at: doc.data().updated_at?.toDate() || new Date()
    })) as DocumentRequirement[]

    const global = globalQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate() || new Date(),
      updated_at: doc.data().updated_at?.toDate() || new Date()
    })) as DocumentRequirement[]

    // Combine and sort by order_index in memory to avoid index requirements
    let allRequirements = [...affiliateSpecific, ...global]
    
    // Filter by cash call type if specified
    if (cashCallType) {
      allRequirements = allRequirements.filter(req => 
        req.applies_to === 'both' || req.applies_to === cashCallType
      )
    }
    
    return allRequirements.sort((a, b) => a.order_index - b.order_index)
  } catch (error) {
    console.error('Error getting document requirements:', error)
    throw error
  }
}

// Create a new document requirement
export async function createDocumentRequirement(requirement: Omit<DocumentRequirement, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  try {
    // Filter out undefined values to prevent Firebase errors
    const cleanRequirement = Object.fromEntries(
      Object.entries(requirement).filter(([_, value]) => value !== undefined)
    )
    
    const docRef = await addDoc(collection(db, 'document_requirements'), {
      ...cleanRequirement,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error('Error creating document requirement:', error)
    throw error
  }
}

// Update a document requirement
export async function updateDocumentRequirement(id: string, updates: Partial<DocumentRequirement>): Promise<void> {
  try {
    const docRef = doc(db, 'document_requirements', id)
    
    // Filter out undefined values to prevent Firebase errors
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    )
    
    await updateDoc(docRef, {
      ...cleanUpdates,
      updated_at: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating document requirement:', error)
    throw error
  }
}

// Delete a document requirement
export async function deleteDocumentRequirement(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'document_requirements', id)
    await deleteDoc(docRef)
  } catch (error) {
    console.error('Error deleting document requirement:', error)
    throw error
  }
}

// Get all document requirements (for admin view)
export async function getAllDocumentRequirements(): Promise<DocumentRequirement[]> {
  try {
    // Get all documents without ordering to avoid issues with null affiliate_id values
    const querySnapshot = await getDocs(collection(db, 'document_requirements'))
    const requirements = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate() || new Date(),
      updated_at: doc.data().updated_at?.toDate() || new Date()
    })) as DocumentRequirement[]
    
    // Sort by order_index in memory to avoid complex index
    return requirements.sort((a, b) => a.order_index - b.order_index)
  } catch (error) {
    console.error('Error getting all document requirements:', error)
    throw error
  }
}