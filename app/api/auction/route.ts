import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for auction rooms (in production, use a database)
const auctionRooms = new Map()

// Add some debugging
console.log("[API] Module loaded, auctionRooms initialized")

// Room data structure
class AuctionRoom {
  constructor(id: string, initialCapital: number, auctionName?: string) {
    this.id = id
    this.name = auctionName || "경매"
    this.initialCapital = Number.parseInt(initialCapital.toString())
    this.status = "PRE-START" // PRE-START, ACTIVE, ENDED
    this.host = null
    this.guests = new Map() // nickname -> { socketId, capital, nickname, hasBidInCurrentRound }
    this.bids = [] // Array of { nickname, amount, timestamp, round }
    this.currentRound = 0
    this.roundStatus = "WAITING" // WAITING, ACTIVE, ENDED
    this.currentRoundItem = null // 현재 라운드의 경매 물품
    this.auctionItems = new Map() // nickname -> AuctionItem (게스트들이 등록한 물품들)
    this.createdAt = new Date()
  }

  addGuest(socketId: string, nickname: string) {
    if (this.guests.size >= 6) {
      throw new Error("방이 가득 찼습니다")
    }

    if (this.guests.has(nickname)) {
      throw new Error("이미 사용 중인 닉네임입니다")
    }

    this.guests.set(nickname, {
      socketId,
      nickname,
      capital: this.initialCapital,
      hasBidInCurrentRound: false,
    })
  }

  removeGuest(nickname: string) {
    this.guests.delete(nickname)
  }

  modifyGuestCapital(nickname: string, newCapital: number) {
    const guest = this.guests.get(nickname)
    if (!guest) {
      throw new Error("게스트를 찾을 수 없습니다")
    }

    if (newCapital < 0) {
      throw new Error("자본금은 0 이상이어야 합니다")
    }

    const oldCapital = guest.capital
    guest.capital = newCapital

    console.log(`[v0] Capital modified for ${nickname}: ${oldCapital} -> ${newCapital}`)
    
    return {
      nickname,
      oldCapital,
      newCapital,
      difference: newCapital - oldCapital
    }
  }

  placeBid(nickname: string, amount: number, auctionMethod = 'fixed') {
    const guest = this.guests.get(nickname)
    if (!guest) {
      throw new Error("게스트를 찾을 수 없습니다")
    }

    if (amount <= 0) {
      throw new Error("입찰 금액은 0보다 커야 합니다")
    }

    if (this.status !== "ACTIVE" || this.roundStatus !== "ACTIVE") {
      throw new Error("현재 라운드가 활성화되지 않았습니다")
    }

    if (auctionMethod === 'fixed') {
      // 고정입찰: 기존 로직
      if (amount > guest.capital) {
        throw new Error("보유 자본보다 높은 금액을 입찰할 수 없습니다")
      }

      // 라운드별 중복 입찰 방지
      if (guest.hasBidInCurrentRound) {
        throw new Error("이미 이번 라운드에서 입찰하셨습니다")
      }

      // Update guest capital
      guest.capital -= amount

      // Mark guest as having bid in current round
      guest.hasBidInCurrentRound = true

      // Add bid to history
      this.bids.push({
        nickname,
        amount,
        timestamp: new Date(),
        round: this.currentRound,
      })

      return { success: true, type: 'fixed' }
    } else if (auctionMethod === 'dynamic') {
      // 변동입찰: 새로운 로직
      if (amount > guest.capital) {
        throw new Error("보유 자본보다 높은 금액을 입찰할 수 없습니다")
      }

      // 현재 라운드의 최고 입찰 확인
      const currentRoundBids = this.bids.filter(bid => bid.round === this.currentRound)
      const currentHighestBid = currentRoundBids.length > 0 ?
        Math.max(...currentRoundBids.map(bid => bid.amount)) : 0

      if (amount <= currentHighestBid) {
        throw new Error(`현재 최고 입찰가(${currentHighestBid}원)보다 높은 금액을 입찰해야 합니다`)
      }

      // 이전 입찰 취소 및 자본 환원
      const previousBid = this.bids.find(bid =>
        bid.nickname === nickname && bid.round === this.currentRound
      )
      if (previousBid) {
        guest.capital += previousBid.amount // 이전 입찰 금액 환원
        // 이전 입찰 기록 제거
        this.bids = this.bids.filter(bid =>
          !(bid.nickname === nickname && bid.round === this.currentRound)
        )
      }

      // 다른 참가자들의 입찰 취소 및 상태 초기화
      const otherBids = this.bids.filter(bid =>
        bid.nickname !== nickname && bid.round === this.currentRound
      )

      console.log(`[API] Dynamic bid: Cancelling ${otherBids.length} other bids`)

      for (const bid of otherBids) {
        const otherGuest = this.guests.get(bid.nickname)
        if (otherGuest) {
          otherGuest.capital += bid.amount // 자본 환원
          otherGuest.hasBidInCurrentRound = false // 입찰 상태 초기화
          console.log(`[API] Cancelled bid for ${bid.nickname}: +${bid.amount}, new capital: ${otherGuest.capital}`)
        }
      }

      // 다른 참가자들의 입찰 기록 완전 제거
      this.bids = this.bids.filter(bid =>
        !(bid.nickname !== nickname && bid.round === this.currentRound)
      )

      console.log(`[API] Removed ${otherBids.length} bid records from history`)

      // 새로운 입찰 처리
      guest.capital -= amount
      guest.hasBidInCurrentRound = true

      // Add new bid to history
      this.bids.push({
        nickname,
        amount,
        timestamp: new Date(),
        round: this.currentRound,
      })

      return {
        success: true,
        type: 'dynamic',
        previousBid: previousBid?.amount || 0,
        cancelledBids: otherBids.map(bid => ({ nickname: bid.nickname, amount: bid.amount }))
      }
    }

    return { success: false }
  }

  startAuction() {
    if (this.guests.size === 0) {
      throw new Error("참가자가 없습니다")
    }
    this.status = "ACTIVE"
  }

  startRound() {
    if (this.status !== "ACTIVE") {
      throw new Error("경매가 시작되지 않았습니다")
    }
    this.currentRound++
    this.roundStatus = "ACTIVE"
    
    // 모든 게스트의 입찰 상태 초기화
    console.log(`[v0] Resetting bid status for ${this.guests.size} guests in round ${this.currentRound}`)
    for (const guest of this.guests.values()) {
      console.log(`[v0] Guest ${guest.nickname}: hasBidInCurrentRound = ${guest.hasBidInCurrentRound} -> false`)
      guest.hasBidInCurrentRound = false
    }
  }

  endRound() {
    if (this.roundStatus !== "ACTIVE") {
      throw new Error("활성화된 라운드가 없습니다")
    }
    this.roundStatus = "ENDED"
    
    const roundBids = this.bids.filter(bid => bid.round === this.currentRound)
    const winner = roundBids.length > 0 ? roundBids.reduce((max, bid) => bid.amount > max.amount ? bid : max) : null
    
    const roundResults = {
      round: this.currentRound,
      bids: roundBids.sort((a, b) => b.amount - a.amount), // Sort by amount descending
      winner
    }
    
    // 라운드 종료 후 경매 물품은 유지 (낙찰 금액 전달 후 수동으로 초기화)
    
    return roundResults
  }

  endAuction() {
    if (this.status !== "ACTIVE") {
      throw new Error("활성화된 경매가 없습니다")
    }
    this.status = "ENDED"
    this.roundStatus = "ENDED"
    
    // 최종 결과 계산
    const finalResults = {
      totalRounds: this.currentRound,
      participants: Array.from(this.guests.values()).map(guest => ({
        nickname: guest.nickname,
        finalCapital: guest.capital,
        totalBidAmount: this.initialCapital - guest.capital,
        wonItems: this.getWonItems(guest.nickname)
      })),
      allBids: this.bids,
      auctionItems: Array.from(this.auctionItems.values())
    }
    
    return finalResults
  }

  getWonItems(nickname: string) {
    // 각 라운드별로 낙찰자 확인
    const wonItems = []
    for (let round = 1; round <= this.currentRound; round++) {
      const roundBids = this.bids.filter(bid => bid.round === round)
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

  registerAuctionItem(itemData: any, round: number) {
    if (this.roundStatus !== "WAITING" && this.roundStatus !== "ENDED") {
      throw new Error("라운드가 대기 상태이거나 종료된 상태일 때만 물품을 등록할 수 있습니다")
    }

    // itemData에 ownerNickname이 없으면 추가
    const itemWithOwner = {
      ...itemData,
      ownerNickname: itemData.createdBy || itemData.ownerNickname || "알 수 없음"
    }

    this.currentRoundItem = {
      item: itemWithOwner,
      registeredAt: new Date()
    }

    return {
      success: true,
      item: this.currentRoundItem
    }
  }

  distributeWinningAmount(winnerNickname: string, amount: number, ownerNickname: string) {
    if (!this.currentRoundItem) {
      throw new Error("등록된 경매 물품이 없습니다")
    }

    const winner = this.guests.get(winnerNickname)
    const owner = this.guests.get(ownerNickname)

    if (!winner) {
      throw new Error("낙찰자를 찾을 수 없습니다")
    }

    if (!owner) {
      throw new Error("물품 등록자를 찾을 수 없습니다")
    }

    // 물품 등록자에게 낙찰금액 전달 (자본금 증가)
    owner.capital += amount

    // 낙찰 금액 분배 후 경매 물품 초기화
    this.currentRoundItem = null

    return {
      success: true,
      winnerNickname,
      ownerNickname,
      amount,
      ownerNewCapital: owner.capital
    }
  }

  // 경매 물품 저장 (게스트가 등록한 물품)
  saveAuctionItem(itemData: any, guestName: string) {
    const item = {
      ...itemData,
      id: itemData.id || Date.now().toString(),
      createdBy: guestName,
      createdAt: new Date().toISOString(),
      roomId: this.id
    }
    
    this.auctionItems.set(guestName, item)
    
    return {
      success: true,
      item
    }
  }

  // 모든 경매 물품 조회
  getAllAuctionItems() {
    const items: { [guestName: string]: any } = {}
    for (const [guestName, item] of this.auctionItems) {
      items[guestName] = item
    }
    return items
  }

  getState() {
    const currentRoundBids = this.bids.filter(bid => bid.round === this.currentRound)
    const highestBid = currentRoundBids.length > 0 ?
      currentRoundBids.reduce((max, bid) => bid.amount > max.amount ? bid : max) : null

    return {
      id: this.id,
      name: this.name,
      status: this.status,
      initialCapital: this.initialCapital,
      guestCount: this.guests.size,
      guests: Array.from(this.guests.values()).map((guest) => ({
        nickname: guest.nickname,
        capital: guest.capital,
        hasBidInCurrentRound: guest.hasBidInCurrentRound,
      })),
      bids: this.bids.slice(-20), // Last 20 bids
      currentRound: this.currentRound,
      roundStatus: this.roundStatus,
      currentHighestBid: highestBid,
      currentRoundItem: this.currentRoundItem,
    }
  }
}

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function GET(request: NextRequest) {
  try {
    console.log("[API] GET request received")
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')

    console.log("[API] GET request for roomId:", roomId)
    console.log("[API] Available rooms:", Array.from(auctionRooms.keys()))
    console.log("[API] Request URL:", request.url)

    if (!roomId) {
      console.log("[API] No roomId provided")
      return NextResponse.json({ success: false, error: "Room ID is required" }, { status: 400 })
    }

    const room = auctionRooms.get(roomId)
    if (!room) {
      console.log("[API] Room not found:", roomId)
      console.log("[API] Creating temporary room for testing...")
      
      // For development: create a temporary room if it doesn't exist
      const tempRoom = new AuctionRoom(roomId, 10000)
      auctionRooms.set(roomId, tempRoom)
      console.log("[API] Created temporary room:", roomId)
      
      const state = tempRoom.getState()
      console.log("[API] Returning temporary room state:", JSON.stringify(state, null, 2))
      return NextResponse.json({ success: true, state })
    }

    const state = room.getState()
    console.log("[API] Returning state for room:", roomId, "State:", JSON.stringify(state, null, 2))
    return NextResponse.json({ success: true, state })
  } catch (error) {
    console.error("[API] Error in GET handler:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json()
    
    switch (action) {
      case 'createRoom':
        const { initialCapital, auctionName } = data
        const roomId = generateRoomId()
        const room = new AuctionRoom(roomId, initialCapital, auctionName)
        auctionRooms.set(roomId, room)
        console.log("[API] Created room:", roomId, "with capital:", initialCapital)
        console.log("[API] Available rooms after creation:", Array.from(auctionRooms.keys()))
        
        return NextResponse.json({
          success: true,
          roomId,
          joinUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/room/${roomId}`,
          state: room.getState()
        })

      case 'joinRoom':
        const { roomId: joinRoomId, nickname } = data
        const joinRoom = auctionRooms.get(joinRoomId)
        
        if (!joinRoom) {
          return NextResponse.json({ success: false, error: "존재하지 않는 방입니다" })
        }

        try {
          joinRoom.addGuest('temp-socket-id', nickname)
          const guest = joinRoom.guests.get(nickname)
          
          console.log(`[API] Guest ${nickname} joined room ${joinRoomId}. Total guests: ${joinRoom.guests.size}`)
          
          return NextResponse.json({
            success: true,
            nickname,
            capital: joinRoom.initialCapital,
            status: joinRoom.status,
            currentRound: joinRoom.currentRound,
            roundStatus: joinRoom.roundStatus,
            hasBidInCurrentRound: guest.hasBidInCurrentRound,
            guestCount: joinRoom.guests.size,
            totalGuests: Array.from(joinRoom.guests.values()).map(g => g.nickname)
          })
        } catch (error: any) {
          console.error(`[API] Failed to add guest ${nickname} to room ${joinRoomId}:`, error)
          return NextResponse.json({ success: false, error: error.message })
        }

      case 'startAuction':
        const { roomId: startRoomId } = data
        const startRoom = auctionRooms.get(startRoomId)
        
        if (!startRoom) {
          return NextResponse.json({ success: false, error: "존재하지 않는 방입니다" })
        }

        try {
          startRoom.startAuction()
          return NextResponse.json({ success: true, state: startRoom.getState() })
        } catch (error: any) {
          return NextResponse.json({ success: false, error: error.message })
        }

      case 'startRound':
        const { roomId: roundRoomId } = data
        const roundRoom = auctionRooms.get(roundRoomId)
        
        if (!roundRoom) {
          return NextResponse.json({ success: false, error: "존재하지 않는 방입니다" })
        }

        try {
          roundRoom.startRound()
          return NextResponse.json({ 
            success: true, 
            state: roundRoom.getState(),
            round: roundRoom.currentRound,
            canBid: true
          })
        } catch (error: any) {
          return NextResponse.json({ success: false, error: error.message })
        }

      case 'endRound':
        const { roomId: endRoomId } = data
        const endRoom = auctionRooms.get(endRoomId)
        
        if (!endRoom) {
          return NextResponse.json({ success: false, error: "존재하지 않는 방입니다" })
        }

        try {
          const roundResults = endRoom.endRound()
          return NextResponse.json({ 
            success: true, 
            state: endRoom.getState(),
            roundResults
          })
        } catch (error: any) {
          return NextResponse.json({ success: false, error: error.message })
        }

      case 'endAuction':
        const { roomId: endAuctionRoomId } = data
        const endAuctionRoom = auctionRooms.get(endAuctionRoomId)
        
        if (!endAuctionRoom) {
          return NextResponse.json({ success: false, error: "존재하지 않는 방입니다" })
        }

        try {
          const finalResults = endAuctionRoom.endAuction()
          return NextResponse.json({ 
            success: true, 
            state: endAuctionRoom.getState(),
            finalResults
          })
        } catch (error: any) {
          return NextResponse.json({ success: false, error: error.message })
        }

      case 'placeBid':
        const { roomId: bidRoomId, nickname: bidNickname, amount, auctionMethod = 'fixed' } = data
        console.log("[API] Place bid request:", { bidRoomId, bidNickname, amount, auctionMethod })
        
        const bidRoom = auctionRooms.get(bidRoomId)
        
        if (!bidRoom) {
          console.log("[API] Room not found for bid:", bidRoomId)
          return NextResponse.json({ success: false, error: "존재하지 않는 방입니다" })
        }

        try {
          console.log("[API] Placing bid in room:", bidRoomId)
          const bidResult = bidRoom.placeBid(bidNickname, amount, auctionMethod)
          const guest = bidRoom.guests.get(bidNickname)
          const state = bidRoom.getState()
          
          console.log("[API] Bid successful, new state:", state)
          return NextResponse.json({
            success: true,
            bidResult,
            state,
            remainingCapital: guest.capital,
            hasBidInCurrentRound: guest.hasBidInCurrentRound
          })
        } catch (error: any) {
          console.log("[API] Bid failed:", error.message)
          return NextResponse.json({ success: false, error: error.message })
        }

      case 'modifyCapital':
        const { roomId: modRoomId, nickname: modNickname, newCapital } = data
        const modRoom = auctionRooms.get(modRoomId)
        
        if (!modRoom) {
          return NextResponse.json({ success: false, error: "존재하지 않는 방입니다" })
        }

        try {
          const result = modRoom.modifyGuestCapital(modNickname, newCapital)
          return NextResponse.json({
            success: true,
            state: modRoom.getState(),
            result
          })
        } catch (error: any) {
          return NextResponse.json({ success: false, error: error.message })
        }

      case 'getState':
        const { roomId: stateRoomId } = data
        const stateRoom = auctionRooms.get(stateRoomId)
        
        if (!stateRoom) {
          return NextResponse.json({ success: false, error: "존재하지 않는 방입니다" })
        }

        return NextResponse.json({
          success: true,
          state: stateRoom.getState()
        })

      case 'registerAuctionItem':
        const { roomId: regRoomId, itemData, round } = data
        const regRoom = auctionRooms.get(regRoomId)
        
        if (!regRoom) {
          return NextResponse.json({ success: false, error: "존재하지 않는 방입니다" })
        }

        try {
          const result = regRoom.registerAuctionItem(itemData, round)
          return NextResponse.json({
            success: true,
            state: regRoom.getState(),
            result
          })
        } catch (error: any) {
          return NextResponse.json({ success: false, error: error.message })
        }

      case 'getAuctionItems':
        const { roomId: itemsRoomId } = data
        const itemsRoom = auctionRooms.get(itemsRoomId)
        
        if (!itemsRoom) {
          return NextResponse.json({ success: false, error: "존재하지 않는 방입니다" })
        }

        const items = itemsRoom.getAllAuctionItems()
        return NextResponse.json({
          success: true,
          items
        })

      case 'getCurrentRoundItem':
        const { roomId: currentItemRoomId } = data
        const currentItemRoom = auctionRooms.get(currentItemRoomId)
        
        if (!currentItemRoom) {
          return NextResponse.json({ success: false, error: "존재하지 않는 방입니다" })
        }

        return NextResponse.json({
          success: true,
          currentRoundItem: currentItemRoom.currentRoundItem,
          currentRound: currentItemRoom.currentRound
        })

      case 'saveAuctionItem':
        const { roomId: saveRoomId, itemData: saveItemData, guestName } = data
        const saveRoom = auctionRooms.get(saveRoomId)
        
        if (!saveRoom) {
          return NextResponse.json({ success: false, error: "존재하지 않는 방입니다" })
        }

        try {
          const result = saveRoom.saveAuctionItem(saveItemData, guestName)
          return NextResponse.json({
            success: true,
            result
          })
        } catch (error: any) {
          return NextResponse.json({ success: false, error: error.message })
        }

      case 'distributeWinningAmount':
        const { roomId: distRoomId, winnerNickname, amount: winningAmount, ownerNickname } = data
        const distRoom = auctionRooms.get(distRoomId)
        
        if (!distRoom) {
          return NextResponse.json({ success: false, error: "존재하지 않는 방입니다" })
        }

        try {
          const result = distRoom.distributeWinningAmount(winnerNickname, winningAmount, ownerNickname)
          return NextResponse.json({
            success: true,
            state: distRoom.getState(),
            result
          })
        } catch (error: any) {
          return NextResponse.json({ success: false, error: error.message })
        }

      default:
        return NextResponse.json({ success: false, error: "알 수 없는 액션입니다" })
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다" })
  }
}
