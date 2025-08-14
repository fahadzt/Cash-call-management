"use client"

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Download, Share2, FileText, BarChart3 } from 'lucide-react'
import type { CashCall } from '@/lib/firebase-database'

interface ExportButtonProps {
  cashCalls: CashCall[]
  selectedCashCall?: CashCall
  variant: "summary" | "detailed"
}

interface ExportData {
  monthlyData: any[]
  statusData: any[]
  approvalTimeData: any[]
  analytics: any
  filters: any
  cashCalls: any[]
}

interface ExportFunctionsProps {
  data: ExportData
  isExporting?: boolean
}

// Original ExportButton for Dashboard
export function ExportButton({ cashCalls, selectedCashCall, variant }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const exportToPDF = async () => {
    setIsExporting(true)

    try {
      const data = variant === "detailed" && selectedCashCall ? [selectedCashCall] : cashCalls

      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Cash Call ${variant === "detailed" ? "Details" : "Summary"}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { color: #0033A0; font-size: 24px; font-weight: bold; }
              .title { color: #00A3E0; font-size: 20px; margin: 10px 0; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #0033A0; color: white; }
              .status-draft { background-color: #6B7280; color: white; padding: 4px 8px; border-radius: 4px; }
              .status-review { background-color: #F59E0B; color: white; padding: 4px 8px; border-radius: 4px; }
              .status-approved { background-color: #10B981; color: white; padding: 4px 8px; border-radius: 4px; }
              .status-paid { background-color: #059669; color: white; padding: 4px 8px; border-radius: 4px; }
              .status-rejected { background-color: #EF4444; color: white; padding: 4px 8px; border-radius: 4px; }
              .detail-section { margin: 20px 0; }
              .detail-label { font-weight: bold; color: #0033A0; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">Aramco Digital</div>
              <div class="title">Cash Call ${variant === "detailed" ? "Details" : "Summary Report"}</div>
              <div>Generated on ${new Date().toLocaleDateString()}</div>
            </div>
            
            ${
              variant === "detailed" && selectedCashCall
                ? `
              <div class="detail-section">
                <h3>Cash Call Information</h3>
                <p><span class="detail-label">Call Number:</span> ${selectedCashCall.call_number}</p>
                <p><span class="detail-label">Affiliate:</span> ${selectedCashCall.affiliate?.name || "Unknown"}</p>
                <p><span class="detail-label">Amount:</span> $${selectedCashCall.amount_requested.toLocaleString()}</p>
                <p><span class="detail-label">Status:</span> ${selectedCashCall.status.replace("_", " ")}</p>
                <p><span class="detail-label">Created:</span> ${new Date(selectedCashCall.created_at).toLocaleDateString()}</p>
                ${selectedCashCall.description ? `<p><span class="detail-label">Description:</span> ${selectedCashCall.description}</p>` : ""}
                ${selectedCashCall.justification ? `<p><span class="detail-label">Justification:</span> ${selectedCashCall.justification}</p>` : ""}
              </div>
            `
                : `
              <table>
                <thead>
                  <tr>
                    <th>Call Number</th>
                    <th>Affiliate</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Created Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${data
                    .map(
                      (call) => `
                    <tr>
                      <td>${call.call_number}</td>
                      <td>${call.affiliate?.name || "Unknown"}</td>
                      <td>$${call.amount_requested.toLocaleString()}</td>
                      <td><span class="status-${call.status.replace("_", "-")}">${call.status.replace("_", " ")}</span></td>
                      <td>${new Date(call.created_at).toLocaleDateString()}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
              
              <div class="detail-section">
                <h3>Summary</h3>
                <p><span class="detail-label">Total Records:</span> ${data.length}</p>
                <p><span class="detail-label">Total Amount:</span> $${data.reduce((sum, call) => sum + call.amount_requested, 0).toLocaleString()}</p>
                <p><span class="detail-label">Approved/Paid:</span> ${data.filter((call) => call.status === "approved" || call.status === "paid").length}</p>
              </div>
            `
            }
          </body>
        </html>
      `

      // Create and download the HTML file (simulating PDF export)
      const blob = new Blob([htmlContent], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `cash-call-${variant}-${new Date().toISOString().split("T")[0]}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export to PDF failed:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const exportToExcel = async () => {
    setIsExporting(true)

    try {
      const data = variant === "detailed" && selectedCashCall ? [selectedCashCall] : cashCalls

      // Create CSV content
      const headers = [
        "Call Number",
        "Affiliate Name",
        "Company Code",
        "Amount Requested",
        "Status",
        "Created Date",
        "Description",
        "Justification",
      ]

      const csvContent = [
        headers.join(","),
        ...data.map((call) =>
          [
            call.call_number,
            `"${call.affiliate?.name || "Unknown"}"`,
            call.affiliate?.company_code || "",
            call.amount_requested,
            call.status,
            new Date(call.created_at).toLocaleDateString(),
            `"${call.description || ""}"`,
            `"${call.justification || ""}"`,
          ].join(","),
        ),
      ].join("\n")

      // Create and download the CSV file
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `cash-call-${variant}-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export to Excel failed:", error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10 bg-transparent"
          disabled={isExporting}
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white border-gray-300">
        <DropdownMenuItem onClick={exportToPDF} className="hover:bg-[#0033A0]/10">
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel} className="hover:bg-[#0033A0]/10">
          <BarChart3 className="h-4 w-4 mr-2" />
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// New ExportFunctions for Reports page
export const ExportFunctions = ({ data, isExporting = false }: ExportFunctionsProps) => {
  const [exportType, setExportType] = useState<'csv' | 'pdf' | 'summary'>('csv')

  const exportToCSV = useCallback(() => {
    const csvData = [
      ['Month', 'Cash Calls', 'Total Amount', 'Average Amount'],
      ...data.monthlyData.map(row => [
        row.month,
        row.count.toString(),
        `$${row.amount.toLocaleString()}`,
        `$${row.avgAmount.toLocaleString()}`
      ])
    ]

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cash-call-report-${data.filters.timeRange}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }, [data])

  const exportToPDF = useCallback(() => {
    const printContent = `
      <html>
        <head>
          <title>Cash Call Analytics Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
            .metric { text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            .metric-value { font-size: 24px; font-weight: bold; color: #0033A0; }
            .metric-label { font-size: 12px; color: #666; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Cash Call Analytics Report</h1>
            <p>Period: ${data.filters.timeRange} | Generated: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="metrics">
            <div class="metric">
              <div class="metric-value">${data.analytics.totalRequests}</div>
              <div class="metric-label">Total Requests</div>
            </div>
            <div class="metric">
              <div class="metric-value">$${data.analytics.totalAmount.toLocaleString()}</div>
              <div class="metric-label">Total Amount</div>
            </div>
            <div class="metric">
              <div class="metric-value">${data.analytics.approvalRate}%</div>
              <div class="metric-label">Approval Rate</div>
            </div>
            <div class="metric">
              <div class="metric-value">$${data.analytics.avgAmount.toLocaleString()}</div>
              <div class="metric-label">Average Amount</div>
            </div>
          </div>
          
          <h2>Monthly Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Cash Calls</th>
                <th>Total Amount</th>
                <th>Average Amount</th>
              </tr>
            </thead>
            <tbody>
              ${data.monthlyData.map(row => `
                <tr>
                  <td>${row.month}</td>
                  <td>${row.count}</td>
                  <td>$${row.amount.toLocaleString()}</td>
                  <td>$${row.avgAmount.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }, [data])

  const exportSummary = useCallback(() => {
    const summaryData = {
      period: data.filters.timeRange,
      generated: new Date().toISOString(),
      metrics: {
        totalRequests: data.analytics.totalRequests,
        totalAmount: data.analytics.totalAmount,
        approvalRate: data.analytics.approvalRate,
        avgAmount: data.analytics.avgAmount,
        growthRate: data.analytics.growthRate,
        anomalies: data.analytics.anomalies
      },
      topAffiliates: data.approvalTimeData.slice(0, 5),
      statusBreakdown: data.statusData
    }

    const blob = new Blob([JSON.stringify(summaryData, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cash-call-summary-${data.filters.timeRange}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }, [data])

  return (
    <div className="flex gap-2">
      <Button
        onClick={exportToCSV}
        disabled={isExporting}
        variant="outline"
        size="sm"
        className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10"
      >
        <Download className="h-4 w-4 mr-2" />
        {isExporting ? 'Exporting...' : 'CSV'}
      </Button>
      <Button
        onClick={exportToPDF}
        disabled={isExporting}
        variant="outline"
        size="sm"
        className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10"
      >
        <Share2 className="h-4 w-4 mr-2" />
        {isExporting ? 'Generating...' : 'PDF'}
      </Button>
      <Button
        onClick={exportSummary}
        disabled={isExporting}
        variant="outline"
        size="sm"
        className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10"
      >
        <FileText className="h-4 w-4 mr-2" />
        {isExporting ? 'Generating...' : 'Summary'}
      </Button>
    </div>
  )
}
