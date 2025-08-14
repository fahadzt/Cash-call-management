"use client"

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Settings, Download } from 'lucide-react'

interface EnhancedPDFExportProps {
  monthlyData: any[]
  statusData: any[]
  approvalTimeData: any[]
  analytics: any
  filters: any
  chartType: string
  isExporting?: boolean
  monthlyChartRef?: React.RefObject<HTMLDivElement | null>
  statusChartRef?: React.RefObject<HTMLDivElement | null>
  approvalChartRef?: React.RefObject<HTMLDivElement | null>
}

export const EnhancedPDFExport = ({ 
  monthlyData, 
  statusData, 
  approvalTimeData, 
  analytics, 
  filters, 
  chartType,
  isExporting = false,
  monthlyChartRef,
  statusChartRef,
  approvalChartRef
}: EnhancedPDFExportProps) => {
  
  const [showChartSelector, setShowChartSelector] = useState(false)
  const [selectedCharts, setSelectedCharts] = useState({
    monthlyTrends: true,
    statusDistribution: true,
    approvalPerformance: true,
    keyInsights: true
  })
  const [isGenerating, setIsGenerating] = useState(false)

  const toggleChart = (chartKey: string) => {
    setSelectedCharts(prev => ({
      ...prev,
      [chartKey]: !prev[chartKey as keyof typeof prev]
    }))
  }

  const exportToPDF = useCallback(async () => {
    setIsGenerating(true)
    
    try {
      console.log('Starting PDF generation...')
      console.log('Monthly data:', monthlyData)
      console.log('Status data:', statusData)
      
      // Create simple SVG charts inline based on chart type
      const createChart = (data: any[], chartType: string) => {
        if (!data || data.length === 0) return ''
        
        const width = 600
        const height = 300
        const margin = { top: 20, right: 30, bottom: 40, left: 60 }
        const chartWidth = width - margin.left - margin.right
        const chartHeight = height - margin.top - margin.bottom
        
        const maxValue = Math.max(...data.map(d => d.count))
        const stepX = chartWidth / (data.length - 1)
        
        // Create grid lines
        const gridLines = []
        for (let i = 0; i <= 5; i++) {
          const y = margin.top + (chartHeight / 5) * i
          gridLines.push(`<line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="#f0f0f0" stroke-width="1"/>`)
        }
        
        // Create axis lines
        const axes = `
          <line x1="${margin.left}" y1="${margin.top + chartHeight}" x2="${width - margin.right}" y2="${margin.top + chartHeight}" stroke="#ccc" stroke-width="1"/>
          <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartHeight}" stroke="#ccc" stroke-width="1"/>
        `
        
        // Create data points and labels
        const dataPoints = data.map((item, index) => {
          const x = margin.left + index * stepX
          const y = margin.top + chartHeight - (item.count / maxValue) * chartHeight
          return { x, y, item }
        })
        
        // Create chart based on type
        let chartContent = ''
        
        switch (chartType) {
          case 'bar':
            const barWidth = chartWidth / data.length * 0.8
            const barSpacing = chartWidth / data.length * 0.2
            
            chartContent = data.map((item, index) => {
              const barHeight = (item.count / maxValue) * chartHeight
              const x = margin.left + index * (barWidth + barSpacing) + barSpacing / 2
              const y = margin.top + chartHeight - barHeight
              
              return `
                <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" 
                      fill="#0033A0" stroke="#002266" stroke-width="1"/>
                <text x="${x + barWidth/2}" y="${margin.top + chartHeight + 15}" 
                      text-anchor="middle" font-size="12" fill="#333">${item.month}</text>
                <text x="${x + barWidth/2}" y="${y - 5}" 
                      text-anchor="middle" font-size="10" fill="#0033A0">${item.count}</text>
              `
            }).join('')
            break
            
          case 'line':
            const linePath = dataPoints.map((point, index) => 
              `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
            ).join(' ')
            
            chartContent = `
              <path d="${linePath}" stroke="#0033A0" stroke-width="3" fill="none"/>
              ${dataPoints.map(point => `
                <circle cx="${point.x}" cy="${point.y}" r="4" fill="#0033A0" stroke="white" stroke-width="2"/>
                <text x="${point.x}" y="${margin.top + chartHeight + 15}" 
                      text-anchor="middle" font-size="12" fill="#333">${point.item.month}</text>
                <text x="${point.x}" y="${point.y - 10}" 
                      text-anchor="middle" font-size="10" fill="#0033A0">${point.item.count}</text>
              `).join('')}
            `
            break
            
          case 'area':
            const areaPath = dataPoints.map((point, index) => 
              `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
            ).join(' ') + ` L ${dataPoints[dataPoints.length - 1].x} ${margin.top + chartHeight} L ${dataPoints[0].x} ${margin.top + chartHeight} Z`
            
            chartContent = `
              <path d="${areaPath}" fill="#0033A0" fill-opacity="0.3" stroke="#0033A0" stroke-width="2"/>
              ${dataPoints.map(point => `
                <circle cx="${point.x}" cy="${point.y}" r="3" fill="#0033A0" stroke="white" stroke-width="1"/>
                <text x="${point.x}" y="${margin.top + chartHeight + 15}" 
                      text-anchor="middle" font-size="12" fill="#333">${point.item.month}</text>
                <text x="${point.x}" y="${point.y - 10}" 
                      text-anchor="middle" font-size="10" fill="#0033A0">${point.item.count}</text>
              `).join('')}
            `
            break
            
          case 'composed':
            // Bar chart with line overlay
            const composedBarWidth = chartWidth / data.length * 0.6
            const composedBarSpacing = chartWidth / data.length * 0.4
            
            const bars = data.map((item, index) => {
              const barHeight = (item.count / maxValue) * chartHeight * 0.7
              const x = margin.left + index * (composedBarWidth + composedBarSpacing) + composedBarSpacing / 2
              const y = margin.top + chartHeight - barHeight
              
              return `
                <rect x="${x}" y="${y}" width="${composedBarWidth}" height="${barHeight}" 
                      fill="#0033A0" fill-opacity="0.7" stroke="#002266" stroke-width="1"/>
              `
            }).join('')
            
            const avgLinePath = dataPoints.map((point, index) => {
              const avgValue = point.item.avgAmount / Math.max(...data.map(d => d.avgAmount)) * chartHeight
              const y = margin.top + chartHeight - avgValue
              return `${index === 0 ? 'M' : 'L'} ${point.x} ${y}`
            }).join(' ')
            
            chartContent = `
              ${bars}
              <path d="${avgLinePath}" stroke="#00A3E0" stroke-width="3" fill="none"/>
              ${dataPoints.map(point => `
                <text x="${point.x}" y="${margin.top + chartHeight + 15}" 
                      text-anchor="middle" font-size="12" fill="#333">${point.item.month}</text>
              `).join('')}
            `
            break
            
          default:
            // Default to bar chart
            const defaultBarWidth = chartWidth / data.length * 0.8
            const defaultBarSpacing = chartWidth / data.length * 0.2
            
            chartContent = data.map((item, index) => {
              const barHeight = (item.count / maxValue) * chartHeight
              const x = margin.left + index * (defaultBarWidth + defaultBarSpacing) + defaultBarSpacing / 2
              const y = margin.top + chartHeight - barHeight
              
              return `
                <rect x="${x}" y="${y}" width="${defaultBarWidth}" height="${barHeight}" 
                      fill="#0033A0" stroke="#002266" stroke-width="1"/>
                <text x="${x + defaultBarWidth/2}" y="${margin.top + chartHeight + 15}" 
                      text-anchor="middle" font-size="12" fill="#333">${item.month}</text>
                <text x="${x + defaultBarWidth/2}" y="${y - 5}" 
                      text-anchor="middle" font-size="10" fill="#0033A0">${item.count}</text>
              `
            }).join('')
        }
        
        return `
          <svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">
            <text x="${width/2}" y="15" text-anchor="middle" font-size="16" font-weight="bold" fill="#333">
              Monthly Cash Call Trends (${chartType.toUpperCase()})
            </text>
            ${gridLines.join('')}
            ${axes}
            ${chartContent}
          </svg>
        `
      }
      
      const createPieChart = (data: any[]) => {
        if (!data || data.length === 0) return ''
        
        const width = 400
        const height = 300
        const radius = 80
        const centerX = width / 2
        const centerY = height / 2
        
        const total = data.reduce((sum, item) => sum + item.value, 0)
        let currentAngle = 0
        
        const colors = ['#0033A0', '#00A3E0', '#00843D', '#84BD00', '#F59E0B', '#EF4444']
        
        const slices = data.map((item, index) => {
          const sliceAngle = (item.value / total) * 2 * Math.PI
          const startAngle = currentAngle
          const endAngle = currentAngle + sliceAngle
          
          const x1 = centerX + radius * Math.cos(startAngle)
          const y1 = centerY + radius * Math.sin(startAngle)
          const x2 = centerX + radius * Math.cos(endAngle)
          const y2 = centerY + radius * Math.sin(endAngle)
          
          const largeArcFlag = sliceAngle > Math.PI ? 1 : 0
          
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ')
          
          const labelAngle = startAngle + sliceAngle / 2
          const labelRadius = radius + 20
          const labelX = centerX + labelRadius * Math.cos(labelAngle)
          const labelY = centerY + labelRadius * Math.sin(labelAngle)
          
          currentAngle = endAngle
          
          return `
            <path d="${pathData}" fill="${colors[index % colors.length]}" stroke="white" stroke-width="2"/>
            <text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="10" fill="#333">
              ${item.name} (${item.value})
            </text>
          `
        }).join('')
        
        return `
          <svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">
            <text x="${centerX}" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="#333">
              Status Distribution
            </text>
            ${slices}
          </svg>
        `
      }
      
      // Create HTML content that matches the exact design from the image
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 20px;
              background: #f8fafc;
              color: #333;
            }
            
            /* Header Section */
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #0033A0;
              margin-bottom: 5px;
            }
            .report-title {
              font-size: 20px;
              font-weight: bold;
              color: #333;
              margin-bottom: 10px;
            }
            .report-meta {
              display: flex;
              justify-content: center;
              gap: 20px;
              font-size: 14px;
              color: #666;
              margin-bottom: 20px;
            }
            .meta-item {
              display: flex;
              align-items: center;
              gap: 5px;
            }
            
            /* Key Metrics Cards */
            .metrics-container {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
              margin-bottom: 40px;
            }
            .metric-card {
              background: white;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              border-top: 4px solid;
            }
            .metric-card:nth-child(1) { border-top-color: #0033A0; }
            .metric-card:nth-child(2) { border-top-color: #00A3E0; }
            .metric-card:nth-child(3) { border-top-color: #00843D; }
            .metric-card:nth-child(4) { border-top-color: #84BD00; }
            .metric-value {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 8px;
              color: #333;
            }
            .metric-label {
              font-size: 12px;
              color: #666;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            /* Section Headers */
            .section-header {
              font-size: 18px;
              font-weight: bold;
              color: #333;
              margin-bottom: 15px;
              padding-bottom: 8px;
              border-bottom: 2px solid #0033A0;
              display: inline-block;
            }
            
            /* Chart Container */
            .chart-container {
              background: white;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin-bottom: 20px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .chart-description {
              font-size: 14px;
              color: #666;
              text-align: center;
              margin-bottom: 20px;
            }
            
            /* Data Table */
            .data-table {
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              margin-bottom: 30px;
            }
            .table-header {
              background: #0033A0;
              color: white;
              padding: 12px 15px;
              font-weight: bold;
              font-size: 14px;
            }
            .table-row {
              padding: 10px 15px;
              border-bottom: 1px solid #E5E7EB;
              font-size: 14px;
            }
            .table-row:last-child {
              border-bottom: none;
            }
            .table-row:nth-child(even) {
              background: #F9FAFB;
            }
            
            /* Print styles */
            @media print {
              body { 
                background: white; 
                padding: 10px;
              }
              .metrics-container { 
                grid-template-columns: repeat(2, 1fr); 
                gap: 15px;
              }
              .metric-card {
                padding: 15px;
              }
              .metric-value {
                font-size: 24px;
              }
            }
          </style>
        </head>
        <body>
          <!-- Header Section -->
          <div class="header">
            <div class="company-name">Aramco Digital</div>
            <div class="report-title">Cash Call Analytics Report</div>
            <div class="report-meta">
              <div class="meta-item">
                <span>Period:</span>
                <span>${filters.timeRange}</span>
              </div>
              <div class="meta-item">
                <span>Chart Type:</span>
                <span>${chartType}</span>
              </div>
              <div class="meta-item">
                <span>Generated:</span>
                <span>${new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <!-- Key Metrics Cards -->
          <div class="metrics-container">
            <div class="metric-card">
              <div class="metric-value">${analytics.totalRequests}</div>
              <div class="metric-label">Total Requests</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">$${analytics.totalAmount.toLocaleString()}</div>
              <div class="metric-label">Total Amount</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${analytics.approvalRate}%</div>
              <div class="metric-label">Approval Rate</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">$${analytics.avgAmount.toLocaleString()}</div>
              <div class="metric-label">Average Amount</div>
            </div>
          </div>
          
          <!-- Monthly Trends Section -->
          <div class="section-header">Monthly Trends</div>
          <div class="chart-container">
            ${createChart(monthlyData, chartType)}
          </div>
          <div class="chart-description">Shows cash call volume and amounts over time with bar visualization.</div>
          <div class="data-table">
            <div class="table-header">MONTH | CASH CALLS | TOTAL AMOUNT | AVERAGE AMOUNT</div>
            ${monthlyData.map(row => `
              <div class="table-row">
                ${row.month} | ${row.count} | $${row.amount.toLocaleString()} | $${row.avgAmount.toLocaleString()}
              </div>
            `).join('')}
          </div>
          
          <!-- Status Distribution Section -->
          <div class="section-header">Status Distribution</div>
          <div class="chart-container">
            ${createPieChart(statusData)}
          </div>
          <div class="chart-description">Distribution of cash calls by status.</div>
          <div class="data-table">
            <div class="table-header">STATUS | COUNT | PERCENTAGE | TOTAL AMOUNT</div>
            ${statusData.map(row => {
              const percentage = ((row.value / analytics.totalRequests) * 100).toFixed(1)
              return `
                <div class="table-row">
                  ${row.name} | ${row.value} | ${percentage}% | $${row.amount.toLocaleString()}
                </div>
              `
            }).join('')}
          </div>
        </body>
        </html>
      `
      
      // Create a new window with the HTML content
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        
        // Wait for content to load, then print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print()
            printWindow.close()
          }, 1000)
        }
      }

    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }, [monthlyData, statusData, approvalTimeData, analytics, filters, chartType, selectedCharts])

  return (
    <div className="relative">
      <Button
        onClick={() => setShowChartSelector(!showChartSelector)}
        variant="outline"
        size="sm"
        className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10"
      >
        <Settings className="h-4 w-4 mr-2" />
        Configure PDF
      </Button>
      
      {showChartSelector && (
        <Card className="absolute top-full right-0 mt-2 w-80 z-50 bg-white shadow-xl border-2 border-[#0033A0]">
          <CardHeader className="pb-3">
            <CardTitle className="text-[#0033A0] text-lg flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Select Charts for PDF
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="monthlyTrends" 
                checked={selectedCharts.monthlyTrends}
                onCheckedChange={() => toggleChart('monthlyTrends')}
              />
              <Label htmlFor="monthlyTrends" className="text-sm font-medium">
                Monthly Trends Chart
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="statusDistribution" 
                checked={selectedCharts.statusDistribution}
                onCheckedChange={() => toggleChart('statusDistribution')}
              />
              <Label htmlFor="statusDistribution" className="text-sm font-medium">
                Status Distribution Chart
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="approvalPerformance" 
                checked={selectedCharts.approvalPerformance}
                onCheckedChange={() => toggleChart('approvalPerformance')}
              />
              <Label htmlFor="approvalPerformance" className="text-sm font-medium">
                Approval Performance Chart
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="keyInsights" 
                checked={selectedCharts.keyInsights}
                onCheckedChange={() => toggleChart('keyInsights')}
              />
              <Label htmlFor="keyInsights" className="text-sm font-medium">
                Key Insights Section
              </Label>
            </div>
            
            <div className="pt-3 border-t border-gray-200 space-y-2">
              <Button
                onClick={() => {
                  console.log('Selected charts:', selectedCharts)
                  console.log('Monthly data:', monthlyData)
                  console.log('Status data:', statusData)
                  console.log('Chart type:', chartType)
                }}
                variant="outline"
                size="sm"
                className="w-full text-xs"
              >
                Debug: Check Data
              </Button>
              <Button
                onClick={exportToPDF}
                disabled={isGenerating || isExporting}
                className="w-full bg-[#0033A0] hover:bg-[#002266] text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generating PDF...' : 'Generate Enhanced PDF'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}


    </div>
  )
}
