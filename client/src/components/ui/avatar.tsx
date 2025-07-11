"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    />
  )
}

const ProfileAvatar = ({
  src,
  name,
  className,
  fallbackClassName,
  style,
}: {
  src: string | undefined
  name: string
  className?: string
  fallbackClassName?: string
  style?: React.CSSProperties
}) => {
  const words = name.split(" ")

  const firstInitial = words[0] ? words[0][0].toUpperCase() : ""
  const secondInitial = words[1] ? words[1][0].toUpperCase() : ""

  return <Avatar className={className} style={style} title={name}>
    <AvatarImage src={src} alt={name} className="object-cover" />
    <AvatarFallback className={fallbackClassName}> 
      {(firstInitial + secondInitial).slice(0, 2)}
    </AvatarFallback>
  </Avatar>
}

export { Avatar, AvatarImage, AvatarFallback, ProfileAvatar }
