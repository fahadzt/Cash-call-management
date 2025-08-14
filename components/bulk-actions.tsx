import { Button } from "@/components/ui/button"

interface BulkActionsProps {
  selectedCount: number
  onApprove: () => void
  onReject: () => void
  onClearSelection: () => void
}

export const BulkActions = ({ 
  selectedCount, 
  onApprove, 
  onReject, 
  onClearSelection 
}: BulkActionsProps) => {
  if (selectedCount === 0) return null

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[#0033A0] font-medium">
        {selectedCount} selected
      </span>
      <Button
        size="sm"
        onClick={onApprove}
        className="bg-[#00843D] hover:bg-[#84BD00] text-white"
      >
        Approve Selected
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={onReject}
        className="border-red-500 text-red-500 hover:bg-red-500/10"
      >
        Reject Selected
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={onClearSelection}
        className="border-gray-400 text-gray-600"
      >
        Clear Selection
      </Button>
    </div>
  )
}
