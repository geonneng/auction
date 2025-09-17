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
import { Wallet, Clock, TrendingUp, AlertCircle } from "lucide-react"
import SocketManager from "@/lib/socket"
import type { GuestData, RoundResults } from "@/types/auction"
import { toast } from "@/hooks/use-toast"

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

  useEffect(() => {
    const socketManager = SocketManager.getInstance()
    const socket = socketManager.connect()

    socket.on("connect", () => {
      setIsConnected(true)
      console.log("[v0] Guest connected to server")
    })

    socket.on("disconnect", () => {
      setIsConnected(false)
    })

    socket.on("guest:joined", (data: GuestData) => {
      console.log("[v0] Guest joined successfully:", data)
      console.log(`[v0] hasBidInCurrentRound: ${data.hasBidInCurrentRound}, canBid will be: ${!data.hasBidInCurrentRound}`)
      setGuestData(data)
      setCanBid(!data.hasBidInCurrentRound)
      setShowJoinModal(false)
      setIsJoining(false)
      toast({
        title: "참여 완료",
        description: `${data.nickname}님으로 경매에 참여했습니다.`,
      })
    })

    socket.on("guest:bidSuccess", (data: { remainingCapital: number; hasBidInCurrentRound: boolean }) => {
      console.log("[v0] Bid successful, remaining capital:", data.remainingCapital)
      setGuestData((prev) => (prev ? { ...prev, capital: data.remainingCapital } : null))
      setCanBid(!data.hasBidInCurrentRound)
      setBidAmount("")
      setIsBidding(false)
      toast({
        title: "입찰 완료",
        description: `입찰이 성공적으로 처리되었습니다. 남은 자본: ${data.remainingCapital.toLocaleString()}원`,
      })
    })

    socket.on("auction:started", () => {
      console.log("[v0] Auction started")
      setGuestData((prev) => (prev ? { ...prev, status: "ACTIVE" } : null))
      toast({
        title: "경매 시작",
        description: "경매가 시작되었습니다! 호스트가 라운드를 시작하면 입찰할 수 있습니다.",
      })
    })

    socket.on("round:started", (data: { round: number; canBid: boolean }) => {
      console.log("[v0] Round started:", data.round)
      console.log(`[v0] Round started - canBid: ${data.canBid}`)
      setGuestData((prev) => (prev ? { ...prev, currentRound: data.round, roundStatus: "ACTIVE" } : null))
      setCanBid(data.canBid)
      setRoundResults(null) // Clear previous round results
      toast({
        title: "라운드 시작",
        description: `라운드 ${data.round}가 시작되었습니다! 이제 입찰할 수 있습니다.`,
      })
    })

    socket.on("round:ended", (data: { round: number, results: RoundResults }) => {
      console.log("[v0] Round ended:", data.round, data.results)
      setGuestData((prev) => (prev ? { ...prev, roundStatus: "ENDED" } : null))
      setRoundResults(data.results)
      if (data.results.winner) {
        toast({
          title: "라운드 종료",
          description: `라운드 ${data.round} 종료! 최고 입찰자: ${data.results.winner.nickname} (${data.results.winner.amount?.toLocaleString()}원)`,
        })
      } else {
        toast({
          title: "라운드 종료",
          description: `라운드 ${data.round} 종료! 입찰자가 없었습니다.`,
        })
      }
    })

    socket.on("guest:capitalChanged", (data: { newCapital: number; difference: number }) => {
      console.log("[v0] Capital changed:", data)
      console.log(`[v0] Updating guest capital from ${guestData?.capital} to ${data.newCapital}`)
      setGuestData((prev) => {
        const updated = prev ? { ...prev, capital: data.newCapital } : null
        console.log("[v0] Updated guest data:", updated)
        return updated
      })
      
      const changeText = data.difference > 0 ? `+${data.difference.toLocaleString()}원` : `${data.difference.toLocaleString()}원`
      toast({
        title: "자본금 변경",
        description: `자본금이 ${changeText} 변경되었습니다. 현재 자본: ${data.newCapital.toLocaleString()}원`,
      })
    })

    socket.on("room:ended", (data: { reason: string }) => {
      console.log("[v0] Room ended:", data.reason)
      toast({
        title: "경매 종료",
        description: data.reason,
        variant: "destructive",
      })
      setGuestData(null)
      setShowJoinModal(true)
    })

    socket.on("app:error", (error) => {
      console.error("[v0] Socket error:", error)
      setError(error.message)
      setIsJoining(false)
      setIsBidding(false)
      toast({
        title: "오류",
        description: error.message,
        variant: "destructive",
      })
      if (error?.message === "존재하지 않는 방입니다") {
        setTimeout(() => {
          router.push("/")
        }, 800)
      }
    })

    return () => {
      socketManager.disconnect()
    }
  }, [roomId])

  const handleJoinRoom = () => {
    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요.")
      return
    }

    const socket = SocketManager.getInstance().getSocket()
    if (!socket) {
      setError("서버에 연결할 수 없습니다.")
      return
    }

    setIsJoining(true)
    setError("")
    socket.emit("guest:join", { roomId, nickname: nickname.trim() })
  }

  const handlePlaceBid = () => {
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

    const socket = SocketManager.getInstance().getSocket()
    if (!socket) {
      toast({
        title: "연결 오류",
        description: "서버에 연결할 수 없습니다.",
        variant: "destructive",
      })
      return
    }

    setIsBidding(true)
    socket.emit("guest:bid", {
      roomId,
      nickname: guestData.nickname,
      amount,
    })
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">서버에 연결 중...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Join Modal */}
      <Dialog open={showJoinModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>경매 참여</DialogTitle>
            <DialogDescription>닉네임을 입력하여 경매에 참여하세요.</DialogDescription>
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
                maxLength={20}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button onClick={handleJoinRoom} className="w-full" disabled={isJoining}>
              {isJoining ? "참여 중..." : "참여하기"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Guest Interface */}
      {guestData && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary">다시마 경매</h1>
            <p className="text-muted-foreground">안녕하세요, {guestData.nickname}님!</p>
          </div>

          {/* Capital Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />내 자본금
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold font-mono text-primary">{guestData.capital.toLocaleString()}원</div>
                <div className="text-sm text-muted-foreground mt-2">남은 자본금</div>
              </div>
            </CardContent>
          </Card>

          {/* Status and Bidding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                입찰하기
              </CardTitle>
              <CardDescription>
                <div className="flex items-center gap-2">
                  <Badge variant={guestData.status === "ACTIVE" ? "default" : "secondary"}>
                    {guestData.status === "PRE-START" ? "대기 중" : guestData.status === "ACTIVE" ? "진행 중" : "종료"}
                  </Badge>
                  {guestData.status === "PRE-START" && (
                    <span className="text-sm">호스트가 경매를 시작하기를 기다리는 중입니다...</span>
                  )}
                  {guestData.status === "ACTIVE" && (
                    <span className="text-sm">호스트가 라운드를 시작하기를 기다리는 중입니다...</span>
                  )}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {guestData.status === "PRE-START" ? (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    경매가 아직 시작되지 않았습니다. 호스트가 경매를 시작할 때까지 기다려주세요.
                  </AlertDescription>
                </Alert>
              ) : guestData.status === "ACTIVE" && guestData.roundStatus === "ACTIVE" ? (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <Badge variant="default" className="text-lg px-4 py-2">
                      라운드 {guestData.currentRound} 진행 중
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
                </div>
              ) : guestData.status === "ACTIVE" ? (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    경매가 시작되었습니다. 호스트가 라운드를 시작하면 입찰할 수 있습니다.
                    {guestData.currentRound && guestData.currentRound > 0 && (
                      <span className="block mt-2 text-sm">
                        현재 라운드: {guestData.currentRound} | 
                        상태: {guestData.roundStatus === "WAITING" ? "대기 중" : 
                               guestData.roundStatus === "ENDED" ? "종료" : "알 수 없음"}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertDescription>경매가 종료되었습니다.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Round Results */}
          {roundResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  라운드 {roundResults.round} 결과
                </CardTitle>
                <CardDescription>라운드 종료 후 입찰 결과가 공개됩니다</CardDescription>
              </CardHeader>
              <CardContent>
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
      )}
    </div>
  )
}
