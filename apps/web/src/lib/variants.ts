import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-button font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80",
        ghost: "hover:bg-muted text-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-border bg-transparent hover:bg-muted",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export const badgeVariants = cva(
  "inline-flex items-center rounded-badge px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        success: "bg-success-bg text-success-foreground",
        warning: "bg-warning-bg text-warning-foreground",
        info: "bg-info-bg text-info-foreground",
        destructive: "bg-destructive/15 text-destructive",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export const inputVariants = cva(
  "flex w-full rounded-input border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  { variants: {}, defaultVariants: {} }
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
export type BadgeVariants = VariantProps<typeof badgeVariants>;
export type InputVariants = VariantProps<typeof inputVariants>;
