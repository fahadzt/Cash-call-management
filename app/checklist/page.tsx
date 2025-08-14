"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import {
  Plus,
  LogOut,
  RefreshCw,
  CheckSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Save,
  X,
  FolderSyncIcon as Sync,
} from "lucide-react"
import { useAuth } from "@/lib/firebase-auth-context"
import { getAffiliates, type Affiliate } from "@/lib/firebase-database"
import {
  getAllChecklists, 
  getChecklistByAffiliate, 
  createAffiliateChecklist,
  updateChecklistItem,
  addChecklistItem,
  deleteChecklistItem,
  deleteAffiliateChecklist,
  updateAffiliateChecklistName,
  updateGroupName,
  getStatusOptions,
  createStatusOption,
  updateStatusOption,
  deleteStatusOption,
  standardizeExistingChecklists,
  type AffiliateChecklist,
  type ChecklistItem,
  type ChecklistGroup,
  type StatusOption
} from "@/lib/firebase-database"
import { AdminSettings } from "@/components/admin-settings"
import { ErrorBoundary } from "@/components/error-boundary"
import { AnimatedLoading } from "@/components/animated-loading"

export default function ChecklistPage() {
  const { user, userProfile, signOut } = useAuth()
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [checklists, setChecklists] = useState<AffiliateChecklist[]>([])
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([])
  const [activeTab, setActiveTab] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  // Add this state near the other state declarations
  const [currentNextEraItems, setCurrentNextEraItems] = useState<{
    groups: Array<{ name: string; items: Array<{ itemNo: string; documentList: string }> }>
  } | null>(null)

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [affiliateFilter, setAffiliateFilter] = useState("all")
  const [expandedChecklists, setExpandedChecklists] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'tabs' | 'stacked'>('stacked')

  // Bulk update states
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false)
  const [bulkUpdateStatus, setBulkUpdateStatus] = useState("")

  // Dialog states
  const [isAddAffiliateOpen, setIsAddAffiliateOpen] = useState(false)
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [isStandardizeOpen, setIsStandardizeOpen] = useState(false)
  const [selectedAffiliateId, setSelectedAffiliateId] = useState("")
  const [newAffiliateName, setNewAffiliateName] = useState("")

  // Editing states
  const [editingItem, setEditingItem] = useState<{ checklistId: string; groupId: string; itemId: string } | null>(null)
  const [editingValues, setEditingValues] = useState<{ itemNo: string; documentList: string; status: string }>({
    itemNo: "",
    documentList: "",
    status: "",
  })

  // Group editing states
  const [editingGroup, setEditingGroup] = useState<{ checklistId: string; groupId: string } | null>(null)
  const [editingGroupName, setEditingGroupName] = useState("")

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    
    if (user) {
      loadData()
    }
  }, [user, router])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError("")
      setIsRefreshing(true)

      const [affiliatesData, checklistsData, statusOptionsData] = await Promise.all([
        getAffiliates(),
        getAllChecklists(),
        getStatusOptions(),
      ])

      setAffiliates(affiliatesData)
      setChecklists(checklistsData)
      setStatusOptions(statusOptionsData)

      // Set active tab to first checklist if available
      if (checklistsData.length > 0 && !activeTab) {
        setActiveTab(checklistsData[0].id)
      }

      // Get current NextEra items separately to avoid blocking
      try {
        const nextEraItems = await getChecklistByAffiliate("NextEra") // Assuming NextEra is the affiliate ID for standard items
        setCurrentNextEraItems(nextEraItems)
      } catch (err) {
        console.error("Error loading NextEra items:", err)
      }
    } catch (err) {
      console.error("Error loading data:", err)
      setError("Failed to load data. Please try refreshing the page.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push("/")
  }

  const handleRefresh = () => {
    if (user) {
      loadData()
    }
  }

  // Filter and search functions
  const filteredChecklists = checklists.filter(checklist => {
    // Affiliate filter
    if (affiliateFilter !== 'all' && checklist.affiliate_id !== affiliateFilter) {
      return false
    }

    // Search filter - check checklist name, group names, and item content
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const checklistNameMatch = checklist.affiliate_name?.toLowerCase().includes(searchLower) || false
      const groupMatch = checklist.groups.some(group => 
        group.name.toLowerCase().includes(searchLower) ||
        group.items.some(item => 
          item.itemNo.toLowerCase().includes(searchLower) ||
          item.documentList.toLowerCase().includes(searchLower) ||
          item.status.toLowerCase().includes(searchLower)
        )
      )
      
      if (!checklistNameMatch && !groupMatch) {
        return false
      }
    }

    return true
  })

  const toggleChecklistExpansion = (checklistId: string) => {
    const newExpanded = new Set(expandedChecklists)
    if (newExpanded.has(checklistId)) {
      newExpanded.delete(checklistId)
    } else {
      newExpanded.add(checklistId)
    }
    setExpandedChecklists(newExpanded)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setAffiliateFilter("all")
  }

  const handleAddAffiliate = async () => {
    const selectedAffiliate = affiliates.find((a) => a.id === selectedAffiliateId)
    if (!selectedAffiliate) {
      setError("Please select an affiliate")
      return
    }

    try {
      setError("")
      const newChecklist = await createAffiliateChecklist(selectedAffiliate.id, selectedAffiliate.name)
      setChecklists([...checklists, newChecklist])
      setActiveTab(selectedAffiliate.id)
      setIsAddAffiliateOpen(false)
      setSelectedAffiliateId("")
      setSuccess("Affiliate checklist created successfully with current NextEra items")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      console.error("Error creating affiliate checklist:", err)
      setError(err instanceof Error ? err.message : "Failed to create affiliate checklist")
    }
  }

  const handleStandardizeChecklists = async () => {
    try {
      setError("")
      setIsRefreshing(true)
      await standardizeExistingChecklists()
      await loadData() // Reload data to show updated checklists
      setIsStandardizeOpen(false)
      setSuccess("All checklists have been standardized with the latest items")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error standardizing checklists:", err)
      setError("Failed to standardize checklists")
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleRenameAffiliate = async () => {
    if (!newAffiliateName.trim()) {
      setError("Please enter a valid name")
      return
    }

    const checklist = checklists.find((c) => c.affiliate_id === activeTab)
    if (!checklist) return

    try {
      setError("")
      const updatedChecklist = await updateAffiliateChecklistName(checklist.id, newAffiliateName.trim())
      setChecklists(checklists.map((c) => (c.id === checklist.id ? updatedChecklist : c)))
      setIsRenameOpen(false)
      setNewAffiliateName("")
      setSuccess("Affiliate name updated successfully")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error renaming affiliate:", err)
      setError("Failed to rename affiliate")
    }
  }

  const handleDeleteAffiliate = async (checklistId: string) => {
    if (!confirm("Are you sure you want to delete this affiliate checklist? This action cannot be undone.")) {
      return
    }

    try {
      setError("")
      await deleteAffiliateChecklist(checklistId)
      const updatedChecklists = checklists.filter((c) => c.id !== checklistId)
      setChecklists(updatedChecklists)

      // Update active tab if the deleted one was active
      if (updatedChecklists.length > 0) {
        setActiveTab(updatedChecklists[0].affiliate_id)
      } else {
        setActiveTab("")
      }

      setSuccess("Affiliate checklist deleted successfully")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error deleting affiliate checklist:", err)
      setError("Failed to delete affiliate checklist")
    }
  }

  const handleUpdateItemStatus = async (checklistId: string, groupId: string, itemId: string, newStatus: string) => {
    try {
      setError("")
      const updatedItem = await updateChecklistItem(checklistId, groupId, itemId, {
        status: newStatus,
      })

      // Update local state
      setChecklists(
        checklists.map((checklist) =>
          checklist.id === checklistId
            ? {
                ...checklist,
                groups: checklist.groups.map((group) =>
                  group.id === groupId
                    ? {
                        ...group,
                        items: group.items.map((item) => (item.id === itemId ? updatedItem : item)),
                      }
                    : group,
                ),
              }
            : checklist,
        ),
      )
    } catch (err) {
      console.error("Error updating item status:", err)
      setError("Failed to update item status")
    }
  }

  const handleStartEdit = (checklistId: string, groupId: string, item: ChecklistItem) => {
    setEditingItem({ checklistId, groupId, itemId: item.id })
    setEditingValues({
      itemNo: item.itemNo,
      documentList: item.documentList,
      status: item.status,
    })
  }

  const handleSaveEdit = async () => {
    if (!editingItem) return

    try {
      setError("")
      const updatedItem = await updateChecklistItem(
        editingItem.checklistId,
        editingItem.groupId,
        editingItem.itemId,
        {
          itemNo: editingValues.itemNo,
          documentList: editingValues.documentList,
          status: editingValues.status,
        },
      )

      // Update local state
      setChecklists(
        checklists.map((checklist) =>
          checklist.id === editingItem.checklistId
            ? {
                ...checklist,
                groups: checklist.groups.map((group) =>
                  group.id === editingItem.groupId
                    ? {
                        ...group,
                        items: group.items.map((item) => (item.id === editingItem.itemId ? updatedItem : item)),
                      }
                    : group,
                ),
              }
            : checklist,
        ),
      )

      setEditingItem(null)
      setSuccess("Item updated successfully")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error updating item:", err)
      setError("Failed to update item")
    }
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
    setEditingValues({ itemNo: "", documentList: "", status: "" })
  }

  const handleAddItem = async (checklistId: string, groupId: string) => {
    const checklist = checklists.find((c) => c.id === checklistId)
    const group = checklist?.groups.find((g) => g.id === groupId)
    if (!group) return

    const nextItemNo = (group.items.length + 1).toString()

    try {
      setError("")
      const newItem = await addChecklistItem(checklistId, groupId, {
        itemNo: nextItemNo,
        documentList: "New Document",
        status: "Not Started",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      // Update local state
      setChecklists(
        checklists.map((checklist) =>
          checklist.id === checklistId
            ? {
                ...checklist,
                groups: checklist.groups.map((group) =>
                  group.id === groupId ? { ...group, items: [...group.items, newItem] } : group,
                ),
              }
            : checklist,
        ),
      )

      setSuccess("Item added successfully")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error adding item:", err)
      setError("Failed to add item")
    }
  }

  const handleDeleteItem = async (checklistId: string, groupId: string, itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) {
      return
    }

    try {
      setError("")
      await deleteChecklistItem(checklistId, groupId, itemId)

      // Update local state
      setChecklists(
        checklists.map((checklist) =>
          checklist.id === checklistId
            ? {
                ...checklist,
                groups: checklist.groups.map((group) =>
                  group.id === groupId ? { ...group, items: group.items.filter((item) => item.id !== itemId) } : group,
                ),
              }
            : checklist,
        ),
      )

      setSuccess("Item deleted successfully")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error deleting item:", err)
      setError("Failed to delete item")
    }
  }

  const handleStartGroupEdit = (checklistId: string, groupId: string, currentName: string) => {
    setEditingGroup({ checklistId, groupId })
    setEditingGroupName(currentName)
  }

  const handleSaveGroupEdit = async () => {
    if (!editingGroup || !editingGroupName.trim()) return

    try {
      setError("")
      const updatedGroup = await updateGroupName(
        editingGroup.checklistId,
        editingGroup.groupId,
        editingGroupName.trim(),
      )

      // Update local state
      setChecklists(
        checklists.map((checklist) =>
          checklist.id === editingGroup.checklistId
            ? {
                ...checklist,
                groups: checklist.groups.map((group) => (group.id === editingGroup.groupId ? updatedGroup : group)),
              }
            : checklist,
        ),
      )

      setEditingGroup(null)
      setEditingGroupName("")
      setSuccess("Group name updated successfully")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error updating group name:", err)
      setError("Failed to update group name")
    }
  }

  const handleCancelGroupEdit = () => {
    setEditingGroup(null)
    setEditingGroupName("")
  }

  const getStatusBadgeClass = (status: string) => {
    const statusOption = statusOptions.find((option) => option.label === status)
    if (statusOption) {
      switch (statusOption.color) {
        case "gray":
          return "bg-gray-100 text-gray-800 border-gray-200"
        case "yellow":
          return "bg-yellow-100 text-yellow-800 border-yellow-200"
        case "blue":
          return "bg-blue-100 text-blue-800 border-blue-200"
        case "green":
          return "bg-green-100 text-green-800 border-green-200"
        case "red":
          return "bg-red-100 text-red-800 border-red-200"
        case "orange":
          return "bg-orange-100 text-orange-800 border-orange-200"
        case "purple":
          return "bg-purple-100 text-purple-800 border-purple-200"
        default:
          return "bg-gray-100 text-gray-800 border-gray-200"
      }
    }

    // Fallback to intelligent detection for custom statuses
    const lowerStatus = status.toLowerCase()
    if (lowerStatus.includes("not started") || lowerStatus.includes("pending") || lowerStatus.includes("todo")) {
      return "bg-gray-100 text-gray-800 border-gray-200"
    } else if (lowerStatus.includes("progress") || lowerStatus.includes("working") || lowerStatus.includes("review")) {
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    } else if (lowerStatus.includes("completed") || lowerStatus.includes("done") || lowerStatus.includes("finished")) {
      return "bg-green-100 text-green-800 border-green-200"
    } else if (lowerStatus.includes("blocked") || lowerStatus.includes("issue") || lowerStatus.includes("problem")) {
      return "bg-red-100 text-red-800 border-red-200"
    } else if (lowerStatus.includes("approved") || lowerStatus.includes("verified")) {
      return "bg-blue-100 text-blue-800 border-blue-200"
    } else {
      return "bg-purple-100 text-purple-800 border-purple-200"
    }
  }

  const getStatusIcon = (status: string) => {
    const lowerStatus = status.toLowerCase()
    if (lowerStatus.includes("not started") || lowerStatus.includes("pending") || lowerStatus.includes("todo")) {
      return <AlertCircle className="h-4 w-4" />
    } else if (lowerStatus.includes("progress") || lowerStatus.includes("working") || lowerStatus.includes("review")) {
      return <Clock className="h-4 w-4" />
    } else if (lowerStatus.includes("completed") || lowerStatus.includes("done") || lowerStatus.includes("finished")) {
      return <CheckCircle className="h-4 w-4" />
    } else {
      return <CheckSquare className="h-4 w-4" />
    }
  }

  const getProgressStats = (checklist: AffiliateChecklist) => {
    const totalItems = checklist.groups.reduce((sum, group) => sum + group.items.length, 0)

    // Check for completed items using status options or fallback to text matching
    const completedItems = checklist.groups.reduce(
      (sum, group) =>
        sum +
        group.items.filter((item) => {
          // First check if we have a status option that indicates completion
          const statusOption = statusOptions.find((option) => option.label === item.status)
          if (statusOption) {
            // Consider green status as completed, or check for completion keywords in label
            return (
              statusOption.color === "green" ||
              statusOption.label.toLowerCase().includes("completed") ||
              statusOption.label.toLowerCase().includes("done") ||
              statusOption.label.toLowerCase().includes("finished") ||
              statusOption.label.toLowerCase().includes("approved")
            )
          }

          // Fallback to text matching for custom statuses
          const lowerStatus = item.status.toLowerCase()
          return (
            lowerStatus.includes("completed") ||
            lowerStatus.includes("done") ||
            lowerStatus.includes("finished") ||
            lowerStatus.includes("approved") ||
            lowerStatus.includes("received")
          )
        }).length,
      0,
    )

    const inProgressItems = checklist.groups.reduce(
      (sum, group) =>
        sum +
        group.items.filter((item) => {
          // First check if we have a status option that indicates in progress
          const statusOption = statusOptions.find((option) => option.label === item.status)
          if (statusOption) {
            // Consider yellow/orange status as in progress
            return (
              statusOption.color === "yellow" ||
              statusOption.color === "orange" ||
              statusOption.label.toLowerCase().includes("progress") ||
              statusOption.label.toLowerCase().includes("working") ||
              statusOption.label.toLowerCase().includes("review")
            )
          }

          // Fallback to text matching
          const lowerStatus = item.status.toLowerCase()
          return (
            lowerStatus.includes("progress") ||
            lowerStatus.includes("working") ||
            lowerStatus.includes("review") ||
            lowerStatus.includes("pending")
          )
        }).length,
      0,
    )

    return { totalItems, completedItems, inProgressItems }
  }

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const handleSelectAllItems = (checklist: AffiliateChecklist) => {
    const allItemIds = checklist.groups.flatMap((group) => group.items.map((item) => item.id))
    if (selectedItems.size === allItemIds.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(allItemIds))
    }
  }

  const handleBulkStatusUpdate = async () => {
    if (!bulkUpdateStatus || selectedItems.size === 0) {
      setError("Please select items and a status")
      return
    }

    try {
      setError("")
      const activeChecklistData = checklists.find((c) => c.affiliate_id === activeTab)
      if (!activeChecklistData) return

      // Update all selected items
      const updatePromises: Promise<any>[] = []

      for (const itemId of selectedItems) {
        for (const group of activeChecklistData.groups) {
          const item = group.items.find((i) => i.id === itemId)
          if (item) {
            updatePromises.push(
              updateChecklistItem(activeChecklistData.id, group.id, itemId, {
                status: bulkUpdateStatus,
              }),
            )
          }
        }
      }

      await Promise.all(updatePromises)

      // Reload data to reflect changes
      await loadData()

      setSelectedItems(new Set())
      setIsBulkUpdateOpen(false)
      setBulkUpdateStatus("")
      setSuccess(`Updated ${selectedItems.size} items successfully`)
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error bulk updating items:", err)
      setError("Failed to update items")
    }
  }

  // Get available affiliates that don't have checklists yet
  const availableAffiliates = affiliates.filter(
    (affiliate) => !checklists.some((checklist) => checklist.affiliate_id === affiliate.id),
  )

  if (isLoading) {
    return <AnimatedLoading message="Loading Checklists..." />
  }

  if (!user) {
    return null
  }

  const activeChecklist = checklists.find((c) => c.affiliate_id === activeTab)

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
            <div className="px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-6">
                <Image
                  src="/images/aramco-digital-new.png"
                  alt="Aramco Digital"
                  width={200}
                  height={60}
                  className="h-10 w-auto"
                />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0033A0] to-[#00A3E0] bg-clip-text text-transparent flex items-center gap-2">
                    {activeTab && (
                      <Button
                        onClick={() => setActiveTab("")}
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto text-[#0033A0] hover:text-[#00A3E0] hover:bg-transparent"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </Button>
                    )}
                    {activeTab ? 'Checklist Details' : 'Affiliate Checklist Management'}
                  </h1>
                  <p className="text-gray-600">
                    Welcome back, {user.full_name || user.email} •{" "}
                    {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AdminSettings currentUser={user} />
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  size="sm"
                  className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10 bg-transparent"
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button
                  onClick={() => router.push("/dashboard")}
                  variant="outline"
                  size="sm"
                  className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10 bg-transparent"
                >
                  Dashboard
                </Button>
                <Button
                  onClick={handleLogout}
                  className="border border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10 bg-transparent enhanced-button"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </header>

          {/* Error/Success Messages */}
          {error && (
            <div className="mx-6 mt-6 mb-4">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                  <Button
                    onClick={() => setError("")}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                  >
                    ×
                  </Button>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mx-6 mt-6 mb-4">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <p className="text-green-400 text-sm">{success}</p>
                  </div>
                  <Button
                    onClick={() => setSuccess("")}
                    variant="ghost"
                    size="sm"
                    className="text-green-400 hover:text-green-300"
                  >
                    ×
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="p-6">
            {/* Show loading state while refreshing */}
            {isRefreshing && (
              <div className="mb-6">
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-[#0033A0] mr-2" />
                  <span className="text-[#0033A0]">Loading data...</span>
                </div>
              </div>
            )}

            {/* Rest of the component content remains the same */}
            {/* Stats Cards */}
            {activeChecklist && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {(() => {
                  const stats = getProgressStats(activeChecklist)
                  const progressPercentage = stats.totalItems > 0 ? (stats.completedItems / stats.totalItems) * 100 : 0

                  return (
                    <>
                      <Card className="aramco-card-bg border-l-4 border-l-[#0033A0] hover:scale-105 transition-all duration-300">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                          <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
                          <CheckSquare className="h-4 w-4 text-[#0033A0]" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-[#0033A0]">{stats.totalItems}</div>
                        </CardContent>
                      </Card>

                      <Card className="aramco-card-bg border-l-4 border-l-[#00A3E0] hover:scale-105 transition-all duration-300">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                          <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
                          <Clock className="h-4 w-4 text-[#00A3E0]" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-[#00A3E0]">{stats.inProgressItems}</div>
                        </CardContent>
                      </Card>

                      <Card className="aramco-card-bg border-l-4 border-l-[#00843D] hover:scale-105 transition-all duration-300">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                          <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
                          <CheckCircle className="h-4 w-4 text-[#00843D]" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-[#00843D]">{stats.completedItems}</div>
                        </CardContent>
                      </Card>

                      <Card className="aramco-card-bg border-l-4 border-l-[#84BD00] hover:scale-105 transition-all duration-300">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                          <CardTitle className="text-sm font-medium text-gray-600">Progress</CardTitle>
                          <CheckSquare className="h-4 w-4 text-[#84BD00]" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-[#84BD00]">{Math.round(progressPercentage)}%</div>
                        </CardContent>
                      </Card>
                    </>
                  )
                })()}
              </div>
            )}

            {/* Main Content */}
            <Card className="aramco-card-bg">
              <CardHeader>
                {/* Search and Filter Controls */}
                <div className="mb-6 space-y-4">
                  {/* View Mode Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant={viewMode === 'tabs' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewMode('tabs')}
                          className="bg-[#0033A0] hover:bg-[#0033A0]/80 text-white"
                        >
                          Tab View
                        </Button>
                        <Button
                          variant={viewMode === 'stacked' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewMode('stacked')}
                          className="bg-[#0033A0] hover:bg-[#0033A0]/80 text-white"
                        >
                          Stacked View
                        </Button>
                      </div>
                      <div className="text-sm text-gray-600">
                        {filteredChecklists.length} of {checklists.length} checklists
                      </div>
                    </div>
                    <Button
                      onClick={clearFilters}
                      variant="outline"
                      size="sm"
                      className="border-gray-400 text-gray-600 hover:bg-gray-100"
                    >
                      Clear Filters
                    </Button>
                  </div>

                  {/* Search and Filter Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Search</Label>
                      <Input
                        placeholder="Search checklists, groups, or items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Affiliate</Label>
                      <Select value={affiliateFilter} onValueChange={setAffiliateFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All affiliates" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Affiliates</SelectItem>
                          {affiliates.map(affiliate => (
                            <SelectItem key={affiliate.id} value={affiliate.id}>
                              {affiliate.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="w-full bg-[#00A3E0] hover:bg-[#0033A0] text-white"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-[#0033A0] text-xl flex items-center gap-2">
                    <CheckSquare className="h-5 w-5" />
                    Affiliate Checklists
                  </CardTitle>
                  {user.role === "admin" && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      {checklists.length > 0 && (
                        <AlertDialog open={isStandardizeOpen} onOpenChange={setIsStandardizeOpen}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-[#84BD00] text-[#84BD00] hover:bg-[#84BD00]/10 bg-transparent"
                            >
                              <Sync className="h-4 w-4 mr-2" />
                              Standardize All
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="aramco-card-bg">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Standardize All Checklists</AlertDialogTitle>
                              <div className="text-white/80 space-y-4">
                                <div>
                                  This will update all existing checklists to use the original standardized items.
                                </div>

                                <div>
                                  <div className="font-semibold text-white mb-2">Aramco Digital Company:</div>
                                  <div className="space-y-1 text-sm ml-4">
                                    <div>• Corporate Registration Certificate</div>
                                    <div>• Tax Registration Documents</div>
                                    <div>• Financial Statements (Last 3 Years)</div>
                                    <div>• Board Resolution for Partnership</div>
                                  </div>
                                </div>

                                <div>
                                  <div className="font-semibold text-white mb-2">
                                    Business Proponent - T&I Affiliate Affairs:
                                  </div>
                                  <div className="space-y-1 text-sm ml-4">
                                    <div>• Business Plan & Strategy Document</div>
                                    <div>• Technology Transfer Agreement</div>
                                    <div>• Intellectual Property Documentation</div>
                                    <div>• Innovation & Development Roadmap</div>
                                  </div>
                                </div>

                                <div>
                                  <div className="font-semibold text-white mb-2">2nd Tiered Affiliate - NextEra:</div>
                                  <div className="space-y-1 text-sm ml-4">
                                    <div>• Energy Partnership Agreement</div>
                                    <div>• Renewable Energy Certificates</div>
                                    <div>• Environmental Impact Assessment</div>
                                    <div>• Grid Integration Technical Specs</div>
                                  </div>
                                </div>

                                <div className="text-yellow-400 font-semibold">
                                  Warning: This will replace all existing items in all checklists. This action cannot
                                  be undone.
                                </div>
                              </div>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-gray-400 text-gray-300 hover:bg-gray-700">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleStandardizeChecklists}
                                className="bg-[#84BD00] hover:bg-[#84BD00]/80 text-white"
                              >
                                Standardize All Checklists
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}

                      {activeChecklist && (
                        <>
                          <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-[#00A3E0] text-[#00A3E0] hover:bg-[#00A3E0]/10 bg-transparent"
                                onClick={() => setNewAffiliateName(activeChecklist.affiliate_name)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Rename
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="aramco-card-bg">
                              <DialogHeader>
                                <DialogTitle className="text-white">Rename Affiliate</DialogTitle>
                                <DialogDescription className="text-white/80">
                                  Enter a new name for this affiliate checklist.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-white">Affiliate Name</Label>
                                  <Input
                                    value={newAffiliateName}
                                    onChange={(e) => setNewAffiliateName(e.target.value)}
                                    placeholder="Enter affiliate name"
                                    className="enhanced-input"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button onClick={handleRenameAffiliate} className="aramco-button-primary text-white">
                                    <Save className="h-4 w-4 mr-2" />
                                    Save
                                  </Button>
                                  <Button
                                    onClick={() => setIsRenameOpen(false)}
                                    variant="outline"
                                    className="border-gray-400 text-gray-300 hover:bg-gray-700"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button
                            onClick={() => handleDeleteAffiliate(activeChecklist.id)}
                            variant="outline"
                            size="sm"
                            className="border-red-400 text-red-400 hover:bg-red-500/10 bg-transparent"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </>
                      )}

                      <Dialog open={isAddAffiliateOpen} onOpenChange={setIsAddAffiliateOpen}>
                        <DialogTrigger asChild>
                          <Button className="aramco-button-primary text-white enhanced-button">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Affiliate
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="aramco-card-bg">
                          <DialogHeader>
                            <DialogTitle className="text-white">Add Affiliate Checklist</DialogTitle>
                            <div className="text-white/80 space-y-4">
                              <div>
                                Select an affiliate to create a new checklist. The new checklist will copy all current
                                items from the existing NextEra checklist.
                              </div>

                              {currentNextEraItems ? (
                                <div>
                                  <div className="font-semibold text-white mb-2">
                                    Current items that will be copied:
                                  </div>
                                  {currentNextEraItems.groups.map((group, groupIndex) => (
                                    <div key={groupIndex} className="mb-3">
                                      <div className="font-medium text-white/90 mb-1">{group.name}:</div>
                                      <div className="space-y-1 text-sm ml-4">
                                        {group.items.map((item, itemIndex) => (
                                          <div key={itemIndex}>• {item.documentList}</div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div>
                                  <div className="font-semibold text-white mb-2">
                                    No existing checklist found. Standard items will be used:
                                  </div>
                                  <div className="space-y-3">
                                    <div>
                                      <div className="font-medium text-white/90 mb-1">Aramco Digital Company:</div>
                                      <div className="space-y-1 text-sm ml-4">
                                        <div>• Developing Cash Call Package</div>
                                        <div>• Cash Call Letter from AD CFO</div>
                                        <div>• Active Bank Certificate</div>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="font-medium text-white/90 mb-1">
                                        Business Proponent - T&I Affiliate Affairs:
                                      </div>
                                      <div className="space-y-1 text-sm ml-4">
                                        <div>• Budget Approval and Funding Authority Check</div>
                                        <div>• Formation Document (CR, Bylaw etc.)</div>
                                        <div>• Setting up MPS and Obtaining pre-MPS Clearance</div>
                                        <div>• Creating Cash Call MPS Workflow</div>
                                        <div>• Notifying SAO Treasury</div>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="font-medium text-white/90 mb-1">
                                        2nd Tiered Affiliate:
                                      </div>
                                      <div className="space-y-1 text-sm ml-4">
                                        <div>• Cash Call Letter from CFO/CEO to Capital Owner</div>
                                        <div>• Approved Business Plan</div>
                                        <div>• Proof of Budget Approval (e.g. Board Minutes)</div>
                                        <div>• Active Bank Certificate</div>
                                        <div>• Shareholders Resolution Signed by SH-Reps</div>
                                        <div>• Cash Flow Forecast</div>
                                        <div>• Utilization of Previous Cash Call</div>
                                        <div>• Utilization of Current Cash Call</div>
                                        <div>• Additional Documents (Case By Case) Requested By GF&CD</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-white">Select Affiliate</Label>
                              <Select value={selectedAffiliateId} onValueChange={setSelectedAffiliateId}>
                                <SelectTrigger className="enhanced-select">
                                  <SelectValue placeholder="Choose an affiliate" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-gray-300">
                                  {availableAffiliates.map((affiliate) => (
                                    <SelectItem key={affiliate.id} value={affiliate.id}>
                                      {affiliate.name} ({affiliate.company_code})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={handleAddAffiliate} className="aramco-button-primary text-white">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Checklist
                              </Button>
                              <Button
                                onClick={() => setIsAddAffiliateOpen(false)}
                                variant="outline"
                                className="border-gray-400 text-gray-300 hover:bg-gray-700"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {checklists.length > 0 ? (
                  <>
                    {viewMode === 'tabs' ? (
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 bg-white/10 h-auto p-2">
                      {checklists.map((checklist) => {
                        const stats = getProgressStats(checklist)
                        const progressPercentage =
                          stats.totalItems > 0 ? (stats.completedItems / stats.totalItems) * 100 : 0

                        return (
                          <TabsTrigger
                            key={checklist.affiliate_id}
                            value={checklist.affiliate_id}
                            className="data-[state=active]:bg-[#0033A0] data-[state=active]:text-white text-white p-3 h-auto flex flex-col items-start gap-1"
                          >
                            <div className="font-medium text-sm truncate w-full text-left">
                              {checklist.affiliate_name}
                            </div>
                            <div className="text-xs opacity-80">
                              {stats.completedItems}/{stats.totalItems} ({Math.round(progressPercentage)}%)
                            </div>
                          </TabsTrigger>
                        )
                      })}
                    </TabsList>

                    {checklists.map((checklist) => (
                      <TabsContent key={checklist.affiliate_id} value={checklist.affiliate_id} className="mt-6">
                        <div className="space-y-8">
                          {checklist.groups.map((group) => (
                            <Card
                              key={group.id}
                              className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg"
                            >
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  {editingGroup?.groupId === group.id ? (
                                    <div className="flex items-center gap-2 flex-1">
                                      <Input
                                        value={editingGroupName}
                                        onChange={(e) => setEditingGroupName(e.target.value)}
                                        className="text-lg font-semibold text-[#0033A0] bg-white border-[#0033A0] focus:border-[#00A3E0]"
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            handleSaveGroupEdit()
                                          } else if (e.key === "Escape") {
                                            handleCancelGroupEdit()
                                          }
                                        }}
                                        autoFocus
                                      />
                                      <div className="flex gap-1">
                                        <Button
                                          onClick={handleSaveGroupEdit}
                                          size="sm"
                                          className="h-8 px-2 bg-green-600 hover:bg-green-700 text-white"
                                        >
                                          <Save className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          onClick={handleCancelGroupEdit}
                                          size="sm"
                                          variant="outline"
                                          className="h-8 px-2 border-gray-400 text-gray-600 bg-transparent"
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 flex-1">
                                      <CardTitle className="text-[#0033A0] text-lg">{group.name}</CardTitle>
                                      {user.role === "admin" && (
                                        <Button
                                          onClick={() => handleStartGroupEdit(checklist.id, group.id, group.name)}
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 text-[#00A3E0] hover:bg-[#00A3E0]/10"
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                  {user.role === "admin" && !editingGroup && (
                                    <Button
                                      onClick={() => handleAddItem(checklist.id, group.id)}
                                      size="sm"
                                      className="bg-[#00A3E0] hover:bg-[#0033A0] text-white"
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Add Item
                                    </Button>
                                  )}
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="overflow-x-auto">
                                  {/* Bulk Actions Bar */}
                                  {user.role === "admin" && selectedItems.size > 0 && (
                                    <div className="mb-4 p-3 bg-[#0033A0]/10 rounded-lg border border-[#0033A0]/20">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="text-sm text-[#0033A0] font-medium">
                                          {selectedItems.size} item{selectedItems.size !== 1 ? "s" : ""} selected
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Select value={bulkUpdateStatus} onValueChange={setBulkUpdateStatus}>
                                            <SelectTrigger className="w-48 h-8 text-sm">
                                              <SelectValue placeholder="Select status..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {statusOptions.map((option) => (
                                                <SelectItem key={option.id} value={option.label}>
                                                  <div className="flex items-center gap-2">
                                                    <div
                                                      className={`w-2 h-2 rounded-full ${getStatusBadgeClass(option.color).split(" ")[0]}`}
                                                    />
                                                    {option.label}
                                                  </div>
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                          <Button
                                            onClick={handleBulkStatusUpdate}
                                            size="sm"
                                            className="bg-[#0033A0] hover:bg-[#0033A0]/80 text-white"
                                            disabled={!bulkUpdateStatus}
                                          >
                                            Update Status
                                          </Button>
                                          <Button
                                            onClick={() => setSelectedItems(new Set())}
                                            size="sm"
                                            variant="outline"
                                            className="border-gray-400 text-gray-600"
                                          >
                                            Clear Selection
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  <table className="w-full">
                                    <thead>
                                      <tr className="border-b border-gray-200">
                                        {user.role === "admin" && (
                                          <th className="text-left py-3 px-4 font-semibold text-[#0033A0] w-12">
                                            <input
                                              type="checkbox"
                                              checked={
                                                selectedItems.size > 0 &&
                                                selectedItems.size === checklist.groups.flatMap((g) => g.items).length
                                              }
                                              onChange={() => handleSelectAllItems(checklist)}
                                              className="rounded border-[#0033A0] text-[#0033A0] focus:ring-[#0033A0]"
                                            />
                                          </th>
                                        )}
                                        <th className="text-left py-3 px-4 font-semibold text-[#0033A0] w-20">
                                          Item No.
                                        </th>
                                        <th className="text-left py-3 px-4 font-semibold text-[#0033A0]">
                                          Document List
                                        </th>
                                        <th className="text-left py-3 px-4 font-semibold text-[#0033A0] w-40">
                                          Status
                                        </th>
                                        {user.role === "admin" && (
                                          <th className="text-left py-3 px-4 font-semibold text-[#0033A0] w-32">
                                            Actions
                                          </th>
                                        )}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {group.items.map((item) => (
                                        <tr
                                          key={item.id}
                                          className={`border-b border-gray-100 hover:bg-[#0033A0]/5 transition-colors ${
                                            selectedItems.has(item.id) ? "bg-[#0033A0]/10" : ""
                                          }`}
                                        >
                                          {user.role === "admin" && (
                                            <td className="py-3 px-4">
                                              <input
                                                type="checkbox"
                                                checked={selectedItems.has(item.id)}
                                                onChange={() => handleSelectItem(item.id)}
                                                className="rounded border-[#0033A0] text-[#0033A0] focus:ring-[#0033A0]"
                                              />
                                            </td>
                                          )}
                                          <td className="py-3 px-4">
                                            {editingItem?.itemId === item.id ? (
                                              <Input
                                                value={editingValues.itemNo}
                                                onChange={(e) =>
                                                  setEditingValues({ ...editingValues, itemNo: e.target.value })
                                                }
                                                className="w-16 h-8 text-sm"
                                              />
                                            ) : (
                                              <span className="font-medium text-[#00A3E0]">{item.itemNo}</span>
                                            )}
                                          </td>
                                          <td className="py-3 px-4">
                                            {editingItem?.itemId === item.id ? (
                                              <Input
                                                value={editingValues.documentList}
                                                onChange={(e) =>
                                                  setEditingValues({ ...editingValues, documentList: e.target.value })
                                                }
                                                className="h-8 text-sm"
                                              />
                                            ) : (
                                              <span className="text-gray-800">{item.documentList}</span>
                                            )}
                                          </td>
                                          <td className="py-3 px-4">
                                            {editingItem?.itemId === item.id ? (
                                              <Select
                                                value={editingValues.status}
                                                onChange={(value) =>
                                                  setEditingValues({ ...editingValues, status: value })
                                                }
                                              >
                                                <SelectTrigger className="h-8 text-sm">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {statusOptions.map((option) => (
                                                    <SelectItem key={option.id} value={option.label}>
                                                      <div className="flex items-center gap-2">
                                                        <div
                                                          className={`w-2 h-2 rounded-full ${getStatusBadgeClass(option.color).split(" ")[0]}`}
                                                        />
                                                        <div>
                                                          <div>{option.label}</div>
                                                          {option.description && (
                                                            <div className="text-xs text-gray-500">
                                                              {option.description}
                                                            </div>
                                                          )}
                                                        </div>
                                                      </div>
                                                    </SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            ) : (
                                              <Select
                                                value={item.status}
                                                onValueChange={(value) =>
                                                  handleUpdateItemStatus(checklist.id, group.id, item.id, value)
                                                }
                                                disabled={user.role !== "admin"}
                                              >
                                                <SelectTrigger className="h-8 text-sm border-none bg-transparent p-0 hover:bg-gray-50">
                                                  <SelectValue asChild>
                                                    <TooltipProvider>
                                                      <Tooltip>
                                                        <TooltipTrigger asChild>
                                                          <Badge
                                                            className={`${getStatusBadgeClass(item.status)} flex items-center gap-1 cursor-pointer`}
                                                          >
                                                            {getStatusIcon(item.status)}
                                                            {item.status}
                                                          </Badge>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                          <div className="max-w-xs">
                                                            <div className="font-medium">{item.status}</div>
                                                            {statusOptions.find((opt) => opt.label === item.status)
                                                              ?.description && (
                                                              <div className="text-sm text-gray-600 mt-1">
                                                                {
                                                                  statusOptions.find((opt) => opt.label === item.status)
                                                                    ?.description
                                                                }
                                                              </div>
                                                            )}
                                                            {user.role === "admin" && (
                                                              <div className="text-xs text-gray-500 mt-1">
                                                                Click to change status
                                                              </div>
                                                            )}
                                                          </div>
                                                        </TooltipContent>
                                                      </Tooltip>
                                                    </TooltipProvider>
                                                  </SelectValue>
                                                </SelectTrigger>
                                                {user.role === "admin" && (
                                                  <SelectContent>
                                                    {statusOptions.map((option) => (
                                                      <SelectItem key={option.id} value={option.label}>
                                                        <div className="flex items-center gap-2">
                                                          <div
                                                            className={`w-2 h-2 rounded-full ${getStatusBadgeClass(option.color).split(" ")[0]}`}
                                                          />
                                                          <div>
                                                            <div>{option.label}</div>
                                                            {option.description && (
                                                              <div className="text-xs text-gray-500">
                                                                {option.description}
                                                              </div>
                                                            )}
                                                          </div>
                                                        </div>
                                                      </SelectItem>
                                                    ))}
                                                  </SelectContent>
                                                )}
                                              </Select>
                                            )}
                                          </td>
                                          {user.role === "admin" && (
                                            <td className="py-3 px-4">
                                              {editingItem?.itemId === item.id ? (
                                                <div className="flex gap-1">
                                                  <Button
                                                    onClick={handleSaveEdit}
                                                    size="sm"
                                                    className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white"
                                                  >
                                                    <Save className="h-3 w-3" />
                                                  </Button>
                                                  <Button
                                                    onClick={handleCancelEdit}
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 px-2 border-gray-400 text-gray-600 bg-transparent"
                                                  >
                                                    <X className="h-3 w-3" />
                                                  </Button>
                                                </div>
                                              ) : (
                                                <div className="flex gap-1">
                                                  <Button
                                                    onClick={() => handleStartEdit(checklist.id, group.id, item)}
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 px-2 border-[#00A3E0] text-[#00A3E0] hover:bg-[#00A3E0]/10"
                                                  >
                                                    <Edit className="h-3 w-3" />
                                                  </Button>
                                                  <Button
                                                    onClick={() => handleDeleteItem(checklist.id, group.id, item.id)}
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 px-2 border-red-400 text-red-400 hover:bg-red-500/10"
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </Button>
                                                </div>
                                              )}
                                            </td>
                                          )}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                    ) : (
                      /* Stacked View */
                      <div className="space-y-6">
                        {filteredChecklists.length > 0 ? (
                          filteredChecklists.map((checklist) => {
                            const stats = getProgressStats(checklist)
                            const progressPercentage = stats.totalItems > 0 ? (stats.completedItems / stats.totalItems) * 100 : 0
                            const isExpanded = expandedChecklists.has(checklist.id)
                            const affiliate = affiliates.find(a => a.id === checklist.affiliate_id)
                            
                            return (
                              <Card key={checklist.id} className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
                                <CardHeader>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleChecklistExpansion(checklist.id)}
                                        className="p-0 h-auto text-left"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                            <div className="w-2 h-2 bg-[#0033A0] rounded-full"></div>
                                          </div>
                                          <div>
                                            <CardTitle className="text-[#0033A0] text-lg">
                                              {affiliate?.name || checklist.affiliate_id}
                                            </CardTitle>
                                            <div className="text-sm text-gray-600 mt-1">
                                              {stats.completedItems} of {stats.totalItems} items completed
                                            </div>
                                          </div>
                                        </div>
                                      </Button>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <div className="flex items-center gap-2">
                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                          <div
                                            className="bg-[#84BD00] h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${progressPercentage}%` }}
                                          />
                                        </div>
                                        <span className="text-sm font-medium text-[#0033A0]">
                                          {Math.round(progressPercentage)}%
                                        </span>
                                      </div>
                                      {user.role === "admin" && (
                                        <div className="flex items-center gap-2">
                                          <Button
                                            onClick={() => handleStartGroupEdit(checklist.id, "", checklist.affiliate_name || "")}
                                            size="sm"
                                            variant="outline"
                                            className="border-[#00A3E0] text-[#00A3E0] hover:bg-[#00A3E0]/10"
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            onClick={() => handleDeleteAffiliate(checklist.id)}
                                            size="sm"
                                            variant="outline"
                                            className="border-red-400 text-red-400 hover:bg-red-500/10"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CardHeader>
                                
                                {isExpanded && (
                                  <CardContent>
                                    <div className="space-y-6">
                                      {checklist.groups.map((group) => (
                                        <Card key={group.id} className="bg-gray-50/50 border border-gray-200">
                                          <CardHeader>
                                            <div className="flex items-center justify-between">
                                              <CardTitle className="text-[#0033A0] text-base">{group.name}</CardTitle>
                                              {user.role === "admin" && (
                                                <Button
                                                  onClick={() => handleAddItem(checklist.id, group.id)}
                                                  size="sm"
                                                  className="bg-[#00A3E0] hover:bg-[#0033A0] text-white"
                                                >
                                                  <Plus className="h-3 w-3 mr-1" />
                                                  Add Item
                                                </Button>
                                              )}
                                            </div>
                                          </CardHeader>
                                          <CardContent>
                                            <div className="overflow-x-auto">
                                              <table className="w-full">
                                                <thead>
                                                  <tr className="border-b border-gray-200">
                                                    <th className="text-left py-2 px-3 font-semibold text-[#0033A0] w-20">
                                                      Item No.
                                                    </th>
                                                    <th className="text-left py-2 px-3 font-semibold text-[#0033A0]">
                                                      Document List
                                                    </th>
                                                    <th className="text-left py-2 px-3 font-semibold text-[#0033A0] w-40">
                                                      Status
                                                    </th>
                                                    {user.role === "admin" && (
                                                      <th className="text-left py-2 px-3 font-semibold text-[#0033A0] w-32">
                                                        Actions
                                                      </th>
                                                    )}
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {group.items.map((item) => (
                                                    <tr key={item.id} className="border-b border-gray-100 hover:bg-[#0033A0]/5">
                                                      <td className="py-2 px-3">
                                                        <span className="font-medium text-[#00A3E0]">{item.itemNo}</span>
                                                      </td>
                                                      <td className="py-2 px-3">
                                                        <span className="text-gray-800">{item.documentList}</span>
                                                      </td>
                                                      <td className="py-2 px-3">
                                                        <Select
                                                          value={item.status}
                                                          onValueChange={(value) =>
                                                            handleUpdateItemStatus(checklist.id, group.id, item.id, value)
                                                          }
                                                          disabled={user.role !== "admin" && user.role !== "affiliate"}
                                                        >
                                                          <SelectTrigger className="h-8 text-sm border-none bg-transparent p-0 hover:bg-gray-50">
                                                            <SelectValue asChild>
                                                              <TooltipProvider>
                                                                <Tooltip>
                                                                  <TooltipTrigger asChild>
                                                                    <Badge
                                                                      className={`${getStatusBadgeClass(item.status)} flex items-center gap-1 cursor-pointer`}
                                                                    >
                                                                      {getStatusIcon(item.status)}
                                                                      {item.status}
                                                                    </Badge>
                                                                  </TooltipTrigger>
                                                                  <TooltipContent>
                                                                    <div className="max-w-xs">
                                                                      <div className="font-medium">{item.status}</div>
                                                                      {statusOptions.find((opt) => opt.label === item.status)?.description && (
                                                                        <div className="text-sm text-gray-600 mt-1">
                                                                          {statusOptions.find((opt) => opt.label === item.status)?.description}
                                                                        </div>
                                                                      )}
                                                                    </div>
                                                                  </TooltipContent>
                                                                </Tooltip>
                                                              </TooltipProvider>
                                                            </SelectValue>
                                                          </SelectTrigger>
                                                          {(user.role === "admin" || user.role === "affiliate") && (
                                                            <SelectContent>
                                                              {statusOptions.map((option) => (
                                                                <SelectItem key={option.id} value={option.label}>
                                                                  <div className="flex items-center gap-2">
                                                                    <div className={`w-2 h-2 rounded-full ${getStatusBadgeClass(option.color).split(" ")[0]}`} />
                                                                    {option.label}
                                                                  </div>
                                                                </SelectItem>
                                                              ))}
                                                            </SelectContent>
                                                          )}
                                                        </Select>
                                                      </td>
                                                      {user.role === "admin" && (
                                                        <td className="py-2 px-3">
                                                          <div className="flex gap-1">
                                                            <Button
                                                              onClick={() => handleStartEdit(checklist.id, group.id, item)}
                                                              size="sm"
                                                              variant="outline"
                                                              className="h-7 px-2 border-[#00A3E0] text-[#00A3E0] hover:bg-[#00A3E0]/10"
                                                            >
                                                              <Edit className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                              onClick={() => handleDeleteItem(checklist.id, group.id, item.id)}
                                                              size="sm"
                                                              variant="outline"
                                                              className="h-7 px-2 border-red-400 text-red-400 hover:bg-red-500/10"
                                                            >
                                                              <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                          </div>
                                                        </td>
                                                      )}
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      ))}
                                    </div>
                                  </CardContent>
                                )}
                              </Card>
                            )
                          })
                        ) : (
                          <div className="text-center py-12">
                            <CheckSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Checklists Found</h3>
                            <p className="text-gray-600 mb-6">
                              Try adjusting your search or filter criteria.
                            </p>
                            <Button
                              onClick={clearFilters}
                              variant="outline"
                              className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10"
                            >
                              Clear Filters
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <CheckSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Checklists Yet</h3>
                    <p className="text-gray-600 mb-6">
                      {availableAffiliates.length > 0
                        ? "Create your first affiliate checklist to get started with standardized items."
                        : "No affiliates available. Please add affiliates first in the Admin Settings."}
                    </p>
                    {user.role === "admin" && availableAffiliates.length > 0 && (
                      <Button
                        onClick={() => setIsAddAffiliateOpen(true)}
                        className="aramco-button-primary text-white enhanced-button"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Checklist
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </TooltipProvider>
    </ErrorBoundary>
  )
}
