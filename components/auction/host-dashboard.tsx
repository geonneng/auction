'use client'

import { useParams } from 'next/navigation'
import { 
  useRoom, 
  useGuests, 
  useItems, 
  useCurrentRoundItem, 
  useIsLoading,
  useError,
  useAuctionActions,
  useBids
} from '@/stores/auction-store'
import { useAuctionRealtime } from '@/hooks/use-auction-realtime-new'
import { Package } from 'lucide-react'
import { ParticipantPanel } from './participant-panel'
import { AuctionControls } from './auction-controls'
import { ItemManager } from './item-manager'
import { RoundStatus } from './round-status'
import { ConnectionStatus } from './connection-status'
import { FinalResultsDialog } from './final-results-dialog'
import { AuctionItemProvider } from '@/contexts/auction-item-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import { Sidebar } from '@/components/sidebar'
import QRCodeComponent from '@/components/qr-code'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link as LinkIcon, Copy } from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'

interface HostDashboardProps {
  roomId: string
  auctionType: 'fixed' | 'dynamic'
}

export function HostDashboard({ roomId, auctionType }: HostDashboardProps) {
  const room = useRoom()
  const guests = useGuests()
  const items = useItems()
  const currentRoundItem = useCurrentRoundItem()
  const isLoading = useIsLoading()
  const error = useError()
  const allBids = useBids()
  
  const actions = useAuctionActions()
  
  // 참가 링크 생성
  const [inviteUrl, setInviteUrl] = useState('')
  
  // 최종 결과 팝업 상태
  const [showFinalResults, setShowFinalResults] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined' && roomId) {
      // 경매 타입에 따라 다른 게스트 페이지 링크 생성
      const guestPath = auctionType === 'dynamic' ? 'room-dynamic' : 'room'
      setInviteUrl(`${window.location.origin}/${guestPath}/${roomId}`)
    }
  }, [roomId, auctionType])

  const handleCopy = useCallback(() => {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
      .then(() => toast({ title: '링크 복사됨', description: '게스트 참가 링크를 복사했습니다.' }))
      .catch(() => toast({ title: '복사 실패', description: '클립보드 복사 중 오류', variant: 'destructive' }))
  }, [inviteUrl])
  
  // 초기 데이터 로드
  useEffect(() => {
    actions.setAuctionType(auctionType)
    actions.syncWithServer(roomId)
  }, [roomId, auctionType]) // actions 제거
  
  // 실시간 업데이트
  const { isConnected, lastUpdated } = useAuctionRealtime({
    roomId,
    enabled: !!room,
    onGuestJoin: (guest) => {
      toast({
        title: "새 참가자",
        description: `${guest.nickname}님이 참가했습니다.`,
      })
    },
    onGuestLeave: (guest) => {
      toast({
        title: "참가자 퇴장",
        description: `${guest.nickname}님이 퇴장했습니다.`,
      })
    },
    onBidPlaced: (bid) => {
      toast({
        title: "새 입찰",
        description: `${bid.nickname}님이 ${bid.amount.toLocaleString()}원에 입찰했습니다.`,
      })
    },
  })
  
  // 에러 표시
  useEffect(() => {
    if (error) {
      toast({
        title: "오류 발생",
        description: error,
        variant: "destructive",
      })
    }
  }, [error])
  
  // 경매 종료 시 최종 결과 팝업 표시
  useEffect(() => {
    if (room?.status === 'ENDED' && !showFinalResults) {
      setShowFinalResults(true)
    }
  }, [room?.status, showFinalResults])
  
  if (isLoading && !room) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p>경매방 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }
  
  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">경매방을 찾을 수 없습니다.</p>
              <p className="text-sm text-gray-600">
                방 ID: {roomId}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <AuctionItemProvider roomId={roomId}>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Sidebar roomId={roomId} />
      <div className="ml-16">
      {/* 헤더 */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {room.name}
              </h1>
              <p className="text-sm text-gray-600">
                {auctionType === 'fixed' ? '고정입찰' : '변동입찰'} 경매 • 방 ID: {roomId}
              </p>
            </div>
            <ConnectionStatus 
              isConnected={isConnected}
              lastUpdated={lastUpdated}
              participantCount={guests.length}
            />
          </div>
        </div>
      </div>
      
      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 경매 상태 및 제어 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 라운드 상태 */}
            <RoundStatus auctionType={auctionType} />
            
            {/* 경매 제어 */}
            <AuctionControls auctionType={auctionType} />
          </div>
          
          {/* 오른쪽: 참가자 패널 */}
          <div className="space-y-6">
            {/* 참가 링크 & QR */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" /> 게스트 참가 링크
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input value={inviteUrl} readOnly className="flex-1" />
                    <Button onClick={handleCopy} variant="outline" size="sm">
                      <Copy className="h-4 w-4 mr-1" /> 복사
                    </Button>
                  </div>
                  <div className="flex justify-center">
                    {inviteUrl && (
                      <QRCodeComponent value={inviteUrl} size={160} />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 현재 라운드 아이템 - ACTIVE 상태일 때만 표시 */}
            {currentRoundItem && room?.round_status === 'ACTIVE' && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    현재 라운드 경매 물품
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">{currentRoundItem.item.name}</p>
                    <p className="text-sm text-gray-600">{currentRoundItem.item.description}</p>
                    <p className="text-xs text-gray-500">
                      등록 시간: {currentRoundItem.registeredAt.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <ParticipantPanel auctionType={auctionType} />
          </div>
        </div>
      </div>
      </div>
      
      {/* 최종 결과 팝업 */}
      <FinalResultsDialog
        isOpen={showFinalResults}
        onClose={() => setShowFinalResults(false)}
        room={room}
        guests={guests}
        allBids={allBids}
        auctionType={auctionType}
      />
    </div>
    </AuctionItemProvider>
  )
}
