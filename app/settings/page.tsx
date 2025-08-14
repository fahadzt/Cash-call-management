"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Settings, 
  Plus, 
  Trash2, 
  Save, 
  Edit, 
  X, 
  ArrowLeft,
  FileText,
  Users,
  Database,
  Palette,
  Shield
} from "lucide-react"
import { useAuth } from "@/lib/firebase-auth-context"
import { 
  getAvailableChecklistItems,
  getStatusOptions,
  createStatusOption,
  updateStatusOption,
  deleteStatusOption,
  type StatusOption
} from "@/lib/firebase-database"

interface ChecklistItem {
  itemNo: string
  documentList: string
  status: string
  applicableTo: string[]
}

interface ChecklistGroup {
  name: string
  items: ChecklistItem[]
}

export default function SettingsPage() {
  const { user, userProfile, signOut } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("checklist-items")
  const [checklistItems, setChecklistItems] = useState<any>({})
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([])
  const [editingItem, setEditingItem] = useState<{group: string, itemNo: string} | null>(null)
  const [editingStatus, setEditingStatus] = useState<string | null>(null)
  const [newItem, setNewItem] = useState({ itemNo: "", documentList: "", applicableTo: [] as string[] })
  const [newStatus, setNewStatus] = useState({ label: "", color: "gray", description: "" })
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    
    if (userProfile?.role !== "admin") {
      router.push("/dashboard")
      return
    }
    
    if (user) {
      loadSettingsData()
    }
    
    setIsLoading(false)
  }, [user, userProfile, router])

  const loadSettingsData = async () => {
    try {
      const [items, statuses] = await Promise.all([
        getAvailableChecklistItems(),
        getStatusOptions()
      ])
      setChecklistItems(items)
      setStatusOptions(statuses)
    } catch (error) {
      console.error("Error loading settings data:", error)
    }
  }

  const handleSaveChecklistItem = async (groupKey: string, itemNo: string, updates: Partial<ChecklistItem>) => {
    try {
      // In a real implementation, you would save to Firebase
      const updatedItems = { ...checklistItems }
      const groupItems = updatedItems[groupKey]
      const itemIndex = groupItems.findIndex((item: ChecklistItem) => item.itemNo === itemNo)
      
      if (itemIndex !== -1) {
        updatedItems[groupKey][itemIndex] = { ...groupItems[itemIndex], ...updates }
        setChecklistItems(updatedItems)
      }
      
      setEditingItem(null)
    } catch (error) {
      console.error("Error saving checklist item:", error)
    }
  }

  const handleAddChecklistItem = async (groupKey: string) => {
    try {
      if (!newItem.itemNo || !newItem.documentList) return

      const updatedItems = { ...checklistItems }
      updatedItems[groupKey].push({
        itemNo: newItem.itemNo,
        documentList: newItem.documentList,
        status: "Not Started",
        applicableTo: newItem.applicableTo
      })

      setChecklistItems(updatedItems)
      setNewItem({ itemNo: "", documentList: "", applicableTo: [] })
    } catch (error) {
      console.error("Error adding checklist item:", error)
    }
  }

  const handleDeleteChecklistItem = async (groupKey: string, itemNo: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    try {
      const updatedItems = { ...checklistItems }
      updatedItems[groupKey] = updatedItems[groupKey].filter((item: ChecklistItem) => item.itemNo !== itemNo)
      setChecklistItems(updatedItems)
    } catch (error) {
      console.error("Error deleting checklist item:", error)
    }
  }

  const handleSaveStatusOption = async (statusId: string, updates: Partial<StatusOption>) => {
    try {
      await updateStatusOption(statusId, updates)
      await loadSettingsData()
      setEditingStatus(null)
    } catch (error) {
      console.error("Error saving status option:", error)
    }
  }

  const handleAddStatusOption = async () => {
    try {
      if (!newStatus.label) return
      await createStatusOption(newStatus.label, newStatus.color, newStatus.description)
      await loadSettingsData()
      setNewStatus({ label: "", color: "gray", description: "" })
    } catch (error) {
      console.error("Error adding status option:", error)
    }
  }

  const handleDeleteStatusOption = async (statusId: string) => {
    if (!confirm("Are you sure you want to delete this status option?")) return

    try {
      await deleteStatusOption(statusId)
      await loadSettingsData()
    } catch (error) {
      console.error("Error deleting status option:", error)
    }
  }

  const getGroupDisplayName = (groupKey: string) => {
    switch (groupKey) {
      case 'aramcoDigital': return 'Aramco Digital Company'
      case 'businessProponent': return 'Business Proponent - T&I Affiliate Affairs'
      case 'secondTieredAffiliate': return '2nd Tiered Affiliate'
      default: return groupKey
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0033A0] mx-auto mb-4"></div>
          <div className="text-xl font-semibold bg-gradient-to-r from-[#0033A0] to-[#00A3E0] bg-clip-text text-transparent">
            Loading Settings...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push("/dashboard")}
                variant="ghost"
                className="text-[#0033A0] hover:bg-[#0033A0]/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-[#0033A0]" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0033A0] to-[#00A3E0] bg-clip-text text-transparent">
                  System Settings
                </h1>
              </div>
            </div>
          </div>
          <div className="text-gray-600 text-sm">
            Admin: {userProfile?.full_name || user?.email}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            <TabsTrigger 
              value="checklist-items" 
              className="data-[state=active]:bg-[#0033A0] data-[state=active]:text-white text-gray-600 rounded-md transition-all duration-200"
            >
              <FileText className="h-4 w-4 mr-2" />
              Checklist Items
            </TabsTrigger>
            <TabsTrigger 
              value="status-options" 
              className="data-[state=active]:bg-[#0033A0] data-[state=active]:text-white text-gray-600 rounded-md transition-all duration-200"
            >
              <Database className="h-4 w-4 mr-2" />
              Status Options
            </TabsTrigger>
            <TabsTrigger 
              value="appearance" 
              className="data-[state=active]:bg-[#0033A0] data-[state=active]:text-white text-gray-600 rounded-md transition-all duration-200"
            >
              <Palette className="h-4 w-4 mr-2" />
              Appearance
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="data-[state=active]:bg-[#0033A0] data-[state=active]:text-white text-gray-600 rounded-md transition-all duration-200"
            >
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Checklist Items Tab */}
          <TabsContent value="checklist-items" className="mt-6">
            <div className="grid gap-6">
              {Object.entries(checklistItems).map(([groupKey, items]) => (
                <Card key={groupKey} className="enhanced-card border border-gray-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-[#0033A0] flex items-center justify-between">
                      {getGroupDisplayName(groupKey)}
                      <Button
                        onClick={() => setNewItem({ itemNo: "", documentList: "", applicableTo: [] })}
                        size="sm"
                        className="bg-[#0033A0] hover:bg-[#0033A0]/90 text-white enhanced-button"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Add New Item Form */}
                      {newItem.itemNo === "" && (
                        <div className="p-6 border border-dashed border-[#0033A0]/30 rounded-xl bg-gradient-to-br from-[#0033A0]/5 to-[#00A3E0]/5">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label className="text-[#0033A0] font-medium">Item Number</Label>
                              <Input
                                placeholder="e.g., 1"
                                value={newItem.itemNo}
                                onChange={(e) => setNewItem({ ...newItem, itemNo: e.target.value })}
                                className="enhanced-input mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-[#0033A0] font-medium">Document/Requirement</Label>
                              <Input
                                placeholder="e.g., Cash Call Package"
                                value={newItem.documentList}
                                onChange={(e) => setNewItem({ ...newItem, documentList: e.target.value })}
                                className="enhanced-input mt-1"
                              />
                            </div>
                            <div>
                              <Label>Applicable To</Label>
                              <div className="flex gap-2 mt-2">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={newItem.applicableTo.includes('CAPEX')}
                                    onCheckedChange={(checked) => {
                                      const updated = checked 
                                        ? [...newItem.applicableTo, 'CAPEX']
                                        : newItem.applicableTo.filter(t => t !== 'CAPEX')
                                      setNewItem({ ...newItem, applicableTo: updated })
                                    }}
                                  />
                                  <Label className="text-sm">CAPEX</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={newItem.applicableTo.includes('OPEX')}
                                    onCheckedChange={(checked) => {
                                      const updated = checked 
                                        ? [...newItem.applicableTo, 'OPEX']
                                        : newItem.applicableTo.filter(t => t !== 'OPEX')
                                      setNewItem({ ...newItem, applicableTo: updated })
                                    }}
                                  />
                                  <Label className="text-sm">OPEX</Label>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-3 mt-6">
                            <Button
                              onClick={() => handleAddChecklistItem(groupKey)}
                              className="bg-[#0033A0] hover:bg-[#0033A0]/90 text-white enhanced-button"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Add Item
                            </Button>
                            <Button
                              onClick={() => setNewItem({ itemNo: "", documentList: "", applicableTo: [] })}
                              variant="outline"
                              className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10 enhanced-button"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Existing Items */}
                      <div className="space-y-3">
                        {(items as ChecklistItem[]).map((item) => (
                          <div key={item.itemNo} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200">
                            {editingItem?.group === groupKey && editingItem?.itemNo === item.itemNo ? (
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Input
                                  value={item.itemNo}
                                  onChange={(e) => handleSaveChecklistItem(groupKey, item.itemNo, { itemNo: e.target.value })}
                                />
                                <Input
                                  value={item.documentList}
                                  onChange={(e) => handleSaveChecklistItem(groupKey, item.itemNo, { documentList: e.target.value })}
                                />
                                <div className="flex gap-2">
                                  <Checkbox
                                    checked={item.applicableTo.includes('CAPEX')}
                                    onCheckedChange={(checked) => {
                                      const updated = checked 
                                        ? [...item.applicableTo, 'CAPEX']
                                        : item.applicableTo.filter(t => t !== 'CAPEX')
                                      handleSaveChecklistItem(groupKey, item.itemNo, { applicableTo: updated })
                                    }}
                                  />
                                  <Label className="text-sm">CAPEX</Label>
                                  <Checkbox
                                    checked={item.applicableTo.includes('OPEX')}
                                    onCheckedChange={(checked) => {
                                      const updated = checked 
                                        ? [...item.applicableTo, 'OPEX']
                                        : item.applicableTo.filter(t => t !== 'OPEX')
                                      handleSaveChecklistItem(groupKey, item.itemNo, { applicableTo: updated })
                                    }}
                                  />
                                  <Label className="text-sm">OPEX</Label>
                                </div>
                              </div>
                            ) : (
                              <div className="flex-1">
                                <div className="flex items-center gap-4">
                                  <span className="font-medium text-[#0033A0]">#{item.itemNo}</span>
                                  <span className="flex-1">{item.documentList}</span>
                                  <div className="flex gap-1">
                                    {item.applicableTo.includes('CAPEX') && (
                                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">CAPEX</Badge>
                                    )}
                                    {item.applicableTo.includes('OPEX') && (
                                      <Badge variant="secondary" className="bg-green-100 text-green-800">OPEX</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className="flex gap-2">
                              {editingItem?.group === groupKey && editingItem?.itemNo === item.itemNo ? (
                                <>
                                  <Button
                                    onClick={() => setEditingItem(null)}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <Save className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    onClick={() => setEditingItem(null)}
                                    size="sm"
                                    variant="outline"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    onClick={() => setEditingItem({ group: groupKey, itemNo: item.itemNo })}
                                    size="sm"
                                    variant="ghost"
                                    className="text-[#00A3E0] hover:bg-[#00A3E0]/10"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    onClick={() => handleDeleteChecklistItem(groupKey, item.itemNo)}
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Status Options Tab */}
          <TabsContent value="status-options" className="mt-6">
            <Card className="enhanced-card border border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#0033A0] flex items-center justify-between">
                  Status Options
                  <Button
                    onClick={() => setNewStatus({ label: "", color: "gray", description: "" })}
                    size="sm"
                    className="bg-[#0033A0] hover:bg-[#0033A0]/90 text-white enhanced-button"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Status
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Add New Status Form */}
                  {newStatus.label === "" && (
                    <div className="p-4 border border-dashed border-gray-300 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Status Label</Label>
                          <Input
                            placeholder="e.g., In Progress"
                            value={newStatus.label}
                            onChange={(e) => setNewStatus({ ...newStatus, label: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Color</Label>
                          <Select value={newStatus.color} onValueChange={(value) => setNewStatus({ ...newStatus, color: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gray">Gray</SelectItem>
                              <SelectItem value="blue">Blue</SelectItem>
                              <SelectItem value="green">Green</SelectItem>
                              <SelectItem value="yellow">Yellow</SelectItem>
                              <SelectItem value="orange">Orange</SelectItem>
                              <SelectItem value="red">Red</SelectItem>
                              <SelectItem value="purple">Purple</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Input
                            placeholder="Optional description"
                            value={newStatus.description}
                            onChange={(e) => setNewStatus({ ...newStatus, description: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={handleAddStatusOption}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Add Status
                        </Button>
                        <Button
                          onClick={() => setNewStatus({ label: "", color: "gray", description: "" })}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Existing Status Options */}
                  <div className="space-y-2">
                    {statusOptions.map((status) => (
                      <div key={status.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-4">
                          <Badge 
                            variant="secondary" 
                            className={`bg-${status.color}-100 text-${status.color}-800`}
                          >
                            {status.label}
                          </Badge>
                          {status.description && (
                            <span className="text-gray-600 text-sm">{status.description}</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setEditingStatus(status.id)}
                            size="sm"
                            variant="ghost"
                            className="text-[#00A3E0] hover:bg-[#00A3E0]/10"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteStatusOption(status.id)}
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="mt-6">
            <Card className="enhanced-card border border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#0033A0]">Appearance Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label className="text-lg font-medium">Theme Configuration</Label>
                    <p className="text-gray-600 text-sm mt-1">Customize the visual appearance of the application</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-[#0033A0] font-medium">Primary Color</Label>
                      <Select defaultValue="blue" className="mt-2">
                        <SelectTrigger className="enhanced-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blue">Blue (Current)</SelectItem>
                          <SelectItem value="green">Green</SelectItem>
                          <SelectItem value="purple">Purple</SelectItem>
                          <SelectItem value="orange">Orange</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-[#0033A0] font-medium">Theme Mode</Label>
                      <Select defaultValue="light" className="mt-2">
                        <SelectTrigger className="enhanced-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="auto">Auto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-[#0033A0] font-medium">Company Logo</Label>
                    <div className="mt-2 p-6 border border-dashed border-[#0033A0]/30 rounded-xl bg-gradient-to-br from-[#0033A0]/5 to-[#00A3E0]/5">
                      <div className="text-center">
                        <p className="text-gray-600 mb-4">Upload your company logo</p>
                        <Button variant="outline" className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10 enhanced-button">
                          Choose File
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="mt-6">
            <Card className="enhanced-card border border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#0033A0]">Security Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label className="text-lg font-medium">Access Control</Label>
                    <p className="text-gray-600 text-sm mt-1">Manage user permissions and security settings</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200">
                      <div>
                        <Label className="font-medium text-[#0033A0]">Two-Factor Authentication</Label>
                        <p className="text-gray-600 text-sm">Require 2FA for all admin accounts</p>
                      </div>
                      <Checkbox className="border-[#0033A0] data-[state=checked]:bg-[#0033A0]" />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200">
                      <div>
                        <Label className="font-medium text-[#0033A0]">Session Timeout</Label>
                        <p className="text-gray-600 text-sm">Automatically log out inactive users</p>
                      </div>
                      <Select defaultValue="30">
                        <SelectTrigger className="w-32 enhanced-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200">
                      <div>
                        <Label className="font-medium text-[#0033A0]">Audit Logging</Label>
                        <p className="text-gray-600 text-sm">Log all system activities for compliance</p>
                      </div>
                      <Checkbox defaultChecked className="border-[#0033A0] data-[state=checked]:bg-[#0033A0]" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
