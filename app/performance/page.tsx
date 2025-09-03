"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Zap, 
  Database, 
  Wifi, 
  WifiOff, 
  Clock, 
  Memory, 
  HardDrive,
  Activity,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Settings
} from 'lucide-react'
import { usePerformance } from '@/hooks/use-performance'
import { dbOptimizer } from '@/lib/database-optimizer'
import { PerformanceMonitor } from '@/components/performance-optimizer'

export default function PerformancePage() {
  const { getMetrics, isOnline, isSlowConnection, clearCache } = usePerformance()
  const [metrics, setMetrics] = useState(getMetrics())
  const [dbStats, setDbStats] = useState(dbOptimizer.getCacheStats())
  const [systemMetrics, setSystemMetrics] = useState({
    memoryUsage: 0,
    cpuUsage: 0,
    networkLatency: 0,
    loadTime: 0,
  })

  // Update metrics every second
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(getMetrics())
      setDbStats(dbOptimizer.getCacheStats())
      
      // Simulate system metrics (in real app, these would come from actual monitoring)
      setSystemMetrics({
        memoryUsage: Math.random() * 100,
        cpuUsage: Math.random() * 100,
        networkLatency: Math.random() * 1000,
        loadTime: Math.random() * 5000,
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [getMetrics])

  const cacheHitRate = metrics.cacheHits + metrics.cacheMisses > 0
    ? (metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100
    : 0

  const handleClearCache = () => {
    clearCache()
    setDbStats(dbOptimizer.getCacheStats())
  }

  const getPerformanceStatus = () => {
    if (cacheHitRate > 80 && systemMetrics.memoryUsage < 70) return 'excellent'
    if (cacheHitRate > 60 && systemMetrics.memoryUsage < 85) return 'good'
    if (cacheHitRate > 40 && systemMetrics.memoryUsage < 95) return 'fair'
    return 'poor'
  }

  const performanceStatus = getPerformanceStatus()

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Performance Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClearCache}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Performance Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Overall Performance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge 
              variant={
                performanceStatus === 'excellent' ? 'default' :
                performanceStatus === 'good' ? 'secondary' :
                performanceStatus === 'fair' ? 'outline' : 'destructive'
              }
              className="text-lg px-4 py-2"
            >
              {performanceStatus.toUpperCase()}
            </Badge>
            <div className="flex items-center gap-2">
              {performanceStatus === 'excellent' && <TrendingUp className="h-5 w-5 text-green-500" />}
              {performanceStatus === 'poor' && <TrendingDown className="h-5 w-5 text-red-500" />}
              <span className="text-sm text-gray-600">
                Cache Hit Rate: {cacheHitRate.toFixed(1)}% | 
                Memory Usage: {systemMetrics.memoryUsage.toFixed(1)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Cache Metrics */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Hits</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{metrics.cacheHits}</div>
                <p className="text-xs text-muted-foreground">
                  +{((metrics.cacheHits / Math.max(metrics.cacheHits + metrics.cacheMisses, 1)) * 100).toFixed(1)}% hit rate
                </p>
              </CardContent>
            </Card>

            {/* API Calls */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Calls</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{metrics.apiCalls}</div>
                <p className="text-xs text-muted-foreground">
                  Total requests made
                </p>
              </CardContent>
            </Card>

            {/* Memory Usage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <Memory className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{systemMetrics.memoryUsage.toFixed(1)}%</div>
                <Progress value={systemMetrics.memoryUsage} className="mt-2" />
              </CardContent>
            </Card>

            {/* Load Time */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Load Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{(systemMetrics.loadTime / 1000).toFixed(2)}s</div>
                <p className="text-xs text-muted-foreground">
                  Page load time
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Cache Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Cache Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Hit Rate</span>
                    <span className="font-medium">{cacheHitRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={cacheHitRate} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{metrics.cacheHits}</div>
                    <div className="text-sm text-gray-600">Cache Hits</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{metrics.cacheMisses}</div>
                    <div className="text-sm text-gray-600">Cache Misses</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Database Cache */}
            <Card>
              <CardHeader>
                <CardTitle>Database Cache</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{dbStats.size}</div>
                  <div className="text-sm text-gray-600">Cached Queries</div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Cached Keys:</div>
                  <div className="max-h-32 overflow-y-auto text-xs text-gray-600">
                    {dbStats.keys.map((key, index) => (
                      <div key={index} className="py-1">
                        {key}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* System Resources */}
            <Card>
              <CardHeader>
                <CardTitle>System Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>CPU Usage</span>
                    <span className="font-medium">{systemMetrics.cpuUsage.toFixed(1)}%</span>
                  </div>
                  <Progress value={systemMetrics.cpuUsage} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Memory Usage</span>
                    <span className="font-medium">{systemMetrics.memoryUsage.toFixed(1)}%</span>
                  </div>
                  <Progress value={systemMetrics.memoryUsage} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Storage</span>
                    <span className="font-medium">75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Performance Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Page Load</span>
                    <span>{(systemMetrics.loadTime / 1000).toFixed(2)}s</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>API Response</span>
                    <span>{(systemMetrics.networkLatency / 1000).toFixed(2)}s</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Cache Lookup</span>
                    <span>0.01s</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Network Status */}
            <Card>
              <CardHeader>
                <CardTitle>Network Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <Wifi className="h-5 w-5 text-green-500" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                {isSlowConnection && (
                  <Badge variant="outline" className="text-orange-600">
                    Slow Connection Detected
                  </Badge>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Latency</span>
                    <span className="font-medium">{systemMetrics.networkLatency.toFixed(0)}ms</span>
                  </div>
                  <Progress 
                    value={Math.min((systemMetrics.networkLatency / 1000) * 100, 100)} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Connection Quality */}
            <Card>
              <CardHeader>
                <CardTitle>Connection Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Bandwidth</span>
                    <Badge variant="outline">Good</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Packet Loss</span>
                    <Badge variant="outline">0.1%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Jitter</span>
                    <Badge variant="outline">2ms</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Performance Monitor Component */}
      <PerformanceMonitor />
    </div>
  )
}
