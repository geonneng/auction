import { NextRequest, NextResponse } from 'next/server'
import { simpleAuctionRoom as auctionRoom } from '@/lib/simple-storage'

// Generate room ID helper
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function GET(request: NextRequest) {
  try {
    console.log("[API] GET request received")
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')

    console.log("[API] GET request for roomId:", roomId)
    console.log("[API] Request URL:", request.url)

    if (!roomId) {
      console.log("[API] No roomId provided")
      return NextResponse.json({ success: false, error: "Room ID is required" }, { status: 400 })
    }

    const state = await auctionRoom.getState(roomId)
    if (!state) {
      console.log("[API] Room not found:", roomId)
      console.log("[API] Creating temporary room for testing...")
      
      // For development: create a temporary room if it doesn't exist
      const tempRoomData = await auctionRoom.createRoom(roomId, 10000)
      console.log("[API] Created temporary room:", roomId)
      
      const tempState = await auctionRoom.getState(roomId)
      console.log("[API] Returning temporary room state:", JSON.stringify(tempState, null, 2))
      return NextResponse.json({ success: true, state: tempState })
    }

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
        const roomData = await auctionRoom.createRoom(roomId, initialCapital, auctionName)
        console.log("[API] Created room:", roomId, "with capital:", initialCapital)
        
        const state = await auctionRoom.getState(roomId)
        
        return NextResponse.json({
          success: true,
          roomId,
          joinUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/room/${roomId}`,
          state
        })

      case 'joinRoom':
        const { roomId: joinRoomId, nickname } = data
        
        try {
          const guest = await auctionRoom.addGuest(joinRoomId, 'temp-socket-id', nickname)
          const roomState = await auctionRoom.getState(joinRoomId)
          
          console.log(`[API] Guest ${nickname} joined room ${joinRoomId}. Total guests: ${roomState?.guestCount}`)
          
          return NextResponse.json({
            success: true,
            nickname,
            capital: guest.capital,
            status: roomState?.status || 'PRE-START',
            currentRound: roomState?.currentRound || 0,
            roundStatus: roomState?.roundStatus || 'WAITING',
            hasBidInCurrentRound: guest.hasBidInCurrentRound,
            guestCount: roomState?.guestCount || 0,
            totalGuests: roomState?.guests?.map((g: any) => g.nickname) || [],
            lastGuestJoinTime: roomState?.lastGuestJoinTime || Date.now()
          })
        } catch (error: any) {
          console.error(`[API] Failed to add guest ${nickname} to room ${joinRoomId}:`, error)
          return NextResponse.json({ success: false, error: error.message })
        }

      case 'startAuction':
        const { roomId: startRoomId } = data

        try {
          const updatedRoomData = await auctionRoom.startAuction(startRoomId)
          const state = await auctionRoom.getState(startRoomId)
          return NextResponse.json({ success: true, state })
        } catch (error: any) {
          return NextResponse.json({ success: false, error: error.message })
        }

      case 'startRound':
        const { roomId: roundRoomId } = data

        try {
          const updatedRoomData = await auctionRoom.startRound(roundRoomId)
          const state = await auctionRoom.getState(roundRoomId)
          return NextResponse.json({ 
            success: true, 
            state,
            round: updatedRoomData.currentRound,
            canBid: true
          })
        } catch (error: any) {
          return NextResponse.json({ success: false, error: error.message })
        }

      case 'endRound':
        const { roomId: endRoomId } = data

        try {
          const { roomData: updatedRoomData, roundResults } = await auctionRoom.endRound(endRoomId)
          const state = await auctionRoom.getState(endRoomId)
          return NextResponse.json({ 
            success: true, 
            state,
            roundResults
          })
        } catch (error: any) {
          return NextResponse.json({ success: false, error: error.message })
        }

      case 'endAuction':
        const { roomId: endAuctionRoomId } = data

        try {
          const { roomData: updatedRoomData, finalResults } = await auctionRoom.endAuction(endAuctionRoomId)
          const state = await auctionRoom.getState(endAuctionRoomId)
          return NextResponse.json({ 
            success: true, 
            state,
            finalResults
          })
        } catch (error: any) {
          return NextResponse.json({ success: false, error: error.message })
        }

      case 'placeBid':
        const { roomId: bidRoomId, nickname: bidNickname, amount, auctionMethod = 'fixed' } = data
        
        try {
          console.log(`[API] Placing bid: ${bidNickname} - ${amount} in room ${bidRoomId}`)
          const result = await auctionRoom.placeBid(bidRoomId, bidNickname, amount, auctionMethod)
          
          return NextResponse.json(result)
        } catch (error: any) {
          console.error(`[API] Failed to place bid for ${bidNickname}:`, error)
          return NextResponse.json({ success: false, error: error.message })
        }

      case 'modifyCapital':
        const { roomId: modifyRoomId, nickname: modifyNickname, newCapital } = data
        
        try {
          const updatedRoomData = await auctionRoom.modifyCapital(modifyRoomId, modifyNickname, newCapital)
          const state = await auctionRoom.getState(modifyRoomId)
          return NextResponse.json({ success: true, state })
        } catch (error: any) {
          return NextResponse.json({ success: false, error: error.message })
        }

      case 'registerAuctionItem':
        const { roomId: itemRoomId, item, round } = data
        
        try {
          const result = await auctionRoom.registerAuctionItem(itemRoomId, item, round)
          const state = await auctionRoom.getState(itemRoomId)
          return NextResponse.json({ success: true, ...result, state })
        } catch (error: any) {
          return NextResponse.json({ success: false, error: error.message })
        }

      case 'saveAuctionItem':
        const { roomId: saveRoomId, item: saveItem, guestName } = data
        
        try {
          const result = await auctionRoom.saveAuctionItem(saveRoomId, saveItem, guestName)
          return NextResponse.json(result)
        } catch (error: any) {
          return NextResponse.json({ success: false, error: error.message })
        }

      case 'getAuctionItems':
        const { roomId: getItemsRoomId } = data
        
        try {
          const items = await auctionRoom.getAllAuctionItems(getItemsRoomId)
          return NextResponse.json({ success: true, items })
        } catch (error: any) {
          return NextResponse.json({ success: false, error: error.message })
        }

      case 'getCurrentRoundItem':
        const { roomId: getCurrentRoomId } = data
        
        try {
          const state = await auctionRoom.getState(getCurrentRoomId)
          return NextResponse.json({
            success: true,
            currentRoundItem: state?.currentRoundItem || null
          })
        } catch (error: any) {
          return NextResponse.json({ success: false, error: error.message })
        }

      case 'distributeWinningAmount':
        const { roomId: distributeRoomId, winnerNickname, amount: winAmount, ownerNickname } = data
        
        try {
          const result = await auctionRoom.distributeWinningAmount(
            distributeRoomId, 
            winnerNickname, 
            winAmount, 
            ownerNickname
          )
          return NextResponse.json(result)
        } catch (error: any) {
          return NextResponse.json({ success: false, error: error.message })
        }

      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[API] Error in POST handler:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}