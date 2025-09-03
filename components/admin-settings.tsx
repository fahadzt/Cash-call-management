"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Settings,
  Users,
  Building2,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  UserCog,
  Tag,
} from "lucide-react"
import { 
  getUsers, 
  getAffiliates, 
  createAffiliate, 
  updateAffiliate, 
  deleteAffiliate,
  updateUserRole,
  type Affiliate,
  type User
} from "@/lib/firebase-database"
import Link from "next/link"
import { checklistDb, type StatusOption } from "@/lib/checklist-database"

interface AdminSettingsProps {
  currentUser: User | null
  onDataChange?: () => void // Callback to refresh dashboard data
}

export function AdminSettings({ currentUser, onDataChange }: AdminSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // User management state
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [userRoleUpdates, setUserRoleUpdates] = useState<Record<string, string>>({})

  // Affiliate management state
  const [editingAffiliate, setEditingAffiliate] = useState<string | null>(null)
  const [isCreatingAffiliate, setIsCreatingAffiliate] = useState(false)
  const [newAffiliate, setNewAffiliate] = useState({
    name: "",
    company_code: "",
    contact_email: "",
    contact_phone: "",
    address: "",
  })
  const [affiliateUpdates, setAffiliateUpdates] = useState<Record<string, Partial<Affiliate>>>({})

  // Status options management state
  const [editingStatus, setEditingStatus] = useState<string | null>(null)
  const [isCreatingStatus, setIsCreatingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState({ label: "", color: "gray", description: "" })
  const [statusUpdates, setStatusUpdates] = useState<Record<string, Partial<StatusOption>>>({})

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  const loadData = async () => {
    setIsLoading(true)
    setError("")
    try {
      const [usersData, affiliatesData, statusOptionsData] = await Promise.all([
        getUsers(),
        getAffiliates(),
        checklistDb.getStatusOptions(),
      ])
      setUsers(usersData)
      setAffiliates(affiliatesData)
      setStatusOptions(statusOptionsData)
    } catch (err) {
      console.error("Error loading admin data:", err)
      setError("Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      setError("")
      await updateUserRole(userId, newRole as any)
      setUsers(users.map((user) => (user.id === userId ? { ...user, role: newRole as any } : user)))
      setEditingUser(null)
      setUserRoleUpdates({})
      setSuccess("User role updated successfully")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error updating user role:", err)
      setError("Failed to update user role")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return
    }

    try {
      setError("")
      // Note: Firebase doesn't have a direct deleteUser function in our database layer
      // You might want to implement this or use Firebase Auth admin SDK
      setUsers(users.filter((user) => user.id !== userId))
      setSuccess("User deleted successfully")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error deleting user:", err)
      setError("Failed to delete user")
    }
  }

  const handleCreateAffiliate = async () => {
    if (!newAffiliate.name || !newAffiliate.company_code) {
      setError("Name and company code are required")
      return
    }

    try {
      setError("")
      const affiliateId = await createAffiliate({
        name: newAffiliate.name,
        company_code: newAffiliate.company_code,
        contact_email: newAffiliate.contact_email || undefined,
        contact_phone: newAffiliate.contact_phone || undefined,
        address: newAffiliate.address || undefined,
        status: 'active',
        risk_level: 'medium',
      })
      
      // Reload affiliates to get the updated list
      const updatedAffiliates = await getAffiliates()
      setAffiliates(updatedAffiliates)
      
      setNewAffiliate({ name: "", company_code: "", contact_email: "", contact_phone: "", address: "" })
      setIsCreatingAffiliate(false)
      setSuccess("Affiliate created successfully")
      setTimeout(() => setSuccess(""), 3000)
      
      // Notify parent component to refresh data
      if (onDataChange) {
        onDataChange()
      }
    } catch (err: any) {
      console.error("Error creating affiliate:", err)
      setError(`Failed to create affiliate: ${err.message || "Unknown error"}`)
    }
  }

  const handleUpdateAffiliate = async (affiliateId: string) => {
    const updates = affiliateUpdates[affiliateId]
    if (!updates) return

    try {
      setError("")
      await updateAffiliate(affiliateId, updates)
      
      // Reload affiliates to get the updated list
      const updatedAffiliates = await getAffiliates()
      setAffiliates(updatedAffiliates)
      
      setEditingAffiliate(null)
      setAffiliateUpdates({})
      setSuccess("Affiliate updated successfully")
      setTimeout(() => setSuccess(""), 3000)
      
      // Notify parent component to refresh data
      if (onDataChange) {
        onDataChange()
      }
    } catch (err) {
      console.error("Error updating affiliate:", err)
      setError("Failed to update affiliate")
    }
  }

  const handleDeleteAffiliate = async (affiliateId: string) => {
    if (!confirm("Are you sure you want to delete this affiliate? This action cannot be undone.")) {
      return
    }

    try {
      setError("")
      await deleteAffiliate(affiliateId)
      
      // Reload affiliates to get the updated list
      const updatedAffiliates = await getAffiliates()
      setAffiliates(updatedAffiliates)
      
      setSuccess("Affiliate deleted successfully")
      setTimeout(() => setSuccess(""), 3000)
      
      // Notify parent component to refresh data
      if (onDataChange) {
        onDataChange()
      }
    } catch (err) {
      console.error("Error deleting affiliate:", err)
      setError("Failed to delete affiliate")
    }
  }

  const handleCreateStatus = async () => {
    if (!newStatus.label.trim()) {
      setError("Status label is required")
      return
    }

    try {
      setError("")
      const createdStatus = await checklistDb.createStatusOption(
        newStatus.label,
        newStatus.color,
        newStatus.description.trim() || undefined,
      )
      setStatusOptions([...statusOptions, createdStatus])
      setNewStatus({ label: "", color: "gray", description: "" })
      setIsCreatingStatus(false)
      setSuccess("Status option created successfully")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error creating status option:", err)
      setError("Failed to create status option")
    }
  }

  const handleUpdateStatus = async (statusId: string) => {
    const updates = statusUpdates[statusId]
    if (!updates) return

    try {
      setError("")
      const updatedStatus = await checklistDb.updateStatusOption(statusId, updates)
      setStatusOptions(statusOptions.map((status) => (status.id === statusId ? updatedStatus : status)))
      setEditingStatus(null)
      setStatusUpdates({})
      setSuccess("Status option updated successfully")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error updating status option:", err)
      setError("Failed to update status option")
    }
  }

  const handleDeleteStatus = async (statusId: string) => {
    if (!confirm("Are you sure you want to delete this status option? This action cannot be undone.")) {
      return
    }

    try {
      setError("")
      await checklistDb.deleteStatusOption(statusId)
      setStatusOptions(statusOptions.filter((status) => status.id !== statusId))
      setSuccess("Status option deleted successfully")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error deleting status option:", err)
      setError("Failed to delete status option")
    }
  }

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200"
      case "manager":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "user":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusBadgeClass = (color: string) => {
    switch (color) {
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

  // Only show settings if user is admin or manager
  if (!currentUser?.role || !["admin", "manager"].includes(currentUser.role)) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10 bg-transparent"
        >
          <Settings className="h-4 w-4 mr-2" />
          Admin Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-6xl h-[85vh] overflow-hidden aramco-card-bg flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">Admin Settings</DialogTitle>
          <DialogDescription className="text-white/80">
            Manage users, roles, affiliates, and status options for the cash call system.
          </DialogDescription>
          <div className="flex justify-end">
            <Link href="/admin/document-requirements">
              <Button variant="outline" size="sm" className="border-[#00A3E0] text-[#00A3E0] hover:bg-[#00A3E0]/10 bg-transparent">
                <Tag className="h-4 w-4 mr-2" />
                Document Requirements
              </Button>
            </Link>
          </div>
        </DialogHeader>

        {/* Success/Error Messages */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="users" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 bg-white/10 flex-shrink-0">
              <TabsTrigger
                value="users"
                className="text-white data-[state=active]:bg-[#0033A0] data-[state=active]:text-white"
              >
                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger
                value="affiliates"
                className="text-white data-[state=active]:bg-[#0033A0] data-[state=active]:text-white"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Affiliates
              </TabsTrigger>
              <TabsTrigger
                value="status"
                className="text-white data-[state=active]:bg-[#0033A0] data-[state=active]:text-white"
              >
                <Tag className="h-4 w-4 mr-2" />
                Status Options
              </TabsTrigger>
              <TabsTrigger
                value="data"
                className="text-white data-[state=active]:bg-[#0033A0] data-[state=active]:text-white"
              >
                <Settings className="h-4 w-4 mr-2" />
                Data
              </TabsTrigger>
            </TabsList>

            {/* User Management Tab */}
            <TabsContent value="users" className="flex-1 overflow-y-auto space-y-4 mt-4">
              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <UserCog className="h-5 w-5" />
                    User Role Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8 text-white">Loading users...</div>
                  ) : (
                    <div className="space-y-4">
                      {users.map((user) => (
                        <div
                          key={user.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 gap-4"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-white truncate">{user.full_name || user.email}</p>
                                <p className="text-sm text-white/70 truncate">{user.email}</p>
                                {user.company && <p className="text-xs text-white/50 truncate">{user.company}</p>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <Badge className={getRoleBadgeClass(user.role)}>{user.role}</Badge>
                            {editingUser === user.id ? (
                              <div className="flex items-center gap-2">
                                <Select
                                  value={userRoleUpdates[user.id] || user.role}
                                  onValueChange={(value) =>
                                    setUserRoleUpdates({ ...userRoleUpdates, [user.id]: value })
                                  }
                                >
                                  <SelectTrigger className="w-32 enhanced-select">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white border-gray-300">
                                    <SelectItem value="user" className="text-gray-700">
                                      User
                                    </SelectItem>
                                    <SelectItem value="manager" className="text-gray-700">
                                      Manager
                                    </SelectItem>
                                    <SelectItem value="admin" className="text-gray-700">
                                      Admin
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateUserRole(user.id, userRoleUpdates[user.id] || user.role)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingUser(null)}
                                  className="border-gray-400 text-gray-300 hover:bg-gray-700"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingUser(user.id)}
                                  className="border-[#00A3E0] text-[#00A3E0] hover:bg-[#00A3E0]/10"
                                  disabled={user.id === currentUser?.id}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit Role
                                </Button>
                                {editingUser !== user.id && user.id !== currentUser?.id && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="border-red-400 text-red-400 hover:bg-red-500/10"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Affiliate Management Tab */}
            <TabsContent value="affiliates" className="flex-1 overflow-y-auto space-y-4 mt-4">
              <Card className="enhanced-card">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Affiliate Management
                    </CardTitle>
                    <Button
                      onClick={() => setIsCreatingAffiliate(true)}
                      className="aramco-button-primary text-white enhanced-button w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Affiliate
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Create New Affiliate Form */}
                  {isCreatingAffiliate && (
                    <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                      <h3 className="text-white font-medium mb-4">Create New Affiliate</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white">Name *</Label>
                          <Input
                            value={newAffiliate.name}
                            onChange={(e) => setNewAffiliate({ ...newAffiliate, name: e.target.value })}
                            placeholder="Affiliate name"
                            className="enhanced-input"
                          />
                        </div>
                        <div>
                          <Label className="text-white">Company Code *</Label>
                          <Input
                            value={newAffiliate.company_code}
                            onChange={(e) =>
                              setNewAffiliate({ ...newAffiliate, company_code: e.target.value.toUpperCase() })
                            }
                            placeholder="COMPANY"
                            className="enhanced-input"
                          />
                        </div>
                        <div>
                          <Label className="text-white">Contact Email</Label>
                          <Input
                            type="email"
                            value={newAffiliate.contact_email}
                            onChange={(e) => setNewAffiliate({ ...newAffiliate, contact_email: e.target.value })}
                            placeholder="contact@company.com"
                            className="enhanced-input"
                          />
                        </div>
                        <div>
                          <Label className="text-white">Contact Phone</Label>
                          <Input
                            value={newAffiliate.contact_phone}
                            onChange={(e) => setNewAffiliate({ ...newAffiliate, contact_phone: e.target.value })}
                            placeholder="+1-555-0123"
                            className="enhanced-input"
                          />
                        </div>
                        <div className="lg:col-span-2">
                          <Label className="text-white">Address</Label>
                          <Textarea
                            value={newAffiliate.address}
                            onChange={(e) => setNewAffiliate({ ...newAffiliate, address: e.target.value })}
                            placeholder="Company address"
                            className="enhanced-input"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 mt-4">
                        <Button onClick={handleCreateAffiliate} className="aramco-button-primary text-white">
                          <Save className="h-4 w-4 mr-2" />
                          Create Affiliate
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsCreatingAffiliate(false)
                            setNewAffiliate({
                              name: "",
                              company_code: "",
                              contact_email: "",
                              contact_phone: "",
                              address: "",
                            })
                          }}
                          className="border-gray-400 text-gray-300 hover:bg-gray-700"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Affiliates List */}
                  {isLoading ? (
                    <div className="text-center py-8 text-white">Loading affiliates...</div>
                  ) : (
                    <div className="space-y-4">
                      {affiliates.map((affiliate) => (
                        <div key={affiliate.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                          {editingAffiliate === affiliate.id ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-white">Name</Label>
                                  <Input
                                    value={affiliateUpdates[affiliate.id]?.name ?? affiliate.name}
                                    onChange={(e) =>
                                      setAffiliateUpdates({
                                        ...affiliateUpdates,
                                        [affiliate.id]: { ...affiliateUpdates[affiliate.id], name: e.target.value },
                                      })
                                    }
                                    className="enhanced-input"
                                  />
                                </div>
                                <div>
                                  <Label className="text-white">Company Code</Label>
                                  <Input
                                    value={affiliateUpdates[affiliate.id]?.company_code ?? affiliate.company_code}
                                    onChange={(e) =>
                                      setAffiliateUpdates({
                                        ...affiliateUpdates,
                                        [affiliate.id]: {
                                          ...affiliateUpdates[affiliate.id],
                                          company_code: e.target.value.toUpperCase(),
                                        },
                                      })
                                    }
                                    className="enhanced-input"
                                  />
                                </div>
                                <div>
                                  <Label className="text-white">Contact Email</Label>
                                  <Input
                                    type="email"
                                    value={
                                      affiliateUpdates[affiliate.id]?.contact_email ?? affiliate.contact_email ?? ""
                                    }
                                    onChange={(e) =>
                                      setAffiliateUpdates({
                                        ...affiliateUpdates,
                                        [affiliate.id]: {
                                          ...affiliateUpdates[affiliate.id],
                                          contact_email: e.target.value,
                                        },
                                      })
                                    }
                                    className="enhanced-input"
                                  />
                                </div>
                                <div>
                                  <Label className="text-white">Contact Phone</Label>
                                  <Input
                                    value={
                                      affiliateUpdates[affiliate.id]?.contact_phone ?? affiliate.contact_phone ?? ""
                                    }
                                    onChange={(e) =>
                                      setAffiliateUpdates({
                                        ...affiliateUpdates,
                                        [affiliate.id]: {
                                          ...affiliateUpdates[affiliate.id],
                                          contact_phone: e.target.value,
                                        },
                                      })
                                    }
                                    className="enhanced-input"
                                  />
                                </div>
                                <div className="lg:col-span-2">
                                  <Label className="text-white">Address</Label>
                                  <Textarea
                                    value={affiliateUpdates[affiliate.id]?.address ?? affiliate.address ?? ""}
                                    onChange={(e) =>
                                      setAffiliateUpdates({
                                        ...affiliateUpdates,
                                        [affiliate.id]: { ...affiliateUpdates[affiliate.id], address: e.target.value },
                                      })
                                    }
                                    className="enhanced-input"
                                  />
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                  onClick={() => handleUpdateAffiliate(affiliate.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <Save className="h-4 w-4 mr-2" />
                                  Save Changes
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setEditingAffiliate(null)
                                    setAffiliateUpdates({})
                                  }}
                                  className="border-gray-400 text-gray-300 hover:bg-gray-700"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3">
                                  <Badge className="bg-[#0033A0] text-white flex-shrink-0">
                                    {affiliate.company_code}
                                  </Badge>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-white truncate">{affiliate.name}</p>
                                    {affiliate.contact_email && (
                                      <p className="text-sm text-white/70 truncate">{affiliate.contact_email}</p>
                                    )}
                                    {affiliate.contact_phone && (
                                      <p className="text-xs text-white/50 truncate">{affiliate.contact_phone}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingAffiliate(affiliate.id)}
                                  className="border-[#00A3E0] text-[#00A3E0] hover:bg-[#00A3E0]/10"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteAffiliate(affiliate.id)}
                                  className="border-red-400 text-red-400 hover:bg-red-500/10"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Status Options Management Tab */}
            <TabsContent value="status" className="flex-1 overflow-y-auto space-y-4 mt-4">
              <Card className="enhanced-card">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Status Options Management
                    </CardTitle>
                    <Button
                      onClick={() => setIsCreatingStatus(true)}
                      className="aramco-button-primary text-white enhanced-button w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Status Option
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Create New Status Form */}
                  {isCreatingStatus && (
                    <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                      <h3 className="text-white font-medium mb-4">Create New Status Option</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white">Status Label *</Label>
                          <Input
                            value={newStatus.label}
                            onChange={(e) => setNewStatus({ ...newStatus, label: e.target.value })}
                            placeholder="e.g., Waiting for Approval"
                            className="enhanced-input"
                          />
                        </div>
                        <div>
                          <Label className="text-white">Color</Label>
                          <Select
                            value={newStatus.color}
                            onValueChange={(value) => setNewStatus({ ...newStatus, color: value })}
                          >
                            <SelectTrigger className="enhanced-select">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-300">
                              <SelectItem value="gray">Gray</SelectItem>
                              <SelectItem value="yellow">Yellow</SelectItem>
                              <SelectItem value="blue">Blue</SelectItem>
                              <SelectItem value="green">Green</SelectItem>
                              <SelectItem value="red">Red</SelectItem>
                              <SelectItem value="orange">Orange</SelectItem>
                              <SelectItem value="purple">Purple</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="lg:col-span-2">
                          <Label className="text-white">Description (Optional)</Label>
                          <Textarea
                            value={newStatus.description}
                            onChange={(e) => setNewStatus({ ...newStatus, description: e.target.value })}
                            placeholder="Brief description of when to use this status..."
                            className="enhanced-input"
                            rows={2}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 mt-4">
                        <Button onClick={handleCreateStatus} className="aramco-button-primary text-white">
                          <Save className="h-4 w-4 mr-2" />
                          Create Status
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsCreatingStatus(false)
                            setNewStatus({ label: "", color: "gray", description: "" })
                          }}
                          className="border-gray-400 text-gray-300 hover:bg-gray-700"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Status Options List */}
                  {isLoading ? (
                    <div className="text-center py-8 text-white">Loading status options...</div>
                  ) : (
                    <div className="space-y-4">
                      {statusOptions.map((status) => (
                        <div key={status.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                          {editingStatus === status.id ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-white">Status Label</Label>
                                  <Input
                                    value={statusUpdates[status.id]?.label ?? status.label}
                                    onChange={(e) =>
                                      setStatusUpdates({
                                        ...statusUpdates,
                                        [status.id]: { ...statusUpdates[status.id], label: e.target.value },
                                      })
                                    }
                                    className="enhanced-input"
                                  />
                                </div>
                                <div>
                                  <Label className="text-white">Color</Label>
                                  <Select
                                    value={statusUpdates[status.id]?.color ?? status.color}
                                    onValueChange={(value) =>
                                      setStatusUpdates({
                                        ...statusUpdates,
                                        [status.id]: { ...statusUpdates[status.id], color: value },
                                      })
                                    }
                                  >
                                    <SelectTrigger className="enhanced-select">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-gray-300">
                                      <SelectItem value="gray">Gray</SelectItem>
                                      <SelectItem value="yellow">Yellow</SelectItem>
                                      <SelectItem value="blue">Blue</SelectItem>
                                      <SelectItem value="green">Green</SelectItem>
                                      <SelectItem value="red">Red</SelectItem>
                                      <SelectItem value="orange">Orange</SelectItem>
                                      <SelectItem value="purple">Purple</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="lg:col-span-2">
                                <Label className="text-white">Description</Label>
                                <Textarea
                                  value={statusUpdates[status.id]?.description ?? status.description ?? ""}
                                  onChange={(e) =>
                                    setStatusUpdates({
                                      ...statusUpdates,
                                      [status.id]: { ...statusUpdates[status.id], description: e.target.value },
                                    })
                                  }
                                  className="enhanced-input"
                                  rows={2}
                                  placeholder="Brief description of when to use this status..."
                                />
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                  onClick={() => handleUpdateStatus(status.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <Save className="h-4 w-4 mr-2" />
                                  Save Changes
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setEditingStatus(null)
                                    setStatusUpdates({})
                                  }}
                                  className="border-gray-400 text-gray-300 hover:bg-gray-700"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3">
                                  <Badge className={`${getStatusBadgeClass(status.color)} flex-shrink-0`}>
                                    {status.label}
                                  </Badge>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm text-white/70">Color: {status.color}</p>
                                    {status.description && (
                                      <p className="text-xs text-white/50 mt-1">{status.description}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingStatus(status.id)}
                                  className="border-[#00A3E0] text-[#00A3E0] hover:bg-[#00A3E0]/10"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteStatus(status.id)}
                                  className="border-red-400 text-red-400 hover:bg-red-500/10"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Management Tab */}
            <TabsContent value="data" className="flex-1 overflow-y-auto space-y-4 mt-4">
              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Data Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <h3 className="text-white font-medium mb-2">Reset Data</h3>
                    <p className="text-white/70 text-sm mb-4">
                      Reset all data to default state. This will restore default affiliates and clear all cash calls.
                    </p>
                    <Button
                      onClick={() => {
                        if (confirm("Are you sure you want to reset all data? This cannot be undone.")) {
                          // mockDb.resetToDefaults() // Removed mockDb
                          checklistDb.clearAllChecklists()
                          checklistDb.clearAllStatusOptions()
                          setSuccess("Data reset to defaults successfully")
                          setTimeout(() => setSuccess(""), 3000)
                          loadData()
                        }
                      }}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      Reset to Defaults
                    </Button>
                  </div>

                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <h3 className="text-white font-medium mb-2">Clear All Data</h3>
                    <p className="text-white/70 text-sm mb-4">
                      Completely clear all data including affiliates, cash calls, checklists, and users. Use with
                      extreme caution.
                    </p>
                    <Button
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to clear ALL data? This will delete everything and cannot be undone.",
                          )
                        ) {
                          // mockDb.clearAllData() // Removed mockDb
                          checklistDb.clearAllChecklists()
                          checklistDb.clearAllStatusOptions()
                          setSuccess("All data cleared successfully")
                          setTimeout(() => setSuccess(""), 3000)
                          loadData()
                        }
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Clear All Data
                    </Button>
                  </div>

                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <h3 className="text-white font-medium mb-2">Data Status</h3>
                    <div className="space-y-2 text-sm">
                      <p className="text-white/70">
                        <span className="font-medium">Affiliates:</span> {affiliates.length} records
                      </p>
                      <p className="text-white/70">
                        <span className="font-medium">Users:</span> {users.length} records
                      </p>
                      <p className="text-white/70">
                        <span className="font-medium">Status Options:</span> {statusOptions.length} records
                      </p>
                      <p className="text-white/70">
                        <span className="font-medium">Storage:</span> Browser localStorage (persistent across sessions)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
