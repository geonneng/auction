import { NextRequest, NextResponse } from 'next/server'

// 메모리 기반 저장소 - 간단하고 안정적
const auctionRooms = new Map()

// Generate room ID helper
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 })
    }

    const room = auctionRooms.get(roomId)
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, room })
  } catch (error) {
    console.error("GET Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, roomId, nickname, initialCapital, auctionName, item, bidAmount, round } = await request.json()
    
    let result: any

    switch (action) {
      case 'createRoom':
        const newRoomId = generateRoomId()
        const newRoom = {
          id: newRoomId,
          name: auctionName || `경매방 ${newRoomId}`,
          initialCapital,
          guests: [],
          bids: [],
          items: [],
          currentRound: 0,
          status: 'PRE-START',
          roundStatus: 'WAITING',
          createdAt: new Date()
        }
        auctionRooms.set(newRoomId, newRoom)
        return NextResponse.json({ 
          success: true, 
          roomId: newRoomId, 
          room: newRoom,
          joinUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/room/${newRoomId}`
        })

      case 'joinRoom':
        if (!roomId || !nickname) {
          return NextResponse.json({ success: false, error: "Room ID and nickname are required" }, { status: 400 })
        }
        
        const room = auctionRooms.get(roomId)
        if (!room) {
          return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 })
        }

        // 중복 닉네임 체크
        if (room.guests.some((g: any) => g.nickname === nickname)) {
          return NextResponse.json({ success: false, error: "Nickname already exists" }, { status: 400 })
        }

        const newGuest = {
          socketId: `temp-${Date.now()}`,
          nickname,
          capital: room.initialCapital,
          hasBidInCurrentRound: false
        }
        room.guests.push(newGuest)
        
        return NextResponse.json({ success: true, guest: newGuest })

      case 'addItem':
        if (!roomId || !item) {
          return NextResponse.json({ success: false, error: "Room ID and item are required" }, { status: 400 })
        }
        
        const itemRoom = auctionRooms.get(roomId)
        if (!itemRoom) {
          return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 })
        }

        itemRoom.items.push(item)
        return NextResponse.json({ success: true, item })

      case 'startRound':
        if (!roomId || !item) {
          return NextResponse.json({ success: false, error: "Room ID and item are required" }, { status: 400 })
        }
        
        const roundRoom = auctionRooms.get(roomId)
        if (!roundRoom) {
          return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 })
        }

        roundRoom.currentRound++
        roundRoom.roundStatus = 'ACTIVE'
        roundRoom.currentItem = item
        
        // Reset bid status for all guests
        roundRoom.guests.forEach((guest: any) => {
          guest.hasBidInCurrentRound = false
        })
        
        return NextResponse.json({ success: true, room: roundRoom })

      case 'placeBid':
        if (!roomId || !nickname || bidAmount === undefined || round === undefined) {
          return NextResponse.json({ success: false, error: "Room ID, nickname, bid amount, and round are required" }, { status: 400 })
        }
        
        const bidRoom = auctionRooms.get(roomId)
        if (!bidRoom) {
          return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 })
        }

        const guest = bidRoom.guests.find((g: any) => g.nickname === nickname)
        if (!guest) {
          return NextResponse.json({ success: false, error: "Guest not found" }, { status: 404 })
        }

        if (guest.capital < bidAmount) {
          return NextResponse.json({ success: false, error: "Insufficient capital" }, { status: 400 })
        }

        const newBid = {
          nickname,
          amount: bidAmount,
          timestamp: new Date(),
          round
        }
        
        bidRoom.bids.push(newBid)
        guest.hasBidInCurrentRound = true
        guest.capital -= bidAmount
        
        return NextResponse.json({ success: true, bid: newBid })

      case 'endRound':
        if (!roomId) {
          return NextResponse.json({ success: false, error: "Room ID is required" }, { status: 400 })
        }
        
        const endRoom = auctionRooms.get(roomId)
        if (!endRoom) {
          return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 })
        }

        endRoom.roundStatus = 'ENDED'
        return NextResponse.json({ success: true, room: endRoom })

      case 'resetRoom':
        if (!roomId) {
          return NextResponse.json({ success: false, error: "Room ID is required" }, { status: 400 })
        }
        
        const resetRoom = auctionRooms.get(roomId)
        if (!resetRoom) {
          return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 })
        }

        resetRoom.status = 'PRE-START'
        resetRoom.currentRound = 0
        resetRoom.roundStatus = 'WAITING'
        resetRoom.bids = []
        resetRoom.items = []
        resetRoom.guests.forEach((guest: any) => {
          guest.capital = resetRoom.initialCapital
          guest.hasBidInCurrentRound = false
        })
        
        return NextResponse.json({ success: true, room: resetRoom })

      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("POST Error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}