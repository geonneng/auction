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
    <div className="flex relative z-10">
      <GuestSidebar roomId={roomId} guestName={guestName} />
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}
