"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Search, 
  Save, 
  Bookmark, 
  Filter, 
  X, 
  Trash2, 
  Eye,
  Clock,
  Star,
  Plus
} from 'lucide-react'
import { CashCall, Affiliate, User } from '@/lib/firebase-database'

export interface SearchFilter {
  id?: string
  name: string
  search: string
  status: string
  affiliate: string
  approver: string
  dateFrom: string
  dateTo: string
  amountMin: string
  amountMax: string
  created_at?: Date
  isDefault?: boolean
}

interface AdvancedSearchProps {
  filters: SearchFilter
  onFiltersChange: (filters: SearchFilter) => void
  affiliates: Affiliate[]
  users: User[]
  cashCalls: CashCall[]
}

export function AdvancedSearch({ 
  filters, 
  onFiltersChange, 
  affiliates, 
  users, 
  cashCalls 
}: AdvancedSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [savedSearches, setSavedSearches] = useState<SearchFilter[]>([])
  const [showSavedSearches, setShowSavedSearches] = useState(false)
  const [currentSearchName, setCurrentSearchName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Load saved searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('saved-searches')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSavedSearches(parsed.map((search: any) => ({
          ...search,
          created_at: new Date(search.created_at)
        })))
      } catch (error) {
        console.error('Failed to load saved searches:', error)
      }
    }
  }, [])

  // Save searches to localStorage
  const saveSearchesToStorage = (searches: SearchFilter[]) => {
    localStorage.setItem('saved-searches', JSON.stringify(searches))
  }

  const handleSaveSearch = () => {
    if (!currentSearchName.trim()) return

    setIsSaving(true)
    
    const newSearch: SearchFilter = {
      ...filters,
      id: Date.now().toString(),
      name: currentSearchName,
      created_at: new Date()
    }

    const updatedSearches = [newSearch, ...savedSearches]
    setSavedSearches(updatedSearches)
    saveSearchesToStorage(updatedSearches)
    
    setCurrentSearchName('')
    setIsSaving(false)
    setIsOpen(false)
  }

  const handleLoadSearch = (search: SearchFilter) => {
    onFiltersChange(search)
    setIsOpen(false)
  }

  const handleDeleteSearch = (searchId: string) => {
    const updatedSearches = savedSearches.filter(s => s.id !== searchId)
    setSavedSearches(updatedSearches)
    saveSearchesToStorage(updatedSearches)
  }

  const handleClearFilters = () => {
    const defaultFilters: SearchFilter = {
      name: '',
      search: '',
      status: 'all',
      affiliate: 'all',
      approver: 'all',
      dateFrom: '',
      dateTo: '',
      amountMin: '',
      amountMax: ''
    }
    onFiltersChange(defaultFilters)
  }

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(
      (value, index) => value !== "" && (index === 0 || value !== "all")
    ).length
  }

  const getSearchResultsCount = () => {
    let filtered = [...cashCalls]

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        (call) =>
          call.call_number.toLowerCase().includes(searchLower) ||
          call.title?.toLowerCase().includes(searchLower) ||
          call.description?.toLowerCase().includes(searchLower) ||
          affiliates.find((aff) => aff.id === call.affiliate_id)?.name.toLowerCase().includes(searchLower)
      )
    }

    if (filters.status !== "all") {
      filtered = filtered.filter((call) => call.status === filters.status)
    }

    if (filters.affiliate !== "all") {
      filtered = filtered.filter((call) => call.affiliate_id === filters.affiliate)
    }

    if (filters.approver !== "all") {
      filtered = filtered.filter((call) => call.approved_by === filters.approver)
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      filtered = filtered.filter((call) => new Date(call.created_at) >= fromDate)
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter((call) => new Date(call.created_at) <= toDate)
    }

    if (filters.amountMin) {
      const minAmount = Number.parseFloat(filters.amountMin)
      if (!isNaN(minAmount)) {
        filtered = filtered.filter((call) => call.amount_requested >= minAmount)
      }
    }

    if (filters.amountMax) {
      const maxAmount = Number.parseFloat(filters.amountMax)
      if (!isNaN(maxAmount)) {
        filtered = filtered.filter((call) => call.amount_requested <= maxAmount)
      }
    }

    return filtered.length
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by affiliate, ID, or description..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#00A3E0] focus:ring-[#00A3E0]"
          />
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10 bg-transparent relative"
            >
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
              {getActiveFiltersCount() > 0 && (
                <Badge className="ml-2 bg-[#0033A0] text-white text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl aramco-card-bg">
            <DialogHeader>
              <DialogTitle className="text-white">Advanced Search & Filters</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Search Results Preview */}
              <Card className="bg-white/10 border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm">Search Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-sm">
                      {getSearchResultsCount()} of {cashCalls.length} cash calls found
                    </span>
                    {getActiveFiltersCount() > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleClearFilters}
                        className="text-xs border-white/30 text-white/80 hover:bg-white/10"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear All
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Filter Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
                  >
                    <SelectTrigger className="enhanced-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white">Affiliate</Label>
                  <Select
                    value={filters.affiliate}
                    onValueChange={(value) => onFiltersChange({ ...filters, affiliate: value })}
                  >
                    <SelectTrigger className="enhanced-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300">
                      <SelectItem value="all">All Affiliates</SelectItem>
                      {affiliates.map((affiliate) => (
                        <SelectItem key={affiliate.id} value={affiliate.id}>
                          {affiliate.name} ({affiliate.company_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white">Approver</Label>
                  <Select
                    value={filters.approver}
                    onValueChange={(value) => onFiltersChange({ ...filters, approver: value })}
                  >
                    <SelectTrigger className="enhanced-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300">
                      <SelectItem value="all">All Approvers</SelectItem>
                      {users
                        .filter((u) => u.role !== "viewer")
                        .map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name || user.email}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white">Date From</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
                    className="enhanced-input"
                  />
                </div>

                <div>
                  <Label className="text-white">Date To</Label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
                    className="enhanced-input"
                  />
                </div>

                <div>
                  <Label className="text-white">Min Amount ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={filters.amountMin}
                    onChange={(e) => onFiltersChange({ ...filters, amountMin: e.target.value })}
                    placeholder="0.00"
                    className="enhanced-input"
                  />
                </div>

                <div>
                  <Label className="text-white">Max Amount ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={filters.amountMax}
                    onChange={(e) => onFiltersChange({ ...filters, amountMax: e.target.value })}
                    placeholder="999999.99"
                    className="enhanced-input"
                  />
                </div>
              </div>

              {/* Save Search */}
              <Card className="bg-white/10 border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm">Save This Search</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter search name..."
                      value={currentSearchName}
                      onChange={(e) => setCurrentSearchName(e.target.value)}
                      className="flex-1 enhanced-input"
                    />
                    <Button
                      onClick={handleSaveSearch}
                      disabled={!currentSearchName.trim() || isSaving}
                      className="bg-[#0033A0] hover:bg-[#0033A0]/90 text-white"
                    >
                      {isSaving ? 'Saving...' : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Saved Searches */}
              {savedSearches.length > 0 && (
                <Card className="bg-white/10 border-white/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Saved Searches</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {savedSearches.map((search) => (
                        <div
                          key={search.id}
                          className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <Bookmark className="h-4 w-4 text-[#00A3E0]" />
                            <div>
                              <div className="text-white text-sm font-medium">{search.name}</div>
                              <div className="text-white/60 text-xs">
                                {search.created_at?.toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleLoadSearch(search)}
                              className="text-white/80 hover:text-white hover:bg-white/10"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteSearch(search.id!)}
                              className="text-white/80 hover:text-white hover:bg-white/10"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setIsOpen(false)} className="aramco-button-primary text-white">
                Apply Filters
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
