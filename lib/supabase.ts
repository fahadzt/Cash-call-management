import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Types for our database
export interface Profile {
  id: string
  email: string
  full_name?: string
  role: "admin" | "manager" | "user"
  company?: string
  created_at: string
  updated_at: string
}

export interface Affiliate {
  id: string
  name: string
  company_code: string
  contact_email?: string
  contact_phone?: string
  address?: string
  created_at: string
  updated_at: string
}

export interface CashCall {
  id: string
  call_number: string
  affiliate_id: string
  amount_requested: number
  status: "draft" | "under_review" | "approved" | "paid" | "rejected"
  description?: string
  created_by: string
  created_at: string
  updated_at: string
  due_date?: string
  approved_at?: string
  approved_by?: string
  paid_at?: string
  // Relations
  affiliate?: Affiliate
  stakeholders?: Stakeholder[]
}

export interface Stakeholder {
  id: string
  cash_call_id: string
  user_id: string
  role: "reviewer" | "approver" | "observer"
  assigned_at: string
  // Relations
  profile?: Profile
}
