import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

// Cache for storing expensive computations
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

// Performance monitoring
const performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  apiCalls: 0,
  renderTime: 0,
}

export function usePerformance() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSlowConnection, setIsSlowConnection] = useState(false)

  // Network status monitoring
  useEffect(() => {
    const updateNetworkStatus = () => {
      setIsOnline(navigator.onLine)
      
      // Check for slow connection
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        setIsSlowConnection(
          connection.effectiveType === 'slow-2g' ||
          connection.effectiveType === '2g' ||
          connection.effectiveType === '3g'
        )
      }
    }

    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)
    updateNetworkStatus()

    return () => {
      window.removeEventListener('online', updateNetworkStatus)
      window.removeEventListener('offline', updateNetworkStatus)
    }
  }, [])

  // Cache management
  const getCachedData = useCallback((key: string) => {
    const cached = cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      performanceMetrics.cacheHits++
      return cached.data
    }
    performanceMetrics.cacheMisses++
    return null
  }, [])

  const setCachedData = useCallback((key: string, data: any, ttl = 5 * 60 * 1000) => {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }, [])

  const clearCache = useCallback(() => {
    cache.clear()
  }, [])

  // Debounced function
  const useDebounce = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): T => {
    const timeoutRef = useRef<NodeJS.Timeout>()

    return useCallback((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => func(...args), delay)
    }, [func, delay]) as T
  }, [])

  // Throttled function
  const useThrottle = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): T => {
    const lastRun = useRef(0)

    return useCallback((...args: Parameters<T>) => {
      const now = Date.now()
      if (now - lastRun.current >= delay) {
        func(...args)
        lastRun.current = now
      }
    }, [func, delay]) as T
  }, [])

  // Lazy loading with intersection observer
  const useLazyLoad = useCallback((callback: () => void, options = {}) => {
    const elementRef = useRef<HTMLElement>(null)

    useEffect(() => {
      const element = elementRef.current
      if (!element) return

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              callback()
              observer.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.1, ...options }
      )

      observer.observe(element)

      return () => {
        if (element) {
          observer.unobserve(element)
        }
      }
    }, [callback, options])

    return elementRef
  }, [])

  // Memoized expensive computations
  const useMemoizedValue = useCallback(<T>(
    factory: () => T,
    deps: React.DependencyList,
    cacheKey?: string
  ): T => {
    const memoizedValue = useMemo(factory, deps)
    
    if (cacheKey) {
      setCachedData(cacheKey, memoizedValue)
    }
    
    return memoizedValue
  }, [setCachedData])

  // Optimized API calls with caching
  const useCachedApiCall = useCallback(<T>(
    key: string,
    apiCall: () => Promise<T>,
    ttl = 5 * 60 * 1000
  ) => {
    const [data, setData] = useState<T | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const fetchData = useCallback(async () => {
      // Check cache first
      const cached = getCachedData(key)
      if (cached) {
        setData(cached)
        return
      }

      setLoading(true)
      setError(null)
      performanceMetrics.apiCalls++

      try {
        const result = await apiCall()
        setData(result)
        setCachedData(key, result, ttl)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }, [key, apiCall, ttl, getCachedData, setCachedData])

    return { data, loading, error, refetch: fetchData }
  }, [getCachedData, setCachedData])

  // Performance monitoring
  const getMetrics = useCallback(() => ({
    ...performanceMetrics,
    cacheSize: cache.size,
    isOnline,
    isSlowConnection,
  }), [isOnline, isSlowConnection])

  return {
    // Cache management
    getCachedData,
    setCachedData,
    clearCache,
    
    // Performance utilities
    useDebounce,
    useThrottle,
    useLazyLoad,
    useMemoizedValue,
    useCachedApiCall,
    
    // Network status
    isOnline,
    isSlowConnection,
    
    // Metrics
    getMetrics,
  }
}

// Virtual scrolling hook for large lists
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan = 5
) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight)
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    )
    return { start: Math.max(0, start - overscan), end }
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length])

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
      style: {
        position: 'absolute' as const,
        top: (visibleRange.start + index) * itemHeight,
        height: itemHeight,
        width: '100%',
      },
    }))
  }, [items, visibleRange, itemHeight])

  const totalHeight = items.length * itemHeight

  return {
    visibleItems,
    totalHeight,
    scrollTop,
    setScrollTop,
  }
}

// Image optimization hook
export function useImageOptimization() {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  const preloadImage = useCallback((src: string) => {
    if (loadedImages.has(src) || failedImages.has(src)) return

    const img = new Image()
    img.onload = () => {
      setLoadedImages(prev => new Set(prev).add(src))
    }
    img.onerror = () => {
      setFailedImages(prev => new Set(prev).add(src))
    }
    img.src = src
  }, [loadedImages, failedImages])

  const isImageLoaded = useCallback((src: string) => {
    return loadedImages.has(src)
  }, [loadedImages])

  return {
    preloadImage,
    isImageLoaded,
    loadedImages,
    failedImages,
  }
}
