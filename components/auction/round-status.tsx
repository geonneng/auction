'use client'

import { useRoom, useGuests, useCurrentRoundBids, useCurrentRoundItem, useBids } from '@/stores/auction-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Clock, Package, TrendingUp, Users } from 'lucide-react'

interface RoundStatusProps {
  auctionType?: 'fixed' | 'dynamic'
}

export function RoundStatus({ auctionType = 'fixed' }: RoundStatusProps) {
  const room = useRoom()
  const currentRoundBids = useCurrentRoundBids()
  const currentRoundItem = useCurrentRoundItem()
  const guests = useGuests()
  const allBids = useBids()
  
  if (!room) return null
  
  // 현재 라운드 최고 입찰가 계산
  const highestBid = currentRoundBids.reduce((max, bid) => 
    bid.amount > max ? bid.amount : max, 0
  )
  
  const highestBidder = currentRoundBids.find(bid => bid.amount === highestBid)
  
  // 입찰 참여율 계산
  const biddingParticipation = guests.length > 0 
    ? (currentRoundBids.length / guests.length) * 100 
    : 0
  
  // 입찰 완료한 참가자 수
  const completedBidders = guests.filter(guest => 
    guest.has_bid_in_current_round || guest.hasBidInCurrentRound
  ).length

  const hideAmounts = auctionType === 'fixed' && room.round_status === 'ACTIVE'
  
  const getRoundStatusInfo = () => {
    if (room.status === 'PRE-START') {
      return {
        title: '경매 시작 전',
        description: '경매가 아직 시작되지 않았습니다.',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100'
      }
    }
    
    if (room.status === 'ENDED') {
      return {
        title: '경매 종료',
        description: '모든 라운드가 완료되었습니다.',
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      }
    }
    
    switch (room.round_status) {
      case 'WAITING':
        return {
          title: '라운드 대기 중',
          description: '라운드를 시작할 준비가 되었습니다.',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        }
      case 'ACTIVE':
        return {
          title: '라운드 진행 중',
          description: '참가자들이 입찰하고 있습니다.',
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        }
      case 'ENDED':
        return {
          title: '라운드 완료',
          description: '라운드가 종료되었습니다.',
          color: 'text-purple-600',
          bgColor: 'bg-purple-100'
        }
      default:
        return {
          title: '알 수 없는 상태',
          description: '',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        }
    }
  }
  
  const statusInfo = getRoundStatusInfo()
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            라운드 {room.current_round} 상태
          </div>
          <Badge variant="outline" className={statusInfo.color}>
            {statusInfo.title}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 현재 아이템 정보 */}
        {currentRoundItem ? (
          <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <Package className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {currentRoundItem.item.name}
              </h3>
              {currentRoundItem.item.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {currentRoundItem.item.description}
                </p>
              )}
              {currentRoundItem.item.starting_price && (
                <p className="text-sm text-blue-600 mt-2 font-medium">
                  시작가: {currentRoundItem.item.starting_price.toLocaleString()}원
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <Package className="h-6 w-6 text-gray-400" />
            <div>
              <p className="text-gray-600">등록된 아이템이 없습니다</p>
              <p className="text-sm text-gray-500"></p>
            </div>
          </div>
        )}
        
        {/* 입찰 현황 */}
        {room.round_status === 'ACTIVE' && (
          <div className="space-y-4">
            {/* 최고 입찰가 */}
            {highestBid > 0 && (
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-green-600">
                      {hideAmounts ? '비공개' : `${highestBid.toLocaleString()}원`}
                    </span>
                    <span className="text-sm text-gray-600">최고 입찰가</span>
                  </div>
                  {highestBidder && (
                    <p className="text-sm text-gray-600 mt-1">
                      입찰자: {highestBidder.nickname}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {/* 입찰 참여 현황 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>입찰 참여 현황</span>
                </div>
                <span className="font-medium">
                  {completedBidders}/{guests.length}명 ({Math.round(biddingParticipation)}%)
                </span>
              </div>
              
              <Progress 
                value={biddingParticipation} 
                className="h-2"
              />
              
              <div className="text-xs text-gray-500 text-center">
                {guests.length - completedBidders > 0 
                  ? `${guests.length - completedBidders}명이 아직 입찰하지 않았습니다`
                  : '모든 참가자가 입찰을 완료했습니다'
                }
              </div>
            </div>
          </div>
        )}
        
        {/* 입찰 내역 (최근 5개) */}
        {currentRoundBids.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              최근 입찰 내역
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {(hideAmounts ? [] : currentRoundBids)
                .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
                .slice(0, 5)
                .map((bid, index) => (
                  <div key={bid.id || index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">
                      {bid.nickname}
                    </span>
                    <span className="text-sm text-blue-600 font-semibold">
                      {bid.amount.toLocaleString()}원
                    </span>
                  </div>
                ))
              }
            </div>
            
            {currentRoundBids.length > 5 && (
              <p className="text-xs text-gray-500 text-center">
                총 {currentRoundBids.length}건의 입찰이 있습니다
              </p>
            )}
          </div>
        )}

        {/* 고정입찰: WAITING 상태에서 현재 라운드 순위 공개 */}
        {auctionType === 'fixed' && room.round_status === 'WAITING' && (() => {
          // 현재 라운드의 입찰 데이터 필터링 (WAITING 상태에서는 current_round가 종료된 라운드)
          const currentRoundBids = allBids.filter(bid => bid.round === room.current_round)
          const roundNumber = room.current_round
          
          return currentRoundBids.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {roundNumber}라운드 결과 (순위 공개)
              </h4>
              <div className="space-y-2">
                {currentRoundBids
                  .slice()
                  .sort((a, b) => b.amount - a.amount)
                  .map((bid, index) => (
                    <div key={bid.id || `${bid.nickname}-${index}`} className="flex items-center justify-between py-2 px-3 bg-emerald-50 rounded border border-emerald-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-600 text-white font-semibold">{index + 1}위</span>
                        <span className="text-sm font-medium">{bid.nickname}</span>
                      </div>
                      <span className="text-sm text-emerald-700 font-semibold">{bid.amount.toLocaleString()}원</span>
                    </div>
                  ))}
              </div>
            </div>
          )
        })()}
        
        {/* 상태별 추가 정보 */}
        <div className="pt-2 border-t">
          <p className={`text-sm ${statusInfo.color}`}>
            {statusInfo.description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
