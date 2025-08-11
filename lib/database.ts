import { supabase } from "./supabase"

// Cash Call operations
export async function getCashCalls(userId: string) {
  // First, get cash calls created by the user
  const { data: ownCashCalls, error: ownError } = await supabase
    .from("cash_calls")
    .select(`
      *,
      affiliate:affiliates(*)
    `)
    .eq("created_by", userId)
    .order("created_at", { ascending: false })

  if (ownError) {
    console.error("Error fetching own cash calls:", ownError)
    throw ownError
  }

  // Get all cash calls for now (we'll implement stakeholder filtering later)
  const { data: allCashCalls, error: allError } = await supabase
    .from("cash_calls")
    .select(`
      *,
      affiliate:affiliates(*)
    `)
    .order("created_at", { ascending: false })

  if (allError) {
    console.error("Error fetching all cash calls:", allError)
    throw allError
  }

  // For now, return all cash calls (we can add stakeholder filtering later)
  return allCashCalls || []
}

export async function createCashCall(cashCallData: {
  affiliate_id: string
  amount_requested: number
  description?: string
  created_by: string
}) {
  const { data, error } = await supabase
    .from("cash_calls")
    .insert([cashCallData])
    .select(`
      *,
      affiliate:affiliates(*)
    `)
    .single()

  if (error) {
    console.error("Error creating cash call:", error)
    throw error
  }

  return data
}

export async function updateCashCallStatus(id: string, status: string, userId: string) {
  const updateData: any = { status }

  if (status === "approved") {
    updateData.approved_at = new Date().toISOString()
    updateData.approved_by = userId
  } else if (status === "paid") {
    updateData.paid_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from("cash_calls")
    .update(updateData)
    .eq("id", id)
    .select(`
      *,
      affiliate:affiliates(*)
    `)
    .single()

  if (error) {
    console.error("Error updating cash call:", error)
    throw error
  }

  return data
}

// Get cash call by ID
export async function getCashCall(id: string) {
  const { data, error } = await supabase
    .from("cash_calls")
    .select(`
      *,
      affiliate:affiliates(*)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching cash call:", error)
    throw error
  }

  return data
}

// Affiliate operations
export async function getAffiliates() {
  const { data, error } = await supabase.from("affiliates").select("*").order("name")

  if (error) {
    console.error("Error fetching affiliates:", error)
    throw error
  }

  return data || []
}

export async function createAffiliate(affiliateData: {
  name: string
  company_code: string
  contact_email?: string
  contact_phone?: string
  address?: string
}) {
  console.log("Attempting to create affiliate:", affiliateData)

  // Get current user to verify permissions
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    console.error("User authentication error:", userError)
    throw new Error("Authentication required")
  }

  // Get user profile to check role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError) {
    console.error("Profile error:", profileError)
    throw new Error("Unable to verify user permissions")
  }

  console.log("User role:", profile.role)

  if (!profile.role || !["admin", "manager"].includes(profile.role)) {
    throw new Error("Insufficient permissions to create affiliates")
  }

  const { data, error } = await supabase.from("affiliates").insert([affiliateData]).select().single()

  if (error) {
    console.error("Database error creating affiliate:", error)
    throw new Error(`Database error: ${error.message}`)
  }

  console.log("Successfully created affiliate:", data)
  return data
}

export async function updateAffiliate(
  id: string,
  updates: Partial<{
    name: string
    company_code: string
    contact_email: string
    contact_phone: string
    address: string
  }>,
) {
  const { data, error } = await supabase.from("affiliates").update(updates).eq("id", id).select().single()

  if (error) {
    console.error("Error updating affiliate:", error)
    throw error
  }

  return data
}

export async function deleteAffiliate(id: string) {
  const { error } = await supabase.from("affiliates").delete().eq("id", id)

  if (error) {
    console.error("Error deleting affiliate:", error)
    throw error
  }
}

// User/Profile operations
export async function getUsers() {
  const { data, error } = await supabase.from("profiles").select("*").order("full_name")

  if (error) {
    console.error("Error fetching users:", error)
    throw error
  }

  return data || []
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error) {
    console.error("Error fetching user profile:", error)
    throw error
  }

  return data
}

export async function updateUserRole(userId: string, role: string) {
  const { data, error } = await supabase.from("profiles").update({ role }).eq("id", userId).select().single()

  if (error) {
    console.error("Error updating user role:", error)
    throw error
  }

  return data
}

// Stakeholder operations (for future use)
export async function addStakeholder(cashCallId: string, userId: string, role = "reviewer") {
  const { data, error } = await supabase
    .from("stakeholders")
    .insert([
      {
        cash_call_id: cashCallId,
        user_id: userId,
        role: role,
      },
    ])
    .select("*")
    .single()

  if (error) {
    console.error("Error adding stakeholder:", error)
    throw new Error("Error adding stakeholder")
  }

  return data
}

export async function getStakeholders(cashCallId: string) {
  const { data, error } = await supabase
    .from("stakeholders")
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq("cash_call_id", cashCallId)

  if (error) {
    console.error("Error fetching stakeholders:", error)
    throw error
  }

  return data || []
}
