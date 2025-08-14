"use client"

import { useRef, useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ComposedChart } from "recharts"

interface ChartToImageProps {
  data: any[]
  chartType: 'bar' | 'line' | 'area' | 'pie' | 'composed'
  width?: number
  height?: number
  onImageGenerated?: (imageData: string) => void
  chartConfig?: any
}

export const ChartToImage = ({ 
  data, 
  chartType, 
  width = 600, 
  height = 400, 
  onImageGenerated,
  chartConfig 
}: ChartToImageProps) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const [imageData, setImageData] = useState<string>('')

  useEffect(() => {
    if (chartRef.current && data.length > 0) {
      // Wait for chart to render
      setTimeout(() => {
        generateImage()
      }, 2000)
    }
  }, [data, chartType])

  const generateImage = async () => {
    if (!chartRef.current) return

    try {
      console.log('Generating image for chart:', chartType, 'with data length:', data.length)
      
      // Use a different approach - create SVG and convert to image
      const svgElement = chartRef.current.querySelector('svg')
      if (svgElement) {
        console.log('SVG element found, converting to image...')
        
        // Clone the SVG to avoid modifying the original
        const clonedSvg = svgElement.cloneNode(true) as SVGElement
        
        // Set explicit dimensions
        clonedSvg.setAttribute('width', width.toString())
        clonedSvg.setAttribute('height', height.toString())
        clonedSvg.setAttribute('viewBox', `0 0 ${width} ${height}`)
        
        const svgData = new XMLSerializer().serializeToString(clonedSvg)
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)
        
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          
          if (ctx) {
            // Set white background
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, width, height)
            
            // Draw the image
            ctx.drawImage(img, 0, 0, width, height)
            
            const dataUrl = canvas.toDataURL('image/png')
            console.log('Image generated successfully:', dataUrl.substring(0, 50) + '...')
            setImageData(dataUrl)
            onImageGenerated?.(dataUrl)
            
            URL.revokeObjectURL(url)
          }
        }
        img.onerror = (error) => {
          console.error('Error loading SVG image:', error)
          URL.revokeObjectURL(url)
        }
        img.src = url
      } else {
        console.error('SVG element not found in chart container')
      }
    } catch (error) {
      console.error('Error generating chart image:', error)
    }
  }

  const renderChart = () => {
    const commonProps = {
      data,
      width,
      height,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    }

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
            <YAxis stroke="#6B7280" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="count" fill="#0033A0" radius={[4, 4, 0, 0]} />
          </BarChart>
        )
      
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
            <YAxis stroke="#6B7280" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Line type="monotone" dataKey="count" stroke="#0033A0" strokeWidth={2} />
          </LineChart>
        )
      
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
            <YAxis stroke="#6B7280" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Area type="monotone" dataKey="amount" stroke="#0033A0" fill="#0033A0" fillOpacity={0.3} />
          </AreaChart>
        )
      
      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        )
      
      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
            <YAxis stroke="#6B7280" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="count" fill="#0033A0" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="avgAmount" stroke="#00A3E0" strokeWidth={2} />
          </ComposedChart>
        )
      
      default:
        return null
    }
  }

  return (
    <div ref={chartRef} style={{ width, height, backgroundColor: '#ffffff' }}>
      {renderChart()}
    </div>
  )
}
