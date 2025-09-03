"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { 
  Upload, 
  FileText, 
  X, 
  Download, 
  Eye, 
  Trash2, 
  Edit,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react"
import { Document, uploadDocument, deleteDocument, updateDocumentMetadata } from "@/lib/firebase-database"

interface DocumentUploadProps {
  cashCallId: string
  userId: string
  onDocumentUploaded: (document: Document) => void
  onDocumentDeleted: (documentId: string) => void
  onDocumentUpdated: (document: Document) => void
}

export function DocumentUpload({ 
  cashCallId, 
  userId, 
  onDocumentUploaded, 
  onDocumentDeleted, 
  onDocumentUpdated 
}: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [uploadStatus, setUploadStatus] = useState("")
  const [isDragOver, setIsDragOver] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    description: "",
    category: "general",
    isPublic: true
  })

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    
    const file = files[0]
    setShowUploadForm(true)
    setError("")
    setSuccess("")
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) return
    
    const file = fileInputRef.current.files[0]
    
    try {
      setIsUploading(true)
      setError("")
      setUploadProgress(0)
      setUploadStatus("Preparing upload...")
      
      console.log('Starting upload for file:', file.name, 'Size:', file.size, 'Type:', file.type)
      console.log('Cash Call ID:', cashCallId, 'User ID:', userId)
      
      // Validate required parameters
      if (!cashCallId) {
        throw new Error('Cash Call ID is required')
      }
      if (!userId) {
        throw new Error('User ID is required')
      }
      
      // Realistic progress simulation based on file size
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const fileSizeMB = file.size / (1024 * 1024)
          let increment = 8 // Base increment
          
          // Adjust increment based on file size
          if (fileSizeMB > 100) {
            increment = 2 // Very slow for very large files
          } else if (fileSizeMB > 50) {
            increment = 3 // Slow for large files
          } else if (fileSizeMB > 20) {
            increment = 5 // Medium for medium files
          } else if (fileSizeMB > 5) {
            increment = 6 // Fast for small files
          }
          
          if (prev >= 95) {
            return 95 // Cap at 95% until upload actually completes
          }
          return Math.min(prev + increment, 95)
        })
      }, 200) // Realistic updates
      
      try {
        console.log('Calling uploadDocument function...')
        const fileSizeMB = file.size / (1024 * 1024)
        if (fileSizeMB > 50) {
          setUploadStatus(`Uploading large file (${fileSizeMB.toFixed(1)}MB)...`)
        } else if (fileSizeMB > 20) {
          setUploadStatus(`Uploading medium file (${fileSizeMB.toFixed(1)}MB)...`)
        } else {
          setUploadStatus(`Uploading file (${fileSizeMB.toFixed(1)}MB)...`)
        }
        
        // Start upload with quick timeout fallback
        const document = await uploadDocument(
          file,
          cashCallId,
          userId,
          uploadForm.description,
          uploadForm.category,
          uploadForm.isPublic
        )
        
        clearInterval(progressInterval)
        setUploadProgress(100)
        setUploadStatus("Upload completed!")
        
        console.log('Upload completed successfully:', document)
        
        // Reset form
        setUploadForm({
          description: "",
          category: "general",
          isPublic: true
        })
        setShowUploadForm(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        
        setSuccess("Document uploaded successfully!")
        onDocumentUploaded(document)
        
        setTimeout(() => setSuccess(""), 3000)
      } catch (uploadError: any) {
        clearInterval(progressInterval)
        console.error('Upload error:', uploadError)
        
        // Provide more specific error messages
        let errorMessage = uploadError.message || "Upload failed"
        
        if (uploadError.message?.includes('timeout')) {
          errorMessage = "Upload timed out. Please try again with a smaller file or check your internet connection."
        } else if (uploadError.message?.includes('permission')) {
          errorMessage = "Permission denied. Please check your account permissions."
        } else if (uploadError.message?.includes('network')) {
          errorMessage = "Network error. Please check your internet connection and try again."
        } else if (uploadError.message?.includes('quota')) {
          errorMessage = "Storage quota exceeded. Please contact your administrator."
        }
        
        throw new Error(errorMessage)
      }
    } catch (err: any) {
      console.error('Error in handleUpload:', err)
      setError(err.message || "Failed to upload document. Please try again.")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      setUploadStatus("")
    }
  }

  const handleDeleteDocument = async (document: Document) => {
    try {
      await deleteDocument(document.id, cashCallId, userId)
      onDocumentDeleted(document.id)
      setSuccess("Document deleted successfully!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to delete document")
    }
  }

  const handleUpdateDocument = async (document: Document, updates: any) => {
    try {
      await updateDocumentMetadata(document.id, updates)
      const updatedDocument = { ...document, ...updates }
      onDocumentUpdated(updatedDocument)
      setEditingDocument(null)
      setSuccess("Document updated successfully!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to update document")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('word')) return '📝'
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊'
    if (fileType.includes('image')) return '🖼️'
    return '📎'
  }

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-red-700 text-sm">{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError("")}
            className="ml-auto h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-green-700 text-sm">{success}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSuccess("")}
            className="ml-auto h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supported formats: PDF, Word, Excel, Images (no size limit)
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-[#0033A0] hover:bg-[#002266] text-white"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </>
              )}
            </Button>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{uploadStatus || "Uploading..."}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[#0033A0] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              {uploadProgress >= 95 && uploadProgress < 100 && (
                <div className="text-xs text-gray-500 mt-1">
                  Almost done...
                </div>
              )}
            </div>
          )}

          {/* Upload Form */}
          {showUploadForm && fileInputRef.current?.files?.[0] && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-[#0033A0]" />
                <span className="font-medium">
                  {fileInputRef.current.files[0].name}
                </span>
                <Badge variant="secondary">
                  {formatFileSize(fileInputRef.current.files[0].size)}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter document description..."
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={uploadForm.category}
                    onValueChange={(value) => setUploadForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      <SelectItem value="receipt">Receipt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={uploadForm.isPublic}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="isPublic" className="text-sm">
                  Make document public (visible to all users)
                </Label>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="bg-[#0033A0] hover:bg-[#002266] text-white"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Document
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUploadForm(false)
                    setUploadForm({
                      description: "",
                      category: "general",
                      isPublic: true
                    })
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ""
                    }
                  }}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface DocumentListProps {
  documents: Document[]
  onDocumentDeleted: (documentId: string) => void
  onDocumentUpdated: (document: Document) => void
  canDelete: boolean
}

export function DocumentList({ 
  documents, 
  onDocumentDeleted, 
  onDocumentUpdated, 
  canDelete 
}: DocumentListProps) {
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [editForm, setEditForm] = useState({
    description: "",
    category: "general",
    isPublic: true
  })

  const handleEdit = (document: Document) => {
    setEditingDocument(document)
    setEditForm({
      description: document.description || "",
      category: document.category || "general",
      isPublic: document.is_public
    })
  }

  const handleSaveEdit = async () => {
    if (!editingDocument) return
    
    try {
      await updateDocumentMetadata(editingDocument.id, editForm)
      const updatedDocument = { ...editingDocument, ...editForm }
      onDocumentUpdated(updatedDocument)
      setEditingDocument(null)
    } catch (error) {
      console.error('Error updating document:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('word')) return '📝'
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊'
    if (fileType.includes('image')) return '🖼️'
    return '📎'
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No documents uploaded yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {documents.map((document) => (
        <Card key={document.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getFileIcon(document.file_type)}</span>
                <div>
                  <h4 className="font-medium text-gray-900">{document.original_name}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{formatFileSize(document.file_size)}</span>
                    <span>•</span>
                    <span>{new Date(document.uploaded_at).toLocaleDateString()}</span>
                    {document.category && (
                      <>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          {document.category}
                        </Badge>
                      </>
                    )}
                    {!document.is_public && (
                      <Badge variant="secondary" className="text-xs">
                        Private
                      </Badge>
                    )}
                  </div>
                  {document.description && (
                    <p className="text-sm text-gray-600 mt-1">{document.description}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(document.download_url, '_blank')}
                  className="text-[#0033A0] hover:text-[#002266]"
                >
                  <Download className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(document)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                
                {canDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Document</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{document.original_name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDocumentDeleted(document.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Edit Modal */}
      {editingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Edit Document</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="receipt">Receipt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-isPublic"
                  checked={editForm.isPublic}
                  onChange={(e) => setEditForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="edit-isPublic" className="text-sm">
                  Make document public
                </Label>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button
                onClick={handleSaveEdit}
                className="bg-[#0033A0] hover:bg-[#002266] text-white"
              >
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditingDocument(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
