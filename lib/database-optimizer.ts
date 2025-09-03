import { supabase } from './supabase'

// Query cache for frequently accessed data
const queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>()

// Batch operation queue
class BatchQueue {
  private queue: Array<{ operation: () => Promise<any>; resolve: (value: any) => void; reject: (error: any) => void }> = []
  private processing = false
  private batchSize = 10
  private batchDelay = 100 // ms

  async add<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ operation, resolve, reject })
      this.process()
    })
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return

    this.processing = true

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize)
      
      try {
        // Process batch in parallel
        const results = await Promise.allSettled(
          batch.map(item => item.operation())
        )

        // Resolve/reject each promise
        results.forEach((result, index) => {
          const { resolve, reject } = batch[index]
          if (result.status === 'fulfilled') {
            resolve(result.value)
          } else {
            reject(result.reason)
          }
        })

        // Add delay between batches to prevent overwhelming the database
        if (this.queue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, this.batchDelay))
        }
      } catch (error) {
        // Reject all remaining items in batch
        batch.forEach(item => item.reject(error))
      }
    }

    this.processing = false
  }
}

const batchQueue = new BatchQueue()

// Optimized database operations
export class DatabaseOptimizer {
  private static instance: DatabaseOptimizer
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  static getInstance(): DatabaseOptimizer {
    if (!DatabaseOptimizer.instance) {
      DatabaseOptimizer.instance = new DatabaseOptimizer()
    }
    return DatabaseOptimizer.instance
  }

  // Cached query execution
  async cachedQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl = 5 * 60 * 1000 // 5 minutes default
  ): Promise<T> {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }

    const data = await queryFn()
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })

    return data
  }

  // Batch multiple queries
  async batchQueries<T>(queries: Array<() => Promise<T>>): Promise<T[]> {
    return Promise.all(queries.map(query => batchQueue.add(query)))
  }

  // Optimized pagination with cursor-based pagination
  async paginatedQuery<T>(
    table: string,
    options: {
      page?: number
      limit?: number
      cursor?: string
      filters?: Record<string, any>
      orderBy?: { column: string; direction: 'asc' | 'desc' }
    } = {}
  ): Promise<{ data: T[]; nextCursor?: string; hasMore: boolean }> {
    const { page = 1, limit = 20, cursor, filters, orderBy } = options

    let query = supabase
      .from(table)
      .select('*', { count: 'exact' })

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })
    }

    // Apply cursor-based pagination
    if (cursor) {
      query = query.gt('id', cursor)
    }

    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.direction === 'asc' })
    }

    // Apply limit
    query = query.limit(limit + 1) // Get one extra to check if there are more

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    const hasMore = data && data.length > limit
    const result = data?.slice(0, limit) || []
    const nextCursor = hasMore ? data[limit - 1]?.id : undefined

    return {
      data: result as T[],
      nextCursor,
      hasMore,
    }
  }

  // Optimized bulk operations
  async bulkInsert<T>(table: string, records: T[]): Promise<T[]> {
    const batchSize = 1000 // Supabase limit
    const results: T[] = []

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      const { data, error } = await supabase
        .from(table)
        .insert(batch)
        .select()

      if (error) {
        throw error
      }

      results.push(...(data || []))
    }

    return results
  }

  async bulkUpdate<T>(
    table: string,
    records: Array<{ id: string; [key: string]: any }>
  ): Promise<T[]> {
    const results: T[] = []

    for (const record of records) {
      const { id, ...updateData } = record
      const { data, error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', id)
        .select()

      if (error) {
        throw error
      }

      if (data && data.length > 0) {
        results.push(data[0] as T)
      }
    }

    return results
  }

  async bulkDelete(table: string, ids: string[]): Promise<void> {
    const batchSize = 1000
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize)
      const { error } = await supabase
        .from(table)
        .delete()
        .in('id', batch)

      if (error) {
        throw error
      }
    }
  }

  // Cache management
  clearCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern)
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }

  // Optimized search with full-text search
  async fullTextSearch<T>(
    table: string,
    searchTerm: string,
    columns: string[],
    options: {
      limit?: number
      filters?: Record<string, any>
    } = {}
  ): Promise<T[]> {
    const { limit = 20, filters } = options

    let query = supabase
      .from(table)
      .select('*')

    // Build full-text search query
    const searchConditions = columns.map(column => `${column}.ilike.%${searchTerm}%`)
    query = query.or(searchConditions.join(','))

    // Apply additional filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })
    }

    // Apply limit
    query = query.limit(limit)

    const { data, error } = await query

    if (error) {
      throw error
    }

    return data as T[]
  }

  // Optimized aggregation queries
  async aggregateQuery<T>(
    table: string,
    aggregation: {
      function: 'count' | 'sum' | 'avg' | 'min' | 'max'
      column: string
    },
    filters?: Record<string, any>
  ): Promise<T> {
    let query = supabase
      .from(table)
      .select(`${aggregation.function}(${aggregation.column})`)

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return data?.[0]?.[`${aggregation.function}`] as T
  }

  // Optimized relationship queries with joins
  async queryWithRelations<T>(
    table: string,
    relations: string[],
    options: {
      filters?: Record<string, any>
      orderBy?: { column: string; direction: 'asc' | 'desc' }
      limit?: number
    } = {}
  ): Promise<T[]> {
    const { filters, orderBy, limit } = options

    let query = supabase
      .from(table)
      .select(`*, ${relations.join(', ')}`)

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })
    }

    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.direction === 'asc' })
    }

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return data as T[]
  }
}

// Export singleton instance
export const dbOptimizer = DatabaseOptimizer.getInstance()

// Utility functions for common operations
export const optimizedQueries = {
  // Get cash calls with caching
  async getCashCalls(userId: string, filters?: any) {
    const cacheKey = `cash_calls_${userId}_${JSON.stringify(filters)}`
    return dbOptimizer.cachedQuery(cacheKey, async () => {
      // Your existing getCashCalls logic here
      return []
    })
  },

  // Get affiliates with caching
  async getAffiliates() {
    return dbOptimizer.cachedQuery('affiliates', async () => {
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .order('name')

      if (error) throw error
      return data || []
    })
  },

  // Get users with caching
  async getUsers() {
    return dbOptimizer.cachedQuery('users', async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('full_name')

      if (error) throw error
      return data || []
    })
  },

  // Batch operations
  async batchGetData() {
    return dbOptimizer.batchQueries([
      () => optimizedQueries.getAffiliates(),
      () => optimizedQueries.getUsers(),
    ])
  },
}
