"use client"

import { cn } from "@/lib/utils"
import { ButtonHTMLAttributes, forwardRef } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost"
  size?: "sm" | "md" | "lg"
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer text-sm",
          {
            "bg-accent text-white hover:bg-accent-hover shadow-md shadow-accent/25 hover:shadow-lg hover:shadow-accent/30": variant === "primary",
            "bg-bg-card text-text-primary border border-border hover:bg-bg-hover hover:border-border-hover": variant === "secondary",
            "bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20": variant === "danger",
            "text-text-secondary hover:text-text-primary hover:bg-bg-hover": variant === "ghost",
          },
          {
            "h-8 px-3 text-xs": size === "sm",
            "h-9 px-4": size === "md",
            "h-10 px-5": size === "lg",
          },
          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"
