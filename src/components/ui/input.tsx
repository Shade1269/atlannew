import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-xl border bg-card text-foreground text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-border hover:border-primary/50 focus-visible:border-primary",
        luxury: "border-accent/30 bg-accent/5 focus-visible:ring-accent focus-visible:border-accent",
        premium: "border-primary/20 bg-primary/5 focus-visible:ring-primary focus-visible:border-primary",
        success: "border-success/50 bg-success/5 focus-visible:ring-success",
        error: "border-destructive/50 bg-destructive/5 focus-visible:ring-destructive",
        warning: "border-warning/50 bg-warning/5 focus-visible:ring-warning",
        glass: "border-border/20 bg-card/50 backdrop-blur-sm",
      },
      size: {
        default: "h-10 px-3 py-2 md:text-sm",
        sm: "h-8 px-2 py-1 text-xs rounded-lg",
        lg: "h-12 px-4 py-3 text-base rounded-xl",
        xl: "h-14 px-6 py-4 text-lg rounded-xl",
      },
      state: {
        default: "",
        focused: "ring-2 ring-primary ring-offset-2",
        invalid: "border-destructive focus-visible:ring-destructive",
        valid: "border-success focus-visible:ring-success",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      state: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  loading?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, size, state, leftIcon, rightIcon, loading, ...props }, ref) => {
    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </div>
        )}
        
        <input
          type={type}
          className={cn(
            inputVariants({ variant, size, state }),
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            className
          )}
          ref={ref}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            ) : (
              rightIcon
            )}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
