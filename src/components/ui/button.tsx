import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary Button - High contrast in dark mode
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 shadow-lg hover:shadow-xl dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 dark:shadow-primary/20",
        // Destructive/Danger Button - High contrast in dark mode
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80 shadow-lg dark:bg-destructive dark:text-destructive-foreground dark:hover:bg-destructive/90 dark:shadow-destructive/30",
        // Outline/Secondary Button - High contrast border in dark mode
        outline: "border-2 border-primary bg-transparent text-primary hover:bg-primary/10 hover:border-primary/80 active:bg-primary/20 dark:border-primary dark:text-primary dark:hover:bg-primary/20 dark:hover:border-primary",
        // Secondary Button - High contrast in dark mode
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 active:bg-secondary/80 shadow-lg dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/90 dark:shadow-secondary/20",
        // Ghost Button - High contrast hover in dark mode
        ghost: "bg-transparent text-foreground hover:bg-muted/50 active:bg-muted dark:hover:bg-muted dark:text-foreground dark:active:bg-muted/80",
        // Link Button
        link: "text-primary underline-offset-4 hover:underline",
        // Hero Gradient Button
        hero: "bg-gradient-to-r from-primary to-accent text-white hover:shadow-anaqati-gold transition-all duration-300 font-semibold",
        // Luxury Button - ذهبي
        luxury: "bg-accent text-white shadow-anaqati-gold hover:bg-[hsl(43,54%,45%)] hover:scale-[1.02] transition-all duration-300 font-bold",
        // Premium Button
        premium: "bg-gradient-to-r from-primary via-accent to-primary text-white shadow-soft hover:shadow-anaqati-gold hover:-translate-y-0.5 transition-all duration-300 font-semibold",
        // Persian Button
        persian: "bg-gradient-to-r from-primary to-secondary text-white shadow-anaqati-pink hover:scale-[1.02] transition-all duration-300 font-bold",
        // Commerce Button
        commerce: "bg-primary text-white shadow-elegant hover:bg-[hsl(310,38%,30%)] hover:-translate-y-0.5 transition-all duration-300 font-semibold",
        // Glass Button
        glass: "bg-white/80 backdrop-blur-md border border-border text-foreground shadow-soft hover:bg-white/90 transition-all duration-300",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-lg px-4",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
