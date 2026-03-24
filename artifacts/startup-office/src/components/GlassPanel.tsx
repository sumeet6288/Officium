import * as React from "react"
import { cn } from "@/lib/utils"

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {}

export const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-background/60 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 rounded-2xl",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
GlassPanel.displayName = "GlassPanel"
