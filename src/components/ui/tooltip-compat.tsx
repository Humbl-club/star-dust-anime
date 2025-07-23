import * as React from "react"
import { Tooltip as FixedTooltip, TooltipTrigger, TooltipContent } from "./tooltip-fixed"

// Compatibility wrapper that works with existing Radix UI API
export const Tooltip = ({ children }: { children: React.ReactNode }) => {
  const [trigger, content] = React.Children.toArray(children)
  
  // Extract content text from TooltipContent
  let tooltipText = ""
  if (React.isValidElement(content) && content.type === TooltipContent) {
    const contentChildren = React.Children.toArray(content.props.children)
    tooltipText = contentChildren
      .map(child => {
        if (typeof child === 'string') return child
        if (React.isValidElement(child) && typeof child.props.children === 'string') {
          return child.props.children
        }
        return ''
      })
      .join('')
  }
  
  return (
    <FixedTooltip content={tooltipText}>
      {React.isValidElement(trigger) && trigger.type === TooltipTrigger 
        ? trigger.props.children 
        : trigger}
    </FixedTooltip>
  )
}

export { TooltipProvider, TooltipTrigger, TooltipContent } from "./tooltip-fixed"