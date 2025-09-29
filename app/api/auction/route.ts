import { NextRequest, NextResponse } from 'next/server'

// 간단한 메모리 기반 저장소 - 데이터베이스 불필요
const auctionRooms = new Map()

// Generate room ID helper
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function GET(request: NextRequest) {
  try {
    console.log("[API] GET request received")
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')

    if (!roomId) {
      return NextResponse.json({ success: false, error: "Room ID is required" }, { status: 400 })
    }

    const room = auctionRooms.get(roomId)
    if (!room) {
      console.log("[API] Room not found:", roomId)
      return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, room })
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
        
        const roomData = {
          id: roomId,
          name: auctionName || `경매 ${roomId}`,
          initialCapital,
          status: 'PRE-START',
          guests: [],
          createdAt: new Date().toISOString()
        }
        
        auctionRooms.set(roomId, roomData)
        console.log("[API] Created room:", roomId, "with capital:", initialCapital)
        
        return NextResponse.json({
          success: true,
          roomId,
          joinUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/room/${roomId}`,
          room: roomData
        })

      case 'joinRoom':
        const { roomId: joinRoomId, nickname } = data
        
        const room = auctionRooms.get(joinRoomId)
        if (!room) {
          return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 })
        }
        
        // 중복 닉네임 체크
        if (room.guests.some((g: any) => g.nickname === nickname)) {
          return NextResponse.json({ success: false, error: "Nickname already exists" }, { status: 409 })
        }
        
        const guest = {
          nickname,
          capital: room.initialCapital,
          joinedAt: new Date().toISOString()
        }
        
        room.guests.push(guest)
        console.log(`[API] Guest ${nickname} joined room ${joinRoomId}. Total guests: ${room.guests.length}`)
        
        return NextResponse.json({
          success: true,
          nickname,
          capital: guest.capital,
          room
        })


      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[API] Error in POST handler:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}