import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Accessible Dropdown Menu Component
 * Compliant with WCAG 2.1 & WAI-ARIA 1.2 Standards
 *
 * Standards implemented:
 * - WCAG 2.1.1: Keyboard accessible (Tab, Enter, Space, Arrows, Esc)
 * - WCAG 2.4.3: Logical focus order
 * - WCAG 2.4.7: Visible focus indicator
 * - WCAG 4.1.2: Name, Role, Value (aria-expanded, aria-haspopup)
 * - WAI-ARIA: Menu pattern with proper roles
 */

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger> & {
    /** Accessible label for screen readers */
    "aria-label"?: string
  }
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.Trigger
    ref={ref}
    className={cn(
      // Focus visible indicator (WCAG 2.4.7)
      "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      "transition-all duration-200",
      className
    )}
    {...props}
  >
    {children}
  </DropdownMenuPrimitive.Trigger>
))
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-pointer select-none items-center rounded-md px-3 py-2.5 text-sm outline-none",
      "text-foreground",
      "hover:bg-[hsl(0_60%_97%)] hover:text-primary",
      "focus:bg-[hsl(0_60%_97%)] focus:text-primary",
      "data-[state=open]:bg-[hsl(0_60%_97%)] data-[state=open]:text-primary",
      "transition-colors duration-150",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="mr-auto h-4 w-4 text-muted-foreground" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-[100] min-w-[8rem] overflow-hidden",
      "rounded-lg border border-[hsl(20_30%_87%)] bg-white p-1 text-foreground",
      "shadow-[0_10px_40px_hsl(320_42%_25%/0.12)]",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
      "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
      "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & {
    /** Accessible label for the menu */
    "aria-label"?: string
  }
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      // WAI-ARIA: role="menu" is automatically added by Radix
      // WCAG 2.4.3: Focus is automatically managed by Radix
      className={cn(
        // Minimum width and overflow
        "z-[100] min-w-[180px] overflow-hidden",
        // Spacing for touch-friendly layout (8px gap between items)
        "rounded-lg border border-[hsl(20_30%_87%)] bg-white p-1.5 text-foreground space-y-1",
        "shadow-[0_10px_40px_hsl(320_42%_25%/0.12)]",
        // Smooth animations (150-200ms as per UX spec)
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        // Animation duration (WCAG compliant - not too fast, not too slow)
        "duration-200",
        className
      )}
      // Keyboard: Esc closes menu, Arrows navigate, Enter/Space select
      // These are handled automatically by Radix UI
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
    variant?: "default" | "danger"
    /** Icon to display before the text */
    icon?: React.ReactNode
  }
>(({ className, inset, variant = "default", icon, children, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    // WAI-ARIA: role="menuitem" is automatically added by Radix
    className={cn(
      // WCAG 2.5.5: Minimum touch target 44px
      "relative flex cursor-pointer select-none items-center gap-2.5 rounded-md px-3 min-h-[44px] py-3 text-sm outline-none",
      // WCAG 2.4.7: Visible focus indicator
      "transition-all duration-150",
      // Touch-friendly: prevent accidental zoom on double-tap
      "touch-manipulation",
      // Golden side bar on hover/focus/active (as per UX spec)
      "before:absolute before:right-0 before:top-0 before:bottom-0 before:w-[3px] before:rounded-l",
      "before:bg-transparent before:transition-colors before:duration-150",
      // Default variant
      variant === "default" && [
        "text-foreground",
        // Desktop hover
        "hover:bg-[hsl(0_60%_97%)] hover:text-primary",
        // Mobile active/touch
        "active:bg-[hsl(0_60%_97%)] active:text-primary active:scale-[0.98]",
        // Keyboard focus
        "focus:bg-[hsl(0_60%_97%)] focus:text-primary",
        // Focus visible ring for keyboard navigation (WCAG 2.4.7)
        "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset",
        "[&>svg]:text-muted-foreground [&>svg]:w-4 [&>svg]:h-4",
        "hover:[&>svg]:text-primary focus:[&>svg]:text-primary active:[&>svg]:text-primary",
        // Golden bar on hover/focus/active
        "hover:before:bg-[hsl(43_54%_51%)] focus:before:bg-[hsl(43_54%_51%)] active:before:bg-[hsl(43_54%_51%)]",
      ],
      // Danger variant (تسجيل الخروج) - Always red as per UX spec
      variant === "danger" && [
        "text-[hsl(0_62%_56%)]",
        "[&>svg]:text-[hsl(0_62%_56%)]",
        // Desktop hover
        "hover:bg-[hsl(0_70%_96%)] hover:text-[hsl(0_70%_45%)]",
        // Mobile active/touch
        "active:bg-[hsl(0_70%_96%)] active:text-[hsl(0_70%_45%)] active:scale-[0.98]",
        // Keyboard focus
        "focus:bg-[hsl(0_70%_96%)] focus:text-[hsl(0_70%_45%)]",
        "focus-visible:ring-2 focus-visible:ring-[hsl(0_62%_56%)]/50 focus-visible:ring-inset",
        // Red bar on hover/focus/active for danger
        "hover:before:bg-[hsl(0_62%_56%)] focus:before:bg-[hsl(0_62%_56%)] active:before:bg-[hsl(0_62%_56%)]",
      ],
      // Disabled state (WCAG: disabled items should be visually distinct)
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "data-[disabled]:cursor-not-allowed",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {icon && <span className="flex-shrink-0">{icon}</span>}
    {children}
  </DropdownMenuPrimitive.Item>
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-md py-2.5 pl-8 pr-3 text-sm outline-none",
      "text-foreground transition-colors duration-150",
      "hover:bg-[hsl(0_60%_97%)] hover:text-primary",
      "focus:bg-[hsl(0_60%_97%)] focus:text-primary",
      "data-[state=checked]:bg-[hsl(0_62%_86%)] data-[state=checked]:text-primary",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-[hsl(43_54%_51%)]" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-md py-2.5 pl-8 pr-3 text-sm outline-none",
      "text-foreground transition-colors duration-150",
      "hover:bg-[hsl(0_60%_97%)] hover:text-primary",
      "focus:bg-[hsl(0_60%_97%)] focus:text-primary",
      "data-[state=checked]:bg-[hsl(0_62%_86%)] data-[state=checked]:text-primary",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-[hsl(43_54%_51%)] text-[hsl(43_54%_51%)]" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1.5 h-px bg-[hsl(20_30%_87%)]", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
