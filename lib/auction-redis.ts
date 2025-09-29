// Redis-based Auction Room implementation
import { getRedisClient, RedisKeys } from './redis'
import type { Redis } from 'ioredis'

interface Guest {
  socketId: string
  nickname: string
  capital: number
  hasBidInCurrentRound: boolean
}

interface Bid {
  nickname: string
  amount: number
  timestamp: Date
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
}

export class RedisAuctionRoom {
  private redis: Redis
  
  constructor() {
    this.redis = getRedisClient()
  }

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
    }

    const pipeline = this.redis.pipeline()
    pipeline.hset(RedisKeys.room(id), roomData as any)
    pipeline.sadd(RedisKeys.roomList(), id)
    pipeline.expire(RedisKeys.room(id), 86400) // 24 hours TTL
    pipeline.expire(RedisKeys.roomList(), 86400)
    await pipeline.exec()

    console.log(`[Redis] Created room ${id} with capital ${initialCapital}`)
    return roomData
  }

  async getRoomData(roomId: string): Promise<RoomData | null> {
    const data = await this.redis.hgetall(RedisKeys.room(roomId))
    if (!data || Object.keys(data).length === 0) {
      return null
    }

    return {
      id: data.id,
      name: data.name,
      initialCapital: parseInt(data.initialCapital),
      status: data.status as any,
      currentRound: parseInt(data.currentRound) || 0,
      roundStatus: data.roundStatus as any,
      createdAt: data.createdAt,
      lastGuestJoinTime: parseInt(data.lastGuestJoinTime) || 0,
      currentRoundItem: data.currentRoundItem ? JSON.parse(data.currentRoundItem) : null,
    }
  }

  async updateRoomData(roomId: string, updates: Partial<RoomData>): Promise<void> {
    const updateData: any = { ...updates }
    if (updateData.currentRoundItem) {
      updateData.currentRoundItem = JSON.stringify(updateData.currentRoundItem)
    }
    
    await this.redis.hset(RedisKeys.room(roomId), updateData)
    await this.redis.expire(RedisKeys.room(roomId), 86400) // Reset TTL
  }

  // Guest management
  async addGuest(roomId: string, socketId: string, nickname: string): Promise<Guest> {
    const roomData = await this.getRoomData(roomId)
    if (!roomData) {
      throw new Error("존재하지 않는 방입니다")
    }

    // Check if room is full
    const guestCount = await this.redis.scard(RedisKeys.guests(roomId))
    if (guestCount >= 6) {
      throw new Error("방이 가득 찼습니다")
    }

    // Check if nickname exists
    const existingGuest = await this.redis.hgetall(RedisKeys.guest(roomId, nickname))
    if (existingGuest && Object.keys(existingGuest).length > 0) {
      throw new Error("이미 사용 중인 닉네임입니다")
    }

    const guest: Guest = {
      socketId,
      nickname,
      capital: roomData.initialCapital,
      hasBidInCurrentRound: false,
    }

    const pipeline = this.redis.pipeline()
    pipeline.hset(RedisKeys.guest(roomId, nickname), guest as any)
    pipeline.sadd(RedisKeys.guests(roomId), nickname)
    pipeline.expire(RedisKeys.guest(roomId, nickname), 86400)
    pipeline.expire(RedisKeys.guests(roomId), 86400)
    
    // Update room's lastGuestJoinTime
    const now = Date.now()
    pipeline.hset(RedisKeys.room(roomId), 'lastGuestJoinTime', now)
    
    await pipeline.exec()

    console.log(`[Redis] Guest ${nickname} joined room ${roomId}`)
    return guest
  }

  async getGuest(roomId: string, nickname: string): Promise<Guest | null> {
    const data = await this.redis.hgetall(RedisKeys.guest(roomId, nickname))
    if (!data || Object.keys(data).length === 0) {
      return null
    }

    return {
      socketId: data.socketId,
      nickname: data.nickname,
      capital: parseInt(data.capital),
      hasBidInCurrentRound: data.hasBidInCurrentRound === 'true',
    }
  }

  async getAllGuests(roomId: string): Promise<Guest[]> {
    const nicknames = await this.redis.smembers(RedisKeys.guests(roomId))
    if (nicknames.length === 0) {
      return []
    }

    const pipeline = this.redis.pipeline()
    nicknames.forEach(nickname => {
      pipeline.hgetall(RedisKeys.guest(roomId, nickname))
    })

    const results = await pipeline.exec()
    if (!results) return []

    return results
      .map(([err, data]) => {
        if (err || !data || typeof data !== 'object' || Object.keys(data).length === 0) {
          return null
        }
        return {
          socketId: data.socketId,
          nickname: data.nickname,
          capital: parseInt(data.capital),
          hasBidInCurrentRound: data.hasBidInCurrentRound === 'true',
        }
      })
      .filter((guest): guest is Guest => guest !== null)
  }

  async updateGuest(roomId: string, nickname: string, updates: Partial<Guest>): Promise<void> {
    await this.redis.hset(RedisKeys.guest(roomId, nickname), updates as any)
    await this.redis.expire(RedisKeys.guest(roomId, nickname), 86400)
  }

  async getGuestCount(roomId: string): Promise<number> {
    return await this.redis.scard(RedisKeys.guests(roomId))
  }

  // Bid management
  async placeBid(roomId: string, nickname: string, amount: number, auctionMethod: 'fixed' | 'dynamic' = 'fixed'): Promise<any> {
    const roomData = await this.getRoomData(roomId)
    if (!roomData) {
      throw new Error("존재하지 않는 방입니다")
    }

    if (roomData.status !== "ACTIVE") {
      throw new Error("경매가 시작되지 않았습니다")
    }

    if (roomData.roundStatus !== "ACTIVE") {
      throw new Error("라운드가 진행 중이 아닙니다")
    }

    const guest = await this.getGuest(roomId, nickname)
    if (!guest) {
      throw new Error("참가자를 찾을 수 없습니다")
    }

    if (guest.capital < amount) {
      throw new Error("보유 자본이 부족합니다")
    }

    if (guest.hasBidInCurrentRound) {
      throw new Error("이미 이번 라운드에서 입찰하셨습니다")
    }

    const bid: Bid = {
      nickname,
      amount,
      timestamp: new Date(),
      round: roomData.currentRound,
    }

    // Handle different auction methods
    if (auctionMethod === 'dynamic') {
      // Cancel other bids in dynamic auction
      const allBids = await this.getRoundBids(roomId, roomData.currentRound)
      const otherBids = allBids.filter(b => b.nickname !== nickname)

      // Restore capital for cancelled bids
      const pipeline = this.redis.pipeline()
      for (const otherBid of otherBids) {
        const otherGuest = await this.getGuest(roomId, otherBid.nickname)
        if (otherGuest) {
          pipeline.hset(RedisKeys.guest(roomId, otherBid.nickname), {
            capital: otherGuest.capital + otherBid.amount,
            hasBidInCurrentRound: false,
          })
        }
      }
      
      // Remove cancelled bids
      const cancelledBidIds = otherBids.map(b => `${b.nickname}:${b.round}:${b.timestamp.getTime()}`)
      if (cancelledBidIds.length > 0) {
        pipeline.hdel(RedisKeys.bids(roomId), ...cancelledBidIds)
      }

      await pipeline.exec()
    }

    // Place new bid
    const bidId = `${nickname}:${roomData.currentRound}:${Date.now()}`
    const pipeline = this.redis.pipeline()
    pipeline.hset(RedisKeys.bids(roomId), bidId, JSON.stringify(bid))
    pipeline.hset(RedisKeys.guest(roomId, nickname), {
      capital: guest.capital - amount,
      hasBidInCurrentRound: true,
    })
    pipeline.expire(RedisKeys.bids(roomId), 86400)
    
    await pipeline.exec()

    console.log(`[Redis] Bid placed: ${nickname} - ${amount} in room ${roomId}`)
    
    return {
      success: true,
      type: auctionMethod,
      remainingCapital: guest.capital - amount,
      hasBidInCurrentRound: true,
      state: await this.getState(roomId),
    }
  }

  async getRoundBids(roomId: string, round: number): Promise<Bid[]> {
    const allBids = await this.redis.hgetall(RedisKeys.bids(roomId))
    if (!allBids) return []

    return Object.entries(allBids)
      .map(([key, value]) => JSON.parse(value) as Bid)
      .filter(bid => bid.round === round)
      .map(bid => ({
        ...bid,
        timestamp: new Date(bid.timestamp),
      }))
  }

  async getAllBids(roomId: string): Promise<Bid[]> {
    const allBids = await this.redis.hgetall(RedisKeys.bids(roomId))
    if (!allBids) return []

    return Object.entries(allBids)
      .map(([key, value]) => JSON.parse(value) as Bid)
      .map(bid => ({
        ...bid,
        timestamp: new Date(bid.timestamp),
      }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Auction control
  async startAuction(roomId: string): Promise<RoomData> {
    const guestCount = await this.getGuestCount(roomId)
    if (guestCount === 0) {
      throw new Error("참가자가 없습니다")
    }

    await this.updateRoomData(roomId, { status: "ACTIVE" })
    const roomData = await this.getRoomData(roomId)
    
    console.log(`[Redis] Auction started in room ${roomId}`)
    return roomData!
  }

  async startRound(roomId: string): Promise<RoomData> {
    const roomData = await this.getRoomData(roomId)
    if (!roomData) {
      throw new Error("존재하지 않는 방입니다")
    }

    if (roomData.status !== "ACTIVE") {
      throw new Error("경매가 시작되지 않았습니다")
    }

    // Reset all guests' bid status
    const guests = await this.getAllGuests(roomId)
    const pipeline = this.redis.pipeline()
    
    guests.forEach(guest => {
      pipeline.hset(RedisKeys.guest(roomId, guest.nickname), {
        hasBidInCurrentRound: false,
      })
    })

    // Update room data
    const newRound = roomData.currentRound + 1
    pipeline.hset(RedisKeys.room(roomId), {
      currentRound: newRound,
      roundStatus: "ACTIVE",
    })

    await pipeline.exec()

    const updatedRoomData = await this.getRoomData(roomId)
    console.log(`[Redis] Round ${newRound} started in room ${roomId}`)
    return updatedRoomData!
  }

  async endRound(roomId: string): Promise<{ roomData: RoomData; roundResults: any }> {
    const roomData = await this.getRoomData(roomId)
    if (!roomData) {
      throw new Error("존재하지 않는 방입니다")
    }

    if (roomData.roundStatus !== "ACTIVE") {
      throw new Error("활성화된 라운드가 없습니다")
    }

    const roundBids = await this.getRoundBids(roomId, roomData.currentRound)
    const winner = roundBids.length > 0 ? 
      roundBids.reduce((max, bid) => bid.amount > max.amount ? bid : max) : null

    const roundResults = {
      round: roomData.currentRound,
      bids: roundBids.sort((a, b) => b.amount - a.amount),
      winner
    }

    await this.updateRoomData(roomId, { roundStatus: "ENDED" })
    const updatedRoomData = await this.getRoomData(roomId)

    console.log(`[Redis] Round ${roomData.currentRound} ended in room ${roomId}`)
    return { roomData: updatedRoomData!, roundResults }
  }

  async endAuction(roomId: string): Promise<{ roomData: RoomData; finalResults: any }> {
    const roomData = await this.getRoomData(roomId)
    if (!roomData) {
      throw new Error("존재하지 않는 방입니다")
    }

    if (roomData.status !== "ACTIVE") {
      throw new Error("활성화된 경매가 없습니다")
    }

    const guests = await this.getAllGuests(roomId)
    const allBids = await this.getAllBids(roomId)

    const finalResults = {
      totalRounds: roomData.currentRound,
      participants: guests.map(guest => ({
        nickname: guest.nickname,
        finalCapital: guest.capital,
        totalBidAmount: roomData.initialCapital - guest.capital,
        wonItems: this.getWonItems(guest.nickname, allBids, roomData.currentRound)
      })),
      allBids,
      auctionItems: await this.getAllAuctionItems(roomId)
    }

    await this.updateRoomData(roomId, { 
      status: "ENDED", 
      roundStatus: "ENDED" 
    })
    
    const updatedRoomData = await this.getRoomData(roomId)

    console.log(`[Redis] Auction ended in room ${roomId}`)
    return { roomData: updatedRoomData!, finalResults }
  }

  private getWonItems(nickname: string, allBids: Bid[], totalRounds: number): any[] {
    const wonItems = []
    for (let round = 1; round <= totalRounds; round++) {
      const roundBids = allBids.filter(bid => bid.round === round)
      if (roundBids.length > 0) {
        const winner = roundBids.reduce((max, bid) => bid.amount > max.amount ? bid : max)
        if (winner.nickname === nickname) {
          wonItems.push({
            round,
            amount: winner.amount,
            timestamp: winner.timestamp
          })
        }
      }
    }
    return wonItems
  }

  // Auction Items
  async saveAuctionItem(roomId: string, itemData: any, guestName: string): Promise<{ success: boolean; item: AuctionItem }> {
    const item: AuctionItem = {
      ...itemData,
      id: itemData.id || Date.now().toString(),
      createdBy: guestName,
      createdAt: new Date().toISOString(),
      roomId,
      ownerNickname: guestName,
    }
    
    await this.redis.hset(RedisKeys.auctionItems(roomId), guestName, JSON.stringify(item))
    await this.redis.expire(RedisKeys.auctionItems(roomId), 86400)
    
    return { success: true, item }
  }

  async getAllAuctionItems(roomId: string): Promise<{ [guestName: string]: AuctionItem }> {
    const items = await this.redis.hgetall(RedisKeys.auctionItems(roomId))
    if (!items) return {}

    const result: { [guestName: string]: AuctionItem } = {}
    for (const [guestName, itemData] of Object.entries(items)) {
      result[guestName] = JSON.parse(itemData)
    }
    return result
  }

  async registerAuctionItem(roomId: string, itemData: any, round: number): Promise<{ success: boolean; item: any }> {
    const roomData = await this.getRoomData(roomId)
    if (!roomData) {
      throw new Error("존재하지 않는 방입니다")
    }

    if (roomData.roundStatus !== "WAITING" && roomData.roundStatus !== "ENDED") {
      throw new Error("라운드가 대기 상태이거나 종료된 상태일 때만 물품을 등록할 수 있습니다")
    }

    const itemWithOwner = {
      ...itemData,
      ownerNickname: itemData.createdBy || itemData.ownerNickname || "알 수 없음"
    }

    const currentRoundItem = {
      item: itemWithOwner,
      registeredAt: new Date().toISOString()
    }

    await this.updateRoomData(roomId, { currentRoundItem })

    return { success: true, item: currentRoundItem }
  }

  async modifyCapital(roomId: string, nickname: string, newCapital: number): Promise<RoomData> {
    const guest = await this.getGuest(roomId, nickname)
    if (!guest) {
      throw new Error("참가자를 찾을 수 없습니다")
    }

    await this.updateGuest(roomId, nickname, { capital: newCapital })
    const roomData = await this.getRoomData(roomId)
    
    console.log(`[Redis] Modified capital for ${nickname} to ${newCapital} in room ${roomId}`)
    return roomData!
  }

  async distributeWinningAmount(roomId: string, winnerNickname: string, amount: number, ownerNickname: string): Promise<any> {
    const roomData = await this.getRoomData(roomId)
    if (!roomData || !roomData.currentRoundItem) {
      throw new Error("등록된 경매 물품이 없습니다")
    }

    const winner = await this.getGuest(roomId, winnerNickname)
    const owner = await this.getGuest(roomId, ownerNickname)

    if (!winner) {
      throw new Error("낙찰자를 찾을 수 없습니다")
    }

    if (!owner) {
      throw new Error("물품 등록자를 찾을 수 없습니다")
    }

    // Transfer winning amount to item owner
    await this.updateGuest(roomId, ownerNickname, { 
      capital: owner.capital + amount 
    })

    // Clear current round item
    await this.updateRoomData(roomId, { currentRoundItem: null })

    const updatedRoomData = await this.getRoomData(roomId)
    
    console.log(`[Redis] Distributed ${amount} from ${winnerNickname} to ${ownerNickname} in room ${roomId}`)
    
    return {
      success: true,
      winnerNickname,
      ownerNickname,
      amount,
      ownerNewCapital: owner.capital + amount,
      state: updatedRoomData
    }
  }

  // State management
  async getState(roomId: string): Promise<any> {
    const roomData = await this.getRoomData(roomId)
    if (!roomData) {
      return null
    }

    const guests = await this.getAllGuests(roomId)
    const allBids = await this.getAllBids(roomId)
    const currentRoundBids = allBids.filter(bid => bid.round === roomData.currentRound)
    const highestBid = currentRoundBids.length > 0 ?
      currentRoundBids.reduce((max, bid) => bid.amount > max.amount ? bid : max) : null

    return {
      ...roomData,
      guestCount: guests.length,
      guests: guests.map(guest => ({
        nickname: guest.nickname,
        capital: guest.capital,
        hasBidInCurrentRound: guest.hasBidInCurrentRound,
      })),
      bids: allBids.slice(-20), // Last 20 bids
      currentHighestBid: highestBid,
      lastGuestJoinTime: roomData.lastGuestJoinTime,
    }
  }
}

export const auctionRoom = new RedisAuctionRoom()
