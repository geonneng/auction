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
import { auctionAPI } from "@/lib/api"
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

  // Check if room exists on mount
  useEffect(() => {
    const checkRoomExists = async () => {
      try {
        const response = await auctionAPI.getState(roomId)
        if (response.success) {
          setIsConnected(true)
        } else {
          setIsConnected(false)
          setError("존재하지 않는 방입니다.")
        }
      } catch (error) {
        console.error("Failed to check room:", error)
        setIsConnected(false)
        setError("서버에 연결할 수 없습니다.")
      }
    }

    checkRoomExists()
  }, [roomId])

  // Poll for room state updates (only after guest joins)
  useEffect(() => {
    if (!guestData) return

    const pollRoomState = async () => {
      try {
        const response = await auctionAPI.getState(roomId)
        if (response.success) {
          // Update guest data based on current state
          const currentGuest = response.state.guests.find(g => g.nickname === guestData.nickname)
          if (currentGuest) {
            setGuestData(prev => ({
              ...prev!,
              capital: currentGuest.capital,
              status: response.state.status,
              currentRound: response.state.currentRound,
              roundStatus: response.state.roundStatus,
              hasBidInCurrentRound: currentGuest.hasBidInCurrentRound
            }))
            setCanBid(!currentGuest.hasBidInCurrentRound)
          }
        }
      } catch (error) {
        console.error("Failed to poll room state:", error)
      }
    }

    // Poll every 2 seconds
    const interval = setInterval(pollRoomState, 2000)

    return () => {
      clearInterval(interval)
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
        toast({
          title: "참여 완료",
          description: `${response.nickname}님으로 경매에 참여했습니다.`,
        })
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
      const response = await auctionAPI.placeBid(roomId, guestData.nickname, amount)
      if (response.success) {
        setGuestData((prev) => (prev ? { ...prev, capital: response.remainingCapital } : null))
        setCanBid(!response.hasBidInCurrentRound)
        setBidAmount("")
        toast({
          title: "입찰 완료",
          description: `입찰이 성공적으로 처리되었습니다. 남은 자본: ${response.remainingCapital.toLocaleString()}원`,
        })
      } else {
        toast({
          title: "입찰 실패",
          description: response.error || "입찰에 실패했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to place bid:", error)
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
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              {error ? (
                <div className="space-y-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                  <Button onClick={() => window.location.reload()}>
                    다시 시도
                  </Button>
                </div>
              ) : (
                "서버에 연결 중..."
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
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
                  라운드 {roundResults.round} 결과
                </CardTitle>
                <CardDescription>라운드 종료 후 입찰 결과가 공개됩니다</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {roundResults.winner ? (
                    <Alert>
                      <AlertDescription className="text-center">
                        <div className="text-2xl font-bold text-primary mb-2">🏆 최고 입찰자</div>
                        <div className="text-xl font-semibold">{roundResults.winner.nickname}</div>
                        <div className="text-lg text-muted-foreground">
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
