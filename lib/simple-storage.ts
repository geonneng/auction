// 간단한 메모리 기반 저장소 - 데이터베이스 불필요
// 서버리스 환경에서도 작동하도록 설계

interface Guest {
  socketId: string
  nickname: string
  capital: number
  hasBidInCurrentRound: boolean
}

interface Bid {
  nickname: string
  amount: number
  timestamp: string
  round: number
}

interface AuctionItem {
  id: string
  name: string
  description: string
  image?: string
  startingPrice?: number
  ownerNickname: string
  createdBy: string
  createdAt: string
  roomId: string
}

interface RoomData {
  id: string
  name: string
  initialCapital: number
  status: 'PRE-START' | 'ACTIVE' | 'ENDED'
  currentRound: number
  roundStatus: 'WAITING' | 'ACTIVE' | 'ENDED'
  createdAt: string
  lastGuestJoinTime: number
  currentRoundItem?: {
    item: AuctionItem
    registeredAt: string
  } | null
  guests: Guest[]
  bids: Bid[]
  auctionItems: { [id: string]: AuctionItem }
}

// 글로벌 메모리 저장소 (프로세스 재시작 시 초기화됨)
const rooms = new Map<string, RoomData>()

export class SimpleAuctionRoom {
  
  // Room management
  async createRoom(id: string, initialCapital: number, auctionName?: string): Promise<RoomData> {
    const roomData: RoomData = {
      id,
      name: auctionName || "경매",
      initialCapital: Number.parseInt(initialCapital.toString()),
      status: "PRE-START",
      currentRound: 0,
      roundStatus: "WAITING",
      createdAt: new Date().toISOString(),
      lastGuestJoinTime: 0,
      currentRoundItem: null,
      guests: [],
      bids: [],
      auctionItems: {}
    }

    rooms.set(id, roomData)
    console.log(`[Simple] Created room ${id} with capital ${initialCapital}`)
    return roomData
  }

  async getRoomData(roomId: string): Promise<RoomData | null> {
    return rooms.get(roomId) || null
  }

  async updateRoomData(roomId: string, updates: Partial<RoomData>): Promise<void> {
    const roomData = rooms.get(roomId)
    if (!roomData) return

    const updatedData = { ...roomData, ...updates }
    rooms.set(roomId, updatedData)
  }

  // Guest management
  async addGuest(roomId: string, socketId: string, nickname: string): Promise<Guest> {
    const roomData = rooms.get(roomId)
    if (!roomData) {
      throw new Error("존재하지 않는 방입니다")
    }

    // 기존 게스트 확인 (닉네임 중복 방지)
    const existingGuest = roomData.guests.find(g => g.nickname === nickname)
    if (existingGuest) {
      // 기존 게스트 정보 업데이트
      existingGuest.socketId = socketId
      rooms.set(roomId, roomData)
      console.log(`[Simple] Updated existing guest ${nickname} in room ${roomId}`)
      return existingGuest
    }

    const newGuest: Guest = {
      socketId,
      nickname,
      capital: roomData.initialCapital,
      hasBidInCurrentRound: false,
    }

    roomData.guests.push(newGuest)
    roomData.lastGuestJoinTime = Date.now()
    rooms.set(roomId, roomData)
    
    console.log(`[Simple] Added guest ${nickname} to room ${roomId}`)
    return newGuest
  }

  async removeGuest(roomId: string, nickname: string): Promise<void> {
    const roomData = rooms.get(roomId)
    if (!roomData) return

    roomData.guests = roomData.guests.filter(g => g.nickname !== nickname)
    rooms.set(roomId, roomData)
    console.log(`[Simple] Removed guest ${nickname} from room ${roomId}`)
  }

  async getGuests(roomId: string): Promise<Guest[]> {
    const roomData = rooms.get(roomId)
    return roomData ? roomData.guests : []
  }

  // Bid management
  async placeBid(roomId: string, nickname: string, amount: number, auctionMethod: 'static' | 'dynamic' = 'static'): Promise<void> {
    const roomData = rooms.get(roomId)
    if (!roomData) {
      throw new Error("존재하지 않는 방입니다")
    }

    const guest = roomData.guests.find(g => g.nickname === nickname)
    if (!guest) {
      throw new Error("등록되지 않은 참가자입니다")
    }

    if (guest.capital < amount) {
      throw new Error("보유 자본이 부족합니다")
    }

    const bid: Bid = {
      nickname,
      amount,
      timestamp: new Date().toISOString(),
      round: roomData.currentRound,
    }

    // Handle different auction methods
    if (auctionMethod === 'dynamic') {
      // Cancel other bids in dynamic auction
      roomData.bids = roomData.bids.filter(b => b.round !== roomData.currentRound || b.nickname === nickname)
    }

    // Remove previous bid by same user in this round
    roomData.bids = roomData.bids.filter(b => !(b.round === roomData.currentRound && b.nickname === nickname))
    
    roomData.bids.push(bid)
    guest.hasBidInCurrentRound = true
    
    rooms.set(roomId, roomData)
    console.log(`[Simple] Placed bid ${amount} by ${nickname} in room ${roomId}`)
  }

  async getBids(roomId: string, round?: number): Promise<Bid[]> {
    const roomData = rooms.get(roomId)
    if (!roomData) return []

    if (round !== undefined) {
      return roomData.bids.filter(b => b.round === round)
    }
    return roomData.bids
  }

  async clearBidsForRound(roomId: string, round: number): Promise<void> {
    const roomData = rooms.get(roomId)
    if (!roomData) return

    roomData.bids = roomData.bids.filter(b => b.round !== round)
    
    // Reset bid status for all guests
    roomData.guests.forEach(g => {
      g.hasBidInCurrentRound = false
    })
    
    rooms.set(roomId, roomData)
    console.log(`[Simple] Cleared bids for round ${round} in room ${roomId}`)
  }

  // Auction item management
  async addAuctionItem(roomId: string, item: Omit<AuctionItem, 'id' | 'createdAt' | 'roomId'>): Promise<AuctionItem> {
    const roomData = rooms.get(roomId)
    if (!roomData) {
      throw new Error("존재하지 않는 방입니다")
    }

    const newItem: AuctionItem = {
      ...item,
      id: Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: new Date().toISOString(),
      roomId,
    }

    roomData.auctionItems[newItem.id] = newItem
    rooms.set(roomId, roomData)
    
    console.log(`[Simple] Added auction item ${newItem.id} to room ${roomId}`)
    return newItem
  }

  async getAuctionItems(roomId: string): Promise<AuctionItem[]> {
    const roomData = rooms.get(roomId)
    if (!roomData) return []

    return Object.values(roomData.auctionItems)
  }

  async removeAuctionItem(roomId: string, itemId: string): Promise<void> {
    const roomData = rooms.get(roomId)
    if (!roomData) return

    delete roomData.auctionItems[itemId]
    rooms.set(roomId, roomData)
    console.log(`[Simple] Removed auction item ${itemId} from room ${roomId}`)
  }

  // Room state management
  async updateRoomStatus(roomId: string, status: RoomData['status']): Promise<void> {
    const roomData = rooms.get(roomId)
    if (!roomData) return

    roomData.status = status
    rooms.set(roomId, roomData)
    console.log(`[Simple] Updated room ${roomId} status to ${status}`)
  }

  async setCurrentRoundItem(roomId: string, item: AuctionItem): Promise<void> {
    const roomData = rooms.get(roomId)
    if (!roomData) return

    roomData.currentRoundItem = {
      item,
      registeredAt: new Date().toISOString(),
    }
    rooms.set(roomId, roomData)
    console.log(`[Simple] Set current round item in room ${roomId}`)
  }

  async clearCurrentRoundItem(roomId: string): Promise<void> {
    const roomData = rooms.get(roomId)
    if (!roomData) return

    roomData.currentRoundItem = null
    rooms.set(roomId, roomData)
    console.log(`[Simple] Cleared current round item in room ${roomId}`)
  }

  async updateRoundStatus(roomId: string, roundStatus: RoomData['roundStatus']): Promise<void> {
    const roomData = rooms.get(roomId)
    if (!roomData) return

    roomData.roundStatus = roundStatus
    rooms.set(roomId, roomData)
    console.log(`[Simple] Updated round status to ${roundStatus} in room ${roomId}`)
  }

  async startNewRound(roomId: string): Promise<void> {
    const roomData = rooms.get(roomId)
    if (!roomData) return

    roomData.currentRound += 1
    roomData.roundStatus = 'WAITING'
    
    // Reset bid status for all guests
    roomData.guests.forEach(g => {
      g.hasBidInCurrentRound = false
    })
    
    rooms.set(roomId, roomData)
    console.log(`[Simple] Started round ${roomData.currentRound} in room ${roomId}`)
  }

  // State retrieval (main method used by API)
  async getState(roomId: string): Promise<any> {
    const roomData = rooms.get(roomId)
    if (!roomData) return null

    const currentRoundBids = roomData.bids.filter(b => b.round === roomData.currentRound)
    const allItems = Object.values(roomData.auctionItems)

    return {
      room: {
        id: roomData.id,
        name: roomData.name,
        initialCapital: roomData.initialCapital,
        status: roomData.status,
        currentRound: roomData.currentRound,
        roundStatus: roomData.roundStatus,
        createdAt: roomData.createdAt,
        lastGuestJoinTime: roomData.lastGuestJoinTime,
        currentRoundItem: roomData.currentRoundItem,
      },
      guests: roomData.guests.map(guest => ({
        nickname: guest.nickname,
        capital: guest.capital,
        hasBidInCurrentRound: guest.hasBidInCurrentRound,
      })),
      guestCount: roomData.guests.length,
      bids: currentRoundBids,
      bidCount: currentRoundBids.length,
      auctionItems: allItems,
      itemCount: allItems.length,
    }
  }

  // Utility methods
  async getRoomCount(): Promise<number> {
    return rooms.size
  }

  async getAllRoomIds(): Promise<string[]> {
    return Array.from(rooms.keys())
  }

  // 방 정리 (오래된 방 제거)
  async cleanupOldRooms(maxAgeHours: number = 24): Promise<number> {
    const now = Date.now()
    const maxAge = maxAgeHours * 60 * 60 * 1000
    let cleaned = 0

    for (const [roomId, roomData] of rooms.entries()) {
      const roomAge = now - new Date(roomData.createdAt).getTime()
      const lastActivity = Math.max(
        new Date(roomData.createdAt).getTime(),
        roomData.lastGuestJoinTime
      )
      const inactiveTime = now - lastActivity

      // 24시간 이상 비활성 또는 생성된지 오래된 방 제거
      if (roomAge > maxAge || inactiveTime > maxAge) {
        rooms.delete(roomId)
        cleaned++
        console.log(`[Simple] Cleaned up old room ${roomId}`)
      }
    }

    return cleaned
  }
}

// 싱글톤 인스턴스 생성
export const simpleAuctionRoom = new SimpleAuctionRoom()
