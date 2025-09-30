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
import { GuestLayout } from "@/components/guest-layout"
import { AuctionItemProvider } from "@/contexts/auction-item-context"
import { useCurrentRoundItem } from "@/stores/auction-store"
import { useAuctionRealtime } from "@/hooks/use-supabase-realtime"

export default function DynamicGuestRoom() {
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
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  
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
      console.log("[DynamicGuest] Component unmounting, cleaning up resources")
    }
  })

  // 현재 라운드의 경매 물품 정보 가져오기
  const loadCurrentRoundItem = useCallback(async () => {
    try {
      const response = await auctionAPI.getCurrentRoundItem(roomId)
      if (response.success) {
        setCurrentRoundItem(response.currentRoundItem)
        console.log("[DynamicGuest] Current round item loaded:", response.currentRoundItem)
      }
    } catch (error) {
      console.error("[DynamicGuest] Failed to load current round item:", error)
    }
  }, [roomId])

  useEffect(() => {
    if (storeCurrentRoundItem) setCurrentRoundItem(storeCurrentRoundItem)
  }, [storeCurrentRoundItem])
  const [currentHighestBid, setCurrentHighestBid] = useState<any>(null)

  // Supabase Realtime 구독 - 라운드 상태 변화 실시간 감지
  useAuctionRealtime(roomId, {
    onRoomUpdate: (room) => {
      console.log("[DynamicGuest Realtime] Room updated:", room)
      
      // 즉시 게스트 데이터 업데이트
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
        
        // 라운드 시작 감지
        if (room.round_status === 'ACTIVE' && previousRoundStatus !== 'ACTIVE') {
          console.log('[DynamicGuest Realtime] 라운드 시작 감지!')
          toast({
            title: "🔥 변동입찰 라운드 시작!",
            description: `라운드 ${room.current_round}이 시작되었습니다. 실시간으로 입찰하세요!`,
          })
          setCanBid(true)
          setRoundResults(null)
          loadCurrentRoundItem()
        } 
        // 라운드 종료 감지
        else if (room.round_status !== 'ACTIVE' && previousRoundStatus === 'ACTIVE') {
          console.log('[DynamicGuest Realtime] 라운드 종료 감지!')
          toast({
            title: "라운드 종료",
            description: `라운드 ${room.current_round}이 종료되었습니다.`,
          })
        } 
        // 라운드 번호 변경 감지
        else if (room.current_round !== previousRound && room.current_round > previousRound) {
          console.log('[DynamicGuest Realtime] 라운드 변경 감지!')
          loadCurrentRoundItem()
        }
        
        // 경매 상태 변화
        if (room.status === 'ACTIVE' && previousStatus !== 'ACTIVE') {
          toast({
            title: "🎯 변동입찰 경매 시작!",
            description: "변동입찰 경매가 시작되었습니다. 언제든 재입찰할 수 있습니다!",
          })
        } else if (room.status === 'ENDED' && previousStatus !== 'ENDED') {
          toast({
            title: "경매 종료",
            description: "경매가 종료되었습니다.",
          })
        }
        
        // 현재 아이템 변경
        if (room.current_item) {
          loadCurrentRoundItem()
        }
      }
    },
    onGuestJoin: (guest) => {
      console.log("[DynamicGuest Realtime] Guest joined:", guest)
    },
    onGuestLeave: (guest) => {
      console.log("[DynamicGuest Realtime] Guest left:", guest)
    },
    onBidPlaced: (bid) => {
      console.log("[DynamicGuest Realtime] Bid placed:", bid)
      // 변동입찰에서는 다른 사람의 입찰 알림이 중요
      if (bid.nickname !== guestData?.nickname) {
        toast({
          title: "🚨 새로운 입찰!",
          description: `${bid.nickname}님이 ${bid.amount.toLocaleString()}원에 입찰했습니다!`,
        })
      }
    },
    onItemAdded: (item) => {
      console.log("[DynamicGuest Realtime] Item added:", item)
      loadCurrentRoundItem()
    }
  })

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
        console.log("[Dynamic Guest] Polling room state for roomId:", roomId)
        const response = await auctionAPI.getState(roomId)
        console.log("[Dynamic Guest] Poll response:", response)
        
        if (response.success) {
          console.log("[Dynamic Guest] Connection successful!")
          setIsConnected(true)
          setError("") // Clear any previous errors
          retryCount = 0 // Reset retry count on success
          consecutiveErrors = 0 // Reset consecutive error count
          
          // If guest is already joined, update their data
          if (guestData) {
            const currentGuest = response.state.guests.find(g => g.nickname === guestData.nickname)
            console.log("[Dynamic Guest] Current guest found:", currentGuest)
            
            if (currentGuest) {
              const newGuestData = {
                ...guestData,
                capital: currentGuest.capital,
                status: response.state.status,
                currentRound: response.state.currentRound,
                roundStatus: response.state.roundStatus,
                hasBidInCurrentRound: currentGuest.hasBidInCurrentRound
              }
              
              console.log("[Dynamic Guest] Updating guest data:", newGuestData)
              setGuestData(newGuestData)

              // Update current highest bid
              if (response.state.currentHighestBid) {
                setCurrentHighestBid(response.state.currentHighestBid)
              } else {
                setCurrentHighestBid(null)
              }
              
              // 변동입찰에서는 항상 입찰 가능 (라운드가 활성상태이고 자본이 있으면)
              const dynamicCanBid = response.state.roundStatus === "ACTIVE" && currentGuest.capital > 0
              console.log("[Dynamic Guest] Dynamic bid - always setting canBid to:", dynamicCanBid)
              setCanBid(dynamicCanBid)
              
              // 현재 라운드의 경매 물품 정보 가져오기
              loadCurrentRoundItem()
              
              console.log("[DynamicGuest] State updated:", {
                status: response.state.status,
                roundStatus: response.state.roundStatus,
                currentRound: response.state.currentRound,
                canBid: dynamicCanBid,
                capital: currentGuest.capital
              })
              
              // Check for state changes and show notifications
              if (previousState) {
                console.log("[Dynamic Guest] Previous state:", previousState)
                console.log("[Dynamic Guest] Current state:", response.state)

                // 변동입찰에서 자신의 입찰이 추월되었는지 확인
                if (response.state.roundStatus === "ACTIVE") {
                  const previousMyBid = previousState.currentHighestBid?.nickname === guestData.nickname
                  const currentMyBid = response.state.currentHighestBid?.nickname === guestData.nickname
                  
                  // 이전에는 최고 입찰자였는데 지금은 아닌 경우
                  if (previousMyBid && !currentMyBid && response.state.currentHighestBid) {
                    toast({
                      title: "입찰이 추월되었습니다",
                      description: `${response.state.currentHighestBid.nickname}님이 ${response.state.currentHighestBid.amount.toLocaleString()}원으로 입찰했습니다. 더 높은 금액으로 재입찰하세요!`,
                      variant: "destructive",
                    })
                  }
                }
                
                // Auction started
                if (previousState.status === "PRE-START" && response.state.status === "ACTIVE") {
                  console.log("[Dynamic Guest] Auction started!")
                  toast({
                    title: "변동입찰 경매 시작",
                    description: "변동입찰 경매가 시작되었습니다! 호스트가 라운드를 시작하면 입찰할 수 있습니다.",
                  })
                }
                
                // Round started
                if (previousState.currentRound < response.state.currentRound && response.state.roundStatus === "ACTIVE") {
                  console.log("[Dynamic Guest] Round started!")
                  toast({
                    title: "라운드 시작",
                    description: `라운드 ${response.state.currentRound}이 시작되었습니다! 변동입찰로 실시간 재입찰이 가능합니다.`,
                  })
                  setRoundResults(null) // Clear previous round results
                }
                
                // Round ended (ACTIVE -> NON-ACTIVE: WAITING/ENDED 모두 처리)
                if (previousState.roundStatus === "ACTIVE" && response.state.roundStatus !== "ACTIVE") {
                  console.log("[Dynamic Guest] Round ended!")
                  // Get round results from the latest bids
                  const roundBids = response.state.bids.filter((bid: any) => bid.round === response.state.currentRound)
                  const roundResults = {
                    round: response.state.currentRound,
                    bids: roundBids.sort((a: any, b: any) => b.amount - a.amount),
                    winner: roundBids.length > 0 ? roundBids.reduce((max: any, bid: any) => bid.amount > max.amount ? bid : max) : null
                  }
                  
                  console.log("[Dynamic Guest] Round results:", roundResults)
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
              console.log("[Dynamic Guest] Guest not found in room, might have been removed")
              // Guest was removed from room - but don't immediately disconnect
              // Wait for many more polls to confirm
              consecutiveErrors++
              if (consecutiveErrors >= 10) { // Increased threshold
                console.log("[Dynamic Guest] Guest consistently not found, but not disconnecting")
                // Don't disconnect, just show warning
                setError("연결 상태를 확인하는 중...")
              }
            }
          }
        } else {
          console.log("[Dynamic Guest] Room not found or error:", response.error)
          consecutiveErrors++
          retryCount++
          
          // If room not found, redirect to home after some attempts
          if (response.error === "Room not found" && consecutiveErrors >= 5) {
            console.log("[Dynamic Guest] Room not found, redirecting to home")
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
            console.log("[Dynamic Guest] Many consecutive errors, but not disconnecting")
            setError("연결 상태를 확인하는 중...")
          }
          
          // Never disconnect due to room not found - keep trying
          console.log("[Dynamic Guest] Room error, but continuing to poll... attempt", retryCount)
        }
      } catch (error) {
        console.error("[Dynamic Guest] Failed to check room:", error)
        consecutiveErrors++
        retryCount++
        
        // Never disconnect due to network errors - keep trying
        console.log("[Dynamic Guest] Network error, but continuing to poll... attempt", retryCount)
        setError("연결 상태를 확인하는 중...")
      }
    }

    // Initial check
    checkRoomAndPoll()
    
    // Poll every 1 second for backup (Realtime이 주 방법, 폴링은 보조)
    const interval = createInterval(checkRoomAndPoll, 1000)

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
        console.log("[Dynamic Guest] Guest joined successfully:", response)
        setGuestData(response)
        setCanBid(true) // 변동입찰에서는 기본적으로 입찰 가능
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
            console.error("[DynamicGuest] Failed to update state after join:", error)
          }
        }, 500) // 0.5초 후 즉시 상태 확인
        
        // 호스트 페이지에 참가자 참여 알림을 위한 추가 요청
        setTimeout(async () => {
          try {
            // 호스트 페이지가 참가자 참여를 감지할 수 있도록 추가 요청
            await auctionAPI.getState(roomId)
            console.log("[DynamicGuest] Notified host of participation")
          } catch (error) {
            console.error("[DynamicGuest] Failed to notify host of participation:", error)
          }
        }, 1000) // 1초 후 호스트 알림
        
        // 추가 알림 요청 (더 확실한 동기화) - 여러 번 호출
        const notifyHost = async (attempt: number) => {
          try {
            await auctionAPI.getState(roomId)
            console.log(`[DynamicGuest] Notification ${attempt} sent to host`)
          } catch (error) {
            console.error(`[DynamicGuest] Failed to send notification ${attempt}:`, error)
          }
        }
        
        setTimeout(() => notifyHost(2), 1500) // 1.5초 후
        setTimeout(() => notifyHost(3), 3000) // 3초 후  
        setTimeout(() => notifyHost(4), 5000) // 5초 후
        
        toast({
          title: "참여 완료",
          description: `${response.nickname}님으로 변동입찰 경매에 참여했습니다.`,
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

    console.log("[Dynamic Guest] Place bid check:", {
      canBid,
      roundStatus: guestData.roundStatus,
      capital: guestData.capital,
      hasBidInCurrentRound: guestData.hasBidInCurrentRound
    })

    // 변동입찰에서는 canBid 대신 직접 조건 체크
    if (guestData.roundStatus !== "ACTIVE") {
      toast({
        title: "입찰 불가",
        description: "현재 라운드가 활성화되지 않았습니다.",
        variant: "destructive",
      })
      return
    }

    if (guestData.capital <= 0) {
      toast({
        title: "입찰 불가",
        description: "자본이 부족합니다.",
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

    // 변동입찰에서는 현재 최고 입찰가보다 높아야 함
    if (currentHighestBid && amount <= currentHighestBid.amount) {
      toast({
        title: "입찰 불가",
        description: `현재 최고 입찰가(${currentHighestBid.amount.toLocaleString()}원)보다 높은 금액을 입찰해야 합니다.`,
        variant: "destructive",
      })
      return
    }

    setIsBidding(true)
    
    try {
      console.log("[Dynamic Guest] Placing bid:", { roomId, nickname: guestData.nickname, amount })
      const response = await auctionAPI.placeBid(roomId, guestData.nickname, amount, guestData.currentRound || 1, 'dynamic')
      console.log("[Dynamic Guest] Bid response:", response)
      
      if (response.success) {
        // 최고 입찰 정보 먼저 업데이트 (실시간 반영)
        if (response.state?.currentHighestBid) {
          setCurrentHighestBid(response.state.currentHighestBid)
        }

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
            
            // 변동입찰에서는 항상 입찰 가능 (버튼에서 직접 체크)
            console.log("[Dynamic Guest] Post-bid dynamic - always setting canBid to true")
            setCanBid(true)
          }
        } else {
          // Fallback to simple update
          setGuestData((prev) => (prev ? { 
            ...prev, 
            capital: response.remainingCapital,
            hasBidInCurrentRound: response.hasBidInCurrentRound
          } : null))
          
          // 변동입찰에서는 항상 입찰 가능
          setCanBid(true)
        }
        
        setBidAmount("")
        
        console.log("[Dynamic Guest] Bid successful, updated guest data")
        toast({
          title: "입찰 완료",
          description: `변동입찰이 완료되었습니다. 더 높은 금액으로 재입찰 가능합니다. 남은 자본: ${response.remainingCapital?.toLocaleString() || guestData.capital?.toLocaleString()}원`,
        })
      } else {
        console.log("[Dynamic Guest] Bid failed:", response.error)
        toast({
          title: "입찰 실패",
          description: response.error || "입찰에 실패했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[Dynamic Guest] Failed to place bid:", error)
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
            <DialogTitle>변동입찰 경매 참여</DialogTitle>
            <DialogDescription>
              닉네임을 입력하고 변동입찰 경매에 참여하세요. 실시간 재입찰이 가능합니다.
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
              {isJoining ? "참여 중..." : "변동입찰 경매 참여하기"}
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
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-6 w-6" />
                  변동입찰 경매 참여
                </div>
                {guestData.status === 'ACTIVE' && (
                  <Badge 
                    variant={guestData.roundStatus === 'ACTIVE' ? 'default' : 'secondary'}
                    className="text-base px-4 py-2"
                  >
                    {guestData.roundStatus === 'ACTIVE' ? '🔥 라운드 진행 중' : '⏸️ 대기 중'}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                안녕하세요, <strong>{guestData.nickname}</strong>님! 변동입찰 경매에 참여하셨습니다.
                실시간 재입찰이 가능합니다.
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
                    {guestData.status === "ACTIVE" ? "변동입찰 진행 중" : "대기 중"}
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">경매 상태</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 변동입찰 최고 입찰 정보 */}
          {guestData.status === "ACTIVE" && guestData.roundStatus === "ACTIVE" && (
            <Card className="border-emerald-200 bg-emerald-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-emerald-700">
                  <TrendingUp className="h-5 w-5" />
                  현재 최고 입찰
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentHighestBid ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-emerald-800">
                        {currentHighestBid.nickname}
                      </p>
                      <p className="text-sm text-muted-foreground">최고 입찰자</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-600">
                        {currentHighestBid.amount.toLocaleString()}원
                      </p>
                      <p className="text-sm text-muted-foreground">입찰 금액</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p>아직 입찰자가 없습니다</p>
                    <p className="text-sm">첫 번째 입찰자가 되어보세요!</p>
                  </div>
                )}
                {/* 변동입찰에서 현재 사용자가 최고 입찰자일 때 알림 */}
                {currentHighestBid && currentHighestBid.nickname === guestData.nickname && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                    <p className="text-emerald-700 font-semibold">🏆 현재 최고 입찰자입니다!</p>
                    <p className="text-sm text-emerald-600">더 높은 입찰이 들어올 때까지 1위를 유지하세요.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Current Round Item (click to enlarge) */}
          {guestData.status === "ACTIVE" && (
            <Card onClick={() => currentRoundItem && setIsItemDialogOpen(true)} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  현재 경매 물품
                </CardTitle>
                <CardDescription>
                  라운드 {guestData.currentRound}의 경매 물품입니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentRoundItem ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold text-2xl text-gray-900">{currentRoundItem.item.name}</h3>
                        <p className="text-lg text-gray-700 mt-3 leading-relaxed">{currentRoundItem.item.description}</p>
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
                            className="max-w-full h-64 object-contain rounded-xl border-2 shadow"
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

          {/* 확대 다이얼로그 */}
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

          {/* Bidding Section */}
          {guestData.status === "ACTIVE" && guestData.roundStatus === "ACTIVE" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  변동입찰하기 (실시간 재입찰 가능)
                </CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    라운드 {guestData.currentRound}이 진행 중입니다
                    <Badge variant="outline">
                      {guestData.roundStatus === "ACTIVE" ? "실시간 입찰 가능" : "입찰 불가"}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bid-amount">입찰 금액</Label>
                    <Input
                      id="bid-amount"
                      type="number"
                      placeholder={currentHighestBid ? `${(currentHighestBid.amount + 1).toLocaleString()}원 이상 입력` : "입찰할 금액을 입력하세요"}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handlePlaceBid()}
                      min={currentHighestBid ? currentHighestBid.amount + 1 : 1}
                      max={guestData.capital}
                    />
                  </div>
                  <Button
                    onClick={handlePlaceBid}
                    className="w-full"
                    size="lg"
                    disabled={
                      isBidding || 
                      guestData.capital <= 0 || 
                      guestData.roundStatus !== "ACTIVE"
                    }
                  >
                    {isBidding ? "입찰 중..." : 
                     guestData.capital <= 0 ? "자본금 부족" : 
                     guestData.roundStatus !== "ACTIVE" ? "라운드 대기 중" : 
                     (currentHighestBid?.nickname === guestData.nickname ? "더 높은 금액으로 재입찰" : "입찰하기")}
                  </Button>
                  {guestData.capital <= 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>자본금이 모두 소진되었습니다. 더 이상 입찰할 수 없습니다.</AlertDescription>
                    </Alert>
                  )}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : guestData.status === "ACTIVE" ? (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                변동입찰 경매가 시작되었습니다. 호스트가 라운드를 시작하면 입찰할 수 있습니다.
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
                변동입찰 경매가 아직 시작되지 않았습니다. 호스트가 경매를 시작할 때까지 기다려주세요.
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
              <CardTitle>변동입찰 경매 규칙</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• 보유 자본금 내에서만 입찰할 수 있습니다.</p>
              <p>• <strong>변동입찰: 라운드 중 언제든지 재입찰이 가능합니다.</strong></p>
              <p>• 더 높은 금액으로만 입찰할 수 있습니다.</p>
              <p>• 다른 사람이 더 높은 금액을 입찰하면 자동으로 자본금이 환원됩니다.</p>
              <p>• 모든 입찰은 실시간으로 호스트 화면에 표시됩니다.</p>
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
