'use client'

import { use } from 'react'
import { HostDashboard } from '@/components/auction/host-dashboard'

interface Params {
  roomId: string
}

export default function HostPage({ params }: { params: Promise<Params> }) {
  const { roomId } = use(params)
  
  return (
    <HostDashboard 
      roomId={roomId} 
      auctionType="fixed" 
    />
  )
}
