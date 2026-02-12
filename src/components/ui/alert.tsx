import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-xl border border-border p-4 transition-all duration-300 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground shadow-[0_4px_24px_rgba(90,38,71,0.06)]",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive bg-destructive/5",
        success: "border-status-online/50 text-status-online [&>svg]:text-status-online bg-status-online/5",
        warning: "border-premium/50 text-premium [&>svg]:text-premium bg-premium/5",
        info: "border-accent/50 text-accent-foreground [&>svg]:text-accent bg-accent/5",
        
        // Persian Heritage Variants
        luxury: "border-luxury/30 bg-gradient-luxury/10 text-luxury [&>svg]:text-luxury shadow-luxury",
        premium: "border-premium/30 bg-gradient-premium/10 text-premium [&>svg]:text-premium shadow-elegant",
        persian: "border-persian/30 bg-gradient-persian/10 text-persian [&>svg]:text-persian shadow-persian",
        
        // Glass Effect
        glass: "border-white/20 bg-white/5 backdrop-blur-md text-foreground [&>svg]:text-foreground shadow-glass",
      },
      size: {
        default: "p-4",
        sm: "p-3 text-sm",
        lg: "p-6",
        xl: "p-8 text-lg",
      },
      animation: {
        none: "",
        fade: "animate-fade-in",
        bounce: "animate-bounce-in", 
        slide: "animate-slide-in-up",
        glow: "animate-pulse-glow",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "fade",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants> & {
    closeable?: boolean
    onClose?: () => void
  }
>(({ className, variant, size, animation, closeable, onClose, children, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant, size, animation }), className)}
    {...props}
  >
    {children}
    {closeable && (
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )}
  </div>
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
