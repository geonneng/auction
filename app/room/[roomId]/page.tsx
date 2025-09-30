"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Wallet, Clock, TrendingUp, AlertCircle, Package } from "lucide-react"
import { auctionAPI } from "@/lib/api"
import type { GuestData, RoundResults } from "@/types/auction"
import { toast } from "@/hooks/use-toast"
import { useConnectionMonitor } from "@/hooks/use-connection-monitor"
import { useCleanup } from "@/hooks/use-cleanup"
import { useOfflineHandler } from "@/hooks/use-offline-handler"
import { DataValidator } from "@/lib/data-validation"
import { GuestJoin } from '@/components/auction/guest-join'
import { GuestBid } from '@/components/auction/guest-bid'
import { GuestStatus } from '@/components/auction/guest-status'
import { GuestLayout } from "@/components/guest-layout"
import { AuctionItemProvider } from "@/contexts/auction-item-context"
import { useAuctionRealtime } from "@/hooks/use-supabase-realtime"
import { useCurrentRoundItem, useAuctionActions } from "@/stores/auction-store"

export default function GuestRoom() {
  const params = useParams()
  const roomId = params.roomId as string
  const router = useRouter()

  const [isConnected, setIsConnected] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(true)
  const [nickname, setNickname] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [guestData, setGuestData] = useState<GuestData | null>(null)
  const [bidAmount, setBidAmount] = useState("")
  const [isBidding, setIsBidding] = useState(false)
  const [error, setError] = useState("")
  const [roundResults, setRoundResults] = useState<RoundResults | null>(null)
  const [canBid, setCanBid] = useState(true)
  const [previousStateHash, setPreviousStateHash] = useState("")
  const [currentRoundItem, setCurrentRoundItem] = useState<any>(null)
  const storeCurrentRoundItem = useCurrentRoundItem()
  const actions = useAuctionActions()
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  
  // 서버에서 현재 라운드 아이템 정보 가져오기
  const loadCurrentRoundItem = useCallback(async () => {
    try {
      console.log('[Guest] Loading current round item for room:', roomId)
      const response = await auctionAPI.getCurrentRoundItem(roomId)
      console.log('[Guest] API response:', response)
      
      if (response.success && response.currentRoundItem) {
        console.log('[Guest] Current round item loaded:', response.currentRoundItem)
        setCurrentRoundItem(response.currentRoundItem)
      } else {
        console.log('[Guest] No current round item found')
        setCurrentRoundItem(null)
      }
    } catch (error) {
      console.error('[Guest] Failed to load current round item:', error)
      setCurrentRoundItem(null)
    }
  }, [roomId])

  // 스토어의 currentRoundItem과 동기화
  React.useEffect(() => {
    console.log('[Guest] Store currentRoundItem changed:', storeCurrentRoundItem)
    if (storeCurrentRoundItem) {
      setCurrentRoundItem(storeCurrentRoundItem)
    }
  }, [storeCurrentRoundItem])

  // 현재 라운드 아이템 상태 디버깅
  React.useEffect(() => {
    console.log('[Guest] Current round item state changed:', currentRoundItem)
  }, [currentRoundItem])

  // 게스트 참가 후 현재 라운드 아이템 로드
  React.useEffect(() => {
    if (guestData && isConnected) {
      console.log('[Guest] Loading current round item after join')
      loadCurrentRoundItem()
    }
  }, [guestData, isConnected, loadCurrentRoundItem])

  // 주기적으로 현재 라운드 아이템 확인 (2초마다 - Realtime 보조)
  React.useEffect(() => {
    if (!guestData || !isConnected) return

    const interval = setInterval(() => {
      console.log('[Guest] Periodic check for current round item')
      loadCurrentRoundItem()
    }, 2000)

    return () => clearInterval(interval)
  }, [guestData, isConnected, loadCurrentRoundItem])
  
  // 연결 상태 모니터링
  const { connectionState, recordRequest } = useConnectionMonitor({
    onConnectionLost: () => {
      toast({
        title: "연결 끊김",
        description: "서버와의 연결이 끊어졌습니다. 자동으로 재연결을 시도합니다.",
        variant: "destructive",
      })
    },
    onConnectionRestored: () => {
      toast({
        title: "연결 복구",
        description: "서버와의 연결이 복구되었습니다.",
      })
    }
  })

  // Realtime 업데이트 플래그
  const [shouldRefresh, setShouldRefresh] = useState(0)

  // Supabase Realtime 구독
  useAuctionRealtime(roomId, {
    onRoomUpdate: (room) => {
      console.log("[Guest] Room updated via Realtime:", room)
      
      // 즉시 게스트 데이터 업데이트 (라운드 상태 변화 포함)
      if (guestData) {
        const previousStatus = guestData.status
        const previousRoundStatus = guestData.roundStatus
        const previousRound = guestData.currentRound
        
        setGuestData(prev => prev ? {
          ...prev,
          status: room.status,
          currentRound: room.current_round,
          roundStatus: room.round_status
        } : null)
        
        // 라운드 상태 변화 감지 및 알림
        if (room.round_status === 'ACTIVE' && previousRoundStatus !== 'ACTIVE') {
          console.log('[Guest Realtime] 라운드 시작 감지!')
          toast({
            title: "라운드 시작!",
            description: `라운드 ${room.current_round}이 시작되었습니다. 지금 입찰하세요!`,
          })
          setCanBid(true)
          loadCurrentRoundItem()
        } else if (room.round_status !== 'ACTIVE' && previousRoundStatus === 'ACTIVE') {
          console.log('[Guest Realtime] 라운드 종료 감지!')
          toast({
            title: "라운드 종료",
            description: `라운드 ${room.current_round}이 종료되었습니다.`,
          })
        } else if (room.current_round !== previousRound) {
          console.log('[Guest Realtime] 라운드 변경 감지!')
          loadCurrentRoundItem()
        }
        
        // 경매 시작/종료 감지
        if (room.status === 'ACTIVE' && previousStatus !== 'ACTIVE') {
          toast({
            title: "경매 시작!",
            description: "경매가 시작되었습니다.",
          })
        } else if (room.status === 'ENDED' && previousStatus !== 'ENDED') {
          toast({
            title: "경매 종료",
            description: "경매가 종료되었습니다.",
          })
        }
        
        // 현재 아이템 변경 감지
        if (room.current_item) {
          loadCurrentRoundItem()
        }
      }
      
      setShouldRefresh(prev => prev + 1)
    },
    onGuestJoin: (guest) => {
      console.log("[Guest] Guest joined via Realtime:", guest)
      setShouldRefresh(prev => prev + 1)
    },
    onGuestLeave: (guest) => {
      console.log("[Guest] Guest left via Realtime:", guest)
      setShouldRefresh(prev => prev + 1)
    },
    onBidPlaced: (bid) => {
      console.log("[Guest] Bid placed via Realtime:", bid)
      toast({
        title: "새 입찰",
        description: `${bid.nickname}님이 ${bid.amount.toLocaleString()}원에 입찰했습니다.`,
      })
      setShouldRefresh(prev => prev + 1)
    },
    onItemAdded: (item) => {
      console.log("[Guest] Item added via Realtime:", item)
      loadCurrentRoundItem()
    }
  })

  // checkRoomAndPoll 함수를 메모화
  const checkRoomAndPollMemoized = useCallback(async () => {
    if (!roomId) return
    
    try {
      console.log("[Guest] Polling room state for roomId:", roomId)
      const response = await auctionAPI.getState(roomId)
      console.log("[Guest] Poll response:", response)
      
      if (response.success) {
        console.log("[Guest] Connection successful!")
        setIsConnected(true)
        
        // 상태 정규화 및 안전 처리
        const roomState = response.state ?? response.room ?? {}
        const guestsArray = Array.isArray(roomState.guests) ? roomState.guests : []
        
        // 현재 게스트 정보 찾기
        if (guestData?.nickname) {
          const currentGuest = guestsArray.find((g: any) => g.nickname === guestData.nickname)
          if (currentGuest) {
            const updatedGuestData = {
              ...guestData,
              capital: currentGuest.capital,
              status: roomState.status,
              currentRound: roomState.current_round ?? roomState.currentRound,
              roundStatus: roomState.round_status ?? roomState.roundStatus,
              hasBidInCurrentRound: currentGuest.has_bid_in_current_round ?? currentGuest.hasBidInCurrentRound
            }
            setGuestData(updatedGuestData)
            setCanBid(!(currentGuest.has_bid_in_current_round ?? currentGuest.hasBidInCurrentRound))
          }
        }
      }
    } catch (error) {
      console.error("[Guest] Failed to check room:", error)
      setIsConnected(false)
    }
  }, [roomId, guestData?.nickname])

  // 플래그 변경 시 데이터 새로고침
  useEffect(() => {
    if (shouldRefresh > 0 && guestData) {
      checkRoomAndPollMemoized()
    }
  }, [shouldRefresh, checkRoomAndPollMemoized, guestData?.nickname])

  // 연결 상태 표시
  useEffect(() => {
    if (isConnected) {
      toast({
        title: "연결됨",
        description: "실시간 통신이 활성화되었습니다.",
      })
    }
  }, [isConnected])

  // 오프라인 처리
  const { isOffline, queueAction } = useOfflineHandler({
    onOffline: () => {
      toast({
        title: "오프라인 상태",
        description: "인터넷 연결이 끊어졌습니다. 연결이 복구되면 자동으로 동기화됩니다.",
        variant: "destructive",
      })
    }
  })

  // 정리 로직
  const { createInterval, createTimeout, cleanup } = useCleanup({
    onUnmount: () => {
      console.log("[Guest] Component unmounting, cleaning up resources")
    }
  })


  // 초기 방 상태 확인 및 백업 폴링
  useEffect(() => {
    let isPolling = true
    
    const initialAndBackupPoll = async () => {
      if (!isPolling) return
      await checkRoomAndPollMemoized()
    }

    // 초기 체크
    initialAndBackupPoll()
    
    // 백업 폴링 (1초마다 - Realtime 보조)  
    const interval = createInterval(initialAndBackupPoll, 1000)

    return () => {
      isPolling = false
    }
  }, [roomId, checkRoomAndPollMemoized])

  const handleJoinRoom = async () => {
    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요.")
      return
    }

    if (nickname.trim().length > 10) {
      setError("닉네임은 10자 이하로 입력해주세요.")
      return
    }

    setIsJoining(true)
    setError("")
    
    try {
      const response = await auctionAPI.joinRoom(roomId, nickname.trim())
      if (response.success) {
        const normalizedGuestData = response.guest || response; // Normalize response
        console.log("[v0] Guest joined successfully:", normalizedGuestData);
        setGuestData(normalizedGuestData);
        setCanBid(!normalizedGuestData.hasBidInCurrentRound);
        setShowJoinModal(false)
        toast({
          title: "참가 완료",
          description: "경매에 성공적으로 참가했습니다!",
        })
        
        // 참가 후 상태 업데이트를 위해 잠시 대기 후 폴링
        setTimeout(() => {
          checkRoomAndPollMemoized()
        }, 1000)
      } else {
        setError(response.error || "참가에 실패했습니다.")
      }
    } catch (error: any) {
      console.error("Failed to join room:", error)
      const errorMessage = error.message || "서버에 연결할 수 없습니다."
      setError(errorMessage)
    } finally {
      setIsJoining(false)
    }
  }

  const handlePlaceBid = async () => {
    if (!guestData || !bidAmount.trim()) {
      setError("입찰 금액을 입력해주세요.")
      return
    }

    const amount = parseInt(bidAmount.trim())
    if (isNaN(amount) || amount <= 0) {
      setError("유효한 입찰 금액을 입력해주세요.")
      return
    }

    if (amount > guestData.capital) {
      setError("보유 자본보다 많은 금액을 입찰할 수 없습니다.")
      return
    }

    setIsBidding(true)
    setError("")

    try {
      const response = await auctionAPI.placeBid(roomId, guestData.nickname, amount, guestData.currentRound || 1, 'fixed')
      if (response.success) {
        toast({
          title: "입찰 완료",
          description: `${amount.toLocaleString()}원으로 입찰했습니다.`,
        })
        setBidAmount("")
        setCanBid(false)
        
        // 입찰 후 상태 업데이트
        checkRoomAndPollMemoized()
      } else {
        setError(response.error || "입찰에 실패했습니다.")
      }
    } catch (error: any) {
      console.error("Failed to place bid:", error)
      const errorMessage = error.message || "서버에 연결할 수 없습니다."
      setError(errorMessage)
    } finally {
      setIsBidding(false)
    }
  }

  // 모듈형 UI 연결
  const joinHandler = async (roomId: string, nickname: string) => {
    const res = await auctionAPI.joinRoom(roomId, nickname)
    if (!res.success) throw new Error(res.error || 'Join failed')
    setGuestData({ ...(res.guest || { nickname, capital: 0 }), nickname })
    setCanBid(true)
  }

  // 입찰 불가 상태 확인
  const isBidDisabled = !canBid || isBidding || !guestData || 
    guestData.status !== "ACTIVE" || 
    guestData.roundStatus !== "ACTIVE" ||
    guestData.hasBidInCurrentRound

  if (!guestData) {
    return (
      <GuestLayout roomId={roomId}>
        <div className="container mx-auto px-4 py-8">
          <Dialog open={showJoinModal} onOpenChange={() => {}}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>경매 참가</DialogTitle>
                <DialogDescription>
                  닉네임을 입력하여 경매에 참가하세요.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nickname">닉네임</Label>
                  <Input
                    id="nickname"
                    placeholder="닉네임 입력 (최대 10자)"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                    maxLength={10}
                    disabled={isJoining}
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button 
                  onClick={handleJoinRoom} 
                  className="w-full"
                  disabled={isJoining}
                >
                  {isJoining ? "참가 중..." : "경매 참가"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </GuestLayout>
    )
  }

  return (
    <AuctionItemProvider roomId={roomId} guestName={guestData.nickname}>
      <GuestLayout roomId={roomId} guestName={guestData.nickname}>
        <div className="container mx-auto px-4 py-8 space-y-6">
          {/* 연결 상태 및 라운드 정보 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">경매 참가</h1>
              {guestData?.status === 'ACTIVE' && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={guestData.roundStatus === 'ACTIVE' ? 'default' : 'secondary'}>
                    {guestData.roundStatus === 'ACTIVE' ? '🔥 라운드 진행 중' : '⏸️ 라운드 대기'}
                  </Badge>
                  <span className="text-sm text-gray-600">라운드 {guestData.currentRound}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">{isConnected ? '실시간 연결됨' : '연결 중...'}</span>
              </div>
            </div>
          </div>

          {/* 게스트 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                내 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">닉네임</p>
                  <p className="text-lg font-semibold">{guestData.nickname}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">보유 자본</p>
                  <p className="text-lg font-semibold">{Number(guestData?.capital ?? 0).toLocaleString()}원</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">경매 상태</p>
                  <Badge variant={guestData.status === "ACTIVE" ? "default" : "secondary"}>
                    {guestData.status === "PRE-START" ? "준비 중" : 
                     guestData.status === "ACTIVE" ? "진행 중" : 
                     guestData.status === "ENDED" ? "종료" : "대기 중"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">현재 라운드</p>
                  <p className="text-lg font-semibold">{guestData.currentRound || 0}라운드</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 현재 경매 물품 */}
          {guestData.status === "ACTIVE" && (
            <Card onClick={() => currentRoundItem && setIsItemDialogOpen(true)} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  현재 경매 물품
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentRoundItem ? (
                  <div className="space-y-6">
                    <div className="flex gap-6">
                      {/* 물품 이미지 - 더 크게 */}
                      {currentRoundItem.item.image && (
                        <div className="flex-shrink-0">
                          <img 
                            src={currentRoundItem.item.image} 
                            alt={currentRoundItem.item.name}
                            className="w-40 h-40 object-cover rounded-xl border-2 shadow-lg"
                          />
                        </div>
                      )}
                      
                      {/* 물품 정보 - 더 크게 */}
                      <div className="flex-1 space-y-4">
                        <h3 className="text-2xl font-bold text-gray-900">{currentRoundItem.item.name}</h3>
                        <p className="text-lg text-gray-700 leading-relaxed">{currentRoundItem.item.description}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                    <p className="text-lg text-gray-500 mb-2">현재 경매 물품이 등록되지 않았습니다.</p>
                    <p className="text-sm text-gray-400">호스트가 물품을 등록하면 여기에 표시됩니다.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 현재 경매 물품 확대 보기 다이얼로그 */}
          <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
            <DialogContent className="max-w-3xl w-[95vw]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">{currentRoundItem?.item?.name || '현재 경매 물품'}</DialogTitle>
              </DialogHeader>
              {currentRoundItem && (
                <div className="space-y-4">
                  {currentRoundItem.item.image && (
                    <img
                      src={currentRoundItem.item.image}
                      alt={currentRoundItem.item.name}
                      className="w-full max-h-[60vh] object-contain rounded-xl border"
                    />
                  )}
                  <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {currentRoundItem.item.description}
                  </p>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* 입찰 섹션 - 항상 표시 */}
          {guestData.status === "ACTIVE" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  입찰하기
                </CardTitle>
                <CardDescription>
                  {guestData.roundStatus === "ACTIVE" ? 
                    (canBid ? "입찰 금액을 입력하고 입찰하세요." : "이미 이번 라운드에 입찰했습니다.") :
                    "라운드가 시작되면 입찰할 수 있습니다."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bidAmount">입찰 금액</Label>
                  <Input
                    id="bidAmount"
                    type="number"
                    placeholder="입찰 금액 입력"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !isBidDisabled && handlePlaceBid()}
                    disabled={isBidDisabled}
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button 
                  onClick={handlePlaceBid}
                  className="w-full"
                  disabled={isBidDisabled}
                >
                  {isBidding ? "입찰 중..." : 
                   !canBid ? "입찰 완료" :
                   guestData.roundStatus !== "ACTIVE" ? "라운드 대기 중" : "입찰하기"}
                </Button>
              </CardContent>
            </Card>
          )}


          {/* 라운드 결과 */}
          {roundResults && (
            <Card>
              <CardHeader>
                <CardTitle>라운드 결과</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>승자:</strong> {roundResults.winner}</p>
                  <p><strong>낙찰가:</strong> {roundResults.winningAmount.toLocaleString()}원</p>
                  <p><strong>물품:</strong> {roundResults.item}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </GuestLayout>
    </AuctionItemProvider>
  )
}