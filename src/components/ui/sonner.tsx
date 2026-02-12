import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-[0_8px_40px_rgba(90,38,71,0.1)] group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg",
          cancelButton:
            "group-[.toast]:bg-secondary group-[.toast]:text-foreground group-[.toast]:rounded-lg",
          success: "group-[.toaster]:border-l-4 group-[.toaster]:border-l-green-500",
          error: "group-[.toaster]:border-l-4 group-[.toaster]:border-l-destructive",
          warning: "group-[.toaster]:border-l-4 group-[.toaster]:border-l-accent",
          info: "group-[.toaster]:border-l-4 group-[.toaster]:border-l-primary",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
