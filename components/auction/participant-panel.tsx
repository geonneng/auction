'use client'

import { useState } from 'react'
import { 
  useRoom,
  useGuests,
  useIsLoading,
  useAuctionActions
} from '@/stores/auction-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Users, DollarSign, UserPlus, Pencil } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ParticipantPanelProps {
  auctionType?: 'fixed' | 'dynamic'
}

export function ParticipantPanel({ auctionType = 'fixed' }: ParticipantPanelProps) {
  const room = useRoom()
  const guests = useGuests()
  const isLoading = useIsLoading()
  const actions = useAuctionActions()
  
  const [bulkCapital, setBulkCapital] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  
  const handleBulkUpdateCapital = async () => {
    const newCapital = parseInt(bulkCapital)
    if (isNaN(newCapital) || newCapital <= 0) {
      toast({
        title: "잘못된 입력",
        description: "올바른 자본금을 입력해주세요.",
        variant: "destructive",
      })
      return
    }
    
    if (!room) {
      toast({
        title: "오류",
        description: "경매방 정보를 찾을 수 없습니다.",
        variant: "destructive",
      })
      return
    }
    
    try {
      const { auctionAPI } = await import('@/lib/api')
      
      // 모든 게스트의 자본금을 일괄 업데이트
      const promises = guests.map(guest =>
        auctionAPI.modifyCapital(room.id, guest.nickname, newCapital)
      )
      
      await Promise.all(promises)
      
      // 로컬 상태 업데이트
      guests.forEach(guest => {
        actions.updateGuest(guest.nickname, { capital: newCapital })
      })
      
      // 방 정보의 initial_capital도 업데이트
      actions.updateRoom({ initial_capital: newCapital })
      
      setBulkCapital('')
      
      toast({
        title: "자본금 업데이트 완료",
        description: `모든 참가자의 자본금이 ${newCapital.toLocaleString()}원으로 업데이트되었습니다.`,
      })
    } catch (error) {
      toast({
        title: "자본금 업데이트 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }
  
  const getParticipantStatus = (guest: any) => {
    if (guest.has_bid_in_current_round || guest.hasBidInCurrentRound) {
      return { text: '입찰 완료', variant: 'default' as const }
    }
    return { text: '대기 중', variant: 'secondary' as const }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          참가자 현황
          <Badge variant="outline" className="ml-auto">
            {guests.length}명
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 자본금 일괄 수정 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm font-medium">자본금 일괄 수정</span>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="새 자본금"
              value={bulkCapital}
              onChange={(e) => setBulkCapital(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleBulkUpdateCapital}
              disabled={isLoading || !bulkCapital || guests.length === 0}
              size="sm"
            >
              적용
            </Button>
          </div>
        </div>
        
        {/* 참가자 목록 */}
        <div className="space-y-3">
          {guests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">아직 참가자가 없습니다</p>
              <p className="text-xs mt-1">QR 코드를 공유하여 참가자를 초대하세요</p>
            </div>
          ) : (
            guests.map((guest, index) => {
              const status = getParticipantStatus(guest)
              
              return (
                <div key={guest.nickname || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        {guest.nickname}
                      </span>
                      <Badge variant={status.variant} className="text-xs">
                        {status.text}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                      자본금:
                      {editing === guest.nickname ? (
                        <>
                          <input
                            type="number"
                            className="border rounded px-2 py-1 w-28"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                          />
                          <button
                            className="text-blue-600 text-xs"
                            onClick={async () => {
                              const value = parseInt(editValue)
                              if (!isNaN(value) && value >= 0) {
                                try {
                                  await actions.modifyCapital(guest.nickname, value)
                                  setEditing(null)
                                } catch (e) {}
                              }
                            }}
                          >저장</button>
                          <button className="text-xs" onClick={() => setEditing(null)}>취소</button>
                        </>
                      ) : (
                        <>
                          <span>
                            {(auctionType === 'fixed' && room?.round_status === 'ACTIVE')
                              ? '비공개'
                              : `${Number(guest.capital || 0).toLocaleString()}원`}
                          </span>
                          <button
                            className="text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => { setEditing(guest.nickname); setEditValue(String(guest.capital || 0)) }}
                            title="자본금 수정"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
        
        {/* 통계 정보 */}
        {guests.length > 0 && (
          <div className="pt-3 border-t">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {Number(room?.initial_capital || 0).toLocaleString()}원
                </div>
                <div className="text-xs text-gray-500">초기 자본금</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {guests.filter(g => g.has_bid_in_current_round || g.hasBidInCurrentRound).length}명
                </div>
                <div className="text-xs text-gray-500">입찰 참가자</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
