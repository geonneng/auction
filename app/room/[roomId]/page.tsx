"use client"

import { useEffect, useState } from "react"
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
import { GuestLayout } from "@/components/guest-layout"
import { AuctionItemProvider } from "@/contexts/auction-item-context"

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

  // 현재 라운드의 경매 물품 정보 가져오기
  const loadCurrentRoundItem = async () => {
    try {
      const response = await auctionAPI.getCurrentRoundItem(roomId)
      if (response.success) {
        setCurrentRoundItem(response.currentRoundItem)
        console.log("[Guest] Current round item loaded:", response.currentRoundItem)
      }
    } catch (error) {
      console.error("[Guest] Failed to load current round item:", error)
    }
  }

  // Check if room exists on mount and poll for updates
  useEffect(() => {
    let previousState: any = null
    let isPolling = true
    let retryCount = 0
    let consecutiveErrors = 0
    const maxRetries = 10 // Increased retry count
    const maxConsecutiveErrors = 5 // Allow more consecutive errors

    const checkRoomAndPoll = async () => {
      if (!isPolling) return
      
      try {
        console.log("[Guest] Polling room state for roomId:", roomId)
        const response = await auctionAPI.getState(roomId)
        console.log("[Guest] Poll response:", response)
        
        if (response.success) {
          console.log("[Guest] Connection successful!")
          setIsConnected(true)
          setError("") // Clear any previous errors
          retryCount = 0 // Reset retry count on success
          consecutiveErrors = 0 // Reset consecutive error count
          
          // If guest is already joined, update their data
          if (guestData) {
            const currentGuest = response.state.guests.find(g => g.nickname === guestData.nickname)
            console.log("[Guest] Current guest found:", currentGuest)
            
            if (currentGuest) {
              // 상태 변화 감지를 위한 해시 생성
              const stateHash = JSON.stringify({
                capital: currentGuest.capital,
                status: response.state.status,
                currentRound: response.state.currentRound,
                roundStatus: response.state.roundStatus,
                hasBidInCurrentRound: currentGuest.hasBidInCurrentRound
              })
              
            // 상태가 실제로 변화했을 때만 업데이트
            if (stateHash !== previousStateHash) {
              const newGuestData = {
                ...guestData,
                capital: currentGuest.capital,
                status: response.state.status,
                currentRound: response.state.currentRound,
                roundStatus: response.state.roundStatus,
                hasBidInCurrentRound: currentGuest.hasBidInCurrentRound
              }
              
              console.log("[Guest] Updating guest data:", newGuestData)
              setGuestData(newGuestData)
              setCanBid(!currentGuest.hasBidInCurrentRound)
              setPreviousStateHash(stateHash)
              
              // 현재 라운드의 경매 물품 정보 가져오기
              loadCurrentRoundItem()
            }
              
              // Check for state changes and show notifications
              if (previousState) {
                console.log("[Guest] Previous state:", previousState)
                console.log("[Guest] Current state:", response.state)
                
                // Auction started
                if (previousState.status === "PRE-START" && response.state.status === "ACTIVE") {
                  console.log("[Guest] Auction started!")
                  toast({
                    title: "경매 시작",
                    description: "경매가 시작되었습니다! 호스트가 라운드를 시작하면 입찰할 수 있습니다.",
                  })
                }
                
                // Round started
                if (previousState.currentRound < response.state.currentRound && response.state.roundStatus === "ACTIVE") {
                  console.log("[Guest] Round started!")
                  toast({
                    title: "라운드 시작",
                    description: `라운드 ${response.state.currentRound}이 시작되었습니다! 이제 입찰할 수 있습니다.`,
                  })
                  setRoundResults(null) // Clear previous round results
                }
                
                // Round ended
                if (previousState.roundStatus === "ACTIVE" && response.state.roundStatus === "ENDED") {
                  console.log("[Guest] Round ended!")
                  // Get round results from the latest bids
                  const roundBids = response.state.bids.filter((bid: any) => bid.round === response.state.currentRound)
                  const roundResults = {
                    round: response.state.currentRound,
                    bids: roundBids.sort((a: any, b: any) => b.amount - a.amount),
                    winner: roundBids.length > 0 ? roundBids.reduce((max: any, bid: any) => bid.amount > max.amount ? bid : max) : null
                  }
                  
                  console.log("[Guest] Round results:", roundResults)
                  setRoundResults(roundResults)
                  
                  if (roundResults.winner) {
                    toast({
                      title: "라운드 종료",
                      description: `라운드 ${response.state.currentRound} 종료! 최고 입찰자: ${roundResults.winner.nickname} (${roundResults.winner.amount?.toLocaleString()}원)`,
                    })
                  } else {
                    toast({
                      title: "라운드 종료",
                      description: `라운드 ${response.state.currentRound} 종료! 입찰자가 없었습니다.`,
                    })
                  }
                }
              }
              
              previousState = response.state
            } else {
              console.log("[Guest] Guest not found in room, might have been removed")
              // Guest was removed from room - but don't immediately disconnect
              // Wait for many more polls to confirm
              consecutiveErrors++
              if (consecutiveErrors >= 10) { // Increased threshold
                console.log("[Guest] Guest consistently not found, but not disconnecting")
                // Don't disconnect, just show warning
                setError("연결 상태를 확인하는 중...")
              }
            }
          }
        } else {
          console.log("[Guest] Room not found or error:", response.error)
          consecutiveErrors++
          retryCount++
          
          // If room not found, redirect to home after some attempts
          if (response.error === "Room not found" && consecutiveErrors >= 5) {
            console.log("[Guest] Room not found, redirecting to home")
            toast({
              title: "방을 찾을 수 없습니다",
              description: "존재하지 않는 방입니다. 홈으로 이동합니다.",
              variant: "destructive",
            })
            setTimeout(() => {
              router.push("/")
            }, 2000)
            return
          }
          
          // Only show error after many consecutive failures
          if (consecutiveErrors >= maxConsecutiveErrors) {
            console.log("[Guest] Many consecutive errors, but not disconnecting")
            setError("연결 상태를 확인하는 중...")
          }
          
          // Never disconnect due to room not found - keep trying
          console.log("[Guest] Room error, but continuing to poll... attempt", retryCount)
        }
      } catch (error) {
        console.error("[Guest] Failed to check room:", error)
        consecutiveErrors++
        retryCount++
        
        // Never disconnect due to network errors - keep trying
        console.log("[Guest] Network error, but continuing to poll... attempt", retryCount)
        setError("연결 상태를 확인하는 중...")
      }
    }

    // Initial check
    checkRoomAndPoll()
    
    // Poll every 2 seconds for stable updates
    const interval = createInterval(checkRoomAndPoll, 2000)

    return () => {
      isPolling = false
      // createInterval로 생성된 interval은 자동으로 정리됨
    }
  }, [roomId, guestData?.nickname])

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
        console.log("[v0] Guest joined successfully:", response)
        console.log(`[v0] hasBidInCurrentRound: ${response.hasBidInCurrentRound}, canBid will be: ${!response.hasBidInCurrentRound}`)
        setGuestData(response)
        setCanBid(!response.hasBidInCurrentRound)
        setShowJoinModal(false)
        setIsJoining(false)
        
        // 즉시 상태 확인을 위해 추가 폴링 실행
        setTimeout(async () => {
          try {
            const stateResponse = await auctionAPI.getState(roomId)
            if (stateResponse.success) {
              const currentGuest = stateResponse.state.guests.find(g => g.nickname === response.nickname)
              if (currentGuest) {
                setGuestData(prev => prev ? {
                  ...prev,
                  capital: currentGuest.capital,
                  status: stateResponse.state.status,
                  currentRound: stateResponse.state.currentRound,
                  roundStatus: stateResponse.state.roundStatus,
                  hasBidInCurrentRound: currentGuest.hasBidInCurrentRound
                } : null)
                setCanBid(!currentGuest.hasBidInCurrentRound)
              }
            }
          } catch (error) {
            console.error("[Guest] Failed to update state after join:", error)
          }
        }, 500) // 0.5초 후 즉시 상태 확인
        
        // 호스트 페이지에 참가자 참여 알림을 위한 추가 요청
        setTimeout(async () => {
          try {
            // 호스트 페이지가 참가자 참여를 감지할 수 있도록 추가 요청
            await auctionAPI.getState(roomId)
          } catch (error) {
            console.error("[Guest] Failed to notify host of participation:", error)
          }
        }, 1000) // 1초 후 호스트 알림
        
        toast({
          title: "참여 완료",
          description: `${response.nickname}님으로 경매에 참여했습니다.`,
        })
        
        // 현재 라운드 물품 정보 로드
        loadCurrentRoundItem()
      } else {
        setError(response.error || "참여에 실패했습니다.")
        setIsJoining(false)
      }
    } catch (error) {
      console.error("Failed to join room:", error)
      setError("서버에 연결할 수 없습니다.")
      setIsJoining(false)
    }
  }

  const handlePlaceBid = async () => {
    if (!guestData) return

    if (!canBid) {
      toast({
        title: "입찰 불가",
        description: "이미 이번 라운드에서 입찰하셨습니다.",
        variant: "destructive",
      })
      return
    }

    const amount = Number.parseInt(bidAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "입력 오류",
        description: "올바른 입찰 금액을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    if (amount > guestData.capital) {
      toast({
        title: "입찰 불가",
        description: "보유 자본보다 많은 금액을 입찰할 수 없습니다.",
        variant: "destructive",
      })
      return
    }

    setIsBidding(true)
    
    try {
      console.log("[Guest] Placing bid:", { roomId, nickname: guestData.nickname, amount })
      const response = await auctionAPI.placeBid(roomId, guestData.nickname, amount)
      console.log("[Guest] Bid response:", response)
      
      if (response.success) {
        // Update guest data immediately with full state
        if (response.state) {
          const currentGuest = response.state.guests.find(g => g.nickname === guestData.nickname)
          if (currentGuest) {
            setGuestData((prev) => (prev ? { 
              ...prev, 
              capital: currentGuest.capital,
              status: response.state.status,
              currentRound: response.state.currentRound,
              roundStatus: response.state.roundStatus,
              hasBidInCurrentRound: currentGuest.hasBidInCurrentRound
            } : null))
            setCanBid(!currentGuest.hasBidInCurrentRound)
          }
        } else {
          // Fallback to simple update
          setGuestData((prev) => (prev ? { 
            ...prev, 
            capital: response.remainingCapital,
            hasBidInCurrentRound: response.hasBidInCurrentRound
          } : null))
          setCanBid(!response.hasBidInCurrentRound)
        }
        
        setBidAmount("")
        
        console.log("[Guest] Bid successful, updated guest data")
        toast({
          title: "입찰 완료",
          description: `입찰이 성공적으로 처리되었습니다. 남은 자본: ${response.remainingCapital.toLocaleString()}원`,
        })
      } else {
        console.log("[Guest] Bid failed:", response.error)
        toast({
          title: "입찰 실패",
          description: response.error || "입찰에 실패했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[Guest] Failed to place bid:", error)
      toast({
        title: "연결 오류",
        description: "서버에 연결할 수 없습니다.",
        variant: "destructive",
      })
    } finally {
      setIsBidding(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <div className="text-lg font-semibold">
                {error ? "연결 상태 확인 중..." : "서버에 연결 중..."}
              </div>
              {error && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="text-sm text-muted-foreground">
                잠시만 기다려주세요. 자동으로 재연결을 시도합니다.
              </div>
              <div className="flex justify-center space-x-2">
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  새로고침
                </Button>
                <Button 
                  onClick={() => {
                    setError("")
                    setIsConnected(true)
                  }}
                  size="sm"
                >
                  계속 진행
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Join Modal */}
      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>경매 참여</DialogTitle>
            <DialogDescription>
              닉네임을 입력하고 경매에 참여하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">닉네임</Label>
              <Input
                id="nickname"
                placeholder="닉네임을 입력하세요"
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
              disabled={isJoining || !nickname.trim()}
            >
              {isJoining ? "참여 중..." : "참여하기"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {guestData && (
        <AuctionItemProvider roomId={roomId}>
          <GuestLayout roomId={roomId} guestName={guestData.nickname}>
            <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-6 w-6" />
                경매 참여
              </CardTitle>
              <CardDescription>
                안녕하세요, <strong>{guestData.nickname}</strong>님! 경매에 참여하셨습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {guestData.capital.toLocaleString()}원
                  </div>
                  <div className="text-sm text-muted-foreground">보유 자본</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {guestData.currentRound || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">현재 라운드</div>
                </div>
                <div className="text-center">
                  <Badge variant={guestData.status === "ACTIVE" ? "default" : "secondary"}>
                    {guestData.status === "ACTIVE" ? "진행 중" : "대기 중"}
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">경매 상태</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Round Item */}
          {currentRoundItem && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  현재 라운드 경매 물품
                </CardTitle>
                <CardDescription>
                  라운드 {guestData.currentRound}의 경매 물품입니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">{currentRoundItem.item.name}</h3>
                      <p className="text-muted-foreground mt-2">{currentRoundItem.item.description}</p>
                      {currentRoundItem.item.startingPrice && (
                        <div className="mt-2">
                          <span className="text-sm text-muted-foreground">시작가: </span>
                          <span className="font-semibold text-primary">
                            {currentRoundItem.item.startingPrice.toLocaleString()}원
                          </span>
                        </div>
                      )}
                    </div>
                    {currentRoundItem.item.image && (
                      <div className="flex justify-center">
                        <img 
                          src={currentRoundItem.item.image} 
                          alt={currentRoundItem.item.name}
                          className="max-w-full h-48 object-contain rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                  {currentRoundItem.item.ownerNickname && (
                    <div className="text-sm text-muted-foreground">
                      등록자: {currentRoundItem.item.ownerNickname}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bidding Section */}
          {guestData.status === "ACTIVE" && guestData.roundStatus === "ACTIVE" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  입찰하기
                </CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    라운드 {guestData.currentRound}이 진행 중입니다
                    <Badge variant="outline">
                      {guestData.roundStatus === "ACTIVE" ? "입찰 가능" : "입찰 불가"}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bid-amount">입찰 금액</Label>
                    <Input
                      id="bid-amount"
                      type="number"
                      placeholder="입찰할 금액을 입력하세요"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handlePlaceBid()}
                      min="1"
                      max={guestData.capital}
                    />
                  </div>
                  <Button
                    onClick={handlePlaceBid}
                    className="w-full"
                    size="lg"
                    disabled={isBidding || guestData.capital <= 0 || !canBid}
                  >
                    {isBidding ? "입찰 중..." : 
                     guestData.capital <= 0 ? "자본금 부족" : 
                     !canBid ? "이미 입찰함" : "입찰하기"}
                  </Button>
                  {guestData.capital <= 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>자본금이 모두 소진되었습니다. 더 이상 입찰할 수 없습니다.</AlertDescription>
                    </Alert>
                  )}
                  {!canBid && guestData.capital > 0 && (
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>이미 이번 라운드에서 입찰하셨습니다. 다음 라운드를 기다려주세요.</AlertDescription>
                    </Alert>
                  )}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : guestData.status === "ACTIVE" ? (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                경매가 시작되었습니다. 호스트가 라운드를 시작하면 입찰할 수 있습니다.
                {guestData.currentRound && guestData.currentRound > 0 && (
                  <span className="block mt-2 text-sm">
                    현재 라운드: {guestData.currentRound} | 
                    상태: {guestData.roundStatus === "ACTIVE" ? "진행 중" : "대기 중"}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                경매가 아직 시작되지 않았습니다. 호스트가 경매를 시작할 때까지 기다려주세요.
              </AlertDescription>
            </Alert>
          )}

          {/* Round Results */}
          {roundResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  라운드 {roundResults.round} 결과 공개
                </CardTitle>
                <CardDescription>모든 입찰 금액이 공개되었습니다</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {roundResults.winner ? (
                    <Alert className="border-green-200 bg-green-50">
                      <AlertDescription className="text-center">
                        <div className="text-2xl font-bold text-green-600 mb-2">🏆 낙찰자</div>
                        <div className="text-xl font-semibold">{roundResults.winner.nickname}</div>
                        <div className="text-lg text-green-600">
                          {roundResults.winner.amount?.toLocaleString()}원
                        </div>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert>
                      <AlertDescription className="text-center">
                        <div className="text-lg">이번 라운드에는 입찰자가 없었습니다.</div>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-lg">전체 입찰 내역 (금액 공개)</h4>
                    {roundResults.bids.map((bid, index) => (
                      <Alert key={`${bid.nickname}-${bid.timestamp}-${index}`} className="py-3">
                        <AlertDescription className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{bid.nickname}</span>
                            {index === 0 && <Badge variant="default">1위</Badge>}
                            {index === 1 && <Badge variant="secondary">2위</Badge>}
                            {index === 2 && <Badge variant="outline">3위</Badge>}
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-lg">{bid.amount?.toLocaleString()}원</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(bid.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>경매 규칙</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• 보유 자본금 내에서만 입찰할 수 있습니다.</p>
              <p>• 입찰한 금액은 즉시 자본금에서 차감됩니다.</p>
              <p>• <strong>라운드별로 한 번만 입찰할 수 있습니다.</strong></p>
              <p>• 모든 입찰은 호스트 화면에 실시간으로 표시됩니다.</p>
              <p>• 경매는 호스트가 시작하고 종료합니다.</p>
            </CardContent>
          </Card>
            </div>
          </GuestLayout>
        </AuctionItemProvider>
      )}
    </div>
  )
}
