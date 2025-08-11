"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Download, FileText, Table } from "lucide-react"
import type { CashCall } from "@/lib/mock-database"

interface ExportButtonProps {
  cashCalls: CashCall[]
  selectedCashCall?: CashCall
  variant: "summary" | "detailed"
}

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
          <Table className="h-4 w-4 mr-2" />
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
