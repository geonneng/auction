import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Generate room ID helper
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')

    if (!roomId) {
      return NextResponse.json({ success: false, error: "Room ID is required" }, { status: 400 })
    }

    // 경매방 정보 가져오기
    const supabaseAdmin = getSupabaseAdmin()
    const { data: room, error: roomError } = await supabaseAdmin
      .from('auction_rooms')
      .select(`
        *,
        guests:guests(*),
        items:auction_items(*),
        bids:bids(*)
      `)
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 })
    }

    return NextResponse.json(
      { success: true, room },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    )
  } catch (error) {
    console.error("GET Error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // 환경 변수 확인
    const envSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    console.log("Environment check:", {
      hasUrl: !!envSupabaseUrl,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      url: envSupabaseUrl?.substring(0, 20) + "..."
    })
    
    if (!envSupabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase environment variables")
      return NextResponse.json({ 
        success: false, 
        error: "Server configuration error" 
      }, { status: 500 })
    }

    const { action, roomId, nickname, initialCapital, auctionName, item, itemData, guestName, bidAmount, round, newCapital, auctionType } = await request.json()
    const supabaseAdmin = getSupabaseAdmin()

    switch (action) {
      case 'createRoom':
        const newRoomId = generateRoomId()
        
        console.log("Creating room with ID:", newRoomId)
        console.log("Room data:", {
          id: newRoomId,
          name: auctionName || `경매방 ${newRoomId}`,
          initial_capital: initialCapital,
          status: 'PRE-START',
          round_status: 'WAITING',
          current_round: 0
        })

        // 경매방 생성
        const { data: newRoom, error: createRoomError } = await supabaseAdmin
          .from('auction_rooms')
          .insert({
            id: newRoomId,
            name: auctionName || `경매방 ${newRoomId}`,
            initial_capital: initialCapital,
            status: 'PRE-START',
            round_status: 'WAITING',
            current_round: 0
          })
          .select()
          .single()

        if (createRoomError) {
          console.error("Create room error:", createRoomError)
          console.error("Error details:", {
            message: createRoomError.message,
            details: createRoomError.details,
            hint: createRoomError.hint,
            code: createRoomError.code
          })
          return NextResponse.json({ 
            success: false, 
            error: "Failed to create room", 
            details: createRoomError.message,
            code: createRoomError.code
          }, { status: 500 })
        }

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
        
        // 경매방 존재 확인
        const { data: room, error: roomError } = await supabaseAdmin
          .from('auction_rooms')
          .select('initial_capital')
          .eq('id', roomId)
          .single()

        if (roomError || !room) {
          return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 })
        }

        // 중복 닉네임 체크: 있으면 기존 게스트 반환
        const { data: existingGuest } = await supabaseAdmin
          .from('guests')
          .select('*')
          .eq('room_id', roomId)
          .eq('nickname', nickname)
          .single()

        if (existingGuest) {
          return NextResponse.json({ success: true, guest: existingGuest, reused: true })
        }

        // 게스트 추가
        const { data: newGuest, error: joinGuestError } = await supabaseAdmin
          .from('guests')
          .insert({
            room_id: roomId,
            nickname,
            capital: room.initial_capital,
            has_bid_in_current_round: false
          })
          .select()
          .single()

        if (joinGuestError) {
          return NextResponse.json({ success: false, error: "Failed to join room" }, { status: 500 })
        }
        
        return NextResponse.json({ success: true, guest: newGuest })

      case 'addItem':
        if (!roomId || !item) {
          return NextResponse.json({ success: false, error: "Room ID and item are required" }, { status: 400 })
        }
        
        // 경매방 존재 확인
        const { data: roomCheck } = await supabaseAdmin
          .from('auction_rooms')
          .select('id')
          .eq('id', roomId)
          .single()

        if (!roomCheck) {
          return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 })
        }

        // 아이템 추가
        const { data: newItem, error: itemError } = await supabaseAdmin
          .from('auction_items')
          .insert({
            room_id: roomId,
            name: item.name,
            description: item.description,
            image_url: item.image_url,
            starting_price: item.starting_price,
            created_by: guestName || nickname || 'unknown'
          })
          .select()
          .single()

        if (itemError) {
          return NextResponse.json({ success: false, error: "Failed to add item" }, { status: 500 })
        }

        return NextResponse.json({ success: true, item: newItem })

      case 'getAuctionItems':
        if (!roomId) {
          return NextResponse.json({ success: false, error: "Room ID is required" }, { status: 400 })
        }

        {
          const { data: items, error: itemsError } = await supabaseAdmin
            .from('auction_items')
            .select('*')
            .eq('room_id', roomId)
            .order('created_at', { ascending: true })

          if (itemsError) {
            return NextResponse.json({ success: false, error: "Failed to fetch items" }, { status: 500 })
          }

          return NextResponse.json({ success: true, items })
        }

      case 'startRound':
        if (!roomId) {
          return NextResponse.json({ success: false, error: "Room ID is required" }, { status: 400 })
        }
        
        // 현재 라운드 정보 가져오기
        const { data: currentRoom } = await supabaseAdmin
          .from('auction_rooms')
          .select('current_round')
          .eq('id', roomId)
          .single()

        // 현재 라운드 증가 및 상태 업데이트 (현재 등록된 아이템 유지)
        const { data: updatedRoom, error: updateError } = await supabaseAdmin
          .from('auction_rooms')
          .update({
            current_round: (currentRoom?.current_round || 0) + 1,
            round_status: 'ACTIVE'
          })
          .eq('id', roomId)
          .select()
          .single()

        if (updateError) {
          return NextResponse.json({ success: false, error: "Failed to start round" }, { status: 500 })
        }

        // 모든 게스트의 입찰 상태 초기화
        await supabaseAdmin
          .from('guests')
          .update({ has_bid_in_current_round: false })
          .eq('room_id', roomId)
        
        return NextResponse.json({ success: true, room: updatedRoom, state: updatedRoom })

      case 'placeBid':
        if (!roomId || !nickname || bidAmount === undefined) {
          return NextResponse.json({ success: false, error: "Room ID, nickname and bid amount are required" }, { status: 400 })
        }
        
        // 게스트 정보 가져오기
        const { data: guest, error: bidGuestError } = await supabaseAdmin
          .from('guests')
          .select('id, capital, has_bid_in_current_round')
          .eq('room_id', roomId)
          .eq('nickname', nickname)
          .single()

        if (bidGuestError || !guest) {
          return NextResponse.json({ success: false, error: "Guest not found" }, { status: 404 })
        }

        // 현재 방 상태 및 아이템 가져오기
        const { data: roomRow } = await supabaseAdmin
          .from('auction_rooms')
          .select('current_item, current_round')
          .eq('id', roomId)
          .single()

        const effectiveRound = (roomRow?.current_round ?? round ?? 1)
        const isDynamicAuction = auctionType === 'dynamic'
        
        // 변동입찰: 현재 라운드의 최고 입찰자 찾기 (환원용)
        let currentHighestBid = null
        let previousBidAmount = 0
        
        if (isDynamicAuction) {
          // 현재 라운드의 모든 입찰 중 최고 입찰 찾기
          const { data: allRoundBids } = await supabaseAdmin
            .from('bids')
            .select('*, guest_id')
            .eq('room_id', roomId)
            .eq('round', effectiveRound)
            .order('amount', { ascending: false })
            .limit(1)
          
          if (allRoundBids && allRoundBids.length > 0) {
            currentHighestBid = allRoundBids[0]
            console.log(`[Dynamic Auction] Current highest bid: ${currentHighestBid.amount} by ${currentHighestBid.nickname}`)
          }
          
          // 현재 입찰자의 이전 입찰 금액 찾기 (자신의 재입찰 환원용)
          const { data: myPreviousBids } = await supabaseAdmin
            .from('bids')
            .select('amount')
            .eq('room_id', roomId)
            .eq('nickname', nickname)
            .eq('round', effectiveRound)
            .order('created_at', { ascending: false })
            .limit(1)
          
          if (myPreviousBids && myPreviousBids.length > 0) {
            previousBidAmount = myPreviousBids[0].amount
            console.log(`[Dynamic Auction] Found my previous bid: ${previousBidAmount}, will refund to self`)
          }
        }

        // 자본 체크: 변동입찰은 (현재 자본 + 이전 입찰 환원) >= 새 입찰
        const availableCapital = isDynamicAuction ? guest.capital + previousBidAmount : guest.capital
        if (availableCapital < bidAmount) {
          return NextResponse.json({ 
            success: false, 
            error: isDynamicAuction 
              ? `자본이 부족합니다. 사용 가능: ${availableCapital.toLocaleString()}원` 
              : "Insufficient capital" 
          }, { status: 400 })
        }

        // 변동입찰: 이전 최고 입찰자에게 금액 환원 (새 입찰자가 다른 사람일 때)
        if (isDynamicAuction && currentHighestBid && currentHighestBid.guest_id !== guest.id) {
          // 이전 최고 입찰자 정보 가져오기
          const { data: previousHighestBidder, error: prevGuestError } = await supabaseAdmin
            .from('guests')
            .select('capital, nickname')
            .eq('id', currentHighestBid.guest_id)
            .single()
          
          if (!prevGuestError && previousHighestBidder) {
            // 이전 최고 입찰자에게 입찰 금액 환원
            const refundedCapital = previousHighestBidder.capital + currentHighestBid.amount
            await supabaseAdmin
              .from('guests')
              .update({ capital: refundedCapital })
              .eq('id', currentHighestBid.guest_id)
            
            console.log(`[Dynamic Auction] Refunded ${currentHighestBid.amount} to previous highest bidder ${previousHighestBidder.nickname}, new capital: ${refundedCapital}`)
          }
        }
        
        // 입찰 추가
        const { data: newBid, error: bidError } = await supabaseAdmin
          .from('bids')
          .insert({
            room_id: roomId,
            guest_id: guest.id,
            item_id: roomRow?.current_item?.id || null,
            nickname: nickname,
            amount: bidAmount,
            round: effectiveRound
          })
          .select()
          .single()

        if (bidError) {
          return NextResponse.json({ success: false, error: "Failed to place bid" }, { status: 500 })
        }

        // 게스트 자본 업데이트
        // 변동입찰: 자신의 이전 입찰 환원 + 새 입찰 차감 = 순 차감은 (새 입찰 - 자신의 이전 입찰)
        // 고정입찰: 그냥 차감
        const updatedCapital = isDynamicAuction 
          ? guest.capital + previousBidAmount - bidAmount
          : guest.capital - bidAmount
        
        // 변동입찰에서는 has_bid_in_current_round를 true로 설정하지 않음 (여러 번 입찰 가능)
        const updateData: any = {
          capital: updatedCapital
        }
        
        if (!isDynamicAuction) {
          updateData.has_bid_in_current_round = true
        }
        
        await supabaseAdmin
          .from('guests')
          .update(updateData)
          .eq('id', guest.id)
        
        console.log(`[Auction] Bid placed - Type: ${auctionType}, Previous: ${previousBidAmount}, New: ${bidAmount}, Capital: ${guest.capital} -> ${updatedCapital}`)
        
        return NextResponse.json({ 
          success: true, 
          bid: newBid, 
          remainingCapital: updatedCapital,
          previousBidAmount: isDynamicAuction ? previousBidAmount : undefined
        })

      case 'getCurrentRoundItem':
        if (!roomId) {
          return NextResponse.json({ success: false, error: "Room ID is required" }, { status: 400 })
        }

        {
          const { data: roomWithItem, error: itemFetchError } = await supabaseAdmin
            .from('auction_rooms')
            .select('current_item, current_round, round_status')
            .eq('id', roomId)
            .single()

          if (itemFetchError) {
            return NextResponse.json({ success: false, error: "Failed to fetch current round item" }, { status: 500 })
          }

          if (!roomWithItem?.current_item) {
            return NextResponse.json({ success: true, currentRoundItem: null })
          }

          return NextResponse.json({ 
            success: true, 
            currentRoundItem: roomWithItem.current_item, 
            currentRound: roomWithItem.current_round,
            roundStatus: roomWithItem.round_status
          })
        }

      case 'endRound':
        if (!roomId) {
          return NextResponse.json({ success: false, error: "Room ID is required" }, { status: 400 })
        }
        
        {
          // 현재 라운드 정보 가져오기
          const { data: roomData, error: roomFetchError } = await supabaseAdmin
            .from('auction_rooms')
            .select('current_round')
            .eq('id', roomId)
            .single()
          
          if (roomFetchError) {
            return NextResponse.json({ success: false, error: "Failed to fetch room" }, { status: 500 })
          }
          
          const currentRound = roomData.current_round
          
          // 현재 라운드의 모든 입찰 가져오기 (낙찰자 확인용)
          const { data: roundBids, error: bidsError } = await supabaseAdmin
            .from('bids')
            .select('*')
            .eq('room_id', roomId)
            .eq('round', currentRound)
            .order('amount', { ascending: false })
          
          if (bidsError) {
            console.error('[endRound] Failed to fetch bids:', bidsError)
          }
          
          // 최고 입찰자 찾기 (낙찰자)
          const winningBid = roundBids && roundBids.length > 0 ? roundBids[0] : null
          console.log('[endRound] Winning bid:', winningBid)
          
          // 변동입찰에서는 입찰 시 즉시 환원하므로 라운드 종료 시 환원 불필요
          // 고정입찰에서는 낙찰자가 아닌 사람들도 입찰 금액이 차감된 상태로 유지됨
          
          // 모든 게스트의 has_bid_in_current_round를 false로 초기화
          await supabaseAdmin
            .from('guests')
            .update({ has_bid_in_current_round: false })
            .eq('room_id', roomId)
          
          console.log('[endRound] Reset has_bid_in_current_round for all guests')
          
          // 라운드 종료
          const { data: endRoom, error: endError } = await supabaseAdmin
            .from('auction_rooms')
            // 다음 라운드를 바로 시작할 수 있도록 WAITING 상태로 전환하고 현재 아이템 초기화
            .update({ round_status: 'WAITING', current_item: null })
            .eq('id', roomId)
            .select()
            .single()

          if (endError) {
            return NextResponse.json({ success: false, error: "Failed to end round" }, { status: 500 })
          }

          return NextResponse.json({ 
            success: true, 
            room: endRoom,
            winningBid: winningBid ? {
              nickname: winningBid.nickname,
              amount: winningBid.amount
            } : null
          })
        }

      case 'startAuction':
        if (!roomId) {
          return NextResponse.json({ success: false, error: "Room ID is required" }, { status: 400 })
        }

        {
          const { data: started, error } = await supabaseAdmin
            .from('auction_rooms')
            .update({ status: 'ACTIVE', round_status: 'WAITING' })
            .eq('id', roomId)
            .select()
            .single()

          if (error) {
            return NextResponse.json({ success: false, error: 'Failed to start auction' }, { status: 500 })
          }

          return NextResponse.json({ success: true, room: started })
        }

      case 'endAuction':
        if (!roomId) {
          return NextResponse.json({ success: false, error: "Room ID is required" }, { status: 400 })
        }

        {
          const { data: ended, error } = await supabaseAdmin
            .from('auction_rooms')
            .update({ status: 'ENDED', round_status: 'ENDED' })
            .eq('id', roomId)
            .select()
            .single()

          if (error) {
            return NextResponse.json({ success: false, error: 'Failed to end auction' }, { status: 500 })
          }

          return NextResponse.json({ success: true, room: ended })
        }

      case 'modifyCapital':
        if (!roomId || !nickname || newCapital === undefined || typeof newCapital !== 'number') {
          return NextResponse.json({ success: false, error: 'Room ID, nickname and new capital are required' }, { status: 400 })
        }

        {
          const { data: guestRow, error: findErr } = await supabaseAdmin
            .from('guests')
            .select('id, capital')
            .eq('room_id', roomId)
            .eq('nickname', nickname)
            .single()

          if (findErr || !guestRow) {
            return NextResponse.json({ success: false, error: 'Guest not found' }, { status: 404 })
          }

          const { data: updatedGuest, error: updErr } = await supabaseAdmin
            .from('guests')
            .update({ capital: newCapital })
            .eq('id', guestRow.id)
            .select()
            .single()

          if (updErr) {
            return NextResponse.json({ success: false, error: 'Failed to modify capital' }, { status: 500 })
          }

          return NextResponse.json({ success: true, guest: updatedGuest })
        }

      case 'saveAuctionItem':
        if (!roomId || !(item || itemData)) {
          return NextResponse.json({ success: false, error: 'Room ID and item are required' }, { status: 400 })
        }

        {
          const { data: saved, error: saveErr } = await supabaseAdmin
            .from('auction_items')
            .insert({
              room_id: roomId,
              name: (item?.name ?? itemData?.name) as string,
              description: (item?.description ?? itemData?.description) as string,
              image_url: (item?.image_url ?? itemData?.image_url) as string,
              starting_price: (item?.starting_price ?? itemData?.starting_price ?? 0) as number,
              created_by: (guestName || nickname || 'unknown') as string
            })
            .select()
            .single()

          if (saveErr) {
            return NextResponse.json({ success: false, error: 'Failed to save auction item' }, { status: 500 })
          }

          return NextResponse.json({ success: true, item: saved })
        }

      case 'registerAuctionItem':
        console.log('[API] registerAuctionItem called with:', { roomId, itemData, round })
        console.log('[API] itemData details:', JSON.stringify(itemData, null, 2))
        if (!roomId || !itemData || typeof round !== 'number') {
          console.log('[API] Missing required parameters:', { roomId: !!roomId, itemData: !!itemData, round, roundType: typeof round })
          return NextResponse.json({ success: false, error: 'Room ID, item and round are required' }, { status: 400 })
        }

        {
          const { data: roomRow, error: regErr } = await supabaseAdmin
            .from('auction_rooms')
            .update({
              current_item: { item: itemData, round },
              round_status: 'WAITING'
            })
            .eq('id', roomId)
            .select()
            .single()

          if (regErr) {
            return NextResponse.json({ success: false, error: 'Failed to register item for round' }, { status: 500 })
          }

          return NextResponse.json({ success: true, room: roomRow })
        }

      case 'distributeWinningAmount':
        // 간단 처리: 서버 로직 미정이므로 성공 응답만 반환해 클라이언트 흐름을 막지 않음
        return NextResponse.json({ success: true })

      case 'resetRoom':
        if (!roomId) {
          return NextResponse.json({ success: false, error: "Room ID is required" }, { status: 400 })
        }
        
        // 경매방 초기화
        const { data: resetRoom, error: resetError } = await supabaseAdmin
          .from('auction_rooms')
          .update({
            status: 'PRE-START',
            current_round: 0,
            round_status: 'WAITING',
            current_item: null
          })
          .eq('id', roomId)
          .select()
          .single()

        if (resetError) {
          return NextResponse.json({ success: false, error: "Failed to reset room" }, { status: 500 })
        }

        // 게스트 자본 초기화
        await supabaseAdmin
          .from('guests')
          .update({
            capital: resetRoom.initial_capital,
            has_bid_in_current_round: false
          })
          .eq('room_id', roomId)

        // 입찰 기록 삭제
        await supabaseAdmin
          .from('bids')
          .delete()
          .eq('room_id', roomId)

        // 아이템 삭제
        await supabaseAdmin
          .from('auction_items')
          .delete()
          .eq('room_id', roomId)
        
        return NextResponse.json({ success: true, room: resetRoom })

      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("POST Error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
