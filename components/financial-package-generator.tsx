"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  FileText, 
  Download, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  FileCheck,
  FileX,
  Settings,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Building,
  DollarSign,
  Calendar,
  User,
  BookOpen,
  Shield,
  Scale,
  Target,
  CheckSquare,
  Save,
  FileEdit,
  ArrowLeft
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/firebase-auth-context'
import { getCashCalls, getDocumentsForCashCall, uploadDocument, type CashCall } from '@/lib/firebase-database'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

interface PackagePage {
  id: string
  order: number
  title: string
  description: string
  content: string
  isEditable: boolean
  isRequired: boolean
  category: 'header' | 'content' | 'document' | 'financial'
}

interface FinancialPackage {
  id: string
  cashCallId: string
  cashCallNumber: string
  affiliateName: string
  amount: number
  status: 'draft' | 'in_progress' | 'completed' | 'approved' | 'rejected'
  pages: PackagePage[]
  generatedAt: Date
  generatedBy: string
  packageUrl?: string
  isEditable: boolean
}

export function FinancialPackageGenerator() {
  const router = useRouter()
  const { user, userProfile } = useAuth()
  const [cashCalls, setCashCalls] = useState<CashCall[]>([])
  const [selectedCashCall, setSelectedCashCall] = useState<CashCall | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedPackages, setGeneratedPackages] = useState<FinancialPackage[]>([])
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewPackage, setPreviewPackage] = useState<FinancialPackage | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editingPackage, setEditingPackage] = useState<FinancialPackage | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [uploadingPackages, setUploadingPackages] = useState<Set<string>>(new Set())
  const [pdfSettings, setPdfSettings] = useState<{ showHeader: boolean; showPlaceholderFrame: boolean; margin: number }>({
    showHeader: true,
    showPlaceholderFrame: true,
    margin: 20
  })

  // Define the 14 pages in the specified order
  const packagePages: PackagePage[] = [
    {
      id: 'title_page',
      order: 1,
      title: 'Title Page',
      description: 'Financial Package Title Page',
      content: '',
      isEditable: true,
      isRequired: true,
      category: 'header'
    },
    {
      id: 'table_of_contents',
      order: 2,
      title: 'Table of Contents',
      description: 'Package Contents Index',
      content: '',
      isEditable: true,
      isRequired: true,
      category: 'header'
    },
    {
      id: 'executive_summary',
      order: 3,
      title: 'Executive Summary',
      description: 'High-level overview of the cash call request',
      content: '',
      isEditable: true,
      isRequired: true,
      category: 'content'
    },
    {
      id: 'ad_ceo_cfo_letter',
      order: 4,
      title: 'Cash Call Letter from AD CEO & CFO to Director - Business / Service Line P&PM Requesting Funds',
      description: 'Letter to be prepared by AD Finance',
      content: '',
      isEditable: true,
      isRequired: true,
      category: 'document'
    },
    {
      id: 'affiliate_cfo_ceo_letter',
      order: 5,
      title: 'Cash Call Letter from Affiliate CFO/CEO',
      description: 'Official request letter from affiliate leadership',
      content: '',
      isEditable: true,
      isRequired: true,
      category: 'document'
    },
    {
      id: 'ad_bank_certificate',
      order: 6,
      title: 'Bank Certificate by AD',
      description: 'Aramco Digital bank certification',
      content: '',
      isEditable: true,
      isRequired: true,
      category: 'document'
    },
    {
      id: 'affiliate_bank_certificate',
      order: 7,
      title: 'Affiliate Bank Certificate',
      description: 'Affiliate bank account certification',
      content: '',
      isEditable: true,
      isRequired: true,
      category: 'document'
    },
    {
      id: 'shareholders_resolution',
      order: 8,
      title: 'Shareholders Resolution',
      description: 'Signed resolution by shareholder representatives approving the cash call',
      content: '',
      isEditable: true,
      isRequired: true,
      category: 'document'
    },
    {
      id: 'commercial_registration',
      order: 9,
      title: 'Affiliate Commercial Registration',
      description: 'Official commercial registration documents',
      content: '',
      isEditable: true,
      isRequired: true,
      category: 'document'
    },
    {
      id: 'bylaws_excerpts',
      order: 10,
      title: 'Excerpts from Affiliate ByLaws',
      description: 'Relevant sections from affiliate bylaws',
      content: '',
      isEditable: true,
      isRequired: true,
      category: 'document'
    },
    {
      id: 'approved_business_plan',
      order: 11,
      title: 'Approved Business Plan',
      description: 'Official approved business plan documentation',
      content: '',
      isEditable: true,
      isRequired: true,
      category: 'document'
    },
    {
      id: 'board_minutes_resolution',
      order: 12,
      title: 'Signed Board Minutes / Resolution',
      description: 'Official board meeting minutes and resolutions',
      content: '',
      isEditable: true,
      isRequired: true,
      category: 'document'
    },
    {
      id: 'cash_flow_forecast',
      order: 13,
      title: 'Cash Flow Forecast',
      description: 'Projected cash flow analysis',
      content: '',
      isEditable: true,
      isRequired: true,
      category: 'financial'
    },
    {
      id: 'current_cash_call_utilization',
      order: 14,
      title: 'Utilization of Current Cash Call',
      description: 'Report on current cash call usage and status',
      content: '',
      isEditable: true,
      isRequired: true,
      category: 'financial'
    }
  ]

  useEffect(() => {
    if (userProfile?.role === 'finance') {
      loadCashCalls()
      loadGeneratedPackages()
    }
  }, [userProfile])

  const loadCashCalls = async () => {
    try {
      const cashCallsData = await getCashCalls()
      // Filter for cash calls that need financial review
      const pendingCashCalls = cashCallsData.filter(cc => 
        cc.status === 'under_review' || cc.status === 'finance_review' || cc.status === 'draft'
      )
      setCashCalls(pendingCashCalls)
    } catch (error) {
      console.error('Error loading cash calls:', error)
    }
  }

  const loadGeneratedPackages = async () => {
    // In a real implementation, this would load from your database
    // For now, we'll use mock data
    const mockPackages: FinancialPackage[] = [
      {
        id: '1',
        cashCallId: 'cc-001',
        cashCallNumber: 'CC-001',
        affiliateName: 'Sample Affiliate',
        amount: 500000,
        status: 'draft',
        pages: packagePages.map(page => ({ ...page, content: `Sample content for ${page.title}` })),
        generatedAt: new Date(),
        generatedBy: userProfile?.full_name || 'Finance User',
        packageUrl: '/packages/sample-package.pdf',
        isEditable: true
      }
    ]
    setGeneratedPackages(mockPackages)
  }

  const handleCashCallSelect = async (cashCall: CashCall) => {
    setSelectedCashCall(cashCall)
  }

  const generateFinancialPackage = async () => {
    if (!selectedCashCall) return

    setIsGenerating(true)
    setProgress(0)

    try {
      // Simulate package generation process
      const steps = [
        'Initializing package structure...',
        'Generating page titles...',
        'Creating table of contents...',
        'Setting up editable content areas...',
        'Finalizing package structure...',
        'Saving package...'
      ]

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800))
        setProgress(((i + 1) / steps.length) * 100)
      }

      // Generate table of contents content
      const tocContent = packagePages.map(page => 
        `${page.order}. ${page.title}`
      ).join('\n')

      // Create the financial package with all 14 pages
      const packageData: FinancialPackage = {
        id: `pkg-${Date.now()}`,
        cashCallId: selectedCashCall.id,
        cashCallNumber: selectedCashCall.call_number || 'CC-UNKNOWN',
        affiliateName: selectedCashCall.affiliate_id || 'Unknown Affiliate',
        amount: selectedCashCall.amount_requested || 0,
        status: 'draft',
        pages: packagePages.map(page => ({
          ...page,
          content: page.id === 'table_of_contents' ? tocContent : 
                   page.id === 'title_page' ? `Financial Package\n${selectedCashCall.call_number}\n${selectedCashCall.affiliate_id}\nAmount: $${selectedCashCall.amount_requested?.toLocaleString()}` :
                   `[Content to be provided by user for ${page.title}]`
        })),
        generatedAt: new Date(),
        generatedBy: userProfile?.full_name || 'Finance User',
        packageUrl: `/packages/financial-package-${Date.now()}.pdf`,
        isEditable: true
      }

      setGeneratedPackages(prev => [packageData, ...prev])
      
      // Reset form
      setSelectedCashCall(null)
      setProgress(0)

    } catch (error) {
      console.error('Error generating package:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const generatePDF = async (packageData: FinancialPackage) => {
    const doc = new jsPDF()

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = Math.max(10, Math.min(40, Number(pdfSettings.margin) || 20))

    const renderHeader = () => {
      if (!pdfSettings.showHeader) return
      doc.setFontSize(12)
      doc.setTextColor(0, 51, 160)
      doc.text('Aramco Digital - Financial Package', margin, margin)
    }

    const renderCenteredTitle = (title: string, y: number) => {
      doc.setFontSize(18)
      doc.setTextColor(0, 51, 160)
      doc.text(title, pageWidth / 2, y, { align: 'center' })
    }

    const renderDetails = (pkg: FinancialPackage, yStart: number) => {
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      const lines = [
        `Cash Call Number: ${pkg.cashCallNumber}`,
        `Affiliate: ${pkg.affiliateName}`,
        `Amount: $${pkg.amount.toLocaleString()}`,
        `Generated: ${pkg.generatedAt.toLocaleDateString()}`,
        `Generated By: ${pkg.generatedBy}`
      ]
      let y = yStart
      lines.forEach((line) => {
        doc.text(line, pageWidth / 2, y, { align: 'center' })
        y += 8
      })
    }

    const pagesOrdered = [...packageData.pages].sort((a, b) => a.order - b.order)

    pagesOrdered.forEach((page, idx) => {
      if (idx > 0) doc.addPage()

      renderHeader()

      if (page.id === 'title_page') {
        renderCenteredTitle('Financial Package', margin + 30)
        doc.setFontSize(14)
        doc.setTextColor(0, 163, 224)
        doc.text(`${packageData.cashCallNumber}`, pageWidth / 2, margin + 45, { align: 'center' })
        renderDetails(packageData, margin + 60)
      } else if (page.id === 'table_of_contents') {
        renderCenteredTitle('Table of Contents', margin + 30)
        doc.setFontSize(11)
        doc.setTextColor(0, 0, 0)
        let y = margin + 50
        pagesOrdered.forEach((p) => {
          const text = `${p.order}. ${p.title}`
          const pageNo = `${p.order}`
          doc.text(text, margin, y)
          // Dotted leaders and page number
          const textWidth = doc.getTextWidth(text)
          const dotsStart = margin + textWidth + 2
          const dotsEnd = pageWidth - margin - doc.getTextWidth(pageNo) - 2
          if (dotsEnd > dotsStart) {
            doc.setDrawColor(200)
            doc.line(dotsStart, y - 1, dotsEnd, y - 1)
          }
          doc.setTextColor(0, 0, 0)
          doc.text(pageNo, pageWidth - margin, y, { align: 'right' })
          y += 8
          if (y > pageHeight - margin) {
            doc.addPage()
            renderHeader()
            renderCenteredTitle('Table of Contents (cont.)', margin + 30)
            y = margin + 50
          }
        })
      } else {
        // Regular content page
        renderCenteredTitle(`${page.order}. ${page.title}`, margin + 30)
        doc.setFontSize(10)
        doc.setTextColor(80)
        const placeholder = page.content && page.content.trim().length > 0
          ? page.content
          : 'Content to be provided by user.'
        const lines = doc.splitTextToSize(placeholder, pageWidth - margin * 2)
        doc.text(lines, margin, margin + 50)
        // Draw a light placeholder frame to indicate editable area
        if (pdfSettings.showPlaceholderFrame) {
          doc.setDrawColor(220)
          doc.rect(margin, margin + 45, pageWidth - margin * 2, pageHeight - margin * 2 - 45)
        }
      }
    })

    // Generate PDF blob for upload
    const pdfBlob = doc.output('blob')
    const fileName = `financial-package-${packageData.cashCallNumber}.pdf`
    
    // Create a File object from the blob
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' })
    
    try {
      // Upload the PDF to the cash call's documents
      if (user?.uid) {
        await uploadDocument(
          pdfFile,
          packageData.cashCallId,
          user.uid,
          `Financial Package for ${packageData.cashCallNumber}`,
          'financial',
          true // Make it public
        )
        console.log('Financial package uploaded successfully to cash call documents')
      }
    } catch (error) {
      console.error('Error uploading financial package:', error)
    }

    // Also save locally for immediate download
    doc.save(fileName)
  }

  const downloadPackage = async (packageData: FinancialPackage) => {
    try {
      // Generate PDF for download only (no upload)
      const doc = new jsPDF()

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = Math.max(10, Math.min(40, Number(pdfSettings.margin) || 20))

      const renderHeader = () => {
        if (!pdfSettings.showHeader) return
        doc.setFontSize(12)
        doc.setTextColor(0, 51, 160)
        doc.text('Aramco Digital - Financial Package', margin, margin)
      }

      const renderCenteredTitle = (title: string, y: number) => {
        doc.setFontSize(18)
        doc.setTextColor(0, 51, 160)
        doc.text(title, pageWidth / 2, y, { align: 'center' })
      }

      const renderDetails = (pkg: FinancialPackage, yStart: number) => {
        doc.setFontSize(12)
        doc.setTextColor(0, 0, 0)
        const lines = [
          `Cash Call Number: ${pkg.cashCallNumber}`,
          `Affiliate: ${pkg.affiliateName}`,
          `Amount: $${pkg.amount.toLocaleString()}`,
          `Generated: ${pkg.generatedAt.toLocaleDateString()}`,
          `Generated By: ${pkg.generatedBy}`
        ]
        let y = yStart
        lines.forEach((line) => {
          doc.text(line, pageWidth / 2, y, { align: 'center' })
          y += 8
        })
      }

      const pagesOrdered = [...packageData.pages].sort((a, b) => a.order - b.order)

      pagesOrdered.forEach((page, idx) => {
        if (idx > 0) doc.addPage()

        renderHeader()

        if (page.id === 'title_page') {
          renderCenteredTitle('Financial Package', margin + 30)
          doc.setFontSize(14)
          doc.setTextColor(0, 163, 224)
          doc.text(`${packageData.cashCallNumber}`, pageWidth / 2, margin + 45, { align: 'center' })
          renderDetails(packageData, margin + 60)
        } else if (page.id === 'table_of_contents') {
          renderCenteredTitle('Table of Contents', margin + 30)
          doc.setFontSize(11)
          doc.setTextColor(0, 0, 0)
          let y = margin + 50
          pagesOrdered.forEach((p) => {
            const text = `${p.order}. ${p.title}`
            const pageNo = `${p.order}`
            doc.text(text, margin, y)
            // Dotted leaders and page number
            const textWidth = doc.getTextWidth(text)
            const dotsStart = margin + textWidth + 2
            const dotsEnd = pageWidth - margin - doc.getTextWidth(pageNo) - 2
            if (dotsEnd > dotsStart) {
              doc.setDrawColor(200)
              doc.line(dotsStart, y - 1, dotsEnd, y - 1)
            }
            doc.setTextColor(0, 0, 0)
            doc.text(pageNo, pageWidth - margin, y, { align: 'right' })
            y += 8
            if (y > pageHeight - margin) {
              doc.addPage()
              renderHeader()
              renderCenteredTitle('Table of Contents (cont.)', margin + 30)
              y = margin + 50
            }
          })
        } else {
          // Regular content page
          renderCenteredTitle(`${page.order}. ${page.title}`, margin + 30)
          doc.setFontSize(10)
          doc.setTextColor(80)
          const placeholder = page.content && page.content.trim().length > 0
            ? page.content
            : 'Content to be provided by user.'
          const lines = doc.splitTextToSize(placeholder, pageWidth - margin * 2)
          doc.text(lines, margin, margin + 50)
          // Draw a light placeholder frame to indicate editable area
          if (pdfSettings.showPlaceholderFrame) {
            doc.setDrawColor(220)
            doc.rect(margin, margin + 45, pageWidth - margin * 2, pageHeight - margin * 2 - 45)
          }
        }
      })

      // Download the PDF
      const fileName = `financial-package-${packageData.cashCallNumber}.pdf`
      doc.save(fileName)
    } catch (error) {
      console.error('Error downloading package:', error)
    }
  }

  const handlePreviewPackage = (packageData: FinancialPackage) => {
    setPreviewPackage(packageData)
    setIsPreviewOpen(true)
  }

  const handleEditPackage = (packageData: FinancialPackage) => {
    setEditingPackage(packageData)
    setIsEditing(true)
  }

  const handleSavePackage = (updatedPackage: FinancialPackage) => {
    setGeneratedPackages(prev => 
      prev.map(pkg => pkg.id === updatedPackage.id ? updatedPackage : pkg)
    )
    setIsEditing(false)
    setEditingPackage(null)
  }

  const uploadToCashCall = async (packageData: FinancialPackage) => {
    if (!user?.uid) {
      alert('You must be logged in to upload documents')
      return
    }

    setUploadingPackages(prev => new Set(prev).add(packageData.id))
    try {
      // Generate PDF blob for upload only
      const doc = new jsPDF()

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = Math.max(10, Math.min(40, Number(pdfSettings.margin) || 20))

      const renderHeader = () => {
        if (!pdfSettings.showHeader) return
        doc.setFontSize(12)
        doc.setTextColor(0, 51, 160)
        doc.text('Aramco Digital - Financial Package', margin, margin)
      }

      const renderCenteredTitle = (title: string, y: number) => {
        doc.setFontSize(18)
        doc.setTextColor(0, 51, 160)
        doc.text(title, pageWidth / 2, y, { align: 'center' })
      }

      const renderDetails = (pkg: FinancialPackage, yStart: number) => {
        doc.setFontSize(12)
        doc.setTextColor(0, 0, 0)
        const lines = [
          `Cash Call Number: ${pkg.cashCallNumber}`,
          `Affiliate: ${pkg.affiliateName}`,
          `Amount: $${pkg.amount.toLocaleString()}`,
          `Generated: ${pkg.generatedAt.toLocaleDateString()}`,
          `Generated By: ${pkg.generatedBy}`
        ]
        let y = yStart
        lines.forEach((line) => {
          doc.text(line, pageWidth / 2, y, { align: 'center' })
          y += 8
        })
      }

      const pagesOrdered = [...packageData.pages].sort((a, b) => a.order - b.order)

      pagesOrdered.forEach((page, idx) => {
        if (idx > 0) doc.addPage()

        renderHeader()

        if (page.id === 'title_page') {
          renderCenteredTitle('Financial Package', margin + 30)
          doc.setFontSize(14)
          doc.setTextColor(0, 163, 224)
          doc.text(`${packageData.cashCallNumber}`, pageWidth / 2, margin + 45, { align: 'center' })
          renderDetails(packageData, margin + 60)
        } else if (page.id === 'table_of_contents') {
          renderCenteredTitle('Table of Contents', margin + 30)
          doc.setFontSize(11)
          doc.setTextColor(0, 0, 0)
          let y = margin + 50
          pagesOrdered.forEach((p) => {
            const text = `${p.order}. ${p.title}`
            const pageNo = `${p.order}`
            doc.text(text, margin, y)
            // Dotted leaders and page number
            const textWidth = doc.getTextWidth(text)
            const dotsStart = margin + textWidth + 2
            const dotsEnd = pageWidth - margin - doc.getTextWidth(pageNo) - 2
            if (dotsEnd > dotsStart) {
              doc.setDrawColor(200)
              doc.line(dotsStart, y - 1, dotsEnd, y - 1)
            }
            doc.setTextColor(0, 0, 0)
            doc.text(pageNo, pageWidth - margin, y, { align: 'right' })
            y += 8
            if (y > pageHeight - margin) {
              doc.addPage()
              renderHeader()
              renderCenteredTitle('Table of Contents (cont.)', margin + 30)
              y = margin + 50
            }
          })
        } else {
          // Regular content page
          renderCenteredTitle(`${page.order}. ${page.title}`, margin + 30)
          doc.setFontSize(10)
          doc.setTextColor(80)
          const placeholder = page.content && page.content.trim().length > 0
            ? page.content
            : 'Content to be provided by user.'
          const lines = doc.splitTextToSize(placeholder, pageWidth - margin * 2)
          doc.text(lines, margin, margin + 50)
          // Draw a light placeholder frame to indicate editable area
          if (pdfSettings.showPlaceholderFrame) {
            doc.setDrawColor(220)
            doc.rect(margin, margin + 45, pageWidth - margin * 2, pageHeight - margin * 2 - 45)
          }
        }
      })

      // Generate PDF blob for upload
      const pdfBlob = doc.output('blob')
      const fileName = `financial-package-${packageData.cashCallNumber}.pdf`
      
      // Create a File object from the blob
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' })
      
      console.log('Uploading financial package to cash call:', packageData.cashCallId)
      
      // Upload the PDF to the cash call's documents
      await uploadDocument(
        pdfFile,
        packageData.cashCallId,
        user.uid,
        `Financial Package for ${packageData.cashCallNumber}`,
        'financial',
        true // Make it public
      )
      
      alert('Financial package uploaded successfully to cash call documents!')
      console.log('Financial package uploaded successfully to cash call documents')
    } catch (error) {
      console.error('Error uploading package to cash call:', error)
      alert(`Failed to upload financial package: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploadingPackages(prev => {
        const newSet = new Set(prev)
        newSet.delete(packageData.id)
        return newSet
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'in_progress': return <Clock className="h-4 w-4" />
      case 'draft': return <FileText className="h-4 w-4" />
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <FileX className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const filteredCashCalls = cashCalls.filter(cc => 
    cc.call_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cc.affiliate_id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (userProfile?.role !== 'finance') {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
          <p className="text-gray-600">Only finance users can access the financial package generator.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Package Generator</h1>
          <p className="text-gray-600">Automatically generate structured financial packages with 14 pages for cash calls</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Package Generation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate New Package
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cash Call Selection */}
            <div className="space-y-2">
              <Label>Select Cash Call</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Search cash calls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-2"
                />
                <Select onValueChange={(value) => {
                  const cashCall = filteredCashCalls.find(cc => cc.id === value)
                  if (cashCall) handleCashCallSelect(cashCall)
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a cash call to generate package for" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCashCalls.map((cashCall) => (
                      <SelectItem key={cashCall.id} value={cashCall.id}>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          <span>{cashCall.call_number} - {cashCall.affiliate_id}</span>
                          <DollarSign className="h-4 w-4" />
                          <span>${cashCall.amount_requested?.toLocaleString()}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Package Structure Preview */}
            {selectedCashCall && (
              <div className="space-y-3">
                <Label>Package Structure (14 Pages)</Label>
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    {packagePages.map((page) => (
                      <div key={page.id} className="flex items-center gap-2 text-sm">
                        <span className="font-mono text-gray-500 w-6">{page.order}.</span>
                        <span className="flex-1">{page.title}</span>
                        <Badge variant="outline" className="text-xs">{page.category}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Generate Button */}
            {selectedCashCall && (
              <Button 
                onClick={generateFinancialPackage}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating Package Structure...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Financial Package Structure
                  </>
                )}
              </Button>
            )}

            {/* Progress Bar */}
            {isGenerating && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Generating package structure...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generated Packages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Generated Packages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generatedPackages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No packages generated yet</p>
                  <p className="text-sm">Generate your first financial package to see it here</p>
                </div>
              ) : (
                generatedPackages.map((packageData) => (
                  <div key={packageData.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{packageData.cashCallNumber}</h3>
                        <p className="text-sm text-gray-600">{packageData.affiliateName}</p>
                      </div>
                      <Badge className={getStatusColor(packageData.status)}>
                        {getStatusIcon(packageData.status)}
                        <span className="ml-1 capitalize">{packageData.status.replace('_', ' ')}</span>
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>${packageData.amount.toLocaleString()}</span>
                      <span>{packageData.generatedAt.toLocaleDateString()}</span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreviewPackage(packageData)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditPackage(packageData)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadPackage(packageData)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => uploadToCashCall(packageData)}
                        disabled={uploadingPackages.has(packageData.id)}
                        className="bg-[#0033A0] hover:bg-[#002266] text-white"
                      >
                        {uploadingPackages.has(packageData.id) ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-1" />
                            Upload to Cash Call
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Package Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Financial Package Preview</DialogTitle>
            <DialogDescription>
              Preview of the generated financial package structure
            </DialogDescription>
          </DialogHeader>
          
          {previewPackage && (
            <div className="space-y-6">
              {/* Package Header */}
              <div className="border-b pb-4">
                <h2 className="text-2xl font-bold">{previewPackage.cashCallNumber}</h2>
                <p className="text-gray-600">{previewPackage.affiliateName}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span>Amount: ${previewPackage.amount.toLocaleString()}</span>
                  <span>Generated: {previewPackage.generatedAt.toLocaleDateString()}</span>
                  <span>By: {previewPackage.generatedBy}</span>
                </div>
              </div>

              {/* Package Pages */}
              <div className="space-y-4">
                <h3 className="font-semibold mb-4">Package Structure (14 Pages)</h3>
                <div className="space-y-3">
                  {previewPackage.pages.map((page) => (
                    <div key={page.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{page.order}. {page.title}</h4>
                        <Badge variant="outline" className="text-xs">{page.category}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{page.description}</p>
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        <p className="text-gray-700">{page.content || '[Content to be provided by user]'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Package Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Financial Package</DialogTitle>
            <DialogDescription>
              Edit the content of each page in the financial package
            </DialogDescription>
          </DialogHeader>
          
          {editingPackage && (
            <div className="space-y-6">
              {/* Package Header */}
              <div className="border-b pb-4">
                <h2 className="text-2xl font-bold">{editingPackage.cashCallNumber}</h2>
                <p className="text-gray-600">{editingPackage.affiliateName}</p>
              </div>

              {/* Editable Pages */}
              <div className="space-y-6">
                {editingPackage.pages.map((page) => (
                  <div key={page.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{page.order}. {page.title}</h3>
                      <Badge variant="outline" className="text-xs">{page.category}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{page.description}</p>
                    <Textarea
                      placeholder={`Enter content for ${page.title}...`}
                      value={page.content}
                      onChange={(e) => {
                        const updatedPages = editingPackage.pages.map(p => 
                          p.id === page.id ? { ...p, content: e.target.value } : p
                        )
                        setEditingPackage({ ...editingPackage, pages: updatedPages })
                      }}
                      className="min-h-[120px]"
                    />
                  </div>
                ))}
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleSavePackage(editingPackage)}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Financial Package Settings</DialogTitle>
            <DialogDescription>Configure PDF output options.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showHeader"
                checked={pdfSettings.showHeader}
                onCheckedChange={(v) => setPdfSettings((s) => ({ ...s, showHeader: Boolean(v) }))}
              />
              <Label htmlFor="showHeader">Show header on each page</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showPlaceholderFrame"
                checked={pdfSettings.showPlaceholderFrame}
                onCheckedChange={(v) => setPdfSettings((s) => ({ ...s, showPlaceholderFrame: Boolean(v) }))}
              />
              <Label htmlFor="showPlaceholderFrame">Show editable placeholder frame</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="margin">Page margin</Label>
              <Input
                id="margin"
                type="number"
                min={10}
                max={40}
                value={pdfSettings.margin}
                onChange={(e) => setPdfSettings((s) => ({ ...s, margin: Number(e.target.value || 20) }))}
              />
              <p className="text-xs text-gray-500">Range: 10 - 40</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
              <Button onClick={() => setIsSettingsOpen(false)}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
