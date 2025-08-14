import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Filter, CheckSquare, Plus, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

interface QuickActionsProps {
  onFilterClick: () => void
  onNewCashCallClick: () => void
  onRefresh: () => void
  isRefreshing?: boolean
}

export const QuickActions = ({ 
  onFilterClick, 
  onNewCashCallClick, 
  onRefresh, 
  isRefreshing = false 
}: QuickActionsProps) => {
  const router = useRouter()

  return (
    <Card className="aramco-card-bg mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#0033A0]">Quick Actions:</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onFilterClick}
            className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter (Ctrl+F)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/checklist')}
            className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10"
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            Checklists
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNewCashCallClick}
            className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Cash Call (Ctrl+N)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh (Ctrl+R)
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
