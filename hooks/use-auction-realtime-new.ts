import { useEffect, useRef, useCallback } from 'react'
import { useIsConnected, useLastUpdated, useAuctionActions, useAuctionStore } from '@/stores/auction-store'
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
    console.log('[Realtime-New] Room updated:', room)
    
    // 방 정보 업데이트
    actions.updateRoom(room)
    
    // 라운드가 변경되면 currentRoundBids를 다시 필터링
    const state = useAuctionStore.getState()
    if (state.bids && room.current_round) {
      const newCurrentRoundBids = state.bids.filter((bid: Bid) => bid.round === room.current_round)
      console.log('[Realtime-New] Re-filtering bids for new round:', {
        currentRound: room.current_round,
        totalBids: state.bids.length,
        currentRoundBids: newCurrentRoundBids.length
      })
      actions.setBids(state.bids)  // setBids가 자동으로 currentRoundBids 필터링
    }
    
    callbacksRef.current.onRoomUpdate?.(room)
  }, [actions])
  
  const handleGuestEvent = useCallback((payload: any) => {
    const guest = payload.new as Guest
    console.log(`[Realtime-New] Guest ${payload.eventType}:`, guest)
    
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
    console.log('[Realtime-New] Bid event received:', {
      eventType: payload.eventType,
      bid: bid
    })
    
    // INSERT 이벤트 체크 (대소문자 확인)
    if (payload.eventType === 'INSERT') {
      console.log('[Realtime-New] Calling actions.addBid with:', bid)
      actions.addBid(bid)
      console.log('[Realtime-New] actions.addBid called successfully')
      callbacksRef.current.onBidPlaced?.(bid)
    } else {
      console.warn('[Realtime-New] Bid event is not INSERT, eventType:', payload.eventType)
    }
  }, [actions])
  
  const handleItemEvent = useCallback((payload: any) => {
    const item = payload.new as AuctionItem
    console.log('[Realtime-New] Item added:', item)
    
    if (payload.eventType === 'INSERT') {
      actions.addItem(item)
      callbacksRef.current.onItemAdded?.(item)
    }
  }, [actions])
  
  // 채널 초기화 및 구독
  useEffect(() => {
    if (!enabled || !roomId) {
      console.log('[Realtime-New] Skipping subscription:', { enabled, roomId })
      return
    }
    
    console.log('[Realtime-New] Initializing subscription for room:', roomId)
    const supabase = getSupabase()
    
    // 이전 채널 정리
    if (channelRef.current) {
      console.log('[Realtime-New] Unsubscribing from previous channel')
      channelRef.current.unsubscribe()
    }
    
    // 새 채널 생성
    console.log('[Realtime-New] Creating new channel for room:', roomId)
    const channel = supabase
      .channel(`auction_room_${roomId}_${Date.now()}`)
      
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
          console.log('[Realtime-New] 🎯 Bids table event:', payload.eventType, payload)
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
        console.log(`[Realtime-New] Subscription status for room ${roomId}:`, status)
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime-New] ✅ Successfully subscribed to all channels')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime-New] ❌ Channel error')
        }
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
