export default function ChecklistLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header Skeleton */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
            <div className="w-48 h-10 bg-gray-200 rounded animate-pulse" />
            <div>
              <div className="w-64 h-8 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="w-48 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
            <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="w-12 h-8 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Main Content Skeleton */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="w-48 h-6 bg-gray-200 rounded animate-pulse" />
              <div className="w-32 h-8 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="p-6">
            {/* Tabs Skeleton */}
            <div className="flex gap-2 mb-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-32 h-10 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>

            {/* Table Skeleton */}
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border border-gray-200 rounded">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="w-8 h-6 bg-gray-200 rounded animate-pulse" />
                  <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="w-20 h-6 bg-gray-200 rounded animate-pulse" />
                  <div className="w-16 h-6 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
