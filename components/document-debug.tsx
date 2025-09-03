"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getDocumentsForCashCall, type Document } from "@/lib/firebase-database"
import { useAuth } from "@/lib/firebase-auth-context"
import { FileText, Eye, EyeOff, Download, AlertCircle } from "lucide-react"

interface DocumentDebugProps {
  cashCallId: string
}

export function DocumentDebug({ cashCallId }: DocumentDebugProps) {
  const { user, userProfile } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const loadDocuments = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      console.log('Debug: Loading documents for cash call:', cashCallId)
      console.log('Debug: User ID:', user?.uid)
      console.log('Debug: User Role:', userProfile?.role)
      
      const docs = await getDocumentsForCashCall(cashCallId, user?.uid, userProfile?.role)
      setDocuments(docs)
      
      console.log('Debug: Documents loaded:', docs.length)
      docs.forEach((doc, index) => {
        console.log(`Debug: Document ${index + 1}:`, {
          id: doc.id,
          name: doc.original_name,
          public: doc.is_public,
          uploaded_by: doc.uploaded_by,
          download_url: doc.download_url
        })
      })
    } catch (err) {
      console.error('Debug: Error loading documents:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (cashCallId) {
      loadDocuments()
    }
  }, [cashCallId, user?.uid, userProfile?.role])

  const testDownload = async (document: Document) => {
    try {
      console.log('Debug: Testing download for:', document.original_name)
      console.log('Debug: Download URL:', document.download_url)
      
      const response = await fetch(document.download_url)
      console.log('Debug: Download response status:', response.status)
      console.log('Debug: Download response headers:', Object.fromEntries(response.headers.entries()))
      
      if (response.ok) {
        console.log('Debug: Download successful')
        // Open in new tab
        window.open(document.download_url, '_blank')
      } else {
        console.error('Debug: Download failed with status:', response.status)
        alert(`Download failed: ${response.status} ${response.statusText}`)
      }
    } catch (err) {
      console.error('Debug: Download error:', err)
      alert(`Download error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Document Debug - Loading...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-yellow-300 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800">
          <AlertCircle className="h-5 w-5" />
          Document Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-yellow-700">
          <p><strong>Cash Call ID:</strong> {cashCallId}</p>
          <p><strong>User ID:</strong> {user?.uid || 'Not logged in'}</p>
          <p><strong>User Role:</strong> {userProfile?.role || 'Unknown'}</p>
          <p><strong>Documents Found:</strong> {documents.length}</p>
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        <Button onClick={loadDocuments} variant="outline" size="sm">
          Refresh Documents
        </Button>

        {documents.length > 0 ? (
          <div className="space-y-2">
            <h4 className="font-medium text-yellow-800">Documents:</h4>
            {documents.map((document) => (
              <div key={document.id} className="p-3 bg-white border border-yellow-200 rounded">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium">{document.original_name}</span>
                    <Badge variant={document.is_public ? "default" : "secondary"}>
                      {document.is_public ? "Public" : "Private"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => testDownload(document)}
                      size="sm"
                      variant="outline"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Test Download
                    </Button>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  <p>Uploaded by: {document.uploaded_by}</p>
                  <p>Size: {document.file_size} bytes</p>
                  <p>Type: {document.file_type}</p>
                  <p>URL: {document.download_url.substring(0, 50)}...</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-yellow-700">
            <EyeOff className="h-8 w-8 mx-auto mb-2" />
            <p>No documents visible to current user</p>
            <p className="text-sm">This could be due to:</p>
            <ul className="text-sm text-left mt-2 space-y-1">
              <li>• No documents uploaded</li>
              <li>• Documents are private and user lacks permission</li>
              <li>• Firebase Storage access issues</li>
              <li>• User role restrictions</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
