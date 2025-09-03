"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Checkbox } from "@/components/ui/checkbox"
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
  X,
  Shield,
} from "lucide-react"
import { useAuth } from "@/lib/firebase-auth-context"
import { getAffiliates, type Affiliate, getCashCalls, getCashCallsForUser, type CashCall, getDocumentRequirements, type DocumentRequirement } from "@/lib/firebase-database"
import {
  getAllChecklists, 
  getChecklistsForUser,
  createAffiliateChecklist,
  updateChecklistItem,
  deleteAffiliateChecklist,
  getStatusOptions,
  type AffiliateChecklist,
  type ChecklistItem,
  type ChecklistGroup,
  type StatusOption
} from "@/lib/firebase-database"
import { AdminSettings } from "@/components/admin-settings"
import { AnimatedLoading } from "@/components/animated-loading"

export default function ChecklistPage() {
  const { user, userProfile, signOut } = useAuth()
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [checklists, setChecklists] = useState<AffiliateChecklist[]>([])
  const [cashCalls, setCashCalls] = useState<CashCall[]>([])
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    duration?: number
    action?: {
      label: string
      onClick: () => void
    }
  }>>([])
  const router = useRouter()

  // Notification helper functions
  const addNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, duration = 5000, action?: { label: string; onClick: () => void }) => {
    const id = Date.now().toString()
    setNotifications(prev => [...prev, { id, type, title, message, duration, action }])
    
    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [affiliateFilter, setAffiliateFilter] = useState("all")
  const [expandedChecklists, setExpandedChecklists] = useState<Set<string>>(new Set())
  const [selectedChecklists, setSelectedChecklists] = useState<Set<string>>(new Set())
  const [bulkMode, setBulkMode] = useState(false)

  // Dialog states
  const [isCreateChecklistOpen, setIsCreateChecklistOpen] = useState(false)
  const [selectedAffiliateForChecklist, setSelectedAffiliateForChecklist] = useState<Affiliate | null>(null)
  const [selectedCashCallForChecklist, setSelectedCashCallForChecklist] = useState<CashCall | null>(null)
  const [checklistTemplateType, setChecklistTemplateType] = useState<'CAPEX' | 'OPEX'>('CAPEX')

  useEffect(() => {
    if (user && userProfile) {
      loadData()
    }
  }, [user, userProfile])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      if (!user?.uid) {
        throw new Error('User not authenticated')
      }
      
      // Load data progressively for better perceived performance
      console.log('Starting data load...')
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Data loading timeout')), 30000) // 30 second timeout
      })
      
      const loadDataPromise = async () => {
        // First, load status options (usually small and fast)
        const statusOptionsData = await getStatusOptions()
        setStatusOptions(statusOptionsData)
        console.log('Status options loaded')
        
        // Then load affiliates (also usually fast)
        const affiliatesData = await getAffiliates()
        setAffiliates(affiliatesData)
        console.log('Affiliates loaded')
        
        // Finally load the heavier data in parallel
        const [checklistsData, cashCallsData] = await Promise.all([
          getChecklistsForUser(user.uid, userProfile?.role || 'viewer', userProfile?.affiliate_company_id),
          getCashCallsForUser(user.uid, userProfile?.role || 'viewer', userProfile?.affiliate_company_id)
        ])

        setChecklists(checklistsData)
        setCashCalls(cashCallsData)
        console.log('All data loaded successfully')
      }
      
      await Promise.race([loadDataPromise(), timeoutPromise])
    } catch (err) {
      console.error("Error loading data:", err)
      if (err instanceof Error && err.message === 'Data loading timeout') {
        addNotification('error', 'Loading Timeout', 'Data loading took too long. Please try refreshing the page.', 10000)
      } else {
        addNotification('error', 'Data Loading Failed', 'Failed to load data. Please try again.', 8000)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadData()
    setIsRefreshing(false)
  }

  const handleLogout = async () => {
    try {
      await signOut()
      router.push("/login")
    } catch (err) {
      console.error("Error logging out:", err)
      addNotification('error', 'Logout Failed', 'Failed to logout. Please try again.', 5000)
    }
  }

  const handleUpdateItemStatus = async (checklistId: string, groupId: string, itemId: string, newStatus: string) => {
    try {
      // Check permissions - affiliate users can only update their own affiliate's checklists
      if (userProfile?.role?.toLowerCase() === 'affiliate') {
        const checklist = checklists.find(c => c.id === checklistId)
        if (checklist?.affiliate_id !== userProfile.affiliate_company_id) {
          addNotification('warning', 'Permission Denied', 'You can only update checklists for your own affiliate.', 6000)
          return
        }
      }

      await updateChecklistItem(checklistId, groupId, itemId, { status: newStatus })
      
      // Update local state
      setChecklists(prev => prev.map(checklist => {
        if (checklist.id === checklistId) {
          return {
            ...checklist,
            groups: checklist.groups.map(group => {
              if (group.id === groupId) {
                return {
                  ...group,
                  items: group.items.map(item => {
                    if (item.id === itemId) {
                      return { ...item, status: newStatus }
                    }
                    return item
                  })
                }
              }
              return group
            })
          }
        }
        return checklist
      }))

      addNotification('success', 'Status Updated', 'Status updated successfully!', 4000)
    } catch (err) {
      console.error("Error updating status:", err)
      addNotification('error', 'Update Failed', 'Failed to update status. Please try again.', 6000)
    }
  }

  const handleCreateChecklist = async () => {
    if (!selectedAffiliateForChecklist || !selectedCashCallForChecklist) {
      addNotification('warning', 'Selection Required', 'Please select both an affiliate and a cash call.', 5000)
      return
    }

    // Check permissions - affiliate users can only create checklists for their own affiliate
    if (userProfile?.role?.toLowerCase() === 'affiliate' && selectedAffiliateForChecklist.id !== userProfile.affiliate_company_id) {
      addNotification('warning', 'Permission Denied', 'You can only create checklists for your own affiliate.', 6000)
      return
    }

    try {
      // Get default items based on document requirements from settings
      const getDefaultItems = async (templateType: 'CAPEX' | 'OPEX', affiliateId: string) => {
        try {
          // Get document requirements for this affiliate and cash call type
          const cashCallType = templateType.toLowerCase() as 'opex' | 'capex'
          const documentRequirements = await getDocumentRequirements(affiliateId, cashCallType)
          
          console.log('Debug - Document requirements for checklist:', {
            affiliateId,
            cashCallType,
            requirementsCount: documentRequirements.length,
            requirements: documentRequirements
          })
          
          // Group requirements by committee - for now, assign all to aramcoDigital
          // TODO: Add committee field to DocumentRequirement or create mapping logic
          const groupedRequirements: {
            aramcoDigital: string[]
            businessProponent: string[]
            secondTieredAffiliate: string[]
          } = {
            aramcoDigital: [],
            businessProponent: [],
            secondTieredAffiliate: []
          }
          
          // Assign all document requirements to aramcoDigital committee for now
          documentRequirements.forEach(req => {
            groupedRequirements.aramcoDigital.push(req.id)
          })
          
          console.log('Debug - Grouped requirements:', groupedRequirements)
          
          return groupedRequirements
        } catch (error) {
          console.error('Error getting document requirements for checklist:', error)
          
          // Fallback to hardcoded items if document requirements fail
          if (templateType === 'CAPEX') {
            return {
              aramcoDigital: ["1", "2", "3", "4", "5"],
              businessProponent: ["1", "2", "3", "4", "5", "6"],
              secondTieredAffiliate: ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
            }
          } else {
            return {
              aramcoDigital: ["1", "2", "3", "6"],
              businessProponent: ["1", "2", "3", "4", "5", "7"],
              secondTieredAffiliate: ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
            }
          }
        }
      }

      const defaultItems = await getDefaultItems(checklistTemplateType, selectedAffiliateForChecklist.id)
      
      const newChecklist = await createAffiliateChecklist(
        selectedAffiliateForChecklist.id,
        `${selectedAffiliateForChecklist.name} - ${selectedCashCallForChecklist.call_number}`,
        defaultItems,
        checklistTemplateType,
        selectedCashCallForChecklist.id
      )

      setChecklists(prev => [...prev, newChecklist])
      setIsCreateChecklistOpen(false)
      setSelectedAffiliateForChecklist(null)
      setSelectedCashCallForChecklist(null)
      setChecklistTemplateType('CAPEX')
      addNotification('success', 'Checklist Created', `Checklist created successfully for ${selectedAffiliateForChecklist.name} - Cash Call ${selectedCashCallForChecklist.call_number}!`, 6000)
    } catch (err) {
      console.error("Error creating checklist:", err)
      addNotification('error', 'Creation Failed', 'Failed to create checklist. Please try again.', 6000)
    }
  }

  const handleDeleteChecklist = async (checklistId: string, checklistName: string) => {
    try {
      console.log('Delete checklist attempt:', {
        checklistId,
        checklistName,
        userRole: userProfile?.role,
        userAffiliate: userProfile?.affiliate_company_id
      })

      // Check permissions - affiliate users can only delete their own affiliate's checklists
      if (userProfile?.role?.toLowerCase() === 'affiliate') {
        const checklist = checklists.find(c => c.id === checklistId)
        if (checklist?.affiliate_id !== userProfile.affiliate_company_id) {
          addNotification('warning', 'Permission Denied', 'You can only delete checklists for your own affiliate.', 6000)
          return
        }
      }

      console.log('Proceeding with deletion...')
      await deleteAffiliateChecklist(checklistId)
      
      // Update local state
      setChecklists(prev => prev.filter(checklist => checklist.id !== checklistId))
      
      addNotification('success', 'Checklist Deleted', `Checklist "${checklistName}" deleted successfully!`, 5000)
    } catch (err) {
      console.error("Error deleting checklist:", err)
      addNotification('error', 'Deletion Failed', 'Failed to delete checklist. Please try again.', 6000)
    }
  }

  const toggleChecklistExpansion = (checklistId: string) => {
    setExpandedChecklists(prev => {
      const newSet = new Set(prev)
      if (newSet.has(checklistId)) {
        newSet.delete(checklistId)
      } else {
        newSet.add(checklistId)
      }
      return newSet
    })
  }

  const expandAllChecklists = () => {
    const allKeys = new Set<string>()
    
    // Add all affiliate keys
    Object.keys(filteredGroupedChecklists).forEach(affiliateId => {
      allKeys.add(`affiliate-${affiliateId}`)
    })
    
    // Add all checklist keys
    Object.entries(filteredGroupedChecklists).forEach(([affiliateId, affiliateData]) => {
      affiliateData.checklists.forEach(checklist => {
        allKeys.add(`checklist-${checklist.id}`)
      })
    })
    
    setExpandedChecklists(allKeys)
  }

  const collapseAllChecklists = () => {
    setExpandedChecklists(new Set())
  }

  const toggleBulkMode = () => {
    setBulkMode(!bulkMode)
    if (bulkMode) {
      setSelectedChecklists(new Set())
    }
  }

  const selectAllChecklists = () => {
    const allChecklistIds = new Set(checklists.map(checklist => checklist.id))
    setSelectedChecklists(allChecklistIds)
  }

  const clearAllSelections = () => {
    setSelectedChecklists(new Set())
  }

  const toggleChecklistSelection = (checklistId: string) => {
    setSelectedChecklists(prev => {
      const newSet = new Set(prev)
      if (newSet.has(checklistId)) {
        newSet.delete(checklistId)
      } else {
        newSet.add(checklistId)
      }
      return newSet
    })
  }

  const deleteSelectedChecklists = async () => {
    if (selectedChecklists.size === 0) {
      addNotification('warning', 'No Selection', 'Please select checklists to delete.', 4000)
      return
    }

    const selectedChecklistNames = checklists
      .filter(checklist => selectedChecklists.has(checklist.id))
      .map(checklist => checklist.affiliate_name)

    if (confirm(`Are you sure you want to delete these ${selectedChecklists.size} checklists?\n\n${selectedChecklistNames.join('\n')}\n\nThis action cannot be undone.`)) {
      try {
        await Promise.all(
          Array.from(selectedChecklists).map(checklistId => 
            deleteAffiliateChecklist(checklistId)
          )
        )
        
        setChecklists(prev => prev.filter(checklist => !selectedChecklists.has(checklist.id)))
        setSelectedChecklists(new Set())
        setBulkMode(false)
        
        addNotification('success', 'Bulk Delete Complete', `Successfully deleted ${selectedChecklists.size} checklists.`, 8000)
      } catch (err) {
        console.error('Bulk delete error:', err)
        addNotification('error', 'Bulk Delete Failed', 'Some checklists could not be deleted. Please try again.', 8000)
      }
    }
  }

  const getCashCallsForAffiliate = (affiliateId: string) => {
    return cashCalls.filter(cashCall => 
      cashCall.affiliate_id === affiliateId
    )
  }

  const getAvailableCashCallsForAffiliate = (affiliateId: string) => {
    const affiliateCashCalls = getCashCallsForAffiliate(affiliateId)
    const usedCashCallIds = checklists
      .filter(checklist => checklist.affiliate_id === affiliateId)
      .map(checklist => checklist.cash_call_id)
      .filter(Boolean)

    return affiliateCashCalls.filter(cashCall => !usedCashCallIds.includes(cashCall.id))
  }

  const getStatusBadgeClass = (status: string) => {
    const option = statusOptions.find(opt => opt.label === status)
    if (!option) return "bg-gray-100 text-gray-800"
    
    switch (option.color) {
      case "green": return "bg-green-100 text-green-800"
      case "yellow": return "bg-yellow-100 text-yellow-800"
      case "red": return "bg-red-100 text-red-800"
      case "blue": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    const option = statusOptions.find(opt => opt.label === status)
    if (!option) return <Clock className="h-3 w-3" />
    
    switch (option.color) {
      case "green": return <CheckCircle className="h-3 w-3" />
      case "yellow": return <AlertCircle className="h-3 w-3" />
      case "red": return <X className="h-3 w-3" />
      case "blue": return <Clock className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  // Group checklists by company (affiliate) only
  const groupedChecklists = checklists.reduce((acc, checklist) => {
    const affiliateId = checklist.affiliate_id
    
    if (!acc[affiliateId]) {
      acc[affiliateId] = {
        affiliate: affiliates.find(a => a.id === affiliateId),
        checklists: []
      }
    }
    
    acc[affiliateId].checklists.push(checklist)
    return acc
  }, {} as Record<string, {
    affiliate: Affiliate | undefined,
    checklists: AffiliateChecklist[]
  }>)

  const filteredGroupedChecklists = Object.entries(groupedChecklists)
    .filter(([affiliateId, data]) => {
      const matchesSearch = data.affiliate?.name.toLowerCase().includes(searchTerm.toLowerCase()) || false
      const matchesFilter = affiliateFilter === "all" || affiliateId === affiliateFilter
      return matchesSearch && matchesFilter
    })
    .reduce((acc, [affiliateId, data]) => {
      acc[affiliateId] = data
      return acc
    }, {} as typeof groupedChecklists)

  // Show loading while authentication is being determined
  if (!user || !userProfile) {
    return <AnimatedLoading message="Loading authentication..." />
  }

  if (isLoading) {
    return <AnimatedLoading message="Loading checklists..." />
  }

  return (
    <>
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
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
                  Affiliate Checklist Management
                </h1>
                <p className="text-gray-600">
                  Welcome back, {userProfile?.full_name || user?.email} •{" "}
                  {userProfile?.role ? userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1) : 'User'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AdminSettings currentUser={userProfile} onDataChange={loadData} />
              {userProfile?.role === 'admin' && (
                <Button
                  onClick={() => router.push('/manage-roles')}
                  variant="outline"
                  size="sm"
                  className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10 bg-transparent"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Manage Roles
                </Button>
              )}
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10 bg-transparent"
                disabled={isRefreshing || isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "Refreshing..." : "Refresh"}
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

        {/* Enhanced Notifications */}
        <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
          {notifications.map((notification) => {
            const getNotificationStyles = () => {
              switch (notification.type) {
                case 'success':
                  return 'bg-green-50 border-green-200 text-green-800'
                case 'error':
                  return 'bg-red-50 border-red-200 text-red-800'
                case 'warning':
                  return 'bg-yellow-50 border-yellow-200 text-yellow-800'
                case 'info':
                  return 'bg-blue-50 border-blue-200 text-blue-800'
                default:
                  return 'bg-gray-50 border-gray-200 text-gray-800'
              }
            }

            const getIcon = () => {
              switch (notification.type) {
                case 'success':
                  return <CheckCircle className="h-5 w-5 text-green-500" />
                case 'error':
                  return <AlertCircle className="h-5 w-5 text-red-500" />
                case 'warning':
                  return <AlertCircle className="h-5 w-5 text-yellow-500" />
                case 'info':
                  return <AlertCircle className="h-5 w-5 text-blue-500" />
                default:
                  return <AlertCircle className="h-5 w-5 text-gray-500" />
              }
            }

            return (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border shadow-lg transform transition-all duration-300 ease-in-out ${getNotificationStyles()}`}
                style={{
                  animation: 'slideInRight 0.3s ease-out'
                }}
              >
                <div className="flex items-start gap-3">
                  {getIcon()}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm mb-1">{notification.title}</h4>
                    <p className="text-sm opacity-90">{notification.message}</p>
                    {notification.action && (
                      <button
                        onClick={notification.action.onClick}
                        className="mt-2 text-sm font-medium underline hover:no-underline"
                      >
                        {notification.action.label}
                      </button>
                    )}
                  </div>
                  <Button
                    onClick={() => removeNotification(notification.id)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Clear All Notifications Button */}
        {notifications.length > 0 && (
          <div className="fixed top-4 right-4 z-50">
            <Button
              onClick={clearAllNotifications}
              variant="outline"
              size="sm"
              className="bg-white/80 backdrop-blur-sm border-gray-300 text-gray-600 hover:bg-white"
            >
              Clear All ({notifications.length})
            </Button>
          </div>
        )}

        {/* Main Content */}
        <div className="px-6 py-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <RefreshCw className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Checklists</h3>
                <p className="text-gray-600">
                  Please wait while we load your checklist data...
                </p>
              </div>
            </div>
          ) : checklists.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <CheckSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Checklists Yet</h3>
                <p className="text-gray-600 mb-6">
                  {cashCalls.length > 0 
                    ? "Create your first checklist to start managing affiliate requirements."
                    : "No cash calls available. Please create cash calls first before creating checklists."
                  }
                </p>
                {cashCalls.length > 0 && (userProfile?.role?.toLowerCase() === 'admin' || userProfile?.role?.toLowerCase() === 'approver' || userProfile?.role?.toLowerCase() === 'affiliate') && (
                  <Button
                    onClick={() => setIsCreateChecklistOpen(true)}
                    className="aramco-button-primary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Checklist
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Controls */}
              <div className="mb-6 space-y-4">
                {/* Loading indicator for controls */}
                {isLoading && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading data...
                  </div>
                )}
                {/* Search and Filters */}
                                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search checklists..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-md"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Select value={affiliateFilter} onValueChange={setAffiliateFilter} disabled={isLoading}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Affiliates</SelectItem>
                          {affiliates
                            .filter(affiliate => 
                              userProfile?.role?.toLowerCase() !== 'affiliate' || 
                              affiliate.id === userProfile?.affiliate_company_id
                            )
                            .map((affiliate) => (
                              <SelectItem key={affiliate.id} value={affiliate.id}>
                                {affiliate.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={expandAllChecklists}
                      variant="outline"
                      size="sm"
                      disabled={isLoading}
                    >
                      Expand All
                    </Button>
                    <Button
                      onClick={collapseAllChecklists}
                      variant="outline"
                      size="sm"
                      disabled={isLoading}
                    >
                      Collapse All
                    </Button>
                    {userProfile?.role?.toLowerCase() === 'admin' && checklists.length > 0 && (
                      <Button
                        onClick={toggleBulkMode}
                        variant={bulkMode ? "default" : "outline"}
                        size="sm"
                        className={bulkMode ? "bg-red-600 hover:bg-red-700" : "border-red-400 text-red-400 hover:bg-red-500/10"}
                        disabled={isLoading}
                      >
                        {bulkMode ? "Exit Bulk Mode" : "Bulk Delete Mode"}
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {bulkMode && userProfile?.role?.toLowerCase() === 'admin' && (
                      <>
                        <Button
                          onClick={selectAllChecklists}
                          variant="outline"
                          size="sm"
                          disabled={isLoading}
                        >
                          Select All ({checklists.length})
                        </Button>
                        <Button
                          onClick={clearAllSelections}
                          variant="outline"
                          size="sm"
                          disabled={isLoading}
                        >
                          Clear All
                        </Button>
                        <Button
                          onClick={deleteSelectedChecklists}
                          variant="destructive"
                          size="sm"
                          disabled={isLoading || selectedChecklists.size === 0}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Selected ({selectedChecklists.size})
                        </Button>
                      </>
                    )}
                    {(userProfile?.role?.toLowerCase() === 'admin' || userProfile?.role?.toLowerCase() === 'approver' || userProfile?.role?.toLowerCase() === 'affiliate') && (
                      <Button
                        onClick={() => setIsCreateChecklistOpen(true)}
                        className="aramco-button-primary"
                        disabled={isLoading}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Checklist
                      </Button>
                    )}
                    {userProfile?.role?.toLowerCase() === 'admin' && checklists.length > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-400 text-red-400 hover:bg-red-500/10"
                            disabled={isLoading}
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ALL ${checklists.length} checklists? This action cannot be undone.`)) {
                                // Bulk delete all checklists
                                Promise.all(checklists.map(checklist => 
                                  deleteAffiliateChecklist(checklist.id)
                                )).then(() => {
                                  setChecklists([])
                                  addNotification('success', 'Bulk Delete Complete', `Successfully deleted ${checklists.length} checklists.`, 8000)
                                }).catch(err => {
                                  console.error('Bulk delete error:', err)
                                  addNotification('error', 'Bulk Delete Failed', 'Some checklists could not be deleted. Please try again.', 8000)
                                })
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete All
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete all checklists (Admin only)</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>

              {/* Checklists Display */}
              <div className="space-y-6">
                  {Object.entries(filteredGroupedChecklists).map(([affiliateId, affiliateData]) => {
                    const isAffiliateExpanded = expandedChecklists.has(`affiliate-${affiliateId}`)
                    const totalChecklists = affiliateData.checklists.length
                    const totalItems = affiliateData.checklists.reduce((sum, checklist) => 
                      sum + checklist.groups.reduce((groupSum, group) => groupSum + group.items.length, 0), 0
                    )
                    const completedItems = affiliateData.checklists.reduce((sum, checklist) => 
                      sum + checklist.groups.reduce((groupSum, group) => 
                        groupSum + group.items.filter(item => 
                          item.status === 'Completed' || 
                          item.status === 'Complete' || 
                          item.status === 'Done' ||
                          item.status === 'Finished'
                        ).length, 0
                      ), 0
                    )
                    const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

                    return (
                      <Card key={affiliateId} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <Button
                                onClick={() => toggleChecklistExpansion(`affiliate-${affiliateId}`)}
                                variant="ghost"
                                size="sm"
                                className="p-1 h-8 w-8 text-[#0033A0] hover:bg-[#0033A0]/10"
                              >
                                {isAffiliateExpanded ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                )}
                              </Button>
                              <div>
                                <CardTitle className="text-[#0033A0] text-xl">{affiliateData.affiliate?.name || 'Unknown Affiliate'}</CardTitle>
                                <div className="flex items-center gap-4 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {totalChecklists} Checklist{totalChecklists !== 1 ? 's' : ''}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    {totalItems} items
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">
                                  {completedItems}/{totalItems} completed
                                </div>
                                <div className="text-xs text-gray-500">
                                  {Math.round(progress)}% complete
                                </div>
                              </div>
                              <div className="w-24 h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                                {totalItems > 0 ? (
                                  <div 
                                    className="h-full bg-gradient-to-r from-[#00A3E0] to-[#0033A0] transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                  />
                                ) : (
                                  <div className="h-full bg-gray-300 flex items-center justify-center">
                                    <span className="text-xs text-gray-500">No items</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        
                        {isAffiliateExpanded && (
                          <CardContent className="pt-0">
                            <div className="space-y-6">
                              {affiliateData.checklists.map((checklist) => {
                                const isChecklistExpanded = expandedChecklists.has(`checklist-${checklist.id}`)
                                
                                return (
                                  <Card key={checklist.id} className="border border-gray-100">
                                    <CardHeader className="pb-3">
                                      <div className="flex items-center justify-between">
                                                                                 <div className="flex items-center gap-4 flex-1">
                                           {bulkMode && userProfile?.role?.toLowerCase() === 'admin' && (
                                             <Checkbox
                                               checked={selectedChecklists.has(checklist.id)}
                                               onCheckedChange={() => toggleChecklistSelection(checklist.id)}
                                               className="mr-2"
                                             />
                                           )}
                                           <Button
                                             onClick={() => toggleChecklistExpansion(`checklist-${checklist.id}`)}
                                             variant="ghost"
                                             size="sm"
                                             className="p-1 h-8 w-8 text-gray-600 hover:bg-gray-100"
                                           >
                                             {isChecklistExpanded ? (
                                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                               </svg>
                                             ) : (
                                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                               </svg>
                                             )}
                                           </Button>
                                          <div>
                                            <CardTitle className="text-gray-900 text-base">
                                              {checklist.affiliate_name}
                                              {userProfile?.role?.toLowerCase() === "admin" && (
                                                <Badge variant="outline" className="ml-2 text-xs bg-blue-100 text-blue-800 border-blue-300">
                                                  Admin Access
                                                </Badge>
                                              )}
                                            </CardTitle>
                                            <div className="flex items-center gap-4 mt-1">
                                              <Badge variant="outline" className="text-xs">
                                                {checklist.template_type}
                                              </Badge>
                                              <span className="text-sm text-gray-500">
                                                {checklist.groups.length} groups • {checklist.groups.reduce((sum, group) => sum + group.items.length, 0)} items
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        {/* Debug info - remove this later */}
                                        <div className="text-xs text-gray-400 mr-2">
                                          Role: {userProfile?.role} | Affiliate: {checklist.affiliate_id} | User Affiliate: {userProfile?.affiliate_company_id}
                                        </div>
                                        {(userProfile?.role?.toLowerCase() === "admin" || (userProfile?.role?.toLowerCase() === "affiliate" && checklist.affiliate_id === userProfile.affiliate_company_id)) && (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 px-2 border-red-400 text-red-400 hover:bg-red-500/10 hover:border-red-500"
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                  <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Checklist</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                      Are you sure you want to delete the checklist "{checklist.affiliate_name}"? This action cannot be undone.
                                                    </AlertDialogDescription>
                                                  </AlertDialogHeader>
                                                  <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                      onClick={() => handleDeleteChecklist(checklist.id, checklist.affiliate_name)}
                                                      className="bg-red-600 hover:bg-red-700"
                                                    >
                                                      Delete
                                                    </AlertDialogAction>
                                                  </AlertDialogFooter>
                                                </AlertDialogContent>
                                              </AlertDialog>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Delete this checklist</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        )}
                                      </div>
                                    </CardHeader>
                                    
                                    {isChecklistExpanded && (
                                      <CardContent className="pt-0">
                                        <div className="space-y-6">
                                          {checklist.groups.map((group) => (
                                            <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                                              <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-lg font-semibold text-gray-900">{group.name}</h4>
                                              </div>
                                              <div className="overflow-x-auto">
                                                <table className="w-full">
                                                  <thead>
                                                    <tr className="border-b border-gray-200">
                                                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Item No.</th>
                                                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Document List</th>
                                                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Status</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {group.items.map((item) => (
                                                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="py-3 px-3 text-sm text-gray-900">{item.itemNo}</td>
                                                        <td className="py-3 px-3 text-sm text-gray-700">{item.documentList}</td>
                                                        <td className="py-3 px-3">
                                                          <Select
                                                            value={item.status}
                                                            onValueChange={(value) =>
                                                              handleUpdateItemStatus(checklist.id, group.id, item.id, value)
                                                            }
                                                            disabled={userProfile?.role?.toLowerCase() !== "admin" && userProfile?.role?.toLowerCase() !== "affiliate"}
                                                          >
                                                            <SelectTrigger className="h-8 text-sm border-none bg-transparent p-0 hover:bg-gray-50">
                                                              <SelectValue asChild>
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
                                                              </SelectValue>
                                                            </SelectTrigger>
                                                            {(userProfile?.role?.toLowerCase() === "admin" || userProfile?.role?.toLowerCase() === "affiliate") && (
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
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </CardContent>
                                    )}
                                  </Card>
                                )
                              })}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    )
                  })}
                </div>

            </>
          )}
        </div>

        {/* Create Checklist Dialog */}
        <Dialog open={isCreateChecklistOpen} onOpenChange={setIsCreateChecklistOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Checklist</DialogTitle>
              <DialogDescription>
                Create a new checklist for an affiliate and link it to a specific cash call.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="affiliate-select">Affiliate</Label>
                <Select
                  value={selectedAffiliateForChecklist?.id || ""}
                  onValueChange={(value) => {
                    const affiliate = affiliates.find(a => a.id === value)
                    setSelectedAffiliateForChecklist(affiliate || null)
                    setSelectedCashCallForChecklist(null) // Reset cash call selection when affiliate changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an affiliate" />
                  </SelectTrigger>
                  <SelectContent>
                    {affiliates
                      .filter(affiliate => 
                        userProfile?.role?.toLowerCase() !== 'affiliate' || 
                        affiliate.id === userProfile?.affiliate_company_id
                      )
                      .map((affiliate) => (
                        <SelectItem key={affiliate.id} value={affiliate.id}>
                          {affiliate.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedAffiliateForChecklist && (
                <div>
                  <Label htmlFor="cash-call-select">Cash Call</Label>
                  <Select
                    value={selectedCashCallForChecklist?.id || ""}
                    onValueChange={(value) => {
                      const cashCall = getAvailableCashCallsForAffiliate(selectedAffiliateForChecklist.id).find(c => c.id === value)
                      setSelectedCashCallForChecklist(cashCall || null)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a cash call" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableCashCallsForAffiliate(selectedAffiliateForChecklist.id).map((cashCall) => (
                        <SelectItem key={cashCall.id} value={cashCall.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{cashCall.call_number}</span>
                            <span className="text-xs text-gray-500">
                              ${cashCall.amount_requested?.toLocaleString() || '0'} • {cashCall.status}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {getAvailableCashCallsForAffiliate(selectedAffiliateForChecklist.id).length === 0 && (
                    <div className="text-sm text-red-500 mt-1">
                      <p>No available cash calls for this affiliate. All cash calls already have checklists.</p>
                    </div>
                  )}
                </div>
              )}
              <div>
                <Label htmlFor="template-type">Template Type</Label>
                <Select
                  value={checklistTemplateType}
                  onValueChange={(value: 'CAPEX' | 'OPEX') => setChecklistTemplateType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAPEX">CAPEX</SelectItem>
                    <SelectItem value="OPEX">OPEX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateChecklistOpen(false)
                  setSelectedAffiliateForChecklist(null)
                  setSelectedCashCallForChecklist(null)
                  setChecklistTemplateType('CAPEX')
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateChecklist} 
                className="aramco-button-primary"
                disabled={!selectedAffiliateForChecklist || !selectedCashCallForChecklist}
              >
                Create Checklist
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      </TooltipProvider>
    </>
  )
}
