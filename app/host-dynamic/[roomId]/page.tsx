"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Copy, Users, Clock, TrendingUp, QrCode, Edit3, Package } from "lucide-react"
import { auctionAPI } from "@/lib/api"
import type { AuctionState, Bid, HostData, RoundResults, AuctionItem } from "@/types/auction"
import { toast } from "@/hooks/use-toast"
import QRCodeComponent from "@/components/qr-code"
import { Sidebar } from "@/components/sidebar"
import { AuctionItemProvider, useAuctionItem } from "@/contexts/auction-item-context"
import { useConnectionMonitor } from "@/hooks/use-connection-monitor"
import { useCleanup } from "@/hooks/use-cleanup"
import { useOfflineHandler } from "@/hooks/use-offline-handler"
import { DataValidator } from "@/lib/data-validation"

function DynamicHostDashboardContent() {
  const params = useParams()
  const roomId = params.roomId as string
  const router = useRouter()

  const [auctionState, setAuctionState] = useState<AuctionState | null>(null)
  const [joinUrl, setJoinUrl] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [recentBids, setRecentBids] = useState<Bid[]>([])
  const [roundResults, setRoundResults] = useState<RoundResults | null>(null)
  const [editingGuest, setEditingGuest] = useState<string | null>(null)
  const [newCapital, setNewCapital] = useState("")
  const [currentHighestBid, setCurrentHighestBid] = useState<any>(null)
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false)
  const [bulkCapital, setBulkCapital] = useState("")
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [isDistributingAmount, setIsDistributingAmount] = useState(false)
  const [previousGuestCount, setPreviousGuestCount] = useState(0)
  const [previousStateHash, setPreviousStateHash] = useState("")
  
  // AuctionItemProvider에서 경매 물품 데이터 가져오기
  const { auctionItems, getAllGuests, isLoading: isLoadingItems, loadAuctionItems } = useAuctionItem()
  
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
      console.log("[DynamicHost] Component unmounting, cleaning up resources")
    }
  })

  useEffect(() => {
    let isPolling = true
    let retryCount = 0
    let consecutiveErrors = 0
    const maxConsecutiveErrors = 10
    
    // Load room state on mount
    const loadRoomState = async () => {
      if (!isPolling) return
      
      try {
        console.log("[Dynamic Host] Polling room state for roomId:", roomId)
        const response = await auctionAPI.getState(roomId)
        console.log("[Dynamic Host] Poll response:", response)
        
        if (response.success) {
          const newState = response.state
          
          // 데이터 무결성 검증
          const validation = DataValidator.validateAuctionState(newState)
          if (!validation.isValid) {
            console.error("[DynamicHost] Invalid auction state:", validation.errors)
            // 데이터 복구 시도
            const recoveredState = DataValidator.recoverAuctionState(newState)
            newState = recoveredState
          }
          
          if (validation.warnings.length > 0) {
            console.warn("[DynamicHost] Auction state warnings:", validation.warnings)
          }
          
          const currentGuestCount = newState.guestCount || 0
          
          // 상태 변화 감지를 위한 해시 생성
          const stateHash = JSON.stringify({
            guestCount: currentGuestCount,
            status: newState.status,
            currentRound: newState.currentRound,
            roundStatus: newState.roundStatus,
            guests: newState.guests.map(g => g.nickname).sort() // 참가자 목록도 해시에 포함
          })
          
          // 상태가 실제로 변화했을 때만 업데이트
          if (stateHash !== previousStateHash) {
            // 참가자 수 변화 감지 및 알림
            if (previousGuestCount > 0 && currentGuestCount > previousGuestCount) {
              const newGuests = newState.guests.slice(previousGuestCount)
              newGuests.forEach((guest: any) => {
                toast({
                  title: "새 참가자 참여",
                  description: `${guest.nickname}님이 변동입찰 경매에 참여했습니다.`,
                })
              })
            }
            
            setAuctionState(newState)
            setRecentBids(newState.bids || [])
            setJoinUrl(`${window.location.origin}/room-dynamic/${roomId}`)
            setIsConnected(true)
            setPreviousGuestCount(currentGuestCount)
            setPreviousStateHash(stateHash)
            
            // 경매 물품 목록도 주기적으로 새로고침 (캐시 우선)
            setTimeout(() => {
              loadAuctionItems(roomId, false)
            }, 100)
          } else {
            // 상태가 동일해도 참가자 수가 변화했을 수 있으므로 확인
            if (previousGuestCount !== currentGuestCount) {
              console.log(`[DynamicHost] Guest count changed: ${previousGuestCount} -> ${currentGuestCount}`)
              setPreviousGuestCount(currentGuestCount)
              
              if (currentGuestCount > previousGuestCount) {
                const newGuests = newState.guests.slice(previousGuestCount)
                newGuests.forEach((guest: any) => {
                  toast({
                    title: "새 참가자 참여",
                    description: `${guest.nickname}님이 변동입찰 경매에 참여했습니다.`,
                  })
                })
              }
            }
          }
          
          // Update current highest bid for dynamic auction
          if (newState.currentHighestBid) {
            setCurrentHighestBid(newState.currentHighestBid)
          }
          
          // 연결 상태 기록
          recordRequest(true)
          consecutiveErrors = 0
          retryCount = 0
        } else {
          console.error("[Dynamic Host] Failed to get state:", response.error)
          recordRequest(false)
          consecutiveErrors++
        }
      } catch (error) {
        console.error("[Dynamic Host] Error polling room state:", error)
        recordRequest(false)
        consecutiveErrors++
      }
      
      retryCount++
      
      // Stop polling after too many consecutive errors
      if (consecutiveErrors >= maxConsecutiveErrors) {
        console.error("[Dynamic Host] Too many consecutive errors, stopping polling")
        isPolling = false
        setIsConnected(false)
      }
      
      // Continue polling if still active
      if (isPolling) {
        // 게스트 참여 감지를 위해 첫 1분은 1초 간격으로 폴링
        const pollingInterval = retryCount < 30 ? 1000 : 2000
        createTimeout(loadRoomState, pollingInterval)
      }
    }

    loadRoomState()
    
    return () => {
      isPolling = false
    }
  }, [roomId])

  const handleStartAuction = async () => {
    if (!auctionState) return
    
    try {
      const response = await auctionAPI.startAuction(auctionState.id)
      if (response.success) {
        setAuctionState(response.state)
        toast({
          title: "변동입찰 경매 시작",
          description: "변동입찰 경매가 성공적으로 시작되었습니다!",
        })
      } else {
        toast({
          title: "오류",
          description: response.error || "경매 시작에 실패했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to start auction:", error)
      toast({
        title: "연결 오류",
        description: "서버에 연결할 수 없습니다.",
        variant: "destructive",
      })
    }
  }

  const handleStartRound = async () => {
    if (!auctionState) return
    
    try {
      const response = await auctionAPI.startRound(auctionState.id)
      if (response.success) {
        setAuctionState(response.state)
        setRecentBids([]) // 새 라운드 시작 시 입찰 현황 초기화
        setRoundResults(null) // 이전 라운드 결과 초기화
        setCurrentHighestBid(null) // 최고 입찰 초기화
        toast({
          title: "라운드 시작",
          description: `라운드 ${response.state.currentRound}이 시작되었습니다!`,
        })
      } else {
        toast({
          title: "오류",
          description: response.error || "라운드 시작에 실패했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to start round:", error)
      toast({
        title: "연결 오류",
        description: "서버에 연결할 수 없습니다.",
        variant: "destructive",
      })
    }
  }

  const handleEndRound = async () => {
    if (!auctionState) return
    
    try {
      const response = await auctionAPI.endRound(auctionState.id)
      if (response.success) {
        setAuctionState(response.state)
        setRoundResults(response.roundResults)
        
        if (response.roundResults.winner) {
          toast({
            title: "라운드 종료",
            description: `라운드 ${response.roundResults.round} 종료! 최고 입찰자: ${response.roundResults.winner.nickname} (${response.roundResults.winner.amount?.toLocaleString()}원)`,
          })
        } else {
          toast({
            title: "라운드 종료",
            description: `라운드 ${response.roundResults.round} 종료! 입찰자가 없었습니다.`,
          })
        }
      } else {
        toast({
          title: "오류",
          description: response.error || "라운드 종료에 실패했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to end round:", error)
      toast({
        title: "연결 오류",
        description: "서버에 연결할 수 없습니다.",
        variant: "destructive",
      })
    }
  }

  const handleCopyJoinUrl = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl)
      toast({
        title: "복사 완료",
        description: "참여 링크가 클립보드에 복사되었습니다.",
      })
    } catch (err) {
      console.error("[Dynamic Host] Failed to copy:", err)
    }
  }

  const handleEditCapital = (nickname: string, currentCapital: number) => {
    setEditingGuest(nickname)
    setNewCapital(currentCapital.toString())
  }

  const handleBulkUpdateCapital = async () => {
    if (!auctionState || !bulkCapital) {
      toast({
        title: "입력 오류",
        description: "자본금을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    const capital = Number.parseInt(bulkCapital)
    if (isNaN(capital) || capital < 0) {
      toast({
        title: "입력 오류",
        description: "올바른 자본금을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsBulkUpdating(true)
    
    try {
      // 모든 참가자의 자본금을 일괄 업데이트
      const updatePromises = auctionState.guests.map(guest =>
        auctionAPI.modifyCapital(roomId, guest.nickname, capital)
      )
      
      await Promise.all(updatePromises)
      
      toast({
        title: "성공",
        description: `모든 참가자의 자본금을 ${capital.toLocaleString()}원으로 설정했습니다.`,
      })
      
      setIsBulkEditOpen(false)
      setBulkCapital("")
    } catch (error) {
      console.error("Failed to bulk update capital:", error)
      toast({
        title: "오류",
        description: "자본금 일괄 수정에 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsBulkUpdating(false)
    }
  }

  const handleOpenItemDialog = () => {
    setIsItemDialogOpen(true)
  }

  const handleRegisterItem = async (item: any) => {
    if (!auctionState) return

    try {
      const response = await auctionAPI.registerAuctionItem(roomId, item, auctionState.currentRound)
      if (response.success) {
        const targetRound = auctionState.currentRound === 0 ? 1 : auctionState.currentRound + 1
        toast({
          title: "성공",
          description: `"${item.name}"이(가) 라운드 ${targetRound}에 등록되었습니다.`,
        })
        setIsItemDialogOpen(false)
      } else {
        toast({
          title: "오류",
          description: response.error || "경매 물품 등록에 실패했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to register auction item:", error)
      toast({
        title: "오류",
        description: "경매 물품 등록에 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  const handleDistributeWinningAmount = async () => {
    if (!auctionState || !roundResults?.winner || !auctionState.currentRoundItem) return

    // 토스트 메시지용 데이터 미리 저장
    const winnerAmount = roundResults.winner.amount
    const ownerNickname = auctionState.currentRoundItem.item.ownerNickname

    setIsDistributingAmount(true)
    try {
      const response = await auctionAPI.distributeWinningAmount(
        roomId,
        roundResults.winner.nickname,
        roundResults.winner.amount,
        auctionState.currentRoundItem.item.ownerNickname
      )
      
      if (response.success) {
        // 낙찰 금액 전달 성공 시 상태 갱신
        setAuctionState(response.state)
        setRoundResults(null) // 이전 라운드 결과 초기화
        toast({
          title: "성공",
          description: `${winnerAmount?.toLocaleString()}원이 ${ownerNickname}에게 전달되었습니다.`,
        })
      } else {
        toast({
          title: "오류",
          description: response.error || "낙찰 금액 전달에 실패했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to distribute winning amount:", error)
      toast({
        title: "오류",
        description: "낙찰 금액 전달에 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsDistributingAmount(false)
    }
  }

  const handleSaveCapital = async () => {
    if (!editingGuest || !auctionState) return

    const amount = Number.parseInt(newCapital)
    if (isNaN(amount) || amount < 0) {
      toast({
        title: "입력 오류",
        description: "올바른 자본금을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await auctionAPI.modifyCapital(roomId, editingGuest, amount)
      if (response.success) {
        setAuctionState(response.state)
        setEditingGuest(null)
        setNewCapital("")
        toast({
          title: "성공",
          description: `${editingGuest}의 자본금이 ${amount.toLocaleString()}원으로 수정되었습니다.`,
        })
      } else {
        toast({
          title: "오류",
          description: response.error || "자본금 수정에 실패했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to modify capital:", error)
      toast({
        title: "연결 오류",
        description: "서버에 연결할 수 없습니다.",
        variant: "destructive",
      })
    }
  }

  if (!auctionState) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">경매 정보를 불러오는 중...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div>
        <Sidebar roomId={roomId} />
        <div className="ml-16 p-4 pt-4">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-emerald-600">
                  {auctionState.name ? `${auctionState.name} - 변동입찰 호스트` : 'BID - 변동입찰 호스트'}
                </h1>
                <p className="text-muted-foreground mt-1">
                  변동입찰 경매 관리자 페이지
                </p>
              </div>
            </div>

            {/* 참가 링크 및 QR 코드 섹션 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  참가 링크 공유
                </CardTitle>
                <CardDescription>
                  이 링크를 참가자들에게 공유하거나 QR 코드로 스캔하여 참여할 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="join-url">참가 링크</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="join-url"
                          value={joinUrl}
                          readOnly
                          className="flex-1"
                          placeholder="참여 링크를 불러오는 중..."
                        />
                        <Button onClick={handleCopyJoinUrl} size="sm">
                          <Copy className="h-4 w-4 mr-2" />
                          복사
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      💡 참가자들은 이 링크를 통해 변동입찰 경매에 참여할 수 있습니다.
                    </div>
                  </div>
                  {joinUrl && (
                    <div className="flex-shrink-0">
                      <QRCodeComponent value={joinUrl} size={150} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Participants */}
              <Card className="h-96 overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-6 w-6" />
                        참가자 ({auctionState.guestCount}/6)
                      </CardTitle>
                      <CardDescription>
                        변동입찰: 실시간 자본금 및 최고 입찰자 표시
                      </CardDescription>
                    </div>
                    <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center gap-2"
                          disabled={auctionState.guests.length === 0}
                        >
                          <Edit3 className="h-4 w-4" />
                          자본금 일괄 수정
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>자본금 일괄 수정</DialogTitle>
                          <DialogDescription>
                            모든 참가자의 자본금을 동일하게 설정합니다.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="bulk-capital">자본금</Label>
                            <Input
                              id="bulk-capital"
                              type="number"
                              placeholder="자본금을 입력하세요"
                              value={bulkCapital}
                              onChange={(e) => setBulkCapital(e.target.value)}
                              min="0"
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsBulkEditOpen(false)
                                setBulkCapital("")
                              }}
                            >
                              취소
                            </Button>
                            <Button
                              onClick={handleBulkUpdateCapital}
                              disabled={isBulkUpdating || !bulkCapital}
                            >
                              {isBulkUpdating ? "수정 중..." : "일괄 수정"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="h-full overflow-hidden">
                  {auctionState.guests.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      아직 참가자가 없습니다.
                      <br />
                      참여 링크를 공유해주세요.
                    </div>
                  ) : (
                    <div className="h-full overflow-y-auto overflow-x-hidden">
                      <div className="min-w-full">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-lg w-[120px] min-w-[120px]">닉네임</TableHead>
                              <TableHead className="text-center text-lg w-[100px] min-w-[100px]">입찰 상태</TableHead>
                              <TableHead className="text-right text-lg w-[120px] min-w-[120px]">현재 자본</TableHead>
                              <TableHead className="text-center text-lg w-[100px] min-w-[100px]">액션</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {auctionState.guests.map((guest) => (
                              <TableRow key={guest.nickname} className="h-12">
                                <TableCell className="font-medium text-lg truncate w-[120px] min-w-[120px] max-w-[120px]">{guest.nickname}</TableCell>
                                <TableCell className="text-center w-[100px] min-w-[100px] max-w-[100px]">
                                  {auctionState.roundStatus === "ACTIVE" ? (
                                    guest.hasBidInCurrentRound ? (
                                      <Badge variant="secondary" className="text-xs">입찰 중</Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-xs">입찰 대기</Badge>
                                    )
                                  ) : (
                                    <Badge variant="outline" className="text-xs">대기 중</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-mono text-lg w-[120px] min-w-[120px] max-w-[120px]">
                                  {editingGuest === guest.nickname ? (
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        value={newCapital}
                                        onChange={(e) => setNewCapital(e.target.value)}
                                        className="w-24 h-8 text-sm"
                                        min="0"
                                        onKeyDown={(e) => e.key === "Enter" && handleSaveCapital()}
                                      />
                                      <Button size="sm" onClick={handleSaveCapital} className="h-8 px-2 text-xs">
                                        저장
                                      </Button>
                                    </div>
                                  ) : (
                                    <span className="text-lg">{guest.capital.toLocaleString()}원</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center w-[100px] min-w-[100px] max-w-[100px]">
                                  {editingGuest === guest.nickname ? (
                                    <span className="text-xs text-muted-foreground">편집 중</span>
                                  ) : auctionState.roundStatus === "ACTIVE" ? (
                                    <span className="text-xs text-muted-foreground">라운드 중</span>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditCapital(guest.nickname, guest.capital)}
                                      className="h-6 px-1 text-xs"
                                    >
                                      수정
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Real-time Bid Feed */}
              <Card className="h-96 overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-6 w-6" />
                    실시간 입찰 현황
                  </CardTitle>
                  <CardDescription>변동입찰: 실시간 최고 입찰자 및 금액 표시</CardDescription>
                </CardHeader>
                <CardContent className="h-full overflow-hidden">
                  <div className="space-y-3 h-full overflow-y-auto overflow-x-hidden">
                    {currentHighestBid ? (
                      <div className="space-y-4">
                        <Alert className="border-emerald-200 bg-emerald-50">
                          <AlertDescription className="text-center">
                            <div className="text-2xl font-bold text-emerald-600 mb-2">🏆 현재 최고 입찰자</div>
                            <div className="text-xl font-bold">{currentHighestBid.nickname}</div>
                            <div className="text-lg text-emerald-600">{currentHighestBid.amount?.toLocaleString()}원</div>
                          </AlertDescription>
                        </Alert>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold text-lg">실시간 입찰 현황</h4>
                          <div className="text-sm text-muted-foreground mb-3">
                            변동입찰: 실시간으로 최고 입찰자와 금액이 업데이트됩니다.
                          </div>
                        </div>
                      </div>
                    ) : auctionState?.roundStatus === "ACTIVE" ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <div className="text-lg mb-2">아직 입찰이 없습니다.</div>
                        <div className="text-sm">게스트들이 입찰하면 여기에 표시됩니다.</div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        {auctionState?.status === "PRE-START"
                          ? "경매를 시작하면 입찰이 표시됩니다."
                          : auctionState?.roundStatus === "WAITING"
                          ? "라운드를 시작하면 입찰이 표시됩니다."
                          : "아직 입찰이 없습니다."}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Control Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-6 w-6" />
                  변동입찰 경매 제어
                </CardTitle>
                <CardDescription>변동입찰 경매 및 라운드 시작/종료 관리 - 실시간 재입찰 가능</CardDescription>
              </CardHeader>
              <CardContent>
                {auctionState.status === "PRE-START" ? (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      초기 자본금: {auctionState.initialCapital.toLocaleString()}원 | 경매 방식: 변동입찰
                    </div>
                    <Button
                      onClick={handleStartAuction}
                      disabled={auctionState.guestCount === 0}
                      size="lg"
                      className="w-full"
                    >
                      변동입찰 경매 시작하기
                    </Button>
                    {auctionState.guestCount === 0 && (
                      <p className="text-sm text-muted-foreground text-center">
                        최소 1명의 게스트가 참여해야 경매를 시작할 수 있습니다.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center">
                      <Badge variant="default" className="text-lg px-4 py-2 mb-2">
                        변동입찰 경매 진행 중
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        현재 라운드: {auctionState.currentRound} | 
                        상태: {auctionState.roundStatus === "WAITING" ? "대기 중" : 
                               auctionState.roundStatus === "ACTIVE" ? "진행 중" : "종료"}
                      </p>
                      
                      {/* 현재 라운드 경매 물품 표시 */}
                      {auctionState.currentRoundItem && (
                        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <div className="flex items-center gap-2 text-emerald-700">
                            <Package className="h-4 w-4" />
                            <span className="font-semibold">현재 경매 물품:</span>
                          </div>
                          <div className="mt-1">
                            <div className="font-medium text-emerald-800">{auctionState.currentRoundItem.item.name}</div>
                            <div className="text-sm text-emerald-600">등록자: {auctionState.currentRoundItem.item.ownerNickname}</div>
                            
                            {/* 라운드 종료 후 낙찰 금액 표시 및 전달 버튼 */}
                            {roundResults?.winner && (
                              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2 text-green-700 mb-2">
                                  <TrendingUp className="h-4 w-4" />
                                  <span className="font-semibold">낙찰 결과:</span>
                                </div>
                                <div className="text-sm">
                                  <div className="font-medium text-green-800">
                                    낙찰자: {roundResults.winner.nickname}
                                  </div>
                                  <div className="font-bold text-lg text-green-600">
                                    낙찰 금액: {roundResults.winner.amount?.toLocaleString()}원
                                  </div>
                                </div>
                                <Button
                                  onClick={handleDistributeWinningAmount}
                                  disabled={isDistributingAmount}
                                  size="sm"
                                  className="mt-2 bg-green-600 hover:bg-green-700"
                                >
                                  {isDistributingAmount ? "전달 중..." : "낙찰 금액 전달"}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-4">
                      <Button
                        onClick={handleStartRound}
                        disabled={auctionState.roundStatus === "ACTIVE"}
                        size="lg"
                        className="flex-1"
                      >
                        라운드 시작
                      </Button>
                      <Button
                        onClick={handleEndRound}
                        disabled={auctionState.roundStatus !== "ACTIVE"}
                        size="lg"
                        variant="outline"
                        className="flex-1"
                      >
                        라운드 종료
                      </Button>
                    </div>
                    
                    {/* 경매 물품 등록 버튼 */}
                    <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={handleOpenItemDialog}
                          disabled={auctionState.roundStatus === "ACTIVE"}
                          size="lg"
                          variant="outline"
                          className="w-full"
                        >
                          <Package className="h-4 w-4 mr-2" />
                          경매 물품 등록
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>경매 물품 선택</DialogTitle>
                          <DialogDescription>
                            {auctionState.currentRound === 0 
                              ? "라운드 1에 등록할 경매 물품을 선택하세요."
                              : `라운드 ${auctionState.currentRound + 1}에 등록할 경매 물품을 선택하세요.`}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="py-4">
                          {isLoadingItems ? (
                            <div className="text-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                              <p className="mt-2 text-muted-foreground">경매 물품 목록을 불러오는 중...</p>
                            </div>
                          ) : Object.keys(auctionItems).length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              등록된 경매 물품이 없습니다.
                              <br />
                              참가자들이 사이드바를 통해 물품을 등록해주세요.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {Object.entries(auctionItems).map(([guestName, item]) => (
                                <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                                  <CardContent className="p-4" onClick={() => handleRegisterItem(item)}>
                                    <div className="flex items-start gap-3">
                                      {item.image && (
                                        <img
                                          src={item.image}
                                          alt={item.name}
                                          className="w-16 h-16 object-cover rounded-lg"
                                        />
                                      )}
                                      <div className="flex-1">
                                        <h3 className="font-semibold text-lg">{item.name}</h3>
                                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                          <Badge variant="outline" className="text-xs">
                                            {guestName}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <div className="text-sm text-muted-foreground text-center">
                      {auctionState.roundStatus === "WAITING" 
                        ? "라운드를 시작하면 게스트들이 입찰할 수 있습니다."
                        : auctionState.roundStatus === "ACTIVE"
                        ? "변동입찰 진행 중: 게스트들이 실시간으로 재입찰 가능합니다."
                        : "라운드가 종료되었습니다. 새로운 라운드를 시작하거나 경매 물품을 등록할 수 있습니다."}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DynamicHostDashboard() {
  const params = useParams()
  const roomId = params.roomId as string

  return (
    <AuctionItemProvider roomId={roomId}>
      <DynamicHostDashboardContent />
    </AuctionItemProvider>
  )
}