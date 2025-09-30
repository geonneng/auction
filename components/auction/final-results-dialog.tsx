'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trophy, Users, DollarSign, Award, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { AuctionRoom, AuctionBid, AuctionGuest } from '@/types/auction'

interface FinalResultsDialogProps {
  isOpen: boolean
  onClose: () => void
  room: AuctionRoom
  guests: AuctionGuest[]
  allBids: AuctionBid[]
  auctionType?: 'fixed' | 'dynamic'
}

export function FinalResultsDialog({ 
  isOpen, 
  onClose, 
  room, 
  guests, 
  allBids,
  auctionType = 'fixed'
}: FinalResultsDialogProps) {
  const router = useRouter()
  const [results, setResults] = useState<{
    guestResults: Array<{
      guest: AuctionGuest
      remainingCapital: number
      wonRounds: number
      totalSpent: number
      finalRank: number
      wonRoundNumbers: number[]
    }>
    totalRounds: number
  }>({
    guestResults: [],
    totalRounds: 0
  })

  useEffect(() => {
    if (!isOpen || !room || !guests.length || !allBids.length) return

    // 라운드별로 그룹화
    const bidsByRound = allBids.reduce((acc, bid) => {
      const round = bid.round || 1
      if (!acc[round]) acc[round] = []
      acc[round].push(bid)
      return acc
    }, {} as Record<number, AuctionBid[]>)

    const totalRounds = Math.max(...Object.keys(bidsByRound).map(Number))
    
    // 각 참가자별 결과 계산
    const guestResults = guests.map(guest => {
      let wonRounds = 0
      let totalSpent = 0
      let wonRoundNumbers: number[] = []

      // 각 라운드별로 처리
      for (let round = 1; round <= totalRounds; round++) {
        const roundBids = bidsByRound[round] || []
        const guestBid = roundBids.find(bid => bid.guest_id === guest.id)
        
        if (guestBid) {
          // 해당 라운드에서 이 참가자가 최고가인지 확인
          const maxBid = Math.max(...roundBids.map(bid => bid.amount))
          if (guestBid.amount === maxBid) {
            wonRounds++
            totalSpent += guestBid.amount
            wonRoundNumbers.push(round)
          }
        }
      }

      // 고정입찰과 변동입찰 모두 guest.capital에 실제 남은 자본금이 반영되어 있음
      // - 고정입찰: 입찰 시 차감, 환원 없음
      // - 변동입찰: 입찰 시 차감, 새 최고 입찰 나오면 즉시 환원
      const remainingCapital = guest.capital || 0

      return {
        guest,
        remainingCapital,
        wonRounds,
        totalSpent,
        finalRank: 0, // 나중에 계산
        wonRoundNumbers
      }
    })

    // 최종 순위 계산 (낙찰 라운드 수 기준, 동점시 남은 자본금 기준)
    guestResults.sort((a, b) => {
      if (b.wonRounds !== a.wonRounds) {
        return b.wonRounds - a.wonRounds
      }
      return b.remainingCapital - a.remainingCapital
    })

    guestResults.forEach((result, index) => {
      result.finalRank = index + 1
    })

    setResults({ guestResults, totalRounds })
  }, [isOpen, room, guests, allBids])

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />
    if (rank === 2) return <Award className="h-4 w-4 text-gray-400" />
    if (rank === 3) return <Award className="h-4 w-4 text-amber-600" />
    return <span className="text-sm font-bold text-gray-500">#{rank}</span>
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-50 border-yellow-200'
    if (rank === 2) return 'bg-gray-50 border-gray-200'
    if (rank === 3) return 'bg-amber-50 border-amber-200'
    return 'bg-white border-gray-200'
  }

  const handleNewAuction = () => {
    onClose()
    router.push('/')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="h-6 w-6 text-yellow-500" />
            경매 최종 결과
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* 전체 통계 - 행 단위 레이아웃 */}
          <div className="space-y-3">
            <Card className="border-2 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-blue-500" />
                    <span className="font-semibold text-lg text-gray-700">총 참가자</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-600 whitespace-nowrap">
                    {guests.length}명
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-6 w-6 text-green-500" />
                    <span className="font-semibold text-lg text-gray-700">총 라운드</span>
                  </div>
                  <p className="text-3xl font-bold text-green-600 whitespace-nowrap">
                    {results.totalRounds}라운드
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                    <span className="font-semibold text-lg text-gray-700">총 낙찰</span>
                  </div>
                  <p className="text-3xl font-bold text-yellow-600 whitespace-nowrap">
                    {results.guestResults.reduce((sum, r) => sum + r.wonRounds, 0)}건
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 참가자별 결과 */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">참가자별 결과</h3>
            {/* 헤더 */}
            <div className="hidden lg:grid lg:grid-cols-[2fr_4fr_2fr] px-2 py-3 text-sm font-semibold text-gray-600 border-b">
              <div className="pl-1">참가자</div>
              <div className="text-center">낙찰 라운드 (상세)</div>
              <div className="text-right pr-1">남은 자본금</div>
            </div>
            <div className="space-y-3">
              {results.guestResults.map((result) => (
                <Card 
                  key={result.guest.id} 
                  className={`${getRankColor(result.finalRank)} transition-all hover:shadow-lg border-2`}
                >
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-[2fr_4fr_2fr] items-center gap-4 lg:gap-6">
                      {/* 참가자 */}
                      <div className="flex items-center gap-3 min-w-0">
                        {getRankIcon(result.finalRank)}
                        <h4 className="font-bold text-xl text-gray-900 truncate">{result.guest.nickname}</h4>
                      </div>

                      {/* 낙찰 라운드 (상세 포함) */}
                      <div className="text-left lg:text-center min-w-0">
                        <p className="text-2xl font-bold text-green-600 mb-1">{result.wonRounds}라운드</p>
                        {result.wonRoundNumbers.length > 0 && (
                          <p className="text-sm text-gray-600 whitespace-normal break-words leading-relaxed">
                            {result.wonRoundNumbers.map(round => `${round}라운드`).join(', ')}
                          </p>
                        )}
                      </div>

                      {/* 남은 자본금 */}
                      <div className="text-left lg:text-right">
                        <p className="text-2xl font-bold text-blue-600">{result.remainingCapital.toLocaleString()}원</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* 새 경매 시작 버튼 */}
          <div className="pt-6 border-t">
            <div className="flex justify-center">
              <Button 
                onClick={handleNewAuction}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                새 경매 시작하기
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
