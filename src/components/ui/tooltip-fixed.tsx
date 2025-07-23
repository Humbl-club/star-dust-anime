import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProviderProps {
  children: React.ReactNode
  delayDuration?: number
}

const TooltipProvider = ({ children }: TooltipProviderProps) => {
  return <>{children}</>
}

interface TooltipProps {
  children: React.ReactNode
  content?: string
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
}

const Tooltip = ({ children, content }: TooltipProps) => {
  const [isVisible, setIsVisible] = React.useState(false)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const tooltipRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLDivElement>(null)

  const showTooltip = (e: React.MouseEvent) => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 8
    })
    setIsVisible(true)
  }

  const hideTooltip = () => {
    setIsVisible(false)
  }

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children}
      </div>
      {content && isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            "fixed z-50 px-3 py-1.5 text-sm text-popover-foreground",
            "bg-popover rounded-md shadow-md border animate-in fade-in-0 zoom-in-95",
            "pointer-events-none"
          )}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          {content}
        </div>
      )}
    </div>
  )
}

const TooltipTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ className, asChild, children, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      ...children.props,
      ref,
      className: cn(className, children.props.className)
    })
  }
  
  return (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  )
})
TooltipTrigger.displayName = "TooltipTrigger"

interface TooltipContentProps {
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  hidden?: boolean
}

const TooltipContent = ({ children, side, align, hidden }: TooltipContentProps) => {
  // Content is handled by the Tooltip component
  return null
}

export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
}