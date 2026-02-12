import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "border-border text-foreground hover:bg-secondary/50",
        
        // Anaqti Variants
        luxury: "border-transparent bg-accent text-accent-foreground shadow-[0_4px_20px_rgba(200,155,60,0.2)]",
        premium: "border-transparent bg-primary text-primary-foreground shadow-[0_4px_24px_rgba(90,38,71,0.15)]",
        persian: "border-transparent bg-primary text-primary-foreground",
        heritage: "border-primary/20 bg-primary/10 text-primary",
        
        // Status Variants
        success: "border-transparent bg-success text-white",
        warning: "border-transparent bg-warning text-white",
        error: "border-transparent bg-destructive text-destructive-foreground",
        info: "border-transparent bg-info text-foreground",
        
        // Style Variants
        glass: "border-border/20 bg-card/50 backdrop-blur-sm text-foreground",
        gradient: "border-transparent bg-gradient-to-r from-primary to-accent text-white",
        glow: "border-transparent bg-primary text-primary-foreground shadow-[0_0_20px_rgba(90,38,71,0.3)]",
        
        // Size-specific variants
        dot: "h-2 w-2 p-0 rounded-full",
        pill: "rounded-full px-3 py-1",
        square: "rounded-md aspect-square p-1",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs rounded-md",
        lg: "px-3 py-1 text-sm rounded-lg", 
        xl: "px-4 py-2 text-base rounded-xl font-bold",
      },
      animation: {
        none: "",
        bounce: "hover:scale-105",
        glow: "animate-pulse",
        float: "hover:-translate-y-0.5 transition-transform",
        shimmer: "",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode
  closeable?: boolean
  onClose?: () => void
}

function Badge({ className, variant, size, animation, icon, closeable, onClose, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size, animation }), className)} {...props}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
      {closeable && (
        <button
          onClick={onClose}
          className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
        >
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

export { Badge, badgeVariants }
