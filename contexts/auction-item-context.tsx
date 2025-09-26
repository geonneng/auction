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
  auctionItem: AuctionItem | null
  setAuctionItem: (item: AuctionItem | null) => void
  saveAuctionItem: (item: Omit<AuctionItem, 'id' | 'createdAt'>) => Promise<void>
  loadAuctionItem: (roomId?: string) => Promise<void>
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
  const [auctionItem, setAuctionItem] = useState<AuctionItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // localStorage 키 생성
  const getStorageKey = (id?: string) => {
    return id ? `auction-item-${id}` : 'auction-item-global'
  }

  // 물품 정보 저장
  const saveAuctionItem = useCallback(async (item: Omit<AuctionItem, 'id' | 'createdAt'>) => {
    setIsLoading(true)
    try {
      const newItem: AuctionItem = {
        ...item,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        roomId: roomId || item.roomId
      }

      // localStorage에 저장
      const storageKey = getStorageKey(roomId)
      localStorage.setItem(storageKey, JSON.stringify(newItem))
      
      // 상태 업데이트
      setAuctionItem(newItem)

      // 다른 탭/창에 변경사항 알림
      window.dispatchEvent(new StorageEvent('storage', {
        key: storageKey,
        newValue: JSON.stringify(newItem)
      }))

    } catch (error) {
      console.error('Failed to save auction item:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [roomId])

  // 물품 정보 불러오기
  const loadAuctionItem = useCallback(async (targetRoomId?: string) => {
    setIsLoading(true)
    try {
      const storageKey = getStorageKey(targetRoomId || roomId)
      const storedItem = localStorage.getItem(storageKey)
      
      if (storedItem) {
        const item = JSON.parse(storedItem) as AuctionItem
        setAuctionItem(item)
      } else {
        setAuctionItem(null)
      }
    } catch (error) {
      console.error('Failed to load auction item:', error)
      setAuctionItem(null)
    } finally {
      setIsLoading(false)
    }
  }, [roomId])

  // 초기 로드
  useEffect(() => {
    loadAuctionItem()
  }, [loadAuctionItem])

  // storage 변경 감지 (다른 탭에서 변경된 경우)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      const storageKey = getStorageKey(roomId)
      if (e.key === storageKey && e.newValue) {
        try {
          const item = JSON.parse(e.newValue) as AuctionItem
          setAuctionItem(item)
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
    auctionItem,
    setAuctionItem,
    saveAuctionItem,
    loadAuctionItem,
    isLoading
  }

  return (
    <AuctionItemContext.Provider value={value}>
      {children}
    </AuctionItemContext.Provider>
  )
}
