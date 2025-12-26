import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-foreground/80 text-background",
        outline: "text-foreground border-border",
        // Status variants - all black and white
        draft: "border-border bg-secondary text-foreground",
        published: "border-border bg-foreground text-background",
        live: "border-border bg-foreground text-background",
        completed: "border-border bg-secondary text-foreground",
        cancelled: "border-border bg-muted text-muted-foreground",
        // Ticket-specific status variants
        sold_out: "border-border bg-secondary text-foreground",
        archived: "border-border bg-muted text-muted-foreground",
        // Generic color variants mapped to black/white
        red: "border-transparent bg-foreground text-background",
        yellow: "border-transparent bg-secondary text-foreground",
        blue: "border-transparent bg-foreground text-background",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

