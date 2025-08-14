import { ReactNode } from 'react'

interface ChartTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  formatter?: (value: any, name: string, props: any) => [string, string]
  children?: ReactNode
}

export const ChartTooltip = ({ 
  active, 
  payload, 
  label, 
  formatter,
  children 
}: ChartTooltipProps) => {
  if (!active || !payload || !payload.length) {
    return null
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <div className="text-sm font-medium text-gray-900 mb-2">{label}</div>
      {payload.map((entry, index) => {
        const [value, name] = formatter 
          ? formatter(entry.value, entry.name, entry.payload)
          : [entry.value, entry.name]
        
        return (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color || '#6B7280' }}
            />
            <span className="text-sm text-gray-600">{name}:</span>
            <span className="text-sm font-medium text-gray-900">{value}</span>
          </div>
        )
      })}
      {children}
    </div>
  )
}
