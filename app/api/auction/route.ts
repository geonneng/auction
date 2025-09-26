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

  placeBid(nickname: string, amount: number) {
    const guest = this.guests.get(nickname)
    if (!guest) {
      throw new Error("게스트를 찾을 수 없습니다")
    }

    if (amount <= 0 || amount > guest.capital) {
      throw new Error("유효하지 않은 입찰 금액입니다")
    }

    if (this.status !== "ACTIVE" || this.roundStatus !== "ACTIVE") {
      throw new Error("현재 라운드가 활성화되지 않았습니다")
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

    return true
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
    const roundResults = {
      round: this.currentRound,
      bids: roundBids.sort((a, b) => b.amount - a.amount), // Sort by amount descending
      winner: roundBids.length > 0 ? roundBids.reduce((max, bid) => bid.amount > max.amount ? bid : max) : null
    }
    
    return roundResults
  }

  getState() {
    return {
      id: this.id,
      name: this.name,
      status: this.status,
      initialCapital: this.initialCapital,
      guests: Array.from(this.guests.values()).map((guest) => ({
        nickname: guest.nickname,
        capital: guest.capital,
        hasBidInCurrentRound: guest.hasBidInCurrentRound,
      })),
      bids: this.bids.slice(-20), // Last 20 bids
      guestCount: this.guests.size,
      currentRound: this.currentRound,
      roundStatus: this.roundStatus,
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
          
          return NextResponse.json({
            success: true,
            nickname,
            capital: joinRoom.initialCapital,
            status: joinRoom.status,
            currentRound: joinRoom.currentRound,
            roundStatus: joinRoom.roundStatus,
            hasBidInCurrentRound: guest.hasBidInCurrentRound,
          })
        } catch (error: any) {
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

      case 'placeBid':
        const { roomId: bidRoomId, nickname: bidNickname, amount } = data
        console.log("[API] Place bid request:", { bidRoomId, bidNickname, amount })
        
        const bidRoom = auctionRooms.get(bidRoomId)
        
        if (!bidRoom) {
          console.log("[API] Room not found for bid:", bidRoomId)
          return NextResponse.json({ success: false, error: "존재하지 않는 방입니다" })
        }

        try {
          console.log("[API] Placing bid in room:", bidRoomId)
          bidRoom.placeBid(bidNickname, amount)
          const guest = bidRoom.guests.get(bidNickname)
          const state = bidRoom.getState()
          
          console.log("[API] Bid successful, new state:", state)
          return NextResponse.json({
            success: true,
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

      default:
        return NextResponse.json({ success: false, error: "알 수 없는 액션입니다" })
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다" })
  }
}
