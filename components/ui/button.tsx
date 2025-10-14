import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  // tactile button look: textured background, subtle inner shadow, imperfect radius
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.08),0_4px_10px_rgba(0,0,0,0.08)] hover:bg-primary/90 [background-image:radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:12px_12px]",
        destructive:
          "bg-destructive text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.08),0_4px_10px_rgba(0,0,0,0.08)] hover:bg-destructive/90 focus-visible:ring-destructive/20",
        outline:
          "border border-[color:var(--border)] bg-secondary text-[color:var(--foreground)] shadow-[0_1px_0_rgba(0,0,0,0.06)] hover:bg-secondary/80",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.06)] hover:bg-secondary/80",
        ghost:
          "hover:bg-accent/30 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2 has-[>svg]:px-3",
        sm: "h-9 rounded-[10px] gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 rounded-[14px] px-6 has-[>svg]:px-4",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
