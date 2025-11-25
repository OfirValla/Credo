import * as React from "react"

import { cn } from "@/lib/utils"

const gradients = [
  "bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500",
  "bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500",
  "bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500",
  "bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500",
  "bg-gradient-to-r from-fuchsia-500 via-purple-600 to-indigo-600",
  "bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500",
  "bg-gradient-to-r from-rose-400 via-pink-500 to-purple-500",
  "bg-gradient-to-r from-lime-400 via-green-500 to-emerald-600",
  "bg-gradient-to-r from-violet-400 via-purple-500 to-fuchsia-500",
  "bg-gradient-to-r from-sky-400 via-cyan-500 to-blue-600",
  "bg-gradient-to-r from-amber-400 via-orange-500 to-red-500",
  "bg-gradient-to-r from-teal-400 via-cyan-500 to-sky-500",
  "bg-gradient-to-r from-indigo-400 via-blue-500 to-cyan-500",
  "bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600",
  "bg-gradient-to-r from-red-400 via-rose-500 to-pink-500",
  "bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600",
  "bg-gradient-to-r from-purple-400 via-violet-500 to-indigo-600",
  "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500",
  "bg-gradient-to-r from-green-500 via-lime-500 to-yellow-500",
  "bg-gradient-to-r from-cyan-500 via-teal-500 to-green-600",
];

let availableGradients = [...gradients];

const getNextGradient = () => {
  if (availableGradients.length === 0) {
    availableGradients = [...gradients];
  }
  const randomIndex = Math.floor(Math.random() * availableGradients.length);
  const gradient = availableGradients[randomIndex];
  availableGradients.splice(randomIndex, 1);
  return gradient;
};

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { gradient?: boolean }
>(({ className, gradient, ...props }, ref) => {
  const [gradientClass] = React.useState(() => {
    if (!gradient) return "";
    return getNextGradient();
  });

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border-none bg-white/80 dark:bg-slate-900/80 text-card-foreground shadow-xl relative overflow-hidden backdrop-blur-xl",
        className
      )}
      {...props}
    >
      {gradient && (
        <div className={cn("absolute top-0 left-0 w-full h-2 rounded-t-xl", gradientClass)} />
      )}
      {props.children}
    </div>
  );
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 pt-0 sm:p-6 sm:pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-4 pt-0 sm:p-6 sm:pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
