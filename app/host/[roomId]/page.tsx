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

export default function HostDashboard() {
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

  useEffect(() => {
    // Load room state on mount
    const loadRoomState = async () => {
      try {
        const response = await auctionAPI.getState(roomId)
        if (response.success) {
          setAuctionState(response.state)
          setJoinUrl(`${window.location.origin}/room/${roomId}`)
          setIsConnected(true)
        } else {
          toast({
            title: "오류",
            description: response.error || "방을 찾을 수 없습니다.",
            variant: "destructive",
          })
          setTimeout(() => {
            router.push("/")
          }, 800)
        }
      } catch (error) {
        console.error("Failed to load room state:", error)
        toast({
          title: "연결 오류",
          description: "서버에 연결할 수 없습니다.",
          variant: "destructive",
        })
      }
    }

    loadRoomState()

    // Poll for updates every 2 seconds
    const interval = setInterval(loadRoomState, 2000)

    return () => {
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
          description: "경매가 시작되었습니다!",
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
      console.log("[v0] Starting round for room:", auctionState.id)
      setRoundResults(null) // Clear previous round results
      
      const response = await auctionAPI.startRound(auctionState.id)
      if (response.success) {
        setAuctionState(response.state)
        toast({
          title: "라운드 시작",
          description: `라운드 ${response.round}가 시작되었습니다!`,
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
      console.error("[v0] Failed to copy:", err)
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

    console.log(`[v0] Modifying capital for ${editingGuest}: ${amount}`)
    
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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">다시마 경매 - 호스트</h1>
            <p className="text-muted-foreground">방 ID: {auctionState.id}</p>
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

        {/* Join URL Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              참여 링크
            </CardTitle>
            <CardDescription>게스트들이 이 링크를 통해 경매에 참여할 수 있습니다.</CardDescription>
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
          <Card className="h-96">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                참가자 ({auctionState.guestCount}/6)
              </CardTitle>
              <CardDescription>현재 접속 중인 게스트들의 목록과 자본금 현황</CardDescription>
            </CardHeader>
            <CardContent className="h-full">
              {auctionState.guests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  아직 참가자가 없습니다.
                  <br />
                  참여 링크를 공유해주세요.
                </div>
              ) : (
                <div className="h-full overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-lg">닉네임</TableHead>
                        <TableHead className="text-center text-lg">입찰 상태</TableHead>
                        <TableHead className="text-right text-lg">남은 자본</TableHead>
                        <TableHead className="text-center text-lg">액션</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auctionState.guests.map((guest) => (
                        <TableRow key={guest.nickname} className="h-12">
                          <TableCell className="font-medium text-lg">{guest.nickname}</TableCell>
                          <TableCell className="text-center">
                            {auctionState.roundStatus === "ACTIVE" ? (
                              guest.hasBidInCurrentRound ? (
                                <Badge variant="secondary">입찰 완료</Badge>
                              ) : (
                                <Badge variant="outline">입찰 대기</Badge>
                              )
                            ) : (
                              <Badge variant="outline">대기 중</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-lg">
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
                              <span>{guest.capital.toLocaleString()}원</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {editingGuest === guest.nickname ? (
                              <span className="text-sm text-muted-foreground">편집 중</span>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditCapital(guest.nickname, guest.capital)}
                                className="h-8 px-2"
                              >
                                자본금 수정
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Real-time Bid Feed or Round Results */}
          <Card className="h-96">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                {roundResults ? `라운드 ${roundResults.round} 결과` : "실시간 입찰 현황"}
              </CardTitle>
              <CardDescription>
                {roundResults ? "라운드 종료 후 입찰 결과가 공개됩니다" : "최근 입찰 내역이 실시간으로 표시됩니다"}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-full">
              <div className="space-y-3 h-full overflow-y-auto">
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
                      <h4 className="font-semibold text-lg">전체 입찰 내역</h4>
                      {roundResults.bids.map((bid, index) => (
                        <Alert key={`${bid.nickname}-${bid.timestamp}-${index}`} className="py-3">
                          <AlertDescription className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg">{bid.nickname}</span>
                              {index === 0 && <Badge variant="default">1위</Badge>}
                            </div>
                            <span className="font-mono font-bold text-lg">{bid.amount?.toLocaleString()}원</span>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                ) : auctionState?.roundStatus === "ACTIVE" ? (
                  // Show only current round bids during active round
                  recentBids.filter(bid => bid.round === auctionState.currentRound).length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      아직 입찰이 없습니다.
                    </div>
                  ) : (
                    recentBids
                      .filter(bid => bid.round === auctionState.currentRound)
                      .map((bid, index) => (
                        <Alert key={`${bid.nickname}-${bid.timestamp}-${index}`} className="py-3">
                          <AlertDescription className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg">{bid.nickname}</span>
                              <span className="text-sm text-muted-foreground">
                                라운드 {bid.round}
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(bid.timestamp).toLocaleTimeString()}
                            </span>
                          </AlertDescription>
                        </Alert>
                      ))
                  )
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
              경매 제어
            </CardTitle>
            <CardDescription>경매 및 라운드 시작/종료 관리</CardDescription>
          </CardHeader>
          <CardContent>
            {auctionState.status === "PRE-START" ? (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  초기 자본금: {auctionState.initialCapital.toLocaleString()}원
                </div>
                <Button
                  onClick={handleStartAuction}
                  disabled={auctionState.guestCount === 0}
                  size="lg"
                  className="w-full"
                >
                  경매 시작하기
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
                    경매 진행 중
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
                    ? "현재 라운드가 진행 중입니다. 게스트들이 입찰하고 있습니다."
                    : "라운드가 종료되었습니다. 새로운 라운드를 시작하세요."}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
