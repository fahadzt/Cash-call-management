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
  role: 'admin' | 'approver' | 'affiliate' | 'viewer'
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
  amount_requested: number
  status: 'draft' | 'under_review' | 'approved' | 'paid' | 'rejected'
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
  cash_call_id: string
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
      (userDoc as any).department = userData.department
    }
    if (userData.position) {
      (userDoc as any).position = userData.position
    }
    if (userData.phone) {
      (userDoc as any).phone = userData.phone
    }

    await setDoc(doc(db, 'users', userCredential.user.uid), userDoc)
    
    // Update Firebase Auth profile
    if (userData.full_name) {
      await updateProfile(userCredential.user, {
        displayName: userData.full_name
      })
    }

    return userCredential
  } catch (error) {
    console.error('Error signing up:', error)
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
    const cashCallDoc = await getDoc(doc(db, 'cash_calls', id))
    
    if (!cashCallDoc.exists()) {
      return null
    }

    return {
      id: cashCallDoc.id,
      ...cashCallDoc.data(),
      created_at: cashCallDoc.data().created_at?.toDate(),
      updated_at: cashCallDoc.data().updated_at?.toDate(),
      due_date: cashCallDoc.data().due_date?.toDate(),
      approved_at: cashCallDoc.data().approved_at?.toDate(),
      paid_at: cashCallDoc.data().paid_at?.toDate()
    } as CashCall
  } catch (error) {
    console.error('Error fetching cash call:', error)
    throw error
  }
}

export async function createCashCall(cashCallData: Omit<CashCall, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  try {
    const cashCallsRef = collection(db, 'cash_calls')
    const docRef = await addDoc(cashCallsRef, {
      ...cashCallData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      workflow_step: 1,
      total_approved_amount: 0,
      remaining_amount: cashCallData.amount_requested
    })
    
    // Log activity
    await logActivity({
      user_id: cashCallData.created_by,
      action: 'cash_call_created',
      entity_type: 'cash_call',
      entity_id: docRef.id,
      new_values: cashCallData
    })

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

    // Log activity
    await logActivity({
      user_id: userId,
      action: 'cash_call_updated',
      entity_type: 'cash_call',
      entity_id: id,
      old_values: oldValues,
      new_values: { ...oldValues, ...updates }
    })
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

    // Log activity
    await logActivity({
      user_id: userId,
      action: 'cash_call_deleted',
      entity_type: 'cash_call',
      entity_id: id,
      old_values: oldValues
    })
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

export async function uploadDocument(cashCallId: string, file: File): Promise<string> {
  try {
    const path = `documents/cash_calls/${cashCallId}/${Date.now()}_${file.name}`
    return await uploadFile(file, path)
  } catch (error) {
    console.error('Error uploading document:', error)
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

    // Approver can approve/reject cash calls
    if (user.role === 'approver' && resource === 'cash_calls' && ['approve', 'reject'].includes(action)) {
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

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, 'notifications', notificationId)
    await updateDoc(notificationRef, {
      is_read: true,
      read_at: serverTimestamp()
    })
  } catch (error) {
    console.error('Error marking notification as read:', error)
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

// Standardized checklist items with updated names
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

export async function createAffiliateChecklist(affiliateId: string, affiliateName: string): Promise<AffiliateChecklist> {
  try {
    const timestamp = new Date()
    const uniqueId = Date.now().toString()

    const groupsToCreate: ChecklistGroup[] = [
      {
        id: `group-aramco-${uniqueId}`,
        name: "Aramco Digital Company",
        items: standardChecklistItems.aramcoDigital.map((item, index) => ({
          id: `item-aramco-${uniqueId}-${index + 1}`,
          ...item,
          created_at: timestamp,
          updated_at: timestamp,
        })),
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: `group-business-${uniqueId}`,
        name: "Business Proponent - T&I Affiliate Affairs",
        items: standardChecklistItems.businessProponent.map((item, index) => ({
          id: `item-business-${uniqueId}-${index + 1}`,
          ...item,
          created_at: timestamp,
          updated_at: timestamp,
        })),
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: `group-affiliate-${uniqueId}`,
        name: "2nd Tiered Affiliate",
        items: standardChecklistItems.secondTieredAffiliate.map((item, index) => ({
          id: `item-affiliate-${uniqueId}-${index + 1}`,
          ...item,
          created_at: timestamp,
          updated_at: timestamp,
        })),
        created_at: timestamp,
        updated_at: timestamp,
      },
    ]

    const newChecklist: Omit<AffiliateChecklist, 'id'> = {
      affiliate_id: affiliateId,
      affiliate_name: affiliateName,
      groups: groupsToCreate,
      created_at: timestamp,
      updated_at: timestamp,
    }

    const docRef = await addDoc(collection(db, 'affiliate_checklists'), newChecklist)
    
    // Log activity
    await logActivity({
      action: 'checklist_created',
      entity_type: 'affiliate_checklist',
      entity_id: docRef.id,
      new_values: { affiliate_id: affiliateId, affiliate_name: affiliateName }
    })
    
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