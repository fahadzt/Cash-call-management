import { supabase } from "./supabase"

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
  last_login?: string
  created_at: string
  updated_at: string
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
  partnership_start_date?: string
  partnership_end_date?: string
  financial_rating?: string
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  created_at: string
  updated_at: string
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
  supporting_documents?: any
  rejection_reason?: string
  internal_notes?: string
  external_notes?: string
  tags?: string[]
  risk_assessment?: string
  compliance_status: 'pending' | 'approved' | 'rejected' | 'under_review'
  created_by: string
  created_at: string
  updated_at: string
  due_date?: string
  approved_at?: string
  approved_by?: string
  paid_at?: string
}

export interface Comment {
  id: string
  cash_call_id: string
  user_id: string
  parent_comment_id?: string
  content: string
  is_internal: boolean
  is_private: boolean
  created_at: string
  updated_at: string
  user?: User
  attachments?: CommentAttachment[]
  replies?: Comment[]
}

export interface CommentAttachment {
  id: string
  comment_id: string
  file_name: string
  file_path: string
  file_size?: number
  mime_type?: string
  created_at: string
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
  created_at: string
  user?: User
}

export interface Committee {
  id: string
  name: string
  description?: string
  color: string
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ChecklistTemplate {
  id: string
  name: string
  description?: string
  committee_id: string
  is_default: boolean
  created_by?: string
  created_at: string
  updated_at: string
  committee?: Committee
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
  created_at: string
  updated_at: string
  committee?: Committee
}

export interface AffiliateChecklist {
  id: string
  affiliate_id: string
  cash_call_id: string
  template_id?: string
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold'
  created_by?: string
  created_at: string
  updated_at: string
  affiliate?: Affiliate
  cash_call?: CashCall
  template?: ChecklistTemplate
}

export interface ChecklistResponse {
  id: string
  affiliate_checklist_id: string
  checklist_item_id: string
  status: 'not_started' | 'in_progress' | 'under_review' | 'needs_revision' | 'on_hold' | 'approved' | 'completed' | 'rejected' | 'blocked' | 'pending_info' | 'waiting_approval' | 'escalated'
  response?: string
  submitted_by?: string
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
  attachments?: any
  created_at: string
  updated_at: string
  checklist_item?: ChecklistItem
  submitted_by_user?: User
  reviewed_by_user?: User
}

export interface Stakeholder {
  id: string
  cash_call_id: string
  user_id: string
  role: 'reviewer' | 'approver' | 'observer'
  permissions?: any
  notification_preferences?: any
  assigned_by?: string
  assigned_at: string
  removed_at?: string
  is_active: boolean
  user?: User
  assigned_by_user?: User
}

// =====================================================
// AFFILIATE OPERATIONS
// =====================================================

export async function getAffiliates() {
  const { data, error } = await supabase
    .from("affiliates")
    .select("*")
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching affiliates:", error)
    throw error
  }

  return data || []
}

export async function createAffiliate(affiliateData: {
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
  status?: 'active' | 'inactive' | 'suspended'
  partnership_type?: string
  partnership_start_date?: string
  partnership_end_date?: string
  financial_rating?: string
  risk_level?: 'low' | 'medium' | 'high' | 'critical'
}) {
  const { data, error } = await supabase
    .from("affiliates")
    .insert([affiliateData])
    .select()
    .single()

  if (error) {
    console.error("Error creating affiliate:", error)
    throw error
  }

  return data
}

export async function updateAffiliate(
  id: string,
  updates: Partial<Affiliate>
) {
  const { data, error } = await supabase
    .from("affiliates")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating affiliate:", error)
    throw error
  }

  return data
}

export async function deleteAffiliate(id: string) {
  const { error } = await supabase
    .from("affiliates")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting affiliate:", error)
    throw error
  }
}

// =====================================================
// USER OPERATIONS
// =====================================================

export async function getUsers() {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name", { ascending: true })

    if (error) {
      console.warn("Profiles table not available, returning empty array:", error.message)
      return []
    }

    return data || []
  } catch (err) {
    console.warn("Error fetching users, returning empty array:", err)
    return []
  }
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  if (error) {
    console.error("Error fetching user profile:", error)
    throw error
  }

  return data
}

export async function updateUserRole(userId: string, role: string) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .select()
    .single()

  if (error) {
    console.error("Error updating user role:", error)
    throw error
  }

  return data
}

// =====================================================
// CASH CALL OPERATIONS
// =====================================================

export async function getCashCallsEnhanced(userId: string, filters?: {
  status?: string[]
  affiliate_id?: string
  priority?: string[]
  created_by?: string
  date_from?: string
  date_to?: string
}) {
  try {
    // First try to use the enhanced view if it exists
    let query = supabase
      .from("cash_calls_enhanced")
      .select("*")
      .order("created_at", { ascending: false })

    // Apply filters
    if (filters?.status?.length) {
      query = query.in("status", filters.status)
    }
    if (filters?.affiliate_id) {
      query = query.eq("affiliate_id", filters.affiliate_id)
    }
    if (filters?.priority?.length) {
      query = query.in("priority", filters.priority)
    }
    if (filters?.created_by) {
      query = query.eq("created_by", filters.created_by)
    }
    if (filters?.date_from) {
      query = query.gte("created_at", filters.date_from)
    }
    if (filters?.date_to) {
      query = query.lte("created_at", filters.date_to)
    }

    const { data, error } = await query

    if (error) {
      // If enhanced view doesn't exist, fall back to basic cash calls
      console.warn("Enhanced view not available, falling back to basic cash calls:", error.message)
      return await getCashCallsBasic(userId, filters)
    }

    return data || []
  } catch (err) {
    // Fallback to basic cash calls if anything goes wrong
    console.warn("Falling back to basic cash calls due to error:", err)
    return await getCashCallsBasic(userId, filters)
  }
}

// Fallback function for basic cash calls
async function getCashCallsBasic(userId: string, filters?: {
  status?: string[]
  affiliate_id?: string
  priority?: string[]
  created_by?: string
  date_from?: string
  date_to?: string
}) {
  let query = supabase
    .from("cash_calls")
    .select(`
      *,
      affiliate:affiliates(*)
    `)
    .order("created_at", { ascending: false })

  // Apply filters
  if (filters?.status?.length) {
    query = query.in("status", filters.status)
  }
  if (filters?.affiliate_id) {
    query = query.eq("affiliate_id", filters.affiliate_id)
  }
  if (filters?.created_by) {
    query = query.eq("created_by", filters.created_by)
  }
  if (filters?.date_from) {
    query = query.gte("created_at", filters.date_from)
  }
  if (filters?.date_to) {
    query = query.lte("created_at", filters.date_to)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching basic cash calls:", error)
    throw error
  }

  // Transform basic data to match enhanced format
  return (data || []).map(cashCall => ({
    ...cashCall,
    // Add default values for enhanced fields
    priority: cashCall.priority || 'medium',
    category: cashCall.category || null,
    subcategory: cashCall.subcategory || null,
    currency: cashCall.currency || 'USD',
    exchange_rate: cashCall.exchange_rate || 1.0,
    tags: cashCall.tags || [],
    comment_count: 0,
    stakeholder_count: 0,
    completed_checklist_items: 0,
    total_checklist_items: 0,
    affiliate_name: cashCall.affiliate?.name || 'Unknown',
    affiliate_code: cashCall.affiliate?.company_code || '',
    creator_name: 'Unknown',
    creator_email: '',
    creator_role: 'user'
  }))
}

export async function getCashCallEnhanced(id: string) {
  const { data, error } = await supabase
    .from("cash_calls_enhanced")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching enhanced cash call:", error)
    throw error
  }

  return data
}

export async function createCashCallEnhanced(cashCallData: {
  call_number: string
  title?: string
  affiliate_id: string
  amount_requested: number
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  category?: string
  subcategory?: string
  description?: string
  currency?: string
  exchange_rate?: number
  amount_in_original_currency?: number
  original_currency?: string
  payment_terms?: string
  payment_method?: string
  bank_account_info?: any
  supporting_documents?: any
  internal_notes?: string
  external_notes?: string
  tags?: string[]
  risk_assessment?: string
  due_date?: string
  created_by: string
}) {
  try {
    console.log("Attempting to create cash call with data:", cashCallData)
    
    const { data, error } = await supabase
      .from("cash_calls")
      .insert([cashCallData])
      .select(`
        *,
        affiliate:affiliates(*)
      `)
      .single()

    if (error) {
      console.error("Error creating enhanced cash call:", error)
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw error
    }

    // Try to log activity, but don't fail if activity_logs table doesn't exist
    try {
      await logActivity({
        user_id: cashCallData.created_by,
        action: "Cash Call Created",
        entity_type: "cash_calls",
        entity_id: data.id,
        new_values: data
      })
    } catch (activityError) {
      console.warn("Activity logging failed (table may not exist):", activityError)
      // Don't throw - this is not critical for cash call creation
    }

    return data
  } catch (err) {
    console.error("Error in createCashCallEnhanced:", err)
    throw err
  }
}

export async function updateCashCallEnhanced(
  id: string,
  updates: Partial<CashCall>,
  userId: string
) {
  try {
    // Get current values for activity log
    const { data: currentData } = await supabase
      .from("cash_calls")
      .select("*")
      .eq("id", id)
      .single()

    const { data, error } = await supabase
      .from("cash_calls")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(`
        *,
        affiliate:affiliates(*)
      `)
      .single()

    if (error) {
      console.error("Error updating enhanced cash call:", error)
      throw error
    }

    // Try to log activity, but don't fail if activity_logs table doesn't exist
    try {
      await logActivity({
        user_id: userId,
        action: "Cash Call Updated",
        entity_type: "cash_calls",
        entity_id: id,
        old_values: currentData,
        new_values: data
      })
    } catch (activityError) {
      console.warn("Activity logging failed (table may not exist):", activityError)
      // Don't throw - this is not critical for cash call updates
    }

    return data
  } catch (err) {
    console.error("Error in updateCashCallEnhanced:", err)
    throw err
  }
}

// =====================================================
// COMMENTS OPERATIONS
// =====================================================

export async function getComments(cashCallId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select(`
      *,
      user:profiles(*),
      attachments:comment_attachments(*)
    `)
    .eq("cash_call_id", cashCallId)
    .is("parent_comment_id", null) // Only get top-level comments
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching comments:", error)
    throw error
  }

  // Get replies for each comment
  const commentsWithReplies = await Promise.all(
    (data || []).map(async (comment) => {
      const { data: replies } = await supabase
        .from("comments")
        .select(`
          *,
          user:profiles(*),
          attachments:comment_attachments(*)
        `)
        .eq("parent_comment_id", comment.id)
        .order("created_at", { ascending: true })

      return {
        ...comment,
        replies: replies || []
      }
    })
  )

  return commentsWithReplies
}

export async function createComment(commentData: {
  cash_call_id: string
  user_id: string
  parent_comment_id?: string
  content: string
  is_internal?: boolean
  is_private?: boolean
}) {
  const { data, error } = await supabase
    .from("comments")
    .insert([commentData])
    .select(`
      *,
      user:profiles(*)
    `)
    .single()

  if (error) {
    console.error("Error creating comment:", error)
    throw error
  }

  // Log activity
  await logActivity({
    user_id: commentData.user_id,
    action: "Comment Added",
    entity_type: "comments",
    entity_id: data.id,
    new_values: { content: data.content, cash_call_id: data.cash_call_id }
  })

  return data
}

export async function updateComment(
  id: string,
  updates: Partial<Comment>,
  userId: string
) {
  const { data, error } = await supabase
    .from("comments")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(`
      *,
      user:profiles(*)
    `)
    .single()

  if (error) {
    console.error("Error updating comment:", error)
    throw error
  }

  return data
}

export async function deleteComment(id: string, userId: string) {
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting comment:", error)
    throw error
  }

  // Log activity
  await logActivity({
    user_id: userId,
    action: "Comment Deleted",
    entity_type: "comments",
    entity_id: id
  })
}

// =====================================================
// ACTIVITY LOGS OPERATIONS
// =====================================================

export async function logActivity(logData: {
  user_id?: string
  action: string
  entity_type: string
  entity_id: string
  old_values?: any
  new_values?: any
  ip_address?: string
  user_agent?: string
  session_id?: string
}) {
  const { error } = await supabase
    .from("activity_logs")
    .insert([logData])

  if (error) {
    console.error("Error logging activity:", error)
    // Don't throw error for activity logging failures
  }
}

export async function getActivityLogs(filters?: {
  entity_type?: string
  entity_id?: string
  user_id?: string
  action?: string
  date_from?: string
  date_to?: string
  limit?: number
}) {
  let query = supabase
    .from("activity_logs")
    .select(`
      *,
      user:profiles(*)
    `)
    .order("created_at", { ascending: false })

  // Apply filters
  if (filters?.entity_type) {
    query = query.eq("entity_type", filters.entity_type)
  }
  if (filters?.entity_id) {
    query = query.eq("entity_id", filters.entity_id)
  }
  if (filters?.user_id) {
    query = query.eq("user_id", filters.user_id)
  }
  if (filters?.action) {
    query = query.eq("action", filters.action)
  }
  if (filters?.date_from) {
    query = query.gte("created_at", filters.date_from)
  }
  if (filters?.date_to) {
    query = query.lte("created_at", filters.date_to)
  }
  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching activity logs:", error)
    throw error
  }

  return data || []
}

// =====================================================
// CHECKLIST OPERATIONS
// =====================================================

export async function getCommittees() {
  const { data, error } = await supabase
    .from("committees")
    .select("*")
    .eq("is_active", true)
    .order("order_index", { ascending: true })

  if (error) {
    console.error("Error fetching committees:", error)
    throw error
  }

  return data || []
}

export async function getChecklistTemplates(committeeId?: string) {
  let query = supabase
    .from("checklist_templates")
    .select(`
      *,
      committee:committees(*)
    `)
    .order("name", { ascending: true })

  if (committeeId) {
    query = query.eq("committee_id", committeeId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching checklist templates:", error)
    throw error
  }

  return data || []
}

export async function getChecklistItems(templateId?: string, committeeId?: string) {
  let query = supabase
    .from("checklist_items")
    .select(`
      *,
      committee:committees(*)
    `)
    .order("order_index", { ascending: true })

  if (templateId) {
    query = query.eq("template_id", templateId)
  }
  if (committeeId) {
    query = query.eq("committee_id", committeeId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching checklist items:", error)
    throw error
  }

  return data || []
}

export async function createAffiliateChecklist(checklistData: {
  affiliate_id: string
  cash_call_id: string
  template_id?: string
  created_by: string
}) {
  const { data, error } = await supabase
    .from("affiliate_checklists")
    .insert([checklistData])
    .select(`
      *,
      affiliate:affiliates(*),
      cash_call:cash_calls(*),
      template:checklist_templates(*)
    `)
    .single()

  if (error) {
    console.error("Error creating affiliate checklist:", error)
    throw error
  }

  return data
}

export async function getAffiliateChecklist(affiliateId: string, cashCallId: string) {
  const { data, error } = await supabase
    .from("affiliate_checklists")
    .select(`
      *,
      affiliate:affiliates(*),
      cash_call:cash_calls(*),
      template:checklist_templates(*)
    `)
    .eq("affiliate_id", affiliateId)
    .eq("cash_call_id", cashCallId)
    .single()

  if (error) {
    console.error("Error fetching affiliate checklist:", error)
    throw error
  }

  return data
}

export async function getChecklistResponses(affiliateChecklistId: string) {
  const { data, error } = await supabase
    .from("checklist_responses")
    .select(`
      *,
      checklist_item:checklist_items(
        *,
        committee:committees(*)
      ),
      submitted_by_user:profiles!checklist_responses_submitted_by_fkey(*),
      reviewed_by_user:profiles!checklist_responses_reviewed_by_fkey(*)
    `)
    .eq("affiliate_checklist_id", affiliateChecklistId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching checklist responses:", error)
    throw error
  }

  return data || []
}

export async function updateChecklistResponse(
  id: string,
  updates: Partial<ChecklistResponse>,
  userId: string
) {
  const { data, error } = await supabase
    .from("checklist_responses")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(`
      *,
      checklist_item:checklist_items(
        *,
        committee:committees(*)
      ),
      submitted_by_user:profiles!checklist_responses_submitted_by_fkey(*),
      reviewed_by_user:profiles!checklist_responses_reviewed_by_fkey(*)
    `)
    .single()

  if (error) {
    console.error("Error updating checklist response:", error)
    throw error
  }

  // Log activity
  await logActivity({
    user_id: userId,
    action: "Checklist Updated",
    entity_type: "checklist_responses",
    entity_id: id,
    new_values: { status: data.status, response: data.response }
  })

  return data
}

export async function getChecklistProgress(cashCallId: string) {
  const { data, error } = await supabase
    .from("checklist_progress")
    .select("*")
    .eq("cash_call_id", cashCallId)

  if (error) {
    console.error("Error fetching checklist progress:", error)
    throw error
  }

  return data || []
}

// =====================================================
// STAKEHOLDER OPERATIONS
// =====================================================

export async function getStakeholders(cashCallId: string) {
  const { data, error } = await supabase
    .from("stakeholders")
    .select(`
      *,
      user:profiles(*),
      assigned_by_user:profiles!stakeholders_assigned_by_fkey(*)
    `)
    .eq("cash_call_id", cashCallId)
    .eq("is_active", true)
    .order("assigned_at", { ascending: true })

  if (error) {
    console.error("Error fetching stakeholders:", error)
    throw error
  }

  return data || []
}

export async function addStakeholder(stakeholderData: {
  cash_call_id: string
  user_id: string
  role: 'reviewer' | 'approver' | 'observer'
  permissions?: any
  notification_preferences?: any
  assigned_by: string
}) {
  const { data, error } = await supabase
    .from("stakeholders")
    .insert([stakeholderData])
    .select(`
      *,
      user:profiles(*),
      assigned_by_user:profiles!stakeholders_assigned_by_fkey(*)
    `)
    .single()

  if (error) {
    console.error("Error adding stakeholder:", error)
    throw error
  }

  return data
}

export async function updateStakeholder(
  id: string,
  updates: Partial<Stakeholder>
) {
  const { data, error } = await supabase
    .from("stakeholders")
    .update(updates)
    .eq("id", id)
    .select(`
      *,
      user:profiles(*),
      assigned_by_user:profiles!stakeholders_assigned_by_fkey(*)
    `)
    .single()

  if (error) {
    console.error("Error updating stakeholder:", error)
    throw error
  }

  return data
}

export async function removeStakeholder(id: string) {
  const { error } = await supabase
    .from("stakeholders")
    .update({ 
      is_active: false, 
      removed_at: new Date().toISOString() 
    })
    .eq("id", id)

  if (error) {
    console.error("Error removing stakeholder:", error)
    throw error
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export async function getUserPermissions(userId: string) {
  const { data: user } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single()

  if (!user) return []

  const { data, error } = await supabase
    .from("role_permissions")
    .select("*")
    .eq("role", user.role)

  if (error) {
    console.error("Error fetching user permissions:", error)
    return []
  }

  return data || []
}

export async function hasPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  return permissions.some(p => p.resource === resource && p.action === action)
}

export async function getDashboardStats(userId: string) {
  const [
    { count: totalCashCalls },
    { count: pendingCashCalls },
    { count: approvedCashCalls },
    { count: totalAffiliates },
    { count: totalUsers }
  ] = await Promise.all([
    supabase.from("cash_calls").select("*", { count: "exact", head: true }),
    supabase.from("cash_calls").select("*", { count: "exact", head: true }).eq("status", "under_review"),
    supabase.from("cash_calls").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("affiliates").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true })
  ])

  return {
    totalCashCalls: totalCashCalls || 0,
    pendingCashCalls: pendingCashCalls || 0,
    approvedCashCalls: approvedCashCalls || 0,
    totalAffiliates: totalAffiliates || 0,
    totalUsers: totalUsers || 0
  }
} 