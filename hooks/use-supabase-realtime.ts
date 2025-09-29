import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseSupabaseRealtimeOptions {
  table: string
  filter?: string
  onInsert?: (payload: any) => void
  onUpdate?: (payload: any) => void
  onDelete?: (payload: any) => void
}

export function useSupabaseRealtime({
  table,
  filter,
  onInsert,
  onUpdate,
  onDelete
}: UseSupabaseRealtimeOptions) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    // 기존 채널 정리
    if (channel) {
      channel.unsubscribe()
    }

    // 새로운 채널 생성
    const supabase = getSupabase()
    const newChannel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: filter
        },
        (payload) => {
          console.log('Realtime event received:', payload)
          
          switch (payload.eventType) {
            case 'INSERT':
              onInsert?.(payload)
              break
            case 'UPDATE':
              onUpdate?.(payload)
              break
            case 'DELETE':
              onDelete?.(payload)
              break
          }
        }
      )
      .subscribe()

    setChannel(newChannel)

    // 클린업
    return () => {
      newChannel.unsubscribe()
    }
  }, [table, filter, onInsert, onUpdate, onDelete])

  return channel
}

// 경매방 전용 훅
export function useAuctionRealtime(roomId: string, callbacks: {
  onRoomUpdate?: (room: any) => void
  onGuestJoin?: (guest: any) => void
  onGuestLeave?: (guest: any) => void
  onBidPlaced?: (bid: any) => void
  onItemAdded?: (item: any) => void
}) {
  const [roomData, setRoomData] = useState<any>(null)

  // 경매방 변경사항 구독
  useSupabaseRealtime({
    table: 'auction_rooms',
    filter: `id=eq.${roomId}`,
    onUpdate: (payload) => {
      setRoomData(payload.new)
      callbacks.onRoomUpdate?.(payload.new)
    }
  })

  // 게스트 변경사항 구독
  useSupabaseRealtime({
    table: 'guests',
    filter: `room_id=eq.${roomId}`,
    onInsert: (payload) => {
      callbacks.onGuestJoin?.(payload.new)
    },
    onUpdate: (payload) => {
      // 게스트 정보 업데이트 (자본, 입찰 상태 등)
    },
    onDelete: (payload) => {
      callbacks.onGuestLeave?.(payload.old)
    }
  })

  // 입찰 변경사항 구독
  useSupabaseRealtime({
    table: 'bids',
    filter: `room_id=eq.${roomId}`,
    onInsert: (payload) => {
      callbacks.onBidPlaced?.(payload.new)
    }
  })

  // 아이템 변경사항 구독
  useSupabaseRealtime({
    table: 'auction_items',
    filter: `room_id=eq.${roomId}`,
    onInsert: (payload) => {
      callbacks.onItemAdded?.(payload.new)
    }
  })

  return roomData
}
