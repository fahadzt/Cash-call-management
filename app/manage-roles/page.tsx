"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  Users,
  Shield,
  Building2,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Save,
  X,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
} from "lucide-react"
import { useAuth } from "@/lib/firebase-auth-context"
import { 
  getUsers, 
  getAffiliates, 
  updateUser, 
  deleteUser,
  createAffiliate,
  type User,
  type Affiliate 
} from "@/lib/firebase-database"
import { ErrorBoundary } from "@/components/error-boundary"
import { AnimatedLoading } from "@/components/animated-loading"

// Role definitions with permissions
const ROLE_DEFINITIONS = {
  ADMIN: {
    name: "Administrator",
    description: "Full system access and control",
    color: "bg-red-100 text-red-800",
    permissions: ["all"],
    icon: Shield
  },
  CFO: {
    name: "CFO",
    description: "Approves high-value cash calls and oversees workflows",
    color: "bg-blue-100 text-blue-800",
    permissions: ["cash_calls.approve", "cash_calls.read", "cash_calls.update", "affiliates.read"],
    icon: UserCheck
  },
  AFFILIATE: {
    name: "Affiliate User",
    description: "Can create and manage their affiliate's cash calls",
    color: "bg-green-100 text-green-800",
    permissions: ["cash_calls.create", "cash_calls.read", "cash_calls.update", "affiliates.read"],
    icon: Building2
  },
  FINANCE: {
    name: "Finance",
    description: "Manages cash calls and performs finance review",
    color: "bg-purple-100 text-purple-800",
    permissions: ["cash_calls.read", "cash_calls.update", "affiliates.read"],
    icon: Settings
  }
}

export default function ManageRolesPage() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [activeTab, setActiveTab] = useState("users")
  const router = useRouter()

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [affiliateFilter, setAffiliateFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // User management states
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [newRole, setNewRole] = useState("")
  const [selectedAffiliate, setSelectedAffiliate] = useState("")
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)

  // Bulk operations
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false)
  const [bulkRole, setBulkRole] = useState("")

  // Affiliate management states
  const [isAddAffiliateOpen, setIsAddAffiliateOpen] = useState(false)
  const [selectedAffiliateForActions, setSelectedAffiliateForActions] = useState<string | null>(null)
  const [isViewAffiliateUsersOpen, setIsViewAffiliateUsersOpen] = useState(false)
  const [isAddUserToAffiliateOpen, setIsAddUserToAffiliateOpen] = useState(false)
  const [isManageAffiliateSettingsOpen, setIsManageAffiliateSettingsOpen] = useState(false)
  
  // New affiliate form state
  const [newAffiliate, setNewAffiliate] = useState({
    name: "",
    company_code: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    status: "active" as "active" | "inactive" | "suspended"
  })
  const [isCreatingAffiliate, setIsCreatingAffiliate] = useState(false)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    setIsLoading(true)
    setError("")
    try {
      const [usersData, affiliatesData] = await Promise.all([
        getUsers(),
        getAffiliates(),
      ])
      setUsers(usersData)
      setAffiliates(affiliatesData)
    } catch (err) {
      console.error("Error loading data:", err)
      setError("Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }



  // Show loading while authentication is in progress
  if (authLoading || !userProfile) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold mb-2">Loading...</h2>
              <p className="text-gray-600">
                {authLoading ? "Checking authentication..." : "Loading user profile..."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if current user has admin permissions
  const isAdmin = userProfile?.role === 'admin'
  
  // Debug logging
  console.log('Debug - userProfile:', userProfile)
  console.log('Debug - userProfile?.role:', userProfile?.role)
  console.log('Debug - isAdmin:', isAdmin)

  // Temporarily allow all users to access this page for debugging
  // if (!isAdmin) {
  //   return (
  //     <div className="container mx-auto p-6">
  //       <Card>
  //         <CardContent className="p-6">
  //           <div className="text-center">
  //             <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
  //             <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
  //             <p className="text-gray-600 mb-4">
  //               You don't have permission to access the role management system.
  //             </p>
  //             <Button onClick={() => router.push('/dashboard')}>
  //               Return to Dashboard
  //             </Button>
  //           </div>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   )
  // }

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesAffiliate = affiliateFilter === "all" || 
                           (affiliateFilter === "none" && !user.affiliate_company_id) ||
                           user.affiliate_company_id === affiliateFilter
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && user.is_active) ||
                         (statusFilter === "inactive" && !user.is_active)
    
    return matchesSearch && matchesRole && matchesAffiliate && matchesStatus
  })

  const handleUpdateUserRole = async (userId: string, newRole: string, affiliateId?: string) => {
    setIsUpdatingRole(true)
    setError("")
    try {
      // Convert "none" to undefined for the database
      const finalAffiliateId = affiliateId === "none" ? undefined : affiliateId
      await updateUser(userId, { 
        role: newRole as any, 
        affiliate_company_id: finalAffiliateId 
      })
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: newRole as any, affiliate_company_id: finalAffiliateId }
          : user
      ))
      setEditingUser(null)
      setNewRole("")
      setSelectedAffiliate("")
      setSuccess("User role updated successfully")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error updating user role:", err)
      setError("Failed to update user role")
    } finally {
      setIsUpdatingRole(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return
    }

    try {
      setError("")
      await deleteUser(userId)
      setUsers(users.filter(user => user.id !== userId))
      setSuccess("User deleted successfully")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error deleting user:", err)
      setError("Failed to delete user")
    }
  }

  const handleBulkUpdateRoles = async () => {
    if (selectedUsers.size === 0 || !bulkRole) return

    setIsUpdatingRole(true)
    setError("")
    try {
      const updatePromises = Array.from(selectedUsers).map(userId =>
        updateUser(userId, { role: bulkRole as any })
      )
      await Promise.all(updatePromises)
      
      setUsers(users.map(user => 
        selectedUsers.has(user.id) 
          ? { ...user, role: bulkRole as any }
          : user
      ))
      setSelectedUsers(new Set())
      setBulkRole("")
      setIsBulkUpdateOpen(false)
      setSuccess(`Updated roles for ${selectedUsers.size} users`)
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error bulk updating roles:", err)
      setError("Failed to update some user roles")
    } finally {
      setIsUpdatingRole(false)
    }
  }

  const getRoleInfo = (role: string) => {
    // Handle legacy roles by mapping them to new roles
    const roleMapping: Record<string, keyof typeof ROLE_DEFINITIONS> = {
      'admin': 'ADMIN',
      'approver': 'CFO',
      'affiliate': 'AFFILIATE',
      'viewer': 'FINANCE'
    }
    
    const mappedRole = roleMapping[role] || role
    return ROLE_DEFINITIONS[mappedRole as keyof typeof ROLE_DEFINITIONS] || ROLE_DEFINITIONS.FINANCE
  }

  const getAffiliateName = (affiliateId?: string) => {
    if (!affiliateId || affiliateId === "none") return "None"
    const affiliate = affiliates.find(a => a.id === affiliateId)
    return affiliate?.name || "Unknown"
  }

  // Affiliate management handlers
  const handleViewAffiliateUsers = (affiliateId: string) => {
    setSelectedAffiliateForActions(affiliateId)
    setIsViewAffiliateUsersOpen(true)
  }

  const handleAddUserToAffiliate = (affiliateId: string) => {
    setSelectedAffiliateForActions(affiliateId)
    setIsAddUserToAffiliateOpen(true)
  }

  const handleManageAffiliateSettings = (affiliateId: string) => {
    setSelectedAffiliateForActions(affiliateId)
    setIsManageAffiliateSettingsOpen(true)
  }

  const handleCreateAffiliate = async () => {
    if (!newAffiliate.name || !newAffiliate.company_code) {
      setError("Name and Company Code are required")
      return
    }

    setIsCreatingAffiliate(true)
    setError("")

    try {
      const affiliateData = {
        name: newAffiliate.name,
        company_code: newAffiliate.company_code,
        contact_email: newAffiliate.contact_email || undefined,
        contact_phone: newAffiliate.contact_phone || undefined,
        address: newAffiliate.address || undefined,
        status: newAffiliate.status,
        risk_level: "low" as const
      }

      await createAffiliate(affiliateData)
      
      // Reset form
      setNewAffiliate({
        name: "",
        company_code: "",
        contact_email: "",
        contact_phone: "",
        address: "",
        status: "active"
      })
      
      setIsAddAffiliateOpen(false)
      setSuccess("Affiliate created successfully")
      setTimeout(() => setSuccess(""), 3000)
      
      // Reload data to show the new affiliate
      await loadData()
    } catch (err) {
      console.error("Error creating affiliate:", err)
      setError("Failed to create affiliate. Please try again.")
    } finally {
      setIsCreatingAffiliate(false)
    }
  }

  if (isLoading) {
    return <AnimatedLoading />
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Button>
        </div>
        <h1 className="text-3xl font-bold mb-2">Role Management</h1>
        <p className="text-gray-600">
          Manage user roles and permissions across the system
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-green-700">{success}</span>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Roles
          </TabsTrigger>
          <TabsTrigger value="affiliates" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Affiliate Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search & Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search Users</Label>
                  <Input
                    id="search"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="role-filter">Filter by Role</Label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {Object.keys(ROLE_DEFINITIONS).map(role => (
                        <SelectItem key={role} value={role}>
                          {getRoleInfo(role).name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="affiliate-filter">Filter by Affiliate</Label>
                  <Select value={affiliateFilter} onValueChange={setAffiliateFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                                         <SelectContent>
                       <SelectItem value="all">All Affiliates</SelectItem>
                       <SelectItem value="none">No Affiliate</SelectItem>
                       {affiliates.map(affiliate => (
                         <SelectItem key={affiliate.id} value={affiliate.id}>
                           {affiliate.name}
                         </SelectItem>
                       ))}
                     </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status-filter">Filter by Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedUsers.size > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {selectedUsers.size} user(s) selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsBulkUpdateOpen(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Update Roles
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedUsers(new Set())}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Users Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Users ({filteredUsers.length})</CardTitle>
                <Button onClick={loadData} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">
                        <input
                          type="checkbox"
                          checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(new Set(filteredUsers.map(u => u.id)))
                            } else {
                              setSelectedUsers(new Set())
                            }
                          }}
                        />
                      </th>
                      <th className="text-left p-2">User</th>
                      <th className="text-left p-2">Role</th>
                      <th className="text-left p-2">Affiliate</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Last Login</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => {
                      const roleInfo = getRoleInfo(user.role)
                      const RoleIcon = roleInfo.icon
                      
                      return (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <input
                              type="checkbox"
                              checked={selectedUsers.has(user.id)}
                              onChange={(e) => {
                                const newSelected = new Set(selectedUsers)
                                if (e.target.checked) {
                                  newSelected.add(user.id)
                                } else {
                                  newSelected.delete(user.id)
                                }
                                setSelectedUsers(newSelected)
                              }}
                            />
                          </td>
                          <td className="p-2">
                            <div>
                              <div className="font-medium">{user.full_name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="p-2">
                            <Badge className={roleInfo.color}>
                              <RoleIcon className="h-3 w-3 mr-1" />
                              {roleInfo.name}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <span className="text-sm">
                              {getAffiliateName(user.affiliate_company_id)}
                            </span>
                          </td>
                          <td className="p-2">
                            <Badge variant={user.is_active ? "default" : "secondary"}>
                              {user.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <span className="text-sm text-gray-500">
                              {user.last_login 
                                ? new Date(user.last_login).toLocaleDateString()
                                : "Never"
                              }
                            </span>
                          </td>
                          <td className="p-2">
                            <div className="flex gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setEditingUser(user.id)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit user role</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete {user.full_name}? 
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteUser(user.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="affiliates" className="space-y-6">
          {/* Affiliate Management Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Affiliate Management</CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setIsAddAffiliateOpen(true)}
                    variant="outline"
                    size="sm"
                    className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Affiliate
                  </Button>
                  <Button
                    onClick={loadData}
                    variant="outline"
                    size="sm"
                    className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {affiliates.map(affiliate => {
                  const affiliateUsers = users.filter(u => u.affiliate_company_id === affiliate.id)
                  const adminUsers = affiliateUsers.filter(u => u.role === 'admin')
                  const affiliateRoleUsers = affiliateUsers.filter(u => u.role === 'affiliate')
                  
                  return (
                    <Card key={affiliate.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{affiliate.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant={affiliate.status === 'active' ? 'default' : 'secondary'}>
                            {affiliate.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAffiliateForActions(affiliate.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm mb-4">
                        <div>Total Users: {affiliateUsers.length}</div>
                        <div>Admins: {adminUsers.length}</div>
                        <div>Affiliate Users: {affiliateRoleUsers.length}</div>
                        <div>Code: {affiliate.company_code}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewAffiliateUsers(affiliate.id)}
                          className="text-xs"
                        >
                          <Users className="h-3 w-3 mr-1" />
                          View Users
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddUserToAffiliate(affiliate.id)}
                          className="text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add User
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManageAffiliateSettings(affiliate.id)}
                          className="text-xs"
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Settings
                        </Button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Affiliate Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{affiliates.length}</div>
                  <div className="text-sm text-gray-600">Total Affiliates</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {affiliates.filter(a => a.status === 'active').length}
                  </div>
                  <div className="text-sm text-gray-600">Active Affiliates</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {users.filter(u => u.role === 'affiliate').length}
                  </div>
                  <div className="text-sm text-gray-600">Affiliate Users</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {users.filter(u => u.affiliate_company_id && u.role === 'admin').length}
                  </div>
                  <div className="text-sm text-gray-600">Affiliate Admins</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Role Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Update the role and affiliate assignment for this user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-role">Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_DEFINITIONS).map(([role, info]) => (
                    <SelectItem key={role} value={role}>
                      <div className="flex items-center gap-2">
                        <info.icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{info.name}</div>
                          <div className="text-xs text-gray-500">{info.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {newRole === 'AFFILIATE' && (
              <div>
                <Label htmlFor="affiliate">Affiliate Company</Label>
                <Select value={selectedAffiliate} onValueChange={setSelectedAffiliate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an affiliate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Affiliate</SelectItem>
                    {affiliates.map(affiliate => (
                      <SelectItem key={affiliate.id} value={affiliate.id}>
                        {affiliate.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (editingUser && newRole) {
                  handleUpdateUserRole(editingUser, newRole, selectedAffiliate)
                }
              }}
              disabled={!newRole || isUpdatingRole}
            >
              {isUpdatingRole ? "Updating..." : "Update Role"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Update Dialog */}
      <Dialog open={isBulkUpdateOpen} onOpenChange={setIsBulkUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Update Roles</DialogTitle>
            <DialogDescription>
              Update roles for {selectedUsers.size} selected users.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-role">New Role</Label>
              <Select value={bulkRole} onValueChange={setBulkRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_DEFINITIONS).map(([role, info]) => (
                    <SelectItem key={role} value={role}>
                      {info.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsBulkUpdateOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkUpdateRoles}
              disabled={!bulkRole || isUpdatingRole}
            >
              {isUpdatingRole ? "Updating..." : "Update All"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Affiliate Users Dialog */}
      <Dialog open={isViewAffiliateUsersOpen} onOpenChange={setIsViewAffiliateUsersOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Affiliate Users</DialogTitle>
            <DialogDescription>
              Users assigned to {getAffiliateName(selectedAffiliateForActions || "")}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {selectedAffiliateForActions && (
              <div className="space-y-4">
                {users
                  .filter(user => user.affiliate_company_id === selectedAffiliateForActions)
                  .map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleInfo(user.role).color}>
                          {getRoleInfo(user.role).name}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingUser(user.id)
                            setNewRole(user.role)
                            setSelectedAffiliate(user.affiliate_company_id || "none")
                            setIsViewAffiliateUsersOpen(false)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                {users.filter(user => user.affiliate_company_id === selectedAffiliateForActions).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No users assigned to this affiliate
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add User to Affiliate Dialog */}
      <Dialog open={isAddUserToAffiliateOpen} onOpenChange={setIsAddUserToAffiliateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User to Affiliate</DialogTitle>
            <DialogDescription>
              Assign a user to {getAffiliateName(selectedAffiliateForActions || "")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select User</Label>
              <Select onValueChange={(userId) => {
                const user = users.find(u => u.id === userId)
                if (user) {
                  setEditingUser(user.id)
                  setNewRole(user.role)
                  setSelectedAffiliate(selectedAffiliateForActions || "none")
                  setIsAddUserToAffiliateOpen(false)
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter(user => !user.affiliate_company_id || user.affiliate_company_id !== selectedAffiliateForActions)
                    .map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name} ({user.email})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Affiliate Settings Dialog */}
      <Dialog open={isManageAffiliateSettingsOpen} onOpenChange={setIsManageAffiliateSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Affiliate Settings</DialogTitle>
            <DialogDescription>
              Manage settings for {getAffiliateName(selectedAffiliateForActions || "")}
            </DialogDescription>
          </DialogHeader>
          {selectedAffiliateForActions && (
            <div className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select defaultValue={affiliates.find(a => a.id === selectedAffiliateForActions)?.status || 'active'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Company Code</Label>
                <Input 
                  defaultValue={affiliates.find(a => a.id === selectedAffiliateForActions)?.company_code || ''} 
                  placeholder="Enter company code"
                />
              </div>
              <div>
                <Label>Contact Email</Label>
                <Input 
                  defaultValue={affiliates.find(a => a.id === selectedAffiliateForActions)?.contact_email || ''} 
                  placeholder="Enter contact email"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsManageAffiliateSettingsOpen(false)}>
                  Cancel
                </Button>
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Affiliate Dialog */}
      <Dialog open={isAddAffiliateOpen} onOpenChange={setIsAddAffiliateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Affiliate</DialogTitle>
            <DialogDescription>
              Create a new affiliate company in the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="affiliate-name">Affiliate Name *</Label>
              <Input
                id="affiliate-name"
                value={newAffiliate.name}
                onChange={(e) => setNewAffiliate({ ...newAffiliate, name: e.target.value })}
                placeholder="Enter affiliate name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="company-code">Company Code *</Label>
              <Input
                id="company-code"
                value={newAffiliate.company_code}
                onChange={(e) => setNewAffiliate({ ...newAffiliate, company_code: e.target.value })}
                placeholder="Enter company code"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="contact-email">Contact Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={newAffiliate.contact_email}
                onChange={(e) => setNewAffiliate({ ...newAffiliate, contact_email: e.target.value })}
                placeholder="Enter contact email"
              />
            </div>
            
            <div>
              <Label htmlFor="contact-phone">Contact Phone</Label>
              <Input
                id="contact-phone"
                value={newAffiliate.contact_phone}
                onChange={(e) => setNewAffiliate({ ...newAffiliate, contact_phone: e.target.value })}
                placeholder="Enter contact phone"
              />
            </div>
            
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={newAffiliate.address}
                onChange={(e) => setNewAffiliate({ ...newAffiliate, address: e.target.value })}
                placeholder="Enter address"
              />
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={newAffiliate.status} 
                onValueChange={(value) => setNewAffiliate({ ...newAffiliate, status: value as "active" | "inactive" | "suspended" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddAffiliateOpen(false)
                setNewAffiliate({
                  name: "",
                  company_code: "",
                  contact_email: "",
                  contact_phone: "",
                  address: "",
                  status: "active"
                })
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAffiliate}
              disabled={!newAffiliate.name || !newAffiliate.company_code || isCreatingAffiliate}
            >
              {isCreatingAffiliate ? "Creating..." : "Create Affiliate"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
