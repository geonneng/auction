"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Copy, Users, Clock, TrendingUp, QrCode } from "lucide-react"
import { auctionAPI } from "@/lib/api"
import type { AuctionState, Bid, HostData, RoundResults } from "@/types/auction"
import { toast } from "@/hooks/use-toast"
import QRCodeComponent from "@/components/qr-code"
import { Sidebar } from "@/components/sidebar"
import { AuctionItemProvider } from "@/contexts/auction-item-context"

export default function DynamicHostDashboard() {
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

  useEffect(() => {
    let isPolling = true
    let retryCount = 0
    let consecutiveErrors = 0
    const maxConsecutiveErrors = 10 // Allow many consecutive errors
    
    // Load room state on mount
    const loadRoomState = async () => {
      if (!isPolling) return
      
      try {
        console.log("[Dynamic Host] Polling room state for roomId:", roomId)
        const response = await auctionAPI.getState(roomId)
        console.log("[Dynamic Host] Poll response:", response)
        
        if (response.success) {
          setAuctionState(response.state)
          setJoinUrl(`${window.location.origin}/room-dynamic/${roomId}`)
          setIsConnected(true)
          consecutiveErrors = 0 // Reset error count on success
          
          // Update recent bids from the state
          if (response.state.bids && response.state.bids.length > 0) {
            setRecentBids(response.state.bids.slice(-20)) // Keep last 20 bids
          }

          // Update current highest bid
          if (response.state.currentHighestBid) {
            setCurrentHighestBid(response.state.currentHighestBid)
          } else {
            setCurrentHighestBid(null)
          }
        } else {
          console.log("[Dynamic Host] Room not found or error:", response.error)
          consecutiveErrors++
          
          // Only show error after many consecutive failures
          if (consecutiveErrors >= maxConsecutiveErrors) {
            console.log("[Dynamic Host] Many consecutive errors, but not redirecting")
            toast({
              title: "연결 문제",
              description: "서버 연결에 문제가 있습니다. 계속 시도 중...",
              variant: "destructive",
            })
          }
          
          // Never redirect to home - keep trying
          console.log("[Dynamic Host] Room error, but continuing to poll... attempt", consecutiveErrors)
        }
      } catch (error) {
        console.error("[Dynamic Host] Failed to load room state:", error)
        consecutiveErrors++
        
        // Never redirect due to network errors - keep trying
        console.log("[Dynamic Host] Network error, but continuing to poll... attempt", consecutiveErrors)
      }
    }

    loadRoomState()

    // Poll for updates every 2 seconds
    const interval = setInterval(loadRoomState, 2000)

    return () => {
      isPolling = false
      clearInterval(interval)
    }
  }, [roomId])

  const handleStartAuction = async () => {
    if (!auctionState) return
    
    try {
      const response = await auctionAPI.startAuction(auctionState.id)
      if (response.success) {
        setAuctionState(response.state)
        toast({
          title: "경매 시작",
          description: "변동입찰 경매가 시작되었습니다!",
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
      console.log("[Dynamic Host] Starting round for room:", auctionState.id)
      setRoundResults(null) // Clear previous round results
      
      const response = await auctionAPI.startRound(auctionState.id)
      if (response.success) {
        setAuctionState(response.state)
        toast({
          title: "라운드 시작",
          description: `라운드 ${response.round}가 시작되었습니다! (변동입찰)`,
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

  const copyJoinUrl = async () => {
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

    console.log(`[Dynamic Host] Modifying capital for ${editingGuest}: ${amount}`)
    
    try {
      const response = await auctionAPI.modifyCapital(auctionState.id, editingGuest, amount)
      if (response.success) {
        setAuctionState(response.state)
        const changeText = response.result.difference > 0 ? `+${response.result.difference.toLocaleString()}원` : `${response.result.difference.toLocaleString()}원`
        toast({
          title: "자본금 수정 완료",
          description: `${editingGuest}님의 자본금이 ${changeText} 변경되었습니다.`,
        })
        setEditingGuest(null)
        setNewCapital("")
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

  const handleCancelEdit = () => {
    setEditingGuest(null)
    setNewCapital("")
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">서버에 연결 중...</div>
          </CardContent>
        </Card>
      </div>
    )
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
      <AuctionItemProvider roomId={roomId}>
        <div>
          <Sidebar roomId={roomId} />
          <div className="ml-16 p-4 pt-4">
            <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-emerald-600">
              {auctionState.name ? `${auctionState.name} - 변동입찰 호스트` : '가치오름 - 변동입찰 호스트'}
            </h1>
            <p className="text-muted-foreground">방 ID: {auctionState.id} | 경매 방식: 변동입찰</p>
            {auctionState.status === "ACTIVE" && (
              <p className="text-sm text-muted-foreground">
                현재 라운드: {auctionState.currentRound} | 
                상태: {auctionState.roundStatus === "WAITING" ? "대기 중" : 
                       auctionState.roundStatus === "ACTIVE" ? "진행 중" : "종료"}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={auctionState.status === "ACTIVE" ? "default" : "secondary"}>
              {auctionState.status === "PRE-START" ? "대기 중" : auctionState.status === "ACTIVE" ? "진행 중" : "종료"}
            </Badge>
            {auctionState.status === "ACTIVE" && (
              <Badge variant={auctionState.roundStatus === "ACTIVE" ? "default" : "secondary"}>
                라운드 {auctionState.currentRound}
              </Badge>
            )}
          </div>
        </div>

        {/* 변동입찰 최고 입찰 정보 */}
        {auctionState.status === "ACTIVE" && auctionState.currentRound > 0 && (
          <Card className="border-emerald-200 bg-emerald-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <TrendingUp className="h-5 w-5" />
                {auctionState.roundStatus === "ACTIVE" ? "현재 최고 입찰" : "라운드 최고 입찰"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentHighestBid ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-emerald-800">
                      {currentHighestBid.nickname}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {auctionState.roundStatus === "ACTIVE" ? "최고 입찰자" : "라운드 승리자"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-emerald-600">
                      {currentHighestBid.amount.toLocaleString()}원
                    </p>
                    <p className="text-sm text-muted-foreground">입찰 금액</p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  <p>아직 입찰자가 없습니다</p>
                  <p className="text-sm">참가자들이 입찰할 때까지 기다려주세요</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Join URL Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              참여 링크 (변동입찰)
            </CardTitle>
            <CardDescription>게스트들이 이 링크를 통해 변동입찰 경매에 참여할 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input value={joinUrl} readOnly className="flex-1" />
                <Button onClick={copyJoinUrl} variant="outline" size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              {joinUrl && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <QrCode className="h-4 w-4" />
                    QR코드로 공유하기
                  </div>
                  <QRCodeComponent value={joinUrl} size={180} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Participants */}
          <Card className="h-96 overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                참가자 ({auctionState.guestCount}/6)
              </CardTitle>
              <CardDescription>
                변동입찰: 실시간 자본금 및 최고 입찰자 표시
              </CardDescription>
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
                          <TableHead className="text-right text-lg w-[120px] min-w-[120px]">남은 자본</TableHead>
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
                                <Badge variant="secondary" className="text-xs">입찰 완료</Badge>
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
                                />
                                <Button
                                  size="sm"
                                  onClick={handleSaveCapital}
                                  className="h-8 px-2"
                                >
                                  저장
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                  className="h-8 px-2"
                                >
                                  취소
                                </Button>
                              </div>
                            ) : (
                              // 변동입찰에서는 항상 자본 표시, 최고 입찰자 강조
                              <span className={
                                currentHighestBid?.nickname === guest.nickname
                                  ? "text-emerald-600 font-bold"
                                  : ""
                              }>
                                {guest.capital.toLocaleString()}원
                              </span>
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

          {/* Real-time Bid Feed or Round Results */}
          <Card className="h-96 overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                {roundResults ? `라운드 ${roundResults.round} 결과` : "실시간 입찰 현황"}
              </CardTitle>
              <CardDescription>
                {roundResults ? "라운드 종료 후 입찰 결과가 공개됩니다" : "변동입찰: 실시간 금액 및 순위 표시"}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-full overflow-hidden">
              <div className="space-y-3 h-full overflow-y-auto overflow-x-hidden">
                {roundResults ? (
                  <div className="space-y-4">
                    {roundResults.winner && (
                      <Alert className="border-green-200 bg-green-50">
                        <AlertDescription className="text-center">
                          <div className="text-2xl font-bold text-green-600 mb-2">🏆 낙찰자</div>
                          <div className="text-xl font-bold">{roundResults.winner.nickname}</div>
                          <div className="text-lg text-green-600">{roundResults.winner.amount?.toLocaleString()}원</div>
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-lg">라운드 {roundResults.round} 입찰 결과 공개</h4>
                      <div className="text-sm text-muted-foreground mb-3">
                        모든 입찰 금액이 공개되었습니다.
                      </div>
                      {roundResults.bids.map((bid, index) => (
                        <Alert key={`${bid.nickname}-${bid.timestamp}-${index}`} className="py-3">
                          <AlertDescription className="flex items-center justify-between min-w-0">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="font-bold text-lg truncate">{bid.nickname}</span>
                              {index === 0 && <Badge variant="default" className="flex-shrink-0">1위</Badge>}
                              {index === 1 && <Badge variant="secondary" className="flex-shrink-0">2위</Badge>}
                              {index === 2 && <Badge variant="outline" className="flex-shrink-0">3위</Badge>}
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
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
                ) : auctionState?.roundStatus === "ACTIVE" ? (
                  // Show current round bids during active round (SHOW amounts for dynamic)
                  (() => {
                    const currentRoundBids = recentBids.filter(bid => bid.round === auctionState.currentRound)
                    const sortedBids = currentRoundBids.sort((a, b) => b.amount - a.amount)
                    
                    return sortedBids.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <div className="text-lg mb-2">아직 입찰이 없습니다.</div>
                        <div className="text-sm">게스트들이 입찰하면 여기에 표시됩니다.</div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground mb-3">
                          라운드 {auctionState.currentRound} 입찰 현황 ({sortedBids.length}건) - 실시간 금액 표시
                        </div>
                        {sortedBids.map((bid, index) => (
                          <Alert 
                            key={`${bid.nickname}-${bid.timestamp}-${index}`} 
                            className={`py-3 ${
                              index === 0 ? 'border-emerald-200 bg-emerald-50' : ''
                            }`}
                          >
                            <AlertDescription className="flex items-center justify-between min-w-0">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="font-bold text-lg truncate">{bid.nickname}</span>
                                {index === 0 ? (
                                  <Badge variant="default" className="bg-emerald-600 flex-shrink-0">최고 입찰</Badge>
                                ) : (
                                  <Badge variant="outline" className="flex-shrink-0">입찰됨</Badge>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0 ml-2">
                                <div className={`font-mono font-bold text-lg ${
                                  index === 0 ? 'text-emerald-600' : 'text-foreground'
                                }`}>
                                  {bid.amount?.toLocaleString()}원
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(bid.timestamp).toLocaleTimeString()}
                                </div>
                              </div>
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    )
                  })()
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
                
                <div className="text-sm text-muted-foreground text-center">
                  {auctionState.roundStatus === "WAITING" 
                    ? "라운드를 시작하면 게스트들이 입찰할 수 있습니다."
                    : auctionState.roundStatus === "ACTIVE"
                    ? "변동입찰 진행 중: 게스트들이 실시간으로 재입찰 가능합니다."
                    : "라운드가 종료되었습니다. 새로운 라운드를 시작하세요."}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
            </div>
          </div>
        </div>
      </AuctionItemProvider>
    </div>
  )
}
