import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  growth: number
  icon: React.ReactNode
  iconBgColor: string
}

export function StatsCard({ title, value, growth, icon, iconBgColor }: StatsCardProps) {
  const isPositive = growth > 0
  const isNegative = growth < 0

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium opacity-80">{title}</p>
            <p className="text-2xl font-bold mt-2 font-[var(--font-serif)]">{value}</p>
            <div className="flex items-center mt-2 text-sm">
              {isPositive && (
                <>
                  <TrendingUp className="h-4 w-4 mr-1" style={{ color: "#7A8768" }} />
                  <span style={{ color: "#7A8768" }}>+{growth}%</span>
                </>
              )}
              {isNegative && (
                <>
                  <TrendingDown className="h-4 w-4 mr-1" style={{ color: "#C86A43" }} />
                  <span style={{ color: "#C86A43" }}>{growth}%</span>
                </>
              )}
              {growth === 0 && <span className="text-gray-500">0%</span>}
              <span className="text-muted-foreground ml-1">vs kemarin</span>
            </div>
          </div>
          <div className={cn("p-3 rounded-full sketch-icon", iconBgColor)}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
