export interface ChecklistItem {
  id: string
  itemNo: string
  documentList: string
  status: string
  created_at: string
  updated_at: string
}

export interface ChecklistGroup {
  id: string
  name: string
  items: ChecklistItem[]
  created_at: string
  updated_at: string
}

export interface AffiliateChecklist {
  id: string
  affiliate_id: string
  affiliate_name: string
  groups: ChecklistGroup[]
  created_at: string
  updated_at: string
}

export interface StatusOption {
  id: string
  label: string
  color: string
  description?: string
  created_at: string
}

// Storage keys
const CHECKLIST_STORAGE_KEY = "adc_checklists"
const STATUS_OPTIONS_STORAGE_KEY = "adc_status_options"

// Default status options
const defaultStatusOptions: StatusOption[] = [
  { id: "not_started", label: "Not Started", color: "gray", created_at: new Date().toISOString() },
  { id: "in_progress", label: "In Progress", color: "yellow", created_at: new Date().toISOString() },
  { id: "under_review", label: "Under Review", color: "blue", created_at: new Date().toISOString() },
  { id: "needs_revision", label: "Needs Revision", color: "orange", created_at: new Date().toISOString() },
  { id: "on_hold", label: "On Hold", color: "purple", created_at: new Date().toISOString() },
  { id: "approved", label: "Approved", color: "green", created_at: new Date().toISOString() },
  { id: "completed", label: "Completed", color: "green", created_at: new Date().toISOString() },
  { id: "rejected", label: "Rejected", color: "red", created_at: new Date().toISOString() },
  { id: "blocked", label: "Blocked", color: "red", created_at: new Date().toISOString() },
  { id: "pending_info", label: "Pending Information", color: "orange", created_at: new Date().toISOString() },
  { id: "waiting_approval", label: "Waiting for Approval", color: "blue", created_at: new Date().toISOString() },
  { id: "escalated", label: "Escalated", color: "red", created_at: new Date().toISOString() },
]

// Standardized checklist items
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
  nextEra: [
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

class ChecklistDatabase {
  private isClient = typeof window !== "undefined"

  private getChecklists(): AffiliateChecklist[] {
    if (!this.isClient) return []
    try {
      const stored = localStorage.getItem(CHECKLIST_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Error reading checklists from localStorage:", error)
      return []
    }
  }

  private saveChecklists(checklists: AffiliateChecklist[]): void {
    if (!this.isClient) return
    try {
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(checklists))
    } catch (error) {
      console.error("Error saving checklists to localStorage:", error)
    }
  }

  private getStoredStatusOptions(): StatusOption[] {
    if (!this.isClient) return defaultStatusOptions
    try {
      const stored = localStorage.getItem(STATUS_OPTIONS_STORAGE_KEY)
      if (!stored) {
        this.saveStatusOptions(defaultStatusOptions)
        return defaultStatusOptions
      }
      return JSON.parse(stored)
    } catch (error) {
      console.error("Error reading status options from localStorage:", error)
      return defaultStatusOptions
    }
  }

  private saveStatusOptions(statusOptions: StatusOption[]): void {
    if (!this.isClient) return
    try {
      localStorage.setItem(STATUS_OPTIONS_STORAGE_KEY, JSON.stringify(statusOptions))
    } catch (error) {
      console.error("Error saving status options to localStorage:", error)
    }
  }

  private generateStandardItems(
    groupType: "aramcoDigital" | "businessProponent" | "nextEra",
    timestamp: string,
  ): ChecklistItem[] {
    return standardChecklistItems[groupType].map((item, index) => ({
      id: `item-${groupType}-${timestamp}-${index + 1}`,
      ...item,
      created_at: timestamp,
      updated_at: timestamp,
    }))
  }

  async getAllChecklists(): Promise<AffiliateChecklist[]> {
    await new Promise((resolve) => setTimeout(resolve, 100))
    const checklists = this.getChecklists()

    // If no checklists exist, create a sample one
    if (checklists.length === 0) {
      const sampleChecklist = await this.createSampleChecklist()
      return [sampleChecklist]
    }

    return checklists
  }

  async getChecklistByAffiliate(affiliateId: string): Promise<AffiliateChecklist | null> {
    await new Promise((resolve) => setTimeout(resolve, 50))
    const checklists = this.getChecklists()
    return checklists.find((c) => c.affiliate_id === affiliateId) || null
  }

  async getStatusOptions(): Promise<StatusOption[]> {
    await new Promise((resolve) => setTimeout(resolve, 50))
    return this.getStoredStatusOptions()
  }

  async createStatusOption(label: string, color: string, description?: string): Promise<StatusOption> {
    await new Promise((resolve) => setTimeout(resolve, 100))
    const statusOptions = this.getStoredStatusOptions()
    const newOption: StatusOption = {
      id: `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      label: label.trim(),
      color,
      description: description?.trim() || undefined,
      created_at: new Date().toISOString(),
    }
    statusOptions.push(newOption)
    this.saveStatusOptions(statusOptions)
    return newOption
  }

  async updateStatusOption(
    id: string,
    updates: Partial<Omit<StatusOption, "id" | "created_at">>,
  ): Promise<StatusOption> {
    await new Promise((resolve) => setTimeout(resolve, 100))
    const statusOptions = this.getStoredStatusOptions()
    const index = statusOptions.findIndex((option) => option.id === id)
    if (index === -1) throw new Error("Status option not found")

    statusOptions[index] = { ...statusOptions[index], ...updates }
    this.saveStatusOptions(statusOptions)
    return statusOptions[index]
  }

  async deleteStatusOption(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100))
    const statusOptions = this.getStoredStatusOptions()
    const filteredOptions = statusOptions.filter((option) => option.id !== id)
    if (filteredOptions.length === statusOptions.length) {
      throw new Error("Status option not found")
    }
    this.saveStatusOptions(filteredOptions)
  }

  async createAffiliateChecklist(affiliateId: string, affiliateName: string): Promise<AffiliateChecklist> {
    await new Promise((resolve) => setTimeout(resolve, 200))
    const checklists = this.getChecklists()

    // Check if checklist already exists
    const existing = checklists.find((c) => c.affiliate_id === affiliateId)
    if (existing) {
      throw new Error("Checklist already exists for this affiliate")
    }

    const timestamp = new Date().toISOString()
    const uniqueId = Date.now().toString()

    const groupsToCreate: ChecklistGroup[] = [
      {
        id: `group-aramco-${uniqueId}`,
        name: "Aramco Digital Company",
        items: this.generateStandardItems("aramcoDigital", timestamp),
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: `group-business-${uniqueId}`,
        name: "Business Proponent - T&I Affiliate Affairs",
        items: this.generateStandardItems("businessProponent", timestamp),
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: `group-nextera-${uniqueId}`,
        name: "2nd Tiered Affiliate - NextEra",
        items: this.generateStandardItems("nextEra", timestamp),
        created_at: timestamp,
        updated_at: timestamp,
      },
    ]

    const newChecklist: AffiliateChecklist = {
      id: `checklist-${uniqueId}`,
      affiliate_id: affiliateId,
      affiliate_name: affiliateName,
      groups: groupsToCreate,
      created_at: timestamp,
      updated_at: timestamp,
    }

    checklists.push(newChecklist)
    this.saveChecklists(checklists)
    return newChecklist
  }

  private async createSampleChecklist(): Promise<AffiliateChecklist> {
    const timestamp = new Date().toISOString()
    const uniqueId = Date.now().toString()

    const groupsToCreate: ChecklistGroup[] = [
      {
        id: `group-aramco-${uniqueId}`,
        name: "Aramco Digital Company",
        items: this.generateStandardItems("aramcoDigital", timestamp),
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: `group-business-${uniqueId}`,
        name: "Business Proponent - T&I Affiliate Affairs",
        items: this.generateStandardItems("businessProponent", timestamp),
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: `group-nextera-${uniqueId}`,
        name: "2nd Tiered Affiliate - NextEra",
        items: this.generateStandardItems("nextEra", timestamp),
        created_at: timestamp,
        updated_at: timestamp,
      },
    ]

    const sampleChecklist: AffiliateChecklist = {
      id: `checklist-${uniqueId}`,
      affiliate_id: "sample-affiliate",
      affiliate_name: "Sample Affiliate",
      groups: groupsToCreate,
      created_at: timestamp,
      updated_at: timestamp,
    }

    const checklists = this.getChecklists()
    checklists.push(sampleChecklist)
    this.saveChecklists(checklists)
    return sampleChecklist
  }

  async updateChecklistItem(
    checklistId: string,
    groupId: string,
    itemId: string,
    updates: Partial<ChecklistItem>,
  ): Promise<ChecklistItem> {
    await new Promise((resolve) => setTimeout(resolve, 100))
    const checklists = this.getChecklists()
    const checklistIndex = checklists.findIndex((c) => c.id === checklistId)
    if (checklistIndex === -1) throw new Error("Checklist not found")

    const groupIndex = checklists[checklistIndex].groups.findIndex((g) => g.id === groupId)
    if (groupIndex === -1) throw new Error("Group not found")

    const itemIndex = checklists[checklistIndex].groups[groupIndex].items.findIndex((i) => i.id === itemId)
    if (itemIndex === -1) throw new Error("Item not found")

    checklists[checklistIndex].groups[groupIndex].items[itemIndex] = {
      ...checklists[checklistIndex].groups[groupIndex].items[itemIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    }

    checklists[checklistIndex].updated_at = new Date().toISOString()
    this.saveChecklists(checklists)
    return checklists[checklistIndex].groups[groupIndex].items[itemIndex]
  }

  async addChecklistItem(
    checklistId: string,
    groupId: string,
    item: Omit<ChecklistItem, "id">,
  ): Promise<ChecklistItem> {
    await new Promise((resolve) => setTimeout(resolve, 100))
    const checklists = this.getChecklists()
    const checklistIndex = checklists.findIndex((c) => c.id === checklistId)
    if (checklistIndex === -1) throw new Error("Checklist not found")

    const groupIndex = checklists[checklistIndex].groups.findIndex((g) => g.id === groupId)
    if (groupIndex === -1) throw new Error("Group not found")

    const newItem: ChecklistItem = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }

    checklists[checklistIndex].groups[groupIndex].items.push(newItem)
    checklists[checklistIndex].updated_at = new Date().toISOString()
    this.saveChecklists(checklists)
    return newItem
  }

  async deleteChecklistItem(checklistId: string, groupId: string, itemId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100))
    const checklists = this.getChecklists()
    const checklistIndex = checklists.findIndex((c) => c.id === checklistId)
    if (checklistIndex === -1) throw new Error("Checklist not found")

    const groupIndex = checklists[checklistIndex].groups.findIndex((g) => g.id === groupId)
    if (groupIndex === -1) throw new Error("Group not found")

    checklists[checklistIndex].groups[groupIndex].items = checklists[checklistIndex].groups[groupIndex].items.filter(
      (item) => item.id !== itemId,
    )

    checklists[checklistIndex].updated_at = new Date().toISOString()
    this.saveChecklists(checklists)
  }

  async deleteAffiliateChecklist(checklistId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100))
    const checklists = this.getChecklists()
    const filteredChecklists = checklists.filter((c) => c.id !== checklistId)
    this.saveChecklists(filteredChecklists)
  }

  async updateAffiliateChecklistName(checklistId: string, newName: string): Promise<AffiliateChecklist> {
    await new Promise((resolve) => setTimeout(resolve, 100))
    const checklists = this.getChecklists()
    const checklistIndex = checklists.findIndex((c) => c.id === checklistId)
    if (checklistIndex === -1) throw new Error("Checklist not found")

    checklists[checklistIndex].affiliate_name = newName
    checklists[checklistIndex].updated_at = new Date().toISOString()
    this.saveChecklists(checklists)
    return checklists[checklistIndex]
  }

  async updateGroupName(checklistId: string, groupId: string, newName: string): Promise<ChecklistGroup> {
    await new Promise((resolve) => setTimeout(resolve, 100))
    const checklists = this.getChecklists()
    const checklistIndex = checklists.findIndex((c) => c.id === checklistId)
    if (checklistIndex === -1) throw new Error("Checklist not found")

    const groupIndex = checklists[checklistIndex].groups.findIndex((g) => g.id === groupId)
    if (groupIndex === -1) throw new Error("Group not found")

    checklists[checklistIndex].groups[groupIndex].name = newName
    checklists[checklistIndex].groups[groupIndex].updated_at = new Date().toISOString()
    checklists[checklistIndex].updated_at = new Date().toISOString()
    this.saveChecklists(checklists)
    return checklists[checklistIndex].groups[groupIndex]
  }

  async getCurrentNextEraItems(): Promise<{
    groups: Array<{ name: string; items: Array<{ itemNo: string; documentList: string }> }>
  } | null> {
    await new Promise((resolve) => setTimeout(resolve, 50))
    const checklists = this.getChecklists()
    const nextEraChecklist = checklists.find((checklist) =>
      checklist.groups.some((group) => group.name === "2nd Tiered Affiliate - NextEra"),
    )

    if (!nextEraChecklist) {
      return null
    }

    return {
      groups: nextEraChecklist.groups.map((group) => ({
        name: group.name,
        items: group.items.map((item) => ({
          itemNo: item.itemNo,
          documentList: item.documentList,
        })),
      })),
    }
  }

  clearAllChecklists(): void {
    if (this.isClient) {
      localStorage.removeItem(CHECKLIST_STORAGE_KEY)
    }
  }

  clearAllStatusOptions(): void {
    if (this.isClient) {
      localStorage.removeItem(STATUS_OPTIONS_STORAGE_KEY)
    }
  }

  async standardizeExistingChecklists(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 200))
    const checklists = this.getChecklists()
    const timestamp = new Date().toISOString()

    const updatedChecklists = checklists.map((checklist) => ({
      ...checklist,
      groups: checklist.groups.map((group, groupIndex) => {
        let standardItems: ChecklistItem[] = []

        switch (groupIndex) {
          case 0:
            standardItems = this.generateStandardItems("aramcoDigital", timestamp)
            break
          case 1:
            standardItems = this.generateStandardItems("businessProponent", timestamp)
            break
          case 2:
            standardItems = this.generateStandardItems("nextEra", timestamp)
            break
          default:
            standardItems = group.items
        }

        return {
          ...group,
          items: standardItems,
          updated_at: timestamp,
        }
      }),
      updated_at: timestamp,
    }))

    this.saveChecklists(updatedChecklists)
  }
}

export const checklistDb = new ChecklistDatabase()
