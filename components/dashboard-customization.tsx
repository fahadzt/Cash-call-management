"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Grid3X3, 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  CheckCircle,
  Users,
  Calendar,
  Target,
  Eye,
  EyeOff,
  Move,
  Plus,
  X
} from 'lucide-react'
import { CashCall, Affiliate } from '@/lib/firebase-database'

export interface DashboardWidget {
  id: string
  type: 'stats' | 'chart' | 'recent' | 'calendar' | 'targets'
  title: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  visible: boolean
  config?: any
}

interface DashboardCustomizationProps {
  cashCalls: CashCall[]
  affiliates: Affiliate[]
  onLayoutChange: (widgets: DashboardWidget[]) => void
}

const defaultWidgets: DashboardWidget[] = [
  {
    id: 'total-calls',
    type: 'stats',
    title: 'Total Cash Calls',
    position: { x: 0, y: 0 },
    size: { width: 1, height: 1 },
    visible: true
  },
  {
    id: 'under-review',
    type: 'stats',
    title: 'Under Review',
    position: { x: 1, y: 0 },
    size: { width: 1, height: 1 },
    visible: true
  },
  {
    id: 'approved',
    type: 'stats',
    title: 'Approved',
    position: { x: 2, y: 0 },
    size: { width: 1, height: 1 },
    visible: true
  },
  {
    id: 'total-amount',
    type: 'stats',
    title: 'Total Amount',
    position: { x: 3, y: 0 },
    size: { width: 1, height: 1 },
    visible: true
  },
  {
    id: 'status-chart',
    type: 'chart',
    title: 'Status Distribution',
    position: { x: 0, y: 1 },
    size: { width: 2, height: 2 },
    visible: true
  },
  {
    id: 'recent-calls',
    type: 'recent',
    title: 'Recent Cash Calls',
    position: { x: 2, y: 1 },
    size: { width: 2, height: 2 },
    visible: true
  }
]

export function DashboardCustomization({ 
  cashCalls, 
  affiliates, 
  onLayoutChange 
}: DashboardCustomizationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [widgets, setWidgets] = useState<DashboardWidget[]>(defaultWidgets)
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Load saved layout from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-layout')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setWidgets(parsed)
        onLayoutChange(parsed)
      } catch (error) {
        console.error('Failed to load dashboard layout:', error)
      }
    }
  }, [])

  // Save layout to localStorage
  const saveLayout = (newWidgets: DashboardWidget[]) => {
    localStorage.setItem('dashboard-layout', JSON.stringify(newWidgets))
    onLayoutChange(newWidgets)
  }

  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    setDraggedWidget(widgetId)
    const rect = e.currentTarget.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedWidget) return

    const gridSize = 100 // Size of each grid cell
    const containerRect = e.currentTarget.getBoundingClientRect()
    const x = Math.floor((e.clientX - containerRect.left - dragOffset.x) / gridSize)
    const y = Math.floor((e.clientY - containerRect.top - dragOffset.y) / gridSize)

    const newWidgets = widgets.map(widget => 
      widget.id === draggedWidget 
        ? { ...widget, position: { x: Math.max(0, x), y: Math.max(0, y) } }
        : widget
    )

    setWidgets(newWidgets)
    saveLayout(newWidgets)
    setDraggedWidget(null)
  }

  const toggleWidgetVisibility = (widgetId: string) => {
    const newWidgets = widgets.map(widget =>
      widget.id === widgetId ? { ...widget, visible: !widget.visible } : widget
    )
    setWidgets(newWidgets)
    saveLayout(newWidgets)
  }

  const addWidget = (type: DashboardWidget['type']) => {
    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      type,
      title: getWidgetTitle(type),
      position: { x: 0, y: 0 },
      size: { width: 1, height: 1 },
      visible: true
    }

    const newWidgets = [...widgets, newWidget]
    setWidgets(newWidgets)
    saveLayout(newWidgets)
  }

  const removeWidget = (widgetId: string) => {
    const newWidgets = widgets.filter(widget => widget.id !== widgetId)
    setWidgets(newWidgets)
    saveLayout(newWidgets)
  }

  const getWidgetTitle = (type: DashboardWidget['type']) => {
    switch (type) {
      case 'stats': return 'Statistics'
      case 'chart': return 'Chart'
      case 'recent': return 'Recent Activity'
      case 'calendar': return 'Calendar'
      case 'targets': return 'Targets'
      default: return 'Widget'
    }
  }

  const getWidgetIcon = (type: DashboardWidget['type']) => {
    switch (type) {
      case 'stats': return <TrendingUp className="h-4 w-4" />
      case 'chart': return <BarChart3 className="h-4 w-4" />
      case 'recent': return <Clock className="h-4 w-4" />
      case 'calendar': return <Calendar className="h-4 w-4" />
      case 'targets': return <Target className="h-4 w-4" />
      default: return <Grid3X3 className="h-4 w-4" />
    }
  }

  const renderWidgetPreview = (widget: DashboardWidget) => {
    const stats = {
      totalCalls: cashCalls.length,
      underReview: cashCalls.filter(c => c.status === "under_review").length,
      approved: cashCalls.filter(c => c.status === "approved").length,
      totalAmount: cashCalls.reduce((sum, call) => sum + call.amount_requested, 0)
    }

    switch (widget.type) {
      case 'stats':
        return (
          <div className="text-center">
            <div className="text-2xl font-bold text-[#0033A0]">
              {widget.id === 'total-calls' && stats.totalCalls}
              {widget.id === 'under-review' && stats.underReview}
              {widget.id === 'approved' && stats.approved}
              {widget.id === 'total-amount' && `$${stats.totalAmount.toLocaleString()}`}
            </div>
          </div>
        )
      case 'chart':
        return (
          <div className="flex items-center justify-center h-full">
            <BarChart3 className="h-8 w-8 text-[#00A3E0]" />
          </div>
        )
      case 'recent':
        return (
          <div className="space-y-2">
            {cashCalls.slice(0, 3).map((call, index) => (
              <div key={index} className="text-sm">
                <div className="font-medium">{call.call_number}</div>
                <div className="text-gray-500">${call.amount_requested.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )
      default:
        return <div className="text-center text-gray-500">Widget Content</div>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10"
        >
          <Settings className="h-4 w-4 mr-2" />
          Customize
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Customize Dashboard Layout</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Widget Library */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Available Widgets</h3>
            <div className="grid grid-cols-2 gap-3">
              {(['stats', 'chart', 'recent', 'calendar', 'targets'] as const).map((type) => (
                <Card
                  key={type}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => addWidget(type)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      {getWidgetIcon(type)}
                      <span className="font-medium">{getWidgetTitle(type)}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Add a {getWidgetTitle(type).toLowerCase()} widget to your dashboard
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Dashboard Preview</h3>
            <div
              className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[400px]"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {widgets.filter(w => w.visible).map((widget) => (
                <div
                  key={widget.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, widget.id)}
                  className={`absolute bg-white border border-gray-200 rounded-lg shadow-sm cursor-move hover:shadow-md transition-shadow ${
                    draggedWidget === widget.id ? 'opacity-50' : ''
                  }`}
                  style={{
                    left: widget.position.x * 100,
                    top: widget.position.y * 80,
                    width: widget.size.width * 100,
                    height: widget.size.height * 80,
                    zIndex: draggedWidget === widget.id ? 10 : 1
                  }}
                >
                  <div className="p-3 h-full">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{widget.title}</h4>
                      <div className="flex items-center gap-1">
                        <Move className="h-3 w-3 text-gray-400" />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleWidgetVisibility(widget.id)}
                          className="h-4 w-4 p-0"
                        >
                          <EyeOff className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeWidget(widget.id)}
                          className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {renderWidgetPreview(widget)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Widget List */}
        <div className="mt-6">
          <h3 className="font-semibold text-lg mb-3">Widget Settings</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {widgets.map((widget) => (
              <div
                key={widget.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getWidgetIcon(widget.type)}
                  <div>
                    <div className="font-medium">{widget.title}</div>
                    <div className="text-sm text-gray-500">
                      Position: ({widget.position.x}, {widget.position.y}) | 
                      Size: {widget.size.width}x{widget.size.height}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={widget.visible ? 'default' : 'secondary'}>
                    {widget.visible ? 'Visible' : 'Hidden'}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleWidgetVisibility(widget.id)}
                  >
                    {widget.visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeWidget(widget.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => {
              setWidgets(defaultWidgets)
              saveLayout(defaultWidgets)
            }}
          >
            Reset to Default
          </Button>
          <Button onClick={() => setIsOpen(false)}>
            Save Layout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
