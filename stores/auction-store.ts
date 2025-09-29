import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'
import type { AuctionRoom, Guest, Bid, AuctionItem, RoundAuctionItem } from '@/types/auction'
import { createAuctionActions, type AuctionActions } from './auction-actions'

// 간소화된 경매 상태 타입 (actions 제거)
export interface AuctionState {
  // 기본 정보
  room: AuctionRoom | null
  isLoading: boolean
  error: string | null
  
  // 참가자 관리
  guests: Guest[]
  currentGuest: Guest | null
  
  // 경매 아이템
  items: AuctionItem[]
  currentRoundItem: RoundAuctionItem | null
  
  // 입찰 관리
  bids: Bid[]
  currentRoundBids: Bid[]
  
  // UI 상태
  isConnected: boolean
  lastUpdated: Date | null
  
  // 경매 타입 (고정입찰 vs 변동입찰)
  auctionType: 'fixed' | 'dynamic'
}

const initialState: AuctionState = {
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

// Zustand 스토어 생성 (actions 제거)
export const useAuctionStore = create<AuctionState>()(
  devtools(
    subscribeWithSelector(() => ({
      ...initialState,
    }))
  )
)

// Actions를 별도로 생성하여 참조 안정성 보장
const stableActions = createAuctionActions(
  useAuctionStore.setState,
  useAuctionStore.getState
)

// 편의 hooks
export const useRoom = () => useAuctionStore(state => state.room)
export const useGuests = () => useAuctionStore(state => state.guests)
export const useCurrentGuest = () => useAuctionStore(state => state.currentGuest)
export const useBids = () => useAuctionStore(state => state.bids)
export const useCurrentRoundBids = () => useAuctionStore(state => state.currentRoundBids)
export const useItems = () => useAuctionStore(state => state.items)
export const useCurrentRoundItem = () => useAuctionStore(state => state.currentRoundItem)

// 가장 중요: 안정적인 Actions 참조 반환
export const useAuctionActions = (): AuctionActions => {
  // 항상 같은 객체를 반환하여 참조 안정성 보장
  return stableActions
}

// 개별 상태 훅들 (객체 반환 방지)
export const useIsLoading = () => useAuctionStore(state => state.isLoading)
export const useError = () => useAuctionStore(state => state.error)
export const useIsConnected = () => useAuctionStore(state => state.isConnected)
export const useLastUpdated = () => useAuctionStore(state => state.lastUpdated)

// Current Round Item 액션
export const useSetCurrentRoundItem = () => stableActions.setCurrentRoundItem

// 안정적인 복합 훅들 (shallow 비교 사용)
export const useLoadingState = () => useAuctionStore(
  state => ({ 
    isLoading: state.isLoading, 
    error: state.error 
  }),
  shallow
)

export const useConnectionState = () => useAuctionStore(
  state => ({
    isConnected: state.isConnected,
    lastUpdated: state.lastUpdated
  }),
  shallow
)
