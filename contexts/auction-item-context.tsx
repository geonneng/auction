"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

interface AuctionItem {
  id: string
  name: string
  description: string
  image?: string
  roomId?: string
  createdBy?: string
  createdAt?: string
}

interface AuctionItemContextType {
  auctionItems: { [guestName: string]: AuctionItem }
  selectedGuestItem: AuctionItem | null
  selectedGuest: string | null
  setSelectedGuest: (guestName: string | null) => void
  saveAuctionItem: (item: Omit<AuctionItem, 'id' | 'createdAt'>, guestName: string) => Promise<void>
  loadAuctionItems: (roomId?: string) => Promise<void>
  getGuestItem: (guestName: string) => AuctionItem | null
  getAllGuests: () => string[]
  isLoading: boolean
}

const AuctionItemContext = createContext<AuctionItemContextType | undefined>(undefined)

export function useAuctionItem() {
  const context = useContext(AuctionItemContext)
  if (context === undefined) {
    throw new Error('useAuctionItem must be used within an AuctionItemProvider')
  }
  return context
}

interface AuctionItemProviderProps {
  children: React.ReactNode
  roomId?: string
}

export function AuctionItemProvider({ children, roomId }: AuctionItemProviderProps) {
  const [auctionItems, setAuctionItems] = useState<{ [guestName: string]: AuctionItem }>({})
  const [selectedGuest, setSelectedGuest] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Supabase Realtime 구독을 위한 콜백
  const handleItemAdded = useCallback((item: any) => {
    console.log('[AuctionItem] Item added via Realtime:', item)
    const newItem: AuctionItem = {
      id: item.id,
      name: item.name,
      description: item.description,
      image: item.image_url,
      roomId: roomId,
      createdBy: item.created_by,
      createdAt: item.created_at
    }
    
    setAuctionItems(prev => ({
      ...prev,
      [item.created_by || 'unknown']: newItem
    }))
  }, [roomId])

  // 물품 정보 저장 (Supabase 전용)
  const saveAuctionItem = useCallback(async (item: Omit<AuctionItem, 'id' | 'createdAt'>, guestName: string) => {
    setIsLoading(true)
    try {
      if (!roomId) {
        throw new Error('Room ID is required')
      }

      // Supabase에 저장
      const { auctionAPI } = await import('@/lib/api')
      const response = await auctionAPI.saveAuctionItem(roomId, {
        name: item.name,
        description: item.description,
        image_url: item.image,
        starting_price: 0 // 기본값
      })

      if (response.success) {
        console.log('[AuctionItem] Saved to Supabase:', response.item)
        
        // 상태 업데이트 (Supabase에서 반환된 데이터 사용)
        const newItem: AuctionItem = {
          id: response.item.id,
          name: response.item.name,
          description: response.item.description,
          image: response.item.image_url,
          roomId: roomId,
          createdBy: guestName,
          createdAt: response.item.created_at
        }

        setAuctionItems(prev => ({
          ...prev,
          [guestName]: newItem
        }))
      } else {
        throw new Error(response.error || 'Failed to save item')
      }

    } catch (error) {
      console.error('Failed to save auction item:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [roomId])

  // 물품 정보 불러오기 (Supabase 전용)
  const loadAuctionItems = useCallback(async (targetRoomId?: string, forceRefresh = false) => {
    const targetRoom = targetRoomId || roomId
    if (!targetRoom) {
      console.warn('[AuctionItem] No room ID provided for loading items')
      return
    }
    
    setIsLoading(true)
    try {
      // Supabase에서 조회
      const { auctionAPI } = await import('@/lib/api')
      const response = await auctionAPI.getAuctionItems(targetRoom)
      
      if (response.success && response.items) {
        console.log('[AuctionItem] Loaded from Supabase:', response.items)
        
        // Supabase 데이터를 AuctionItem 형식으로 변환
        const items: { [guestName: string]: AuctionItem } = {}
        response.items.forEach((item: any) => {
          items[item.created_by || 'unknown'] = {
            id: item.id,
            name: item.name,
            description: item.description,
            image: item.image_url,
            roomId: targetRoom,
            createdBy: item.created_by,
            createdAt: item.created_at
          }
        })
        
        setAuctionItems(items)
      } else {
        console.warn('[AuctionItem] No items found or error:', response.error)
        setAuctionItems({})
      }
    } catch (error) {
      console.error('[AuctionItem] Failed to load auction items:', error)
      setAuctionItems({})
    } finally {
      setIsLoading(false)
    }
  }, [roomId])

  // 특정 게스트의 물품 가져오기
  const getGuestItem = useCallback((guestName: string) => {
    return auctionItems[guestName] || null
  }, [auctionItems])

  // 모든 게스트 목록 가져오기
  const getAllGuests = useCallback(() => {
    return Object.keys(auctionItems)
  }, [auctionItems])

  // 선택된 게스트의 물품
  const selectedGuestItem = selectedGuest ? auctionItems[selectedGuest] || null : null

  // Realtime은 부모 컴포넌트에서 처리
  useEffect(() => {
    if (!roomId) return
    console.log('[AuctionItem] Ready for room:', roomId)
  }, [roomId])

  // 초기 로드
  useEffect(() => {
    loadAuctionItems()
  }, [loadAuctionItems])

  const value: AuctionItemContextType = {
    auctionItems,
    selectedGuestItem,
    selectedGuest,
    setSelectedGuest,
    saveAuctionItem,
    loadAuctionItems,
    getGuestItem,
    getAllGuests,
    isLoading
  }

  return (
    <AuctionItemContext.Provider value={value}>
      {children}
    </AuctionItemContext.Provider>
  )
}
