"use client"

import { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Zap, Database, Wifi, WifiOff } from 'lucide-react'
import { usePerformance } from '@/hooks/use-performance'

// Lazy load heavy components
const LazyChart = lazy(() => import('@/components/ui/chart'))
const LazyDataTable = lazy(() => import('@/components/ui/table'))

interface PerformanceOptimizerProps {
  children: React.ReactNode
  showMetrics?: boolean
}

export function PerformanceOptimizer({ children, showMetrics = false }: PerformanceOptimizerProps) {
  const { getMetrics, isOnline, isSlowConnection } = usePerformance()
  const [metrics, setMetrics] = useState(getMetrics())
  const [showPerformancePanel, setShowPerformancePanel] = useState(false)

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(getMetrics())
    }, 5000)

    return () => clearInterval(interval)
  }, [getMetrics])

  if (!showMetrics) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      {children}
      
      {/* Performance Panel Toggle */}
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50"
        onClick={() => setShowPerformancePanel(!showPerformancePanel)}
      >
        <Zap className="h-4 w-4 mr-2" />
        Performance
      </Button>

      {/* Performance Panel */}
      {showPerformancePanel && (
        <Card className="fixed bottom-16 right-4 w-80 z-50 shadow-lg">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Performance Metrics</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPerformancePanel(false)}
                >
                  ×
                </Button>
              </div>

              {/* Network Status */}
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">
                  {isOnline ? 'Online' : 'Offline'}
                  {isSlowConnection && ' (Slow)'}
                </span>
              </div>

              {/* Cache Metrics */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Cache Hits:</span>
                  <Badge variant="outline">{metrics.cacheHits}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cache Misses:</span>
                  <Badge variant="outline">{metrics.cacheMisses}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cache Size:</span>
                  <Badge variant="outline">{metrics.cacheSize}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>API Calls:</span>
                  <Badge variant="outline">{metrics.apiCalls}</Badge>
                </div>
              </div>

              {/* Cache Hit Rate */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Cache Hit Rate:</span>
                  <span className="font-medium">
                    {metrics.cacheHits + metrics.cacheMisses > 0
                      ? `${((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100).toFixed(1)}%`
                      : '0%'}
                  </span>
                </div>
                <Progress
                  value={
                    metrics.cacheHits + metrics.cacheMisses > 0
                      ? (metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100
                      : 0
                  }
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Lazy loading wrapper component
interface LazyLoadWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  threshold?: number
}

export function LazyLoadWrapper({ 
  children, 
  fallback = <div className="animate-pulse bg-gray-200 h-32 rounded" />,
  threshold = 0.1 
}: LazyLoadWrapperProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const ref = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        },
        { threshold }
      )
      observer.observe(node)
    }
  }, [threshold])

  if (!isVisible) {
    return <div ref={ref}>{fallback}</div>
  }

  return (
    <Suspense fallback={fallback}>
      <div ref={ref} onLoad={() => setIsLoaded(true)}>
        {children}
      </div>
    </Suspense>
  )
}

// Optimized data table component
interface OptimizedDataTableProps<T> {
  data: T[]
  columns: {
    key: string
    header: string
    render?: (item: T) => React.ReactNode
  }[]
  pageSize?: number
  searchable?: boolean
  sortable?: boolean
}

export function OptimizedDataTable<T>({
  data,
  columns,
  pageSize = 10,
  searchable = true,
  sortable = true
}: OptimizedDataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Memoized filtered and sorted data
  const processedData = useMemo(() => {
    let result = [...data]

    // Apply search filter
    if (searchTerm && searchable) {
      result = result.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Apply sorting
    if (sortColumn && sortable) {
      result.sort((a, b) => {
        const aValue = (a as any)[sortColumn]
        const bValue = (b as any)[sortColumn]
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [data, searchTerm, sortColumn, sortDirection, searchable, sortable])

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentData = processedData.slice(startIndex, endIndex)

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      {searchable && (
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="border border-gray-300 px-4 py-2 text-left"
                  onClick={() => sortable && handleSort(column.key)}
                  style={{ cursor: sortable ? 'pointer' : 'default' }}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {sortable && sortColumn === column.key && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.key} className="border border-gray-300 px-4 py-2">
                    {column.render ? column.render(item) : (item as any)[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, processedData.length)} of {processedData.length} results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="px-3 py-2 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Performance monitoring component
export function PerformanceMonitor() {
  const { getMetrics } = usePerformance()
  const [metrics, setMetrics] = useState(getMetrics())

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(getMetrics())
    }, 1000)

    return () => clearInterval(interval)
  }, [getMetrics])

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{metrics.cacheHits}</div>
            <div className="text-sm text-gray-600">Cache Hits</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{metrics.cacheMisses}</div>
            <div className="text-sm text-gray-600">Cache Misses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{metrics.apiCalls}</div>
            <div className="text-sm text-gray-600">API Calls</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{metrics.cacheSize}</div>
            <div className="text-sm text-gray-600">Cache Size</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
