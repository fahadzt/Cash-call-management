'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/firebase-auth-context'
import { 
  getAllDocumentRequirements, 
  createDocumentRequirement, 
  updateDocumentRequirement, 
  deleteDocumentRequirement,
  getAffiliates,
  DocumentRequirement,
  Affiliate
} from '@/lib/firebase-database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Save, X, RefreshCw, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

export default function DocumentRequirementsPage() {
  const router = useRouter()
  const { user, userProfile } = useAuth()
  const [documentRequirements, setDocumentRequirements] = useState<DocumentRequirement[]>([])
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRequirement, setEditingRequirement] = useState<DocumentRequirement | null>(null)
  const [formData, setFormData] = useState({
    affiliate_id: '',
    document_type: '',
    title: '',
    description: '',
    is_required: true,
    file_types: [] as string[],
    max_file_size: 10,
    order_index: 0,
    is_global: false,
    applies_to: 'both' as 'opex' | 'capex' | 'both'
  })

  const availableFileTypes = [
    { value: 'pdf', label: 'PDF' },
    { value: 'doc', label: 'DOC' },
    { value: 'docx', label: 'DOCX' },
    { value: 'jpg', label: 'JPG' },
    { value: 'jpeg', label: 'JPEG' },
    { value: 'png', label: 'PNG' },
    { value: 'xlsx', label: 'XLSX' },
    { value: 'xls', label: 'XLS' }
  ]

  useEffect(() => {
    console.log('DocumentRequirementsPage useEffect:', { user: !!user, userProfile, role: userProfile?.role })
    if (user && userProfile?.role === 'admin') {
      loadData()
    }
  }, [user, userProfile])

  // Add loading state for authentication
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  useEffect(() => {
    // Wait for authentication to be fully loaded
    if (user !== undefined) {
      setIsAuthLoading(false)
    }
  }, [user])

  const loadData = async () => {
    try {
      setIsLoading(true)
      console.log('Starting to load data...')
      console.log('Current user state:', { user: !!user, userProfile, role: userProfile?.role })
      
      const [requirements, affiliatesData] = await Promise.all([
        getAllDocumentRequirements(),
        getAffiliates()
      ])
      
      console.log('Raw affiliates data:', affiliatesData)
      console.log('Affiliates data type:', typeof affiliatesData)
      console.log('Is affiliates array?', Array.isArray(affiliatesData))
      
      setDocumentRequirements(requirements)
      setAffiliates(affiliatesData)
      console.log('Loaded document requirements:', requirements.length)
      console.log('Loaded affiliates:', affiliatesData.length)
      console.log('Affiliates state set:', affiliatesData)
    } catch (error: any) {
      console.error('Error loading data:', error)
      toast.error('Failed to load document requirements')
      
      // Retry logic for authentication-related errors
      if (error.message?.includes('permission') || error.message?.includes('unauthenticated')) {
        console.log('Authentication error detected, retrying in 2 seconds...')
        setTimeout(() => {
          if (user && userProfile?.role === 'admin') {
            loadData()
          }
        }, 2000)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.uid) {
      toast.error('You must be logged in to manage document requirements')
      return
    }

    // Validate required fields
    if (!formData.affiliate_id || formData.affiliate_id === '') {
      toast.error('Please select an affiliate company')
      return
    }
    if (!formData.document_type) {
      toast.error('Please enter a document type')
      return
    }
    if (!formData.title) {
      toast.error('Please enter a display title')
      return
    }
    if (formData.file_types.length === 0) {
      toast.error('Please select at least one file type')
      return
    }

    try {
      setIsSubmitting(true)
      
      // Prepare the requirement data, handling undefined values properly
      const requirementData: any = {
        document_type: formData.document_type,
        title: formData.title,
        description: formData.description,
        is_required: formData.is_required,
        file_types: formData.file_types,
        max_file_size: formData.max_file_size,
        order_index: formData.order_index,
        created_by: user.uid,
        is_global: formData.affiliate_id === 'global',
        applies_to: formData.applies_to
      }

      // Only include affiliate_id if it's not global
      if (formData.affiliate_id !== 'global') {
        requirementData.affiliate_id = formData.affiliate_id
      } else {
        // For global requirements, explicitly set affiliate_id to null to remove it from the document
        requirementData.affiliate_id = null
      }

      if (editingRequirement) {
        await updateDocumentRequirement(editingRequirement.id, requirementData)
        toast.success('Document requirement updated successfully')
      } else {
        await createDocumentRequirement(requirementData)
        toast.success('Document requirement created successfully')
      }

      setIsDialogOpen(false)
      setEditingRequirement(null)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Error saving document requirement:', error)
      toast.error('Failed to save document requirement')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (requirement: DocumentRequirement) => {
    setEditingRequirement(requirement)
    setFormData({
      affiliate_id: requirement.is_global ? 'global' : (requirement.affiliate_id || ''),
      document_type: requirement.document_type,
      title: requirement.title,
      description: requirement.description || '',
      is_required: requirement.is_required,
      file_types: requirement.file_types,
      max_file_size: requirement.max_file_size || 10,
      order_index: requirement.order_index || 0,
      is_global: requirement.is_global || false,
      applies_to: requirement.applies_to || 'both'
    })
    setIsDialogOpen(true)
  }

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setEditingRequirement(null)
      resetForm()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document requirement?')) return

    try {
      await deleteDocumentRequirement(id)
      toast.success('Document requirement deleted successfully')
      loadData()
    } catch (error) {
      console.error('Error deleting document requirement:', error)
      toast.error('Failed to delete document requirement')
    }
  }

  const resetForm = () => {
    setFormData({
      affiliate_id: '',
      document_type: '',
      title: '',
      description: '',
      is_required: true,
      file_types: [],
      max_file_size: 10,
      order_index: 0,
      is_global: false,
      applies_to: 'both'
    })
  }

  const handleFileTypeToggle = (fileType: string) => {
    setFormData(prev => ({
      ...prev,
      file_types: prev.file_types.includes(fileType)
        ? prev.file_types.filter(type => type !== fileType)
        : [...prev.file_types, fileType]
    }))
  }

  // Show loading while authentication is being determined
  if (isAuthLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-gray-600">Loading authentication...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if user is authenticated and has admin role
  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              Please log in to access this page.
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (userProfile?.role !== 'admin') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              Access denied. Only admin users can manage document requirements.
              <div className="text-sm text-gray-500 mt-2">
                Your role: {userProfile?.role || 'Unknown'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Requirements</h1>
          <p className="text-gray-600 mt-2">
            Configure mandatory documents that affiliates must upload when creating cash calls
          </p>
          <div className="text-sm text-gray-500 mt-1">
            Logged in as: {userProfile?.email} (Role: {userProfile?.role})
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              setEditingRequirement(null)
              resetForm()
              setIsDialogOpen(true)
            }}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Document Requirement
          </Button>
          <Button 
            variant="outline"
            onClick={loadData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRequirement ? 'Edit Document Requirement' : 'Add Document Requirement'}
            </DialogTitle>
            <DialogDescription>
              Configure document requirements for affiliate companies
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="affiliate_id">Affiliate Company *</Label>
              <div className="text-xs text-gray-500 mb-2">
                Debug: {affiliates.length} affiliates loaded
                {affiliates.length > 0 && (
                  <div className="mt-1">
                    Available: {affiliates.map(a => `${a.name} (${a.id})`).join(', ')}
                  </div>
                )}
              </div>
              <Select
                value={formData.affiliate_id}
                onValueChange={(value) => {
                  console.log('Affiliate selected:', value)
                  setFormData({ ...formData, affiliate_id: value, is_global: value === 'global' })
                }}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={isLoading ? "Loading affiliates..." : "Select an affiliate"} />
                </SelectTrigger>
                <SelectContent className="w-full">
                  {isLoading ? (
                    <div className="px-2 py-1.5 text-sm text-gray-500">
                      Loading affiliates...
                    </div>
                  ) : (
                    <>
                      <SelectItem value="global">
                        🌍 All Affiliates (Global)
                      </SelectItem>
                      {affiliates.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-gray-500">
                          No affiliates available
                        </div>
                      ) : (
                        affiliates.map((affiliate) => (
                          <SelectItem key={affiliate.id} value={affiliate.id}>
                            {affiliate.name} ({affiliate.company_code})
                          </SelectItem>
                        ))
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="document_type">Document Type *</Label>
              <Input
                id="document_type"
                value={formData.document_type}
                onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                placeholder="e.g., invoice, contract, approval"
              />
            </div>

            <div>
              <Label htmlFor="title">Display Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Invoice Document"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description for this document requirement"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_required"
                checked={formData.is_required}
                onCheckedChange={(checked) => setFormData({ ...formData, is_required: checked as boolean })}
              />
              <Label htmlFor="is_required">Required document</Label>
            </div>

            <div>
              <Label htmlFor="applies_to">Applies to Cash Call Type *</Label>
              <Select
                value={formData.applies_to}
                onValueChange={(value) => setFormData({ ...formData, applies_to: value as 'opex' | 'capex' | 'both' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cash call type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Both OPEX & CAPEX</SelectItem>
                  <SelectItem value="opex">OPEX Only</SelectItem>
                  <SelectItem value="capex">CAPEX Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Allowed File Types *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {availableFileTypes.map((fileType) => (
                  <div key={fileType.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={fileType.value}
                      checked={formData.file_types.includes(fileType.value)}
                      onCheckedChange={() => handleFileTypeToggle(fileType.value)}
                    />
                    <Label htmlFor={fileType.value}>{fileType.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="max_file_size">Maximum File Size (MB)</Label>
              <Input
                id="max_file_size"
                type="number"
                min="1"
                max="100"
                value={formData.max_file_size || ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 10
                  setFormData({ ...formData, max_file_size: value })
                }}
              />
            </div>

            <div>
              <Label htmlFor="order_index">Display Order</Label>
              <Input
                id="order_index"
                type="number"
                min="0"
                value={formData.order_index || ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  setFormData({ ...formData, order_index: value })
                }}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Saving...' : (editingRequirement ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="text-center py-8">Loading document requirements...</div>
      ) : (
        <div className="grid gap-4">
          {/* Global Requirements */}
          {(() => {
            const globalRequirements = documentRequirements.filter(req => req.is_global)
            return (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>🌍 Global Requirements</span>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">All Affiliates</Badge>
                  </CardTitle>
                  <CardDescription>
                    Document requirements that apply to all affiliate companies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {globalRequirements.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No global document requirements configured
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {globalRequirements
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((requirement) => (
                          <div key={requirement.id} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{requirement.title}</h4>
                                {requirement.is_required && (
                                  <Badge variant="destructive" className="text-xs">Required</Badge>
                                )}
                                <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">Global</Badge>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Type: {requirement.document_type} • Applies to: {
                                  requirement.applies_to === 'both' ? 'Both OPEX & CAPEX' :
                                  requirement.applies_to === 'opex' ? 'OPEX Only' :
                                  'CAPEX Only'
                                }
                              </p>
                              {requirement.description && (
                                <p className="text-sm text-gray-500 mt-1">{requirement.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-gray-500">File types:</span>
                                <div className="flex gap-1">
                                  {requirement.file_types.map((type) => (
                                    <Badge key={type} variant="secondary" className="text-xs">
                                      {type.toUpperCase()}
                                    </Badge>
                                  ))}
                                </div>
                                {requirement.max_file_size && (
                                  <span className="text-xs text-gray-500">
                                    Max: {requirement.max_file_size}MB
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(requirement)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(requirement.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })()}

          {/* Affiliate-Specific Requirements */}
          {affiliates.map((affiliate) => {
            const affiliateRequirements = documentRequirements.filter(
              req => req.affiliate_id === affiliate.id && !req.is_global
            )
            
            return (
              <Card key={affiliate.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{affiliate.name}</span>
                    <Badge variant="outline">{affiliate.company_code}</Badge>
                  </CardTitle>
                  <CardDescription>
                    {affiliateRequirements.length} specific document requirement(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {affiliateRequirements.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No specific document requirements configured
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {affiliateRequirements
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((requirement) => (
                          <div key={requirement.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{requirement.title}</h4>
                                {requirement.is_required && (
                                  <Badge variant="destructive" className="text-xs">Required</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Type: {requirement.document_type} • Applies to: {
                                  requirement.applies_to === 'both' ? 'Both OPEX & CAPEX' :
                                  requirement.applies_to === 'opex' ? 'OPEX Only' :
                                  'CAPEX Only'
                                }
                              </p>
                              {requirement.description && (
                                <p className="text-sm text-gray-500 mt-1">{requirement.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-gray-500">File types:</span>
                                <div className="flex gap-1">
                                  {requirement.file_types.map((type) => (
                                    <Badge key={type} variant="secondary" className="text-xs">
                                      {type.toUpperCase()}
                                    </Badge>
                                  ))}
                                </div>
                                {requirement.max_file_size && (
                                  <span className="text-xs text-gray-500">
                                    Max: {requirement.max_file_size}MB
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(requirement)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(requirement.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      <Toaster />
    </div>
  )
}
