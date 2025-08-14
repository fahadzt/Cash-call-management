"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X,
  Trash2,
  Eye,
  Info
} from 'lucide-react'
import { CashCall, Affiliate } from '@/lib/firebase-database'

interface BulkImportExportProps {
  cashCalls: CashCall[]
  affiliates: Affiliate[]
  onImport: (data: Partial<CashCall>[]) => Promise<void>
  onExport: (format: 'csv' | 'excel') => void
}

interface ImportRow {
  affiliate_name: string
  amount_requested: string
  description: string
  justification: string
  status: string
  errors?: string[]
}

export function BulkImportExport({ cashCalls, affiliates, onImport, onExport }: BulkImportExportProps) {
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [importData, setImportData] = useState<ImportRow[]>([])
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'excel'>('csv')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setProgress(0)
    setImportErrors([])

    try {
      const text = await file.text()
      const lines = text.split('\n')
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      
      const data: ImportRow[] = []
      const errors: string[] = []

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue
        
        const values = lines[i].split(',').map(v => v.trim())
        const row: ImportRow = {
          affiliate_name: values[headers.indexOf('affiliate_name')] || '',
          amount_requested: values[headers.indexOf('amount_requested')] || '',
          description: values[headers.indexOf('description')] || '',
          justification: values[headers.indexOf('justification')] || '',
          status: values[headers.indexOf('status')] || 'draft'
        }

        // Validate row
        const rowErrors: string[] = []
        if (!row.affiliate_name) {
          rowErrors.push('Affiliate name is required')
        }
        if (!row.amount_requested || isNaN(Number(row.amount_requested))) {
          rowErrors.push('Valid amount is required')
        }
        if (row.amount_requested && Number(row.amount_requested) <= 0) {
          rowErrors.push('Amount must be greater than 0')
        }

        if (rowErrors.length > 0) {
          row.errors = rowErrors
          errors.push(`Row ${i + 1}: ${rowErrors.join(', ')}`)
        }

        data.push(row)
        setProgress((i / lines.length) * 100)
      }

      setImportData(data)
      setImportErrors(errors)
    } catch (error) {
      setImportErrors(['Failed to parse file. Please ensure it\'s a valid CSV file.'])
    } finally {
      setIsProcessing(false)
      setProgress(100)
    }
  }

  const handleImport = async () => {
    if (importErrors.length > 0) return

    setIsProcessing(true)
    setProgress(0)

    try {
      const validData = importData.filter(row => !row.errors || row.errors.length === 0)
      
      const cashCallData = validData.map(row => {
        const affiliate = affiliates.find(aff => 
          aff.name.toLowerCase() === row.affiliate_name.toLowerCase()
        )

        return {
          affiliate_id: affiliate?.id || '',
          amount_requested: Number(row.amount_requested),
          description: row.description,
          justification: row.justification,
          status: row.status as any,
          call_number: `CC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          currency: 'USD',
          exchange_rate: 1,
          priority: 'medium' as const,
          compliance_status: 'pending' as const
        }
      })

      await onImport(cashCallData)
      setIsImportOpen(false)
      setImportData([])
      setImportErrors([])
    } catch (error) {
      setImportErrors(['Failed to import data. Please try again.'])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExport = () => {
    onExport(selectedFormat)
    setIsExportOpen(false)
  }

  const downloadTemplate = () => {
    const template = `affiliate_name,amount_requested,description,justification,status
"Sample Affiliate",1000.00,"Sample description","Sample justification",draft`
    
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cash-calls-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      under_review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      paid: 'bg-purple-100 text-purple-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || colors.draft
  }

  return (
    <div className="flex gap-2">
      {/* Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Import Cash Calls</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Upload CSV File</Label>
              <div className="mt-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Download the template below to see the required format
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="text-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {importErrors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="font-medium text-red-800">Import Errors</span>
                </div>
                <ul className="text-sm text-red-700 space-y-1">
                  {importErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {importData.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Preview ({importData.length} rows)</Label>
                  <Badge variant={importErrors.length > 0 ? 'destructive' : 'default'}>
                    {importErrors.length > 0 ? `${importErrors.length} errors` : 'Ready to import'}
                  </Badge>
                </div>
                
                <div className="max-h-60 overflow-y-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Affiliate</th>
                        <th className="p-2 text-left">Amount</th>
                        <th className="p-2 text-left">Status</th>
                        <th className="p-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importData.slice(0, 10).map((row, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <span>{row.affiliate_name}</span>
                              {row.errors && row.errors.length > 0 && (
                                <AlertCircle className="h-3 w-3 text-red-500" />
                              )}
                            </div>
                          </td>
                          <td className="p-2">${row.amount_requested}</td>
                          <td className="p-2">
                            <Badge className={getStatusBadge(row.status)}>
                              {row.status}
                            </Badge>
                          </td>
                          <td className="p-2">
                            {row.errors && row.errors.length > 0 ? (
                              <span className="text-red-500 text-xs">
                                {row.errors.join(', ')}
                              </span>
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsImportOpen(false)
                  setImportData([])
                  setImportErrors([])
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={isProcessing || importErrors.length > 0 || importData.length === 0}
                className="bg-[#0033A0] hover:bg-[#0033A0]/90"
              >
                {isProcessing ? 'Importing...' : 'Import Cash Calls'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Cash Calls</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Export Format</Label>
              <Select value={selectedFormat} onValueChange={(value: 'csv' | 'excel') => setSelectedFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      CSV File
                    </div>
                  </SelectItem>
                  <SelectItem value="excel">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Excel File
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-blue-700">
                  Exporting {cashCalls.length} cash calls
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsExportOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleExport} className="bg-[#0033A0] hover:bg-[#0033A0]/90">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
