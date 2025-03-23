import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "../../lib/utils"

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
    borderColor?: string;
    pulseEffect?: boolean;
    glowEffect?: boolean;
    size?: AvatarSize;
  }
>(({ className, borderColor, pulseEffect = false, glowEffect = false, size = "md", ...props }, ref) => {
  const sizeClasses: Record<AvatarSize, string> = {
    xs: "h-6 w-6",
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  }

  const validSize: AvatarSize = (size in sizeClasses) ? (size as AvatarSize) : "md";

  return (
    <div className={cn("relative inline-flex", {
      "animate-pulse": pulseEffect,
      "shadow-glow": glowEffect,
    })}>
      {borderColor && (
        <div className={cn(
          "absolute inset-0 rounded-full",
          borderColor || "bg-gradient-to-r from-blue-500 to-violet-500",
          sizeClasses[validSize]
        )} style={{padding: "2px"}} />
      )}
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full",
          sizeClasses[validSize],
          borderColor ? "border-2 border-background" : "",
          className
        )}
        {...props}
      />
    </div>
  )
})
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> & {
    hoverEffect?: "zoom" | "rotate" | "none";
  }
>(({ className, hoverEffect = "none", ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn(
      "aspect-square h-full w-full transition-all duration-300",
      {
        "hover:scale-110": hoverEffect === "zoom",
        "hover:rotate-6": hoverEffect === "rotate",
      },
      className
    )}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & {
    gradient?: boolean;
  }
>(({ className, gradient = false, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full",
      gradient 
        ? "bg-gradient-to-r from-blue-500 to-violet-500 text-white" 
        : "bg-muted text-muted-foreground",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

type AvatarSpacing = "tight" | "normal" | "loose";

const AvatarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    limit?: number;
    spacing?: AvatarSpacing;
  }
>(({ className, children, limit, spacing = "normal", ...props }, ref) => {
  const childrenArray = React.Children.toArray(children);
  const limitedChildren = limit && childrenArray.length > limit
    ? childrenArray.slice(0, limit)
    : childrenArray;
  
  const remainingCount = limit && childrenArray.length > limit
    ? childrenArray.length - limit
    : 0;

  const spacingClasses: Record<AvatarSpacing, string> = {
    tight: "-ml-2",
    normal: "-ml-3",
    loose: "-ml-4"
  }

  const validSpacing: AvatarSpacing = (spacing in spacingClasses) 
    ? (spacing as AvatarSpacing) 
    : "normal";

  return (
    <div
      ref={ref}
      className={cn("flex items-center", className)}
      {...props}
    >
      {limitedChildren.map((child, index) => (
        <div 
          key={index} 
          className={cn(
            index !== 0 ? spacingClasses[validSpacing] : "",
            "relative transition-all duration-300 hover:translate-y-1 border-2 border-background rounded-full"
          )}
        >
          {child}
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div 
          className={cn(
            spacingClasses[validSpacing],
            "relative border-2 border-background rounded-full flex-shrink-0 h-10 w-10 bg-muted flex items-center justify-center text-xs font-medium"
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
})
AvatarGroup.displayName = "AvatarGroup"

type StatusType = "online" | "offline" | "busy" | "away";
type StatusPosition = "top-right" | "top-left" | "bottom-right" | "bottom-left";

const AvatarStatus = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    status: StatusType;
    position?: StatusPosition;
  }
>(({ className, status, position = "bottom-right", ...props }, ref) => {
  const statusColors: Record<StatusType, string> = {
    online: "bg-green-500",
    offline: "bg-slate-500",
    busy: "bg-red-500",
    away: "bg-amber-500",
  }
  
  const positionClasses: Record<StatusPosition, string> = {
    "top-right": "top-0 right-0",
    "top-left": "top-0 left-0",
    "bottom-right": "bottom-0 right-0",
    "bottom-left": "bottom-0 left-0",
  }

  const validStatus: StatusType = (status in statusColors) 
    ? (status as StatusType) 
    : "offline";
    
  const validPosition: StatusPosition = (position in positionClasses) 
    ? (position as StatusPosition) 
    : "bottom-right";

  return (
    <div
      ref={ref}
      className={cn(
        "absolute h-3 w-3 rounded-full border-2 border-background",
        statusColors[validStatus],
        positionClasses[validPosition],
        validStatus === "online" && "animate-pulse",
        className
      )}
      {...props}
    />
  )
})
AvatarStatus.displayName = "AvatarStatus"

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarStatus } 