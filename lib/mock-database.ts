import type { MockUser } from "./mock-auth"

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

export interface ActivityLogEntry {
  id: string
  cash_call_id: string
  action: "created" | "submitted" | "approved" | "rejected" | "paid" | "updated"
  user_id: string
  user_name: string
  timestamp: string
  details?: string
  old_status?: string
  new_status?: string
}

export interface Attachment {
  id: string
  cash_call_id: string
  filename: string
  file_size: number
  file_type: string
  uploaded_by: string
  uploaded_at: string
  download_url: string
}

export interface Comment {
  id: string
  cash_call_id: string
  user_id: string
  user_name: string
  content: string
  created_at: string
}

export interface CashCall {
  id: string
  call_number: string
  affiliate_id: string
  amount_requested: number
  status: "draft" | "under_review" | "approved" | "paid" | "rejected"
  description?: string
  justification?: string
  created_by: string
  created_at: string
  updated_at: string
  due_date?: string
  approved_at?: string
  approved_by?: string
  paid_at?: string
  affiliate?: Affiliate
  activity_log?: ActivityLogEntry[]
  attachments?: Attachment[]
  comments?: Comment[]
}

export interface AuditLogEntry {
  id: string
  cash_call_id: string
  field_changed: string
  old_value: string
  new_value: string
  changed_by: string
  changed_by_name: string
  changed_at: string
  change_type: "create" | "update" | "status_change"
}

// Storage keys
const STORAGE_KEYS = {
  AFFILIATES: "adc_affiliates",
  CASH_CALLS: "adc_cash_calls",
  USERS: "adc_users",
  ACTIVITY_LOG: "adc_activity_log",
  ATTACHMENTS: "adc_attachments",
  COMMENTS: "adc_comments",
  AUDIT_LOG: "adc_audit_log",
}

// Default data
const defaultAffiliates: Affiliate[] = [
  {
    id: "aff-1",
    name: "Alpha Partners LLC",
    company_code: "ALPHA",
    contact_email: "contact@alphapartners.com",
    contact_phone: "+1-555-0101",
    address: "123 Business Ave, New York, NY 10001",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "aff-2",
    name: "Beta Ventures Inc",
    company_code: "BETA",
    contact_email: "info@betaventures.com",
    contact_phone: "+1-555-0102",
    address: "456 Innovation Dr, San Francisco, CA 94105",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "aff-3",
    name: "Gamma Holdings",
    company_code: "GAMMA",
    contact_email: "admin@gammaholdings.com",
    contact_phone: "+1-555-0103",
    address: "789 Corporate Blvd, Chicago, IL 60601",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
]

const defaultUsers: MockUser[] = [
  {
    id: "admin-1",
    email: "admin@aramco.com",
    full_name: "Admin User",
    role: "admin",
    company: "Aramco Digital",
    isAuthenticated: true,
  },
  {
    id: "manager-1",
    email: "manager@aramco.com",
    full_name: "Manager User",
    role: "manager",
    company: "Aramco Digital",
    isAuthenticated: true,
  },
  {
    id: "user-1",
    email: "user@aramco.com",
    full_name: "Regular User",
    role: "user",
    company: "Aramco Digital",
    isAuthenticated: true,
  },
]

// Storage utilities
class PersistentStorage {
  private isClient = typeof window !== "undefined"

  getItem<T>(key: string, defaultValue: T): T {
    if (!this.isClient) return defaultValue

    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error(`Error reading from localStorage for key ${key}:`, error)
      return defaultValue
    }
  }

  setItem<T>(key: string, value: T): void {
    if (!this.isClient) return

    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error writing to localStorage for key ${key}:`, error)
    }
  }

  removeItem(key: string): void {
    if (!this.isClient) return

    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing from localStorage for key ${key}:`, error)
    }
  }
}

const storage = new PersistentStorage()

// Simulate async operations with delays
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export class MockDatabase {
  private getAffiliatesFromStorage(): Affiliate[] {
    return storage.getItem(STORAGE_KEYS.AFFILIATES, defaultAffiliates)
  }

  private saveAffiliatesToStorage(affiliates: Affiliate[]): void {
    storage.setItem(STORAGE_KEYS.AFFILIATES, affiliates)
  }

  private getCashCallsFromStorage(): CashCall[] {
    return storage.getItem(STORAGE_KEYS.CASH_CALLS, [])
  }

  private saveCashCallsToStorage(cashCalls: CashCall[]): void {
    storage.setItem(STORAGE_KEYS.CASH_CALLS, cashCalls)
  }

  private getUsersFromStorage(): MockUser[] {
    return storage.getItem(STORAGE_KEYS.USERS, defaultUsers)
  }

  private saveUsersToStorage(users: MockUser[]): void {
    storage.setItem(STORAGE_KEYS.USERS, users)
  }

  private getActivityLogFromStorage(): ActivityLogEntry[] {
    return storage.getItem(STORAGE_KEYS.ACTIVITY_LOG, [])
  }

  private saveActivityLogToStorage(activityLog: ActivityLogEntry[]): void {
    storage.setItem(STORAGE_KEYS.ACTIVITY_LOG, activityLog)
  }

  private getAttachmentsFromStorage(): Attachment[] {
    return storage.getItem(STORAGE_KEYS.ATTACHMENTS, [])
  }

  private saveAttachmentsToStorage(attachments: Attachment[]): void {
    storage.setItem(STORAGE_KEYS.ATTACHMENTS, attachments)
  }

  private getCommentsFromStorage(): Comment[] {
    return storage.getItem(STORAGE_KEYS.COMMENTS, [])
  }

  private saveCommentsToStorage(comments: Comment[]): void {
    storage.setItem(STORAGE_KEYS.COMMENTS, comments)
  }

  private getAuditLogFromStorage(): AuditLogEntry[] {
    return storage.getItem(STORAGE_KEYS.AUDIT_LOG, [])
  }

  private saveAuditLogToStorage(auditLog: AuditLogEntry[]): void {
    storage.setItem(STORAGE_KEYS.AUDIT_LOG, auditLog)
  }

  private addAuditLogEntry(
    cashCallId: string,
    fieldChanged: string,
    oldValue: string,
    newValue: string,
    changedBy: string,
    changeType: AuditLogEntry["change_type"] = "update",
  ): void {
    const users = this.getUsersFromStorage()
    const user = users.find((u) => u.id === changedBy)
    const auditLog = this.getAuditLogFromStorage()

    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      cash_call_id: cashCallId,
      field_changed: fieldChanged,
      old_value: oldValue,
      new_value: newValue,
      changed_by: changedBy,
      changed_by_name: user?.full_name || user?.email || "Unknown User",
      changed_at: new Date().toISOString(),
      change_type: changeType,
    }

    auditLog.push(entry)
    this.saveAuditLogToStorage(auditLog)
  }

  async getAuditLog(): Promise<AuditLogEntry[]> {
    await delay(300)
    return this.getAuditLogFromStorage()
  }

  private addActivityLogEntry(
    cashCallId: string,
    action: ActivityLogEntry["action"],
    userId: string,
    details?: string,
    oldStatus?: string,
    newStatus?: string,
  ): void {
    const users = this.getUsersFromStorage()
    const user = users.find((u) => u.id === userId)
    const activityLog = this.getActivityLogFromStorage()

    const entry: ActivityLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      cash_call_id: cashCallId,
      action,
      user_id: userId,
      user_name: user?.full_name || user?.email || "Unknown User",
      timestamp: new Date().toISOString(),
      details,
      old_status: oldStatus,
      new_status: newStatus,
    }

    activityLog.push(entry)
    this.saveActivityLogToStorage(activityLog)
  }

  async getCashCalls(userId: string): Promise<CashCall[]> {
    await delay(500)
    const cashCalls = this.getCashCallsFromStorage()
    const affiliates = this.getAffiliatesFromStorage()
    const activityLog = this.getActivityLogFromStorage()
    const attachments = this.getAttachmentsFromStorage()
    const comments = this.getCommentsFromStorage()

    return cashCalls.map((call) => ({
      ...call,
      affiliate: affiliates.find((aff) => aff.id === call.affiliate_id),
      activity_log: activityLog
        .filter((log) => log.cash_call_id === call.id)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
      attachments: attachments.filter((att) => att.cash_call_id === call.id),
      comments: comments
        .filter((comment) => comment.cash_call_id === call.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    }))
  }

  async getCashCall(id: string): Promise<CashCall | null> {
    await delay(300)
    const cashCalls = this.getCashCallsFromStorage()
    const affiliates = this.getAffiliatesFromStorage()
    const activityLog = this.getActivityLogFromStorage()
    const attachments = this.getAttachmentsFromStorage()
    const comments = this.getCommentsFromStorage()

    const call = cashCalls.find((c) => c.id === id)
    if (!call) return null

    return {
      ...call,
      affiliate: affiliates.find((aff) => aff.id === call.affiliate_id),
      activity_log: activityLog
        .filter((log) => log.cash_call_id === call.id)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
      attachments: attachments.filter((att) => att.cash_call_id === call.id),
      comments: comments
        .filter((comment) => comment.cash_call_id === call.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    }
  }

  async createCashCall(data: {
    affiliate_id: string
    amount_requested: number
    description?: string
    justification?: string
    created_by: string
  }): Promise<CashCall> {
    await delay(300)

    const cashCalls = this.getCashCallsFromStorage()
    const affiliates = this.getAffiliatesFromStorage()

    const newCall: CashCall = {
      id: `cc-${Date.now()}`,
      call_number: `CC-${String(cashCalls.length + 1).padStart(3, "0")}`,
      affiliate_id: data.affiliate_id,
      amount_requested: data.amount_requested,
      status: "draft",
      description: data.description,
      justification: data.justification,
      created_by: data.created_by,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      affiliate: affiliates.find((aff) => aff.id === data.affiliate_id),
    }

    const updatedCashCalls = [newCall, ...cashCalls]
    this.saveCashCallsToStorage(updatedCashCalls)

    // Add audit log entry for creation
    this.addAuditLogEntry(newCall.id, "created", "", "Cash call created", data.created_by, "create")

    // Add activity log entry
    this.addActivityLogEntry(newCall.id, "created", data.created_by, "Cash call created")

    return newCall
  }

  async updateCashCallStatus(id: string, status: string, userId: string): Promise<CashCall> {
    await delay(300)

    const cashCalls = this.getCashCallsFromStorage()
    const affiliates = this.getAffiliatesFromStorage()
    const callIndex = cashCalls.findIndex((call) => call.id === id)

    if (callIndex === -1) throw new Error("Cash call not found")

    const oldStatus = cashCalls[callIndex].status

    // Add audit log entry for status change
    this.addAuditLogEntry(id, "status", oldStatus, status, userId, "status_change")

    const updateData: Partial<CashCall> = {
      status: status as any,
      updated_at: new Date().toISOString(),
    }

    if (status === "approved") {
      updateData.approved_at = new Date().toISOString()
      updateData.approved_by = userId
      this.addAuditLogEntry(id, "approved_by", "", userId, userId, "status_change")
    } else if (status === "paid") {
      updateData.paid_at = new Date().toISOString()
      this.addAuditLogEntry(id, "paid_at", "", new Date().toISOString(), userId, "status_change")
    }

    cashCalls[callIndex] = {
      ...cashCalls[callIndex],
      ...updateData,
      affiliate: affiliates.find((aff) => aff.id === cashCalls[callIndex].affiliate_id),
    }

    this.saveCashCallsToStorage(cashCalls)

    // Add activity log entry
    let action: ActivityLogEntry["action"] = "updated"
    const details = `Status changed from ${oldStatus} to ${status}`

    if (status === "under_review") action = "submitted"
    else if (status === "approved") action = "approved"
    else if (status === "rejected") action = "rejected"
    else if (status === "paid") action = "paid"

    this.addActivityLogEntry(id, action, userId, details, oldStatus, status)

    return cashCalls[callIndex]
  }

  async updateCashCall(id: string, updates: Partial<CashCall>, userId: string): Promise<CashCall> {
    await delay(300)

    const cashCalls = this.getCashCallsFromStorage()
    const affiliates = this.getAffiliatesFromStorage()
    const callIndex = cashCalls.findIndex((call) => call.id === id)

    if (callIndex === -1) throw new Error("Cash call not found")

    const oldCall = { ...cashCalls[callIndex] }

    // Track changes for audit log
    Object.keys(updates).forEach((key) => {
      const oldValue = oldCall[key as keyof CashCall]
      const newValue = updates[key as keyof CashCall]

      if (oldValue !== newValue) {
        this.addAuditLogEntry(id, key, String(oldValue || ""), String(newValue || ""), userId, "update")
      }
    })

    cashCalls[callIndex] = {
      ...cashCalls[callIndex],
      ...updates,
      updated_at: new Date().toISOString(),
      affiliate: affiliates.find((aff) => aff.id === cashCalls[callIndex].affiliate_id),
    }

    this.saveCashCallsToStorage(cashCalls)

    // Add activity log entry
    this.addActivityLogEntry(id, "updated", userId, "Cash call details updated")

    return cashCalls[callIndex]
  }

  async getAffiliates(): Promise<Affiliate[]> {
    await delay(300)
    return this.getAffiliatesFromStorage()
  }

  async createAffiliate(data: {
    name: string
    company_code: string
    contact_email?: string
    contact_phone?: string
    address?: string
  }): Promise<Affiliate> {
    await delay(300)

    const affiliates = this.getAffiliatesFromStorage()

    const newAffiliate: Affiliate = {
      id: `aff-${Date.now()}`,
      name: data.name,
      company_code: data.company_code,
      contact_email: data.contact_email,
      contact_phone: data.contact_phone,
      address: data.address,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const updatedAffiliates = [...affiliates, newAffiliate]
    this.saveAffiliatesToStorage(updatedAffiliates)
    return newAffiliate
  }

  async updateAffiliate(id: string, updates: Partial<Affiliate>): Promise<Affiliate> {
    await delay(300)

    const affiliates = this.getAffiliatesFromStorage()
    const index = affiliates.findIndex((aff) => aff.id === id)

    if (index === -1) throw new Error("Affiliate not found")

    affiliates[index] = {
      ...affiliates[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }

    this.saveAffiliatesToStorage(affiliates)
    return affiliates[index]
  }

  async deleteAffiliate(id: string): Promise<void> {
    await delay(300)

    const affiliates = this.getAffiliatesFromStorage()
    const index = affiliates.findIndex((aff) => aff.id === id)

    if (index === -1) throw new Error("Affiliate not found")

    affiliates.splice(index, 1)
    this.saveAffiliatesToStorage(affiliates)
  }

  async getUsers(): Promise<MockUser[]> {
    await delay(300)
    return this.getUsersFromStorage()
  }

  async updateUserRole(userId: string, role: string): Promise<MockUser> {
    await delay(300)

    const users = this.getUsersFromStorage()
    const index = users.findIndex((user) => user.id === userId)

    if (index === -1) throw new Error("User not found")

    users[index] = {
      ...users[index],
      role: role as any,
    }

    this.saveUsersToStorage(users)
    return users[index]
  }

  async deleteUser(userId: string): Promise<void> {
    await delay(300)

    const users = this.getUsersFromStorage()
    const index = users.findIndex((user) => user.id === userId)

    if (index === -1) throw new Error("User not found")

    users.splice(index, 1)
    this.saveUsersToStorage(users)
  }

  // Mock file upload
  async uploadAttachment(
    cashCallId: string,
    file: { name: string; size: number; type: string },
    userId: string,
  ): Promise<Attachment> {
    await delay(500)

    const attachments = this.getAttachmentsFromStorage()
    const newAttachment: Attachment = {
      id: `att-${Date.now()}`,
      cash_call_id: cashCallId,
      filename: file.name,
      file_size: file.size,
      file_type: file.type,
      uploaded_by: userId,
      uploaded_at: new Date().toISOString(),
      download_url: `/placeholder-file/${file.name}`, // Mock URL
    }

    attachments.push(newAttachment)
    this.saveAttachmentsToStorage(attachments)

    // Add activity log entry
    this.addActivityLogEntry(cashCallId, "updated", userId, `Uploaded attachment: ${file.name}`)

    return newAttachment
  }

  async addComment(cashCallId: string, userId: string, content: string): Promise<Comment> {
    await delay(300)

    const users = this.getUsersFromStorage()
    const user = users.find((u) => u.id === userId)
    const comments = this.getCommentsFromStorage()

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      cash_call_id: cashCallId,
      user_id: userId,
      user_name: user?.full_name || user?.email || "Unknown User",
      content,
      created_at: new Date().toISOString(),
    }

    comments.push(newComment)
    this.saveCommentsToStorage(comments)

    // Add activity log entry
    this.addActivityLogEntry(cashCallId, "updated", userId, "Added a comment")

    return newComment
  }

  // Utility methods
  clearAllData(): void {
    storage.removeItem(STORAGE_KEYS.AFFILIATES)
    storage.removeItem(STORAGE_KEYS.CASH_CALLS)
    storage.removeItem(STORAGE_KEYS.USERS)
    storage.removeItem(STORAGE_KEYS.ACTIVITY_LOG)
    storage.removeItem(STORAGE_KEYS.ATTACHMENTS)
    storage.removeItem(STORAGE_KEYS.COMMENTS)
    storage.removeItem(STORAGE_KEYS.AUDIT_LOG)
  }

  resetToDefaults(): void {
    this.saveAffiliatesToStorage(defaultAffiliates)
    this.saveCashCallsToStorage([])
    this.saveUsersToStorage(defaultUsers)
    this.saveActivityLogToStorage([])
    this.saveAttachmentsToStorage([])
    this.saveCommentsToStorage([])
    this.saveAuditLogToStorage([])
  }
}

export const mockDb = new MockDatabase()
