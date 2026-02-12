import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Accessible Select Component
 * Compliant with WCAG 2.1 & WAI-ARIA 1.2 Standards
 *
 * Standards implemented:
 * - WCAG 2.1.1: Keyboard accessible (Tab, Enter, Space, Arrows, Esc)
 * - WCAG 2.4.3: Logical focus order
 * - WCAG 2.4.7: Visible focus indicator
 * - WCAG 4.1.2: Name, Role, Value (aria-expanded, aria-haspopup, aria-labelledby)
 * - WCAG 1.4.13: Content on Hover or Focus (dismissible, hoverable, persistent)
 * - WAI-ARIA: Listbox pattern with proper roles
 *
 * Keyboard Support:
 * - Space/Enter: Open dropdown, select focused option
 * - Arrow Up/Down: Navigate options
 * - Home/End: Jump to first/last option
 * - Esc: Close dropdown
 * - Type-ahead: Jump to matching option
 */

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    /** Accessible label for screen readers */
    "aria-label"?: string
    /** ID of element that labels this select */
    "aria-labelledby"?: string
    /** Error state for form validation */
    "aria-invalid"?: boolean
    /** ID of error message element */
    "aria-errormessage"?: string
  }
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    // WAI-ARIA: aria-haspopup="listbox" and aria-expanded are auto-managed by Radix
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm text-foreground",
      "border-border placeholder:text-muted-foreground",
      // Hover state
      "hover:border-primary/50",
      // Focus state (WCAG 2.4.7: Visible focus indicator)
      "focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10",
      // Focus visible for keyboard users
      "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      // Open state
      "data-[state=open]:border-primary data-[state=open]:ring-[3px] data-[state=open]:ring-primary/10",
      // Disabled state (WCAG: visually distinct)
      "disabled:cursor-not-allowed disabled:opacity-50",
      // Error state for form validation
      "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/10",
      "[&>span]:line-clamp-1 transition-all duration-200",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown
        className={cn(
          "h-4 w-4 text-muted-foreground transition-transform duration-200",
          // Rotate arrow when open (as per UX spec)
          "data-[state=open]:rotate-180"
        )}
        aria-hidden="true"
      />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
    /** Accessible label for the listbox */
    "aria-label"?: string
  }
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      // WAI-ARIA: role="listbox" is automatically added by Radix
      // Focus management is handled automatically
      className={cn(
        "relative z-[100] max-h-96 min-w-[8rem] overflow-hidden",
        "rounded-lg border border-border bg-popover text-popover-foreground",
        "shadow-lg",
        // Smooth animations (150-200ms as per UX spec)
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        // Animation duration (WCAG compliant)
        "duration-200",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          // Spacing for touch-friendly layout (8px gap between items)
          "p-1.5 space-y-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
    /** Optional description text under the main label */
    description?: string
    /** Optional icon to display */
    icon?: React.ReactNode
  }
>(({ className, children, description, icon, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    // WAI-ARIA: role="option" is automatically added by Radix
    // aria-selected is managed automatically
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center",
      // WCAG 2.5.5: Minimum touch target 44px (min-h-11 = 44px)
      "rounded-md min-h-[44px] py-3 pl-8 pr-3 text-sm outline-none",
      "text-popover-foreground bg-popover",
      // Hover state - Desktop (pink background, maroon text as per UX spec)
      "hover:bg-[hsl(0_60%_97%)] hover:text-primary",
      // Active state - Mobile touch (same as hover for consistency)
      "active:bg-[hsl(0_60%_97%)] active:text-primary active:scale-[0.98]",
      // Focus state (same as hover for consistency)
      "focus:bg-[hsl(0_60%_97%)] focus:text-primary",
      // Focus visible ring for keyboard navigation (WCAG 2.4.7)
      "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset",
      // Selected/checked state
      "data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary data-[state=checked]:font-medium",
      // Disabled state (WCAG: disabled items should be visually distinct)
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed",
      "transition-all duration-150",
      // Touch-friendly: prevent accidental zoom on double-tap
      "touch-manipulation",
      // Golden side bar on hover/focus/active (as per UX spec)
      "before:absolute before:right-0 before:top-0 before:bottom-0 before:w-[3px] before:rounded-l",
      "before:bg-transparent before:transition-colors before:duration-150",
      "hover:before:bg-[hsl(43_54%_51%)] focus:before:bg-[hsl(43_54%_51%)] active:before:bg-[hsl(43_54%_51%)]",
      // Selected item keeps the golden bar
      "data-[state=checked]:before:bg-[hsl(43_54%_51%)]",
      className
    )}
    {...props}
  >
    {/* Check mark indicator */}
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-[hsl(43_54%_51%)]" aria-hidden="true" />
      </SelectPrimitive.ItemIndicator>
    </span>

    {/* Optional icon */}
    {icon && (
      <span className="mr-2 flex-shrink-0" aria-hidden="true">
        {icon}
      </span>
    )}

    {/* Content with optional description */}
    <div className="flex flex-col">
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      {description && (
        <span className="text-xs text-muted-foreground mt-0.5">
          {description}
        </span>
      )}
    </div>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
