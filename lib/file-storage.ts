// 파일 기반 저장소 - 외부 서비스 없이 간단한 해결책
import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), '.data')

// 데이터 디렉토리 생성
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

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
  guests: Guest[]
  bids: Bid[]
  auctionItems: { [guestName: string]: AuctionItem }
}

export class FileAuctionRoom {
  private getFilePath(roomId: string, type: 'room' | 'guests' | 'bids' | 'items' = 'room') {
    return path.join(DATA_DIR, `${roomId}-${type}.json`)
  }

  private async readFile(filePath: string, defaultValue: any = null) {
    try {
      const data = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(data)
    } catch {
      return defaultValue
    }
  }

  private async writeFile(filePath: string, data: any) {
    await ensureDataDir()
    await fs.writeFile(filePath, JSON.stringify(data, null, 2))
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
      guests: [],
      bids: [],
      auctionItems: {}
    }

    await this.writeFile(this.getFilePath(id), roomData)
    console.log(`[File] Created room ${id} with capital ${initialCapital}`)
    return roomData
  }

  async getRoomData(roomId: string): Promise<RoomData | null> {
    return await this.readFile(this.getFilePath(roomId))
  }

  async updateRoomData(roomId: string, updates: Partial<RoomData>): Promise<void> {
    const roomData = await this.getRoomData(roomId)
    if (!roomData) return

    const updatedData = { ...roomData, ...updates }
    await this.writeFile(this.getFilePath(roomId), updatedData)
  }

  // Guest management
  async addGuest(roomId: string, socketId: string, nickname: string): Promise<Guest> {
    const roomData = await this.getRoomData(roomId)
    if (!roomData) {
      throw new Error("존재하지 않는 방입니다")
    }

    // Check if room is full
    if (roomData.guests.length >= 6) {
      throw new Error("방이 가득 찼습니다")
    }

    // Check if nickname exists
    if (roomData.guests.some(g => g.nickname === nickname)) {
      throw new Error("이미 사용 중인 닉네임입니다")
    }

    const guest: Guest = {
      socketId,
      nickname,
      capital: roomData.initialCapital,
      hasBidInCurrentRound: false,
    }

    roomData.guests.push(guest)
    roomData.lastGuestJoinTime = Date.now()

    await this.writeFile(this.getFilePath(roomId), roomData)
    console.log(`[File] Guest ${nickname} joined room ${roomId}`)
    return guest
  }

  async getGuest(roomId: string, nickname: string): Promise<Guest | null> {
    const roomData = await this.getRoomData(roomId)
    if (!roomData) return null

    return roomData.guests.find(g => g.nickname === nickname) || null
  }

  async getAllGuests(roomId: string): Promise<Guest[]> {
    const roomData = await this.getRoomData(roomId)
    if (!roomData) return []

    return roomData.guests
  }

  async updateGuest(roomId: string, nickname: string, updates: Partial<Guest>): Promise<void> {
    const roomData = await this.getRoomData(roomId)
    if (!roomData) return

    const guestIndex = roomData.guests.findIndex(g => g.nickname === nickname)
    if (guestIndex === -1) return

    roomData.guests[guestIndex] = { ...roomData.guests[guestIndex], ...updates }
    await this.writeFile(this.getFilePath(roomId), roomData)
  }

  async getGuestCount(roomId: string): Promise<number> {
    const roomData = await this.getRoomData(roomId)
    return roomData?.guests.length || 0
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

    const guestIndex = roomData.guests.findIndex(g => g.nickname === nickname)
    if (guestIndex === -1) {
      throw new Error("참가자를 찾을 수 없습니다")
    }

    const guest = roomData.guests[guestIndex]

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
      const otherBids = roomData.bids.filter(b => b.nickname !== nickname && b.round === roomData.currentRound)

      // Restore capital for cancelled bids
      for (const otherBid of otherBids) {
        const otherGuestIndex = roomData.guests.findIndex(g => g.nickname === otherBid.nickname)
        if (otherGuestIndex !== -1) {
          roomData.guests[otherGuestIndex].capital += otherBid.amount
          roomData.guests[otherGuestIndex].hasBidInCurrentRound = false
        }
      }
      
      // Remove cancelled bids
      roomData.bids = roomData.bids.filter(b => !(b.nickname !== nickname && b.round === roomData.currentRound))
    }

    // Place new bid
    roomData.guests[guestIndex].capital -= amount
    roomData.guests[guestIndex].hasBidInCurrentRound = true
    roomData.bids.push(bid)

    await this.writeFile(this.getFilePath(roomId), roomData)

    console.log(`[File] Bid placed: ${nickname} - ${amount} in room ${roomId}`)
    
    return {
      success: true,
      type: auctionMethod,
      remainingCapital: roomData.guests[guestIndex].capital,
      hasBidInCurrentRound: true,
      state: await this.getState(roomId),
    }
  }

  async getRoundBids(roomId: string, round: number): Promise<Bid[]> {
    const roomData = await this.getRoomData(roomId)
    if (!roomData) return []

    return roomData.bids
      .filter(bid => bid.round === round)
      .map(bid => ({
        ...bid,
        timestamp: new Date(bid.timestamp),
      }))
  }

  async getAllBids(roomId: string): Promise<Bid[]> {
    const roomData = await this.getRoomData(roomId)
    if (!roomData) return []

    return roomData.bids
      .map(bid => ({
        ...bid,
        timestamp: new Date(bid.timestamp),
      }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Auction control
  async startAuction(roomId: string): Promise<RoomData> {
    const roomData = await this.getRoomData(roomId)
    if (!roomData) {
      throw new Error("존재하지 않는 방입니다")
    }

    if (roomData.guests.length === 0) {
      throw new Error("참가자가 없습니다")
    }

    roomData.status = "ACTIVE"
    await this.writeFile(this.getFilePath(roomId), roomData)
    
    console.log(`[File] Auction started in room ${roomId}`)
    return roomData
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
    roomData.guests.forEach(guest => {
      guest.hasBidInCurrentRound = false
    })

    // Update room data
    roomData.currentRound += 1
    roomData.roundStatus = "ACTIVE"

    await this.writeFile(this.getFilePath(roomId), roomData)

    console.log(`[File] Round ${roomData.currentRound} started in room ${roomId}`)
    return roomData
  }

  async endRound(roomId: string): Promise<{ roomData: RoomData; roundResults: any }> {
    const roomData = await this.getRoomData(roomId)
    if (!roomData) {
      throw new Error("존재하지 않는 방입니다")
    }

    if (roomData.roundStatus !== "ACTIVE") {
      throw new Error("활성화된 라운드가 없습니다")
    }

    const roundBids = roomData.bids.filter(bid => bid.round === roomData.currentRound)
    const winner = roundBids.length > 0 ? 
      roundBids.reduce((max, bid) => bid.amount > max.amount ? bid : max) : null

    const roundResults = {
      round: roomData.currentRound,
      bids: roundBids.sort((a, b) => b.amount - a.amount),
      winner
    }

    roomData.roundStatus = "ENDED"
    await this.writeFile(this.getFilePath(roomId), roomData)

    console.log(`[File] Round ${roomData.currentRound} ended in room ${roomId}`)
    return { roomData, roundResults }
  }

  async endAuction(roomId: string): Promise<{ roomData: RoomData; finalResults: any }> {
    const roomData = await this.getRoomData(roomId)
    if (!roomData) {
      throw new Error("존재하지 않는 방입니다")
    }

    if (roomData.status !== "ACTIVE") {
      throw new Error("활성화된 경매가 없습니다")
    }

    const finalResults = {
      totalRounds: roomData.currentRound,
      participants: roomData.guests.map(guest => ({
        nickname: guest.nickname,
        finalCapital: guest.capital,
        totalBidAmount: roomData.initialCapital - guest.capital,
        wonItems: this.getWonItems(guest.nickname, roomData.bids, roomData.currentRound)
      })),
      allBids: roomData.bids,
      auctionItems: Object.values(roomData.auctionItems)
    }

    roomData.status = "ENDED"
    roomData.roundStatus = "ENDED"
    
    await this.writeFile(this.getFilePath(roomId), roomData)

    console.log(`[File] Auction ended in room ${roomId}`)
    return { roomData, finalResults }
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
    const roomData = await this.getRoomData(roomId)
    if (!roomData) {
      throw new Error("존재하지 않는 방입니다")
    }

    const item: AuctionItem = {
      ...itemData,
      id: itemData.id || Date.now().toString(),
      createdBy: guestName,
      createdAt: new Date().toISOString(),
      roomId,
      ownerNickname: guestName,
    }
    
    roomData.auctionItems[guestName] = item
    await this.writeFile(this.getFilePath(roomId), roomData)
    
    return { success: true, item }
  }

  async getAllAuctionItems(roomId: string): Promise<{ [guestName: string]: AuctionItem }> {
    const roomData = await this.getRoomData(roomId)
    if (!roomData) return {}

    return roomData.auctionItems
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

    roomData.currentRoundItem = currentRoundItem
    await this.writeFile(this.getFilePath(roomId), roomData)

    return { success: true, item: currentRoundItem }
  }

  async modifyCapital(roomId: string, nickname: string, newCapital: number): Promise<RoomData> {
    const roomData = await this.getRoomData(roomId)
    if (!roomData) {
      throw new Error("존재하지 않는 방입니다")
    }

    const guestIndex = roomData.guests.findIndex(g => g.nickname === nickname)
    if (guestIndex === -1) {
      throw new Error("참가자를 찾을 수 없습니다")
    }

    roomData.guests[guestIndex].capital = newCapital
    await this.writeFile(this.getFilePath(roomId), roomData)
    
    console.log(`[File] Modified capital for ${nickname} to ${newCapital} in room ${roomId}`)
    return roomData
  }

  async distributeWinningAmount(roomId: string, winnerNickname: string, amount: number, ownerNickname: string): Promise<any> {
    const roomData = await this.getRoomData(roomId)
    if (!roomData || !roomData.currentRoundItem) {
      throw new Error("등록된 경매 물품이 없습니다")
    }

    const ownerIndex = roomData.guests.findIndex(g => g.nickname === ownerNickname)
    if (ownerIndex === -1) {
      throw new Error("물품 등록자를 찾을 수 없습니다")
    }

    // Transfer winning amount to item owner
    roomData.guests[ownerIndex].capital += amount

    // Clear current round item
    roomData.currentRoundItem = null

    await this.writeFile(this.getFilePath(roomId), roomData)
    
    console.log(`[File] Distributed ${amount} from ${winnerNickname} to ${ownerNickname} in room ${roomId}`)
    
    return {
      success: true,
      winnerNickname,
      ownerNickname,
      amount,
      ownerNewCapital: roomData.guests[ownerIndex].capital,
      state: roomData
    }
  }

  // State management
  async getState(roomId: string): Promise<any> {
    const roomData = await this.getRoomData(roomId)
    if (!roomData) {
      return null
    }

    const currentRoundBids = roomData.bids.filter(bid => bid.round === roomData.currentRound)
    const highestBid = currentRoundBids.length > 0 ?
      currentRoundBids.reduce((max, bid) => bid.amount > max.amount ? bid : max) : null

    return {
      ...roomData,
      guestCount: roomData.guests.length,
      guests: roomData.guests.map(guest => ({
        nickname: guest.nickname,
        capital: guest.capital,
        hasBidInCurrentRound: guest.hasBidInCurrentRound,
      })),
      bids: roomData.bids.slice(-20), // Last 20 bids
      currentHighestBid: highestBid,
      lastGuestJoinTime: roomData.lastGuestJoinTime,
    }
  }
}

export const fileAuctionRoom = new FileAuctionRoom()
