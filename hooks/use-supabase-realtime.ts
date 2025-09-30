import { useEffect, useState, useRef } from 'react'
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
  
  // 콜백을 ref로 관리하여 의존성 문제 해결
  const callbacksRef = useRef({ onInsert, onUpdate, onDelete })
  callbacksRef.current = { onInsert, onUpdate, onDelete }

  useEffect(() => {
    // 기존 채널 정리
    if (channel) {
      channel.unsubscribe()
    }

    // 새로운 채널 생성
    const supabase = getSupabase()
    const newChannel = supabase
      .channel(`${table}_changes_${Date.now()}`, {
        config: {
          broadcast: { self: false },
          presence: { key: '' },
        },
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: filter
        },
        (payload) => {
          console.log('[Realtime] Event received:', payload.eventType, 'from', table, payload)
          
          switch (payload.eventType) {
            case 'INSERT':
              callbacksRef.current.onInsert?.(payload)
              break
            case 'UPDATE':
              callbacksRef.current.onUpdate?.(payload)
              break
            case 'DELETE':
              callbacksRef.current.onDelete?.(payload)
              break
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status for', table, ':', status)
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Successfully subscribed to', table)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] Channel error for', table)
        } else if (status === 'TIMED_OUT') {
          console.error('[Realtime] Subscription timed out for', table)
        }
      })

    setChannel(newChannel)

    // 클린업
    return () => {
      console.log('[Realtime] Unsubscribing from', table)
      newChannel.unsubscribe()
    }
  }, [table, filter]) // 콜백은 의존성에서 제외 (ref 패턴으로 변경)

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

  // 경매방 변경사항 구독 - 라운드 상태 변화를 즉시 감지
  useSupabaseRealtime({
    table: 'auction_rooms',
    filter: `id=eq.${roomId}`,
    onUpdate: (payload) => {
      console.log('[useAuctionRealtime] Room update detected:', payload.new)
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

  // 입찰 변경사항 구독 - 실시간 입찰 알림
  useSupabaseRealtime({
    table: 'bids',
    filter: `room_id=eq.${roomId}`,
    onInsert: (payload) => {
      console.log('[useAuctionRealtime] Bid placed detected:', payload.new)
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
