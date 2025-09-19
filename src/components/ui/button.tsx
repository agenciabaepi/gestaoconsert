import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "tabs";
  size?: "default" | "sm" | "lg" | "icon";
}

const buttonVariants = {
  default: "bg-black text-white hover:bg-neutral-800",
  destructive: "bg-red-500 text-white hover:bg-red-600",
  outline: "border border-input hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "underline-offset-4 hover:underline text-primary",
  tabs: "bg-muted text-black data-[state=active]:bg-[#cffb6d] data-[state=active]:text-black data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-black",
};

const sizeVariants = {
  default: "h-10 px-4 py-2",
  sm: "h-9 px-3 rounded-md",
  lg: "h-11 px-8 rounded-md",
  icon: "h-10 w-10",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
          buttonVariants[variant],
          sizeVariants[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
