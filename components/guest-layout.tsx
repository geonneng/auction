"use client"

import type React from "react"
import { GuestSidebar } from "@/components/guest-sidebar"

interface GuestLayoutProps {
  children: React.ReactNode
  roomId: string
  guestName?: string
}

export function GuestLayout({ children, roomId, guestName }: GuestLayoutProps) {
  return (
    <div className="relative z-10">
      <GuestSidebar roomId={roomId} guestName={guestName} />
      <main className="ml-80 p-6 pt-4">
        {children}
      </main>
    </div>
  )
}
