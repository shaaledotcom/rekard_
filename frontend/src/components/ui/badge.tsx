import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow",
        outline: "text-foreground",
        // Primitive color variants
        red: "border-transparent bg-red-500 text-white shadow-lg shadow-red-500/25",
        yellow: "border-transparent bg-yellow-500 text-black shadow-lg shadow-yellow-500/25",
        blue: "border-transparent bg-blue-500 text-white shadow-lg shadow-blue-500/25",
        // Status variants with primitive colors
        draft: "border-yellow-500/30 bg-yellow-500/10 text-yellow-500",
        published: "border-blue-500/30 bg-blue-500/10 text-blue-500",
        live: "border-red-500/30 bg-red-500/10 text-red-500 animate-pulse",
        completed: "border-green-500/30 bg-green-500/10 text-green-500",
        cancelled: "border-gray-500/30 bg-gray-500/10 text-gray-500",
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

