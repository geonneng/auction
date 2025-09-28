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

  // localStorage 키 생성
  const getStorageKey = (id?: string) => {
    return id ? `auction-items-${id}` : 'auction-items-global'
  }

  // 물품 정보 저장
  const saveAuctionItem = useCallback(async (item: Omit<AuctionItem, 'id' | 'createdAt'>, guestName: string) => {
    setIsLoading(true)
    try {
      const newItem: AuctionItem = {
        ...item,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        roomId: roomId || item.roomId,
        createdBy: guestName
      }

      // API 서버에 저장
      if (roomId) {
        try {
          const { auctionAPI } = await import('@/lib/api')
          await auctionAPI.saveAuctionItem(roomId, newItem, guestName)
          console.log('[AuctionItem] Saved to API server:', newItem)
        } catch (apiError) {
          console.error('[AuctionItem] Failed to save to API server:', apiError)
          // API 저장 실패해도 localStorage에는 저장
        }
      }

      // 상태 업데이트
      setAuctionItems(prev => ({
        ...prev,
        [guestName]: newItem
      }))

      // localStorage에 저장
      const storageKey = getStorageKey(roomId)
      const updatedItems = { ...auctionItems, [guestName]: newItem }
      localStorage.setItem(storageKey, JSON.stringify(updatedItems))

      // 다른 탭/창에 변경사항 알림
      window.dispatchEvent(new StorageEvent('storage', {
        key: storageKey,
        newValue: JSON.stringify(updatedItems)
      }))

    } catch (error) {
      console.error('Failed to save auction item:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [roomId, auctionItems])

  // 물품 정보 불러오기
  const loadAuctionItems = useCallback(async (targetRoomId?: string, forceRefresh = false) => {
    const targetRoom = targetRoomId || roomId
    if (!targetRoom) return
    
    // 캐시된 데이터가 있고 강제 새로고침이 아닌 경우 스킵
    const storageKey = getStorageKey(targetRoom)
    const cachedData = localStorage.getItem(storageKey)
    if (cachedData && !forceRefresh) {
      try {
        const parsedItems = JSON.parse(cachedData)
        setAuctionItems(parsedItems)
        return
      } catch (error) {
        console.error('[AuctionItem] Failed to parse cached data:', error)
      }
    }
    
    setIsLoading(true)
    try {
      // API 서버에서 먼저 조회
      try {
        const { auctionAPI } = await import('@/lib/api')
        const response = await auctionAPI.getAuctionItems(targetRoom)
        if (response.success && response.items) {
          console.log('[AuctionItem] Loaded from API server:', response.items)
          setAuctionItems(response.items)
          
          // localStorage에도 저장 (백업용)
          localStorage.setItem(storageKey, JSON.stringify(response.items))
          return
        }
      } catch (apiError) {
        console.error('[AuctionItem] Failed to load from API server:', apiError)
        // API 실패 시 localStorage에서 로드
      }
      
      // localStorage에서 로드 (API 실패 시 또는 roomId가 없는 경우)
      const storageKey = getStorageKey(targetRoom)
      const storedItems = localStorage.getItem(storageKey)
      
      if (storedItems) {
        const items = JSON.parse(storedItems) as { [guestName: string]: AuctionItem }
        setAuctionItems(items)
      } else {
        setAuctionItems({})
      }
    } catch (error) {
      console.error('Failed to load auction items:', error)
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

  // 초기 로드
  useEffect(() => {
    loadAuctionItems()
  }, [loadAuctionItems])

  // storage 변경 감지 (다른 탭에서 변경된 경우)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      const storageKey = getStorageKey(roomId)
      if (e.key === storageKey && e.newValue) {
        try {
          const items = JSON.parse(e.newValue) as { [guestName: string]: AuctionItem }
          setAuctionItems(items)
        } catch (error) {
          console.error('Failed to parse storage change:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // 커스텀 storage 이벤트도 감지 (같은 탭에서의 변경)
    const handleCustomStorageChange = (e: Event) => {
      if (e instanceof StorageEvent) {
        handleStorageChange(e)
      }
    }
    
    window.addEventListener('storage', handleCustomStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('storage', handleCustomStorageChange)
    }
  }, [roomId])

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
