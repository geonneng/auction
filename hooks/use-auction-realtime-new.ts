import { useEffect, useRef, useCallback } from 'react'
import { useIsConnected, useLastUpdated, useAuctionActions } from '@/stores/auction-store'
import { getSupabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { AuctionRoom, Guest, Bid, AuctionItem } from '@/types/auction'

interface UseAuctionRealtimeOptions {
  roomId: string
  enabled?: boolean
  onRoomUpdate?: (room: AuctionRoom) => void
  onGuestJoin?: (guest: Guest) => void
  onGuestLeave?: (guest: Guest) => void
  onBidPlaced?: (bid: Bid) => void
  onItemAdded?: (item: AuctionItem) => void
}

export function useAuctionRealtime({
  roomId,
  enabled = true,
  onRoomUpdate,
  onGuestJoin,
  onGuestLeave,
  onBidPlaced,
  onItemAdded
}: UseAuctionRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const callbacksRef = useRef({
    onRoomUpdate,
    onGuestJoin,
    onGuestLeave,
    onBidPlaced,
    onItemAdded
  })
  
  // 콜백 업데이트
  callbacksRef.current = {
    onRoomUpdate,
    onGuestJoin,
    onGuestLeave,
    onBidPlaced,
    onItemAdded
  }
  
  // Zustand 액션들
  const actions = useAuctionActions()
  
  // 이벤트 핸들러들
  const handleRoomUpdate = useCallback((payload: any) => {
    const room = payload.new as AuctionRoom
    console.log('[Realtime] Room updated:', room)
    
    actions.updateRoom(room)
    callbacksRef.current.onRoomUpdate?.(room)
  }, [actions])
  
  const handleGuestEvent = useCallback((payload: any) => {
    const guest = payload.new as Guest
    console.log(`[Realtime] Guest ${payload.eventType}:`, guest)
    
    switch (payload.eventType) {
      case 'INSERT':
        actions.addGuest(guest)
        callbacksRef.current.onGuestJoin?.(guest)
        break
      case 'UPDATE':
        actions.updateGuest(guest.nickname, guest)
        break
      case 'DELETE':
        actions.removeGuest(guest.nickname)
        callbacksRef.current.onGuestLeave?.(guest)
        break
    }
  }, [actions])
  
  const handleBidEvent = useCallback((payload: any) => {
    const bid = payload.new as Bid
    console.log('[Realtime] Bid event received:', {
      eventType: payload.eventType,
      bid: bid
    })
    
    // INSERT 이벤트 체크 (대소문자 확인)
    if (payload.eventType === 'INSERT') {
      console.log('[Realtime] Calling actions.addBid with:', bid)
      actions.addBid(bid)
      console.log('[Realtime] actions.addBid called successfully')
      callbacksRef.current.onBidPlaced?.(bid)
    } else {
      console.warn('[Realtime] Bid event is not INSERT, eventType:', payload.eventType)
    }
  }, [actions])
  
  const handleItemEvent = useCallback((payload: any) => {
    const item = payload.new as AuctionItem
    console.log('[Realtime] Item added:', item)
    
    if (payload.eventType === 'INSERT') {
      actions.addItem(item)
      callbacksRef.current.onItemAdded?.(item)
    }
  }, [actions])
  
  // 채널 초기화 및 구독
  useEffect(() => {
    if (!enabled || !roomId) return
    
    const supabase = getSupabase()
    
    // 이전 채널 정리
    if (channelRef.current) {
      channelRef.current.unsubscribe()
    }
    
    // 새 채널 생성
    const channel = supabase
      .channel(`auction_room_${roomId}`)
      
      // 경매방 업데이트 구독
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'auction_rooms',
          filter: `id=eq.${roomId}`
        },
        handleRoomUpdate
      )
      
      // 게스트 이벤트 구독
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guests',
          filter: `room_id=eq.${roomId}`
        },
        handleGuestEvent
      )
      
      // 입찰 이벤트 구독
      .on(
        'postgres_changes',
        {
          event: '*',  // 모든 이벤트 받아서 디버깅
          schema: 'public',
          table: 'bids',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('[Realtime] Bids table event:', payload.eventType, payload)
          handleBidEvent(payload)
        }
      )
      
      // 아이템 추가 구독
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'auction_items',
          filter: `room_id=eq.${roomId}`
        },
        handleItemEvent
      )
      
      .subscribe((status) => {
        console.log(`[Realtime] Subscription status for room ${roomId}:`, status)
        actions.setConnected(status === 'SUBSCRIBED')
      })
    
    channelRef.current = channel
    
    // 정리
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
    }
  }, [roomId, enabled, handleRoomUpdate, handleGuestEvent, handleBidEvent, handleItemEvent]) // actions 제거
  
  // 연결 상태 반환 (단일 selector 사용)
  const isConnected = useIsConnected()
  const lastUpdated = useLastUpdated()
  
  return {
    isConnected,
    lastUpdated,
    disconnect: () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
      actions.setConnected(false)
    }
  }
}
