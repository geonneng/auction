// 별도 파일로 Actions 분리하여 참조 안정성 보장
import type { AuctionRoom, Guest, Bid, AuctionItem, RoundAuctionItem } from '@/types/auction'

export interface AuctionActions {
  // 방 관리
  setRoom: (room: AuctionRoom) => void
  updateRoom: (updates: Partial<AuctionRoom>) => void
  clearRoom: () => void
  
  // 참가자 관리
  setGuests: (guests: Guest[]) => void
  addGuest: (guest: Guest) => void
  updateGuest: (nickname: string, updates: Partial<Guest>) => void
  removeGuest: (nickname: string) => void
  setCurrentGuest: (guest: Guest | null) => void
  modifyCapital: (nickname: string, newCapital: number) => Promise<void>
  
  // 아이템 관리
  setItems: (items: AuctionItem[]) => void
  addItem: (item: AuctionItem) => void
  setCurrentRoundItem: (item: RoundAuctionItem | null) => void
  
  // 입찰 관리
  setBids: (bids: Bid[]) => void
  addBid: (bid: Bid) => void
  clearCurrentRoundBids: () => void
  
  // UI 상태
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setConnected: (connected: boolean) => void
  updateLastUpdated: () => void
  
  // 경매 타입
  setAuctionType: (type: 'fixed' | 'dynamic') => void
  
  // 복합 액션
  joinRoom: (roomId: string, nickname: string) => Promise<void>
  leaveRoom: () => void
  placeBid: (amount: number) => Promise<void>
  startRound: (item?: AuctionItem) => Promise<void>
  endRound: () => Promise<void>
  
  // 데이터 동기화
  syncWithServer: (roomId: string) => Promise<void>
  resetStore: () => void
}

// Actions 팩토리 함수 (한번만 생성되도록)
export const createAuctionActions = (
  setState: any,
  getState: any
): AuctionActions => {
  
  const initialState = {
    room: null,
    isLoading: false,
    error: null,
    guests: [],
    currentGuest: null,
    items: [],
    currentRoundItem: null,
    bids: [],
    currentRoundBids: [],
    isConnected: false,
    lastUpdated: null,
    auctionType: 'fixed' as const,
  }

  return {
    // 방 관리
    setRoom: (room) => {
      setState((state: any) => ({ 
        room,
        lastUpdated: new Date(),
      }), false, 'setRoom')
    },
    
    updateRoom: (updates) => {
      setState((state: any) => ({
        room: state.room ? { ...state.room, ...updates } : null,
        lastUpdated: new Date(),
      }), false, 'updateRoom')
    },
    
    clearRoom: () => {
      setState(() => ({
        ...initialState,
      }), false, 'clearRoom')
    },
    
    // 참가자 관리
    setGuests: (guests) => {
      setState(() => ({
        guests,
        lastUpdated: new Date(),
      }), false, 'setGuests')
    },
    
    addGuest: (guest) => {
      setState((state: any) => {
        const existingIndex = state.guests.findIndex((g: Guest) => g.nickname === guest.nickname)
        const newGuests = existingIndex >= 0 
          ? state.guests.map((g: Guest, i: number) => i === existingIndex ? guest : g)
          : [...state.guests, guest]
        
        return {
          guests: newGuests,
          lastUpdated: new Date(),
        }
      }, false, 'addGuest')
    },
    
    updateGuest: (nickname, updates) => {
      setState((state: any) => ({
        guests: state.guests.map((guest: Guest) => 
          guest.nickname === nickname ? { ...guest, ...updates } : guest
        ),
        currentGuest: state.currentGuest?.nickname === nickname 
          ? { ...state.currentGuest, ...updates } 
          : state.currentGuest,
        lastUpdated: new Date(),
      }), false, 'updateGuest')
    },
    
    removeGuest: (nickname) => {
      setState((state: any) => ({
        guests: state.guests.filter((guest: Guest) => guest.nickname !== nickname),
        currentGuest: state.currentGuest?.nickname === nickname ? null : state.currentGuest,
        lastUpdated: new Date(),
      }), false, 'removeGuest')
    },
    
    setCurrentGuest: (guest) => {
      setState(() => ({
        currentGuest: guest,
        lastUpdated: new Date(),
      }), false, 'setCurrentGuest')
    },
    
    modifyCapital: async (nickname: string, newCapital: number) => {
      const state = getState()
      const actions = createAuctionActions(setState, getState)
      
      if (!state.room) {
        throw new Error('Room not found')
      }
      
      actions.setLoading(true)
      actions.setError(null)
      
      try {
        const { auctionAPI } = await import('@/lib/api')
        const response = await auctionAPI.modifyCapital(state.room.id, nickname, newCapital)
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to modify capital')
        }
        
        // 로컬 상태 업데이트
        actions.updateGuest(nickname, { capital: newCapital })
        
        // 서버 상태 동기화
        await actions.syncWithServer(state.room.id)
      } catch (error) {
        actions.setError(error instanceof Error ? error.message : 'Unknown error')
        throw error
      } finally {
        actions.setLoading(false)
      }
    },
    
    // 아이템 관리
    setItems: (items) => {
      setState(() => ({
        items,
        lastUpdated: new Date(),
      }), false, 'setItems')
    },
    
    addItem: (item) => {
      setState((state: any) => ({
        items: [...state.items, item],
        lastUpdated: new Date(),
      }), false, 'addItem')
    },
    
    setCurrentRoundItem: (item) => {
      setState(() => ({
        currentRoundItem: item,
        lastUpdated: new Date(),
      }), false, 'setCurrentRoundItem')
    },
    
    // 입찰 관리
    setBids: (bids) => {
      const state = getState()
      const currentRound = state.room?.current_round
      const currentRoundBids = bids.filter((bid: Bid) => bid.round === currentRound)
      
      console.log('[setBids] Filtering bids:', {
        totalBids: bids.length,
        currentRound,
        currentRoundBids: currentRoundBids.length,
        allRounds: [...new Set(bids.map(b => b.round))]
      })
      
      setState(() => ({
        bids,
        currentRoundBids,
        lastUpdated: new Date(),
      }), false, 'setBids')
    },
    
    addBid: (bid) => {
      setState((state: any) => {
        const newBids = [...state.bids, bid]
        const isCurrentRound = bid.round === state.room?.current_round
        const currentRoundBids = isCurrentRound
          ? [...state.currentRoundBids, bid]
          : state.currentRoundBids
        
        console.log('[addBid] Adding bid:', {
          bidRound: bid.round,
          currentRound: state.room?.current_round,
          isCurrentRound,
          previousCount: state.currentRoundBids.length,
          newCount: currentRoundBids.length
        })
        
        return {
          bids: newBids,
          currentRoundBids,
          lastUpdated: new Date(),
        }
      }, false, 'addBid')
    },
    
    clearCurrentRoundBids: () => {
      setState(() => ({
        currentRoundBids: [],
        lastUpdated: new Date(),
      }), false, 'clearCurrentRoundBids')
    },
    
    // UI 상태
    setLoading: (loading) => {
      setState(() => ({ isLoading: loading }), false, 'setLoading')
    },
    
    setError: (error) => {
      setState(() => ({ error }), false, 'setError')
    },
    
    setConnected: (connected) => {
      setState(() => ({ isConnected: connected }), false, 'setConnected')
    },
    
    updateLastUpdated: () => {
      setState(() => ({ lastUpdated: new Date() }), false, 'updateLastUpdated')
    },
    
    setAuctionType: (type) => {
      setState(() => ({ auctionType: type }), false, 'setAuctionType')
    },
    
    // 복합 액션들 (API 호출 포함)
    joinRoom: async (roomId: string, nickname: string) => {
      const actions = createAuctionActions(setState, getState)
      
      actions.setLoading(true)
      actions.setError(null)
      
      try {
        // API 호출 로직은 별도 service layer에서 처리
        const { auctionAPI } = await import('@/lib/api')
        const response = await auctionAPI.joinRoom(roomId, nickname)
        
        if (response.success && response.guest) {
          setState((state: any) => ({
            currentGuest: response.guest,
            lastUpdated: new Date(),
          }), false, 'joinRoom')
        } else {
          throw new Error(response.error || 'Failed to join room')
        }
      } catch (error) {
        actions.setError(error instanceof Error ? error.message : 'Unknown error')
        throw error
      } finally {
        actions.setLoading(false)
      }
    },
    
    leaveRoom: () => {
      setState(() => ({
        ...initialState,
      }), false, 'leaveRoom')
    },
    
    placeBid: async (amount: number) => {
      const state = getState()
      const actions = createAuctionActions(setState, getState)
      
      if (!state.room || !state.currentGuest) {
        throw new Error('Room or guest not found')
      }
      
      actions.setLoading(true)
      actions.setError(null)
      
      try {
        const { auctionAPI } = await import('@/lib/api')
        const response = await auctionAPI.placeBid(
          state.room.id,
          state.currentGuest.nickname,
          amount,
          state.room.current_round
        )
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to place bid')
        }
        
        // 입찰 성공 후 상태 업데이트는 실시간 업데이트로 처리
      } catch (error) {
        actions.setError(error instanceof Error ? error.message : 'Unknown error')
        throw error
      } finally {
        actions.setLoading(false)
      }
    },
    
    startRound: async (item?: AuctionItem) => {
      const state = getState()
      const actions = createAuctionActions(setState, getState)
      
      if (!state.room) {
        throw new Error('Room not found')
      }
      
      actions.setLoading(true)
      actions.setError(null)
      
      try {
        const { auctionAPI } = await import('@/lib/api')
        console.log('[Actions] startRound request for room', state.room.id)
        const response = await auctionAPI.startRound(state.room.id)
        console.log('[Actions] startRound response', response)
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to start round')
        }

        // Optimistic update: Realtime이 느릴 수 있으므로 즉시 반영
        setState((prev: any) => ({
          room: prev.room
            ? {
                ...prev.room,
                current_round: (prev.room.current_round || 0) + 1,
                round_status: 'ACTIVE',
              }
            : prev.room,
          lastUpdated: new Date(),
        }), false, 'startRound:optimisticUpdate')

        // 현재 등록된 아이템이 있다면 currentRoundItem으로 설정
        if (state.room.current_item && state.room.current_item.item) {
          actions.setCurrentRoundItem({
            item: state.room.current_item.item,
            registeredAt: new Date()
          })
        }
      } catch (error) {
        actions.setError(error instanceof Error ? error.message : 'Unknown error')
        throw error
      } finally {
        actions.setLoading(false)
      }
    },
    
    endRound: async () => {
      const state = getState()
      const actions = createAuctionActions(setState, getState)
      
      if (!state.room) {
        throw new Error('Room not found')
      }
      
      actions.setLoading(true)
      actions.setError(null)
      
      try {
        const { auctionAPI } = await import('@/lib/api')
        const response = await auctionAPI.endRound(state.room.id, state.auctionType)
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to end round')
        }
        
        // 라운드 종료 후 상태 낙관적 업데이트: 다음 라운드 준비 상태로 설정
        setState((prev: any) => ({
          room: prev.room ? { ...prev.room, round_status: 'WAITING' } : prev.room,
          lastUpdated: new Date(),
        }), false, 'endRound:optimistic')
        actions.clearCurrentRoundBids()
      } catch (error) {
        actions.setError(error instanceof Error ? error.message : 'Unknown error')
        throw error
      } finally {
        actions.setLoading(false)
      }
    },
    
    // 데이터 동기화
    syncWithServer: async (roomId: string) => {
      const actions = createAuctionActions(setState, getState)
      
      actions.setLoading(true)
      actions.setError(null)
      
      try {
        const { auctionAPI } = await import('@/lib/api')
        const response = await auctionAPI.getState(roomId)
        
        if (response.success && response.room) {
          const room = response.room
          const currentRoundBids = (room.bids || []).filter(
            (bid: Bid) => bid.round === room.current_round
          )
          
          console.log('[syncWithServer] Syncing data:', {
            roomId: room.id,
            currentRound: room.current_round,
            totalBids: room.bids?.length || 0,
            currentRoundBids: currentRoundBids.length,
            guestCount: room.guests?.length || 0
          })
          
          setState(() => ({
            room,
            guests: room.guests || [],
            items: room.items || [],
            bids: room.bids || [],
            currentRoundBids,
            isConnected: true,
            lastUpdated: new Date(),
          }), false, 'syncWithServer')
        } else {
          throw new Error(response.error || 'Failed to sync with server')
        }
      } catch (error) {
        actions.setError(error instanceof Error ? error.message : 'Unknown error')
        setState(() => ({ isConnected: false }), false, 'syncError')
      } finally {
        actions.setLoading(false)
      }
    },
    
    resetStore: () => {
      setState(() => ({
        ...initialState,
      }), false, 'resetStore')
    },
  }
}
