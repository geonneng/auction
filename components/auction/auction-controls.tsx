'use client'

import { useState } from 'react'
import { 
  useRoom,
  useGuests,
  useCurrentRoundItem,
  useItems,
  useIsLoading,
  useAuctionActions
} from '@/stores/auction-store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Play, Square, RotateCcw, Trophy } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface AuctionControlsProps {
  auctionType: 'fixed' | 'dynamic'
}

export function AuctionControls({ auctionType }: AuctionControlsProps) {
  const room = useRoom()
  const guests = useGuests()
  const currentRoundItem = useCurrentRoundItem()
  const items = useItems()
  const isLoading = useIsLoading()
  const actions = useAuctionActions()
  
  const [isActionLoading, setIsActionLoading] = useState('')
  const [selectedItemId, setSelectedItemId] = useState<string>('')
  
  const canStartAuction = room?.status === 'PRE-START' && guests.length > 0
  const canEndAuction = room?.status === 'ACTIVE'
  // 물품이 없어도 라운드는 시작 가능하도록 변경
  const canStartRound = room?.status === 'ACTIVE' && room?.round_status === 'WAITING'
  const canEndRound = room?.status === 'ACTIVE' && room?.round_status === 'ACTIVE'
  
  const handleStartAuction = async () => {
    if (!room) return
    
    setIsActionLoading('startAuction')
    try {
      const { auctionAPI } = await import('@/lib/api')
      const response = await auctionAPI.startAuction(room.id)
      
      if (response.success) {
        toast({
          title: "경매 시작",
          description: "경매가 시작되었습니다!",
        })
      } else {
        throw new Error(response.error || '경매 시작에 실패했습니다')
      }
    } catch (error) {
      toast({
        title: "경매 시작 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading('')
    }
  }
  
  const handleEndAuction = async () => {
    if (!room) return
    
    setIsActionLoading('endAuction')
    try {
      const { auctionAPI } = await import('@/lib/api')
      const response = await auctionAPI.endAuction(room.id)
      
      if (response.success) {
        toast({
          title: "경매 종료",
          description: "경매가 종료되었습니다.",
        })
      } else {
        throw new Error(response.error || '경매 종료에 실패했습니다')
      }
    } catch (error) {
      toast({
        title: "경매 종료 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading('')
    }
  }
  
  const handleStartRound = async () => {
    if (!room) {
      toast({ title: '라운드 시작 불가', description: '방 정보가 없습니다.', variant: 'destructive' })
      return
    }
    
    setIsActionLoading('startRound')
    try {
      toast({ title: '라운드 시작 시도', description: `현재 상태: ${room.round_status}` })
      await actions.startRound()
      
      toast({
        title: "라운드 시작",
        description: `라운드 ${room.current_round + 1}이 시작되었습니다!`,
      })
    } catch (error) {
      toast({
        title: "라운드 시작 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading('')
    }
  }
  
  const handleEndRound = async () => {
    if (!room) return
    
    setIsActionLoading('endRound')
    try {
      await actions.endRound()
      
      toast({
        title: "라운드 종료",
        description: `라운드 ${room.current_round}이 종료되었습니다.`,
      })
    } catch (error) {
      toast({
        title: "라운드 종료 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading('')
    }
  }

  const handleRegisterNextItem = async () => {
    if (!room || !selectedItemId) return
    setIsActionLoading('registerItem')
    try {
      await actions.registerAuctionItem(selectedItemId)
      setSelectedItemId('')
      toast({ title: '물품 등록 완료', description: '다음 라운드 물품이 등록되었습니다.' })
    } catch (error) {
      toast({ title: '물품 등록 실패', description: error instanceof Error ? error.message : '오류', variant: 'destructive' })
    } finally {
      setIsActionLoading('')
    }
  }
  
  const handleDistributeRewards = async () => {
    if (!room) return
    
    setIsActionLoading('distributeRewards')
    try {
      const { auctionAPI } = await import('@/lib/api')
      const response = await auctionAPI.distributeWinningAmount(room.id)
      
      if (response.success) {
        toast({
          title: "보상 지급 완료",
          description: "우승자에게 상금이 지급되었습니다.",
        })
      } else {
        throw new Error(response.error || '보상 지급에 실패했습니다')
      }
    } catch (error) {
      toast({
        title: "보상 지급 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading('')
    }
  }
  
  const getStatusBadge = () => {
    if (!room) return null
    
    const statusConfig = {
      'PRE-START': { text: '경매 전', variant: 'secondary' as const },
      'ACTIVE': { text: '진행 중', variant: 'default' as const },
      'ENDED': { text: '종료됨', variant: 'outline' as const }
    }
    
    return (
      <Badge variant={statusConfig[room.status].variant}>
        {statusConfig[room.status].text}
      </Badge>
    )
  }
  
  const getRoundStatusBadge = () => {
    if (!room || room.status !== 'ACTIVE') return null
    
    const statusConfig = {
      'WAITING': { text: '라운드 대기', variant: 'secondary' as const },
      'ACTIVE': { text: '라운드 진행 중', variant: 'default' as const },
      'ENDED': { text: '라운드 종료', variant: 'outline' as const }
    }
    
    return (
      <Badge variant={statusConfig[room.round_status].variant}>
        {statusConfig[room.round_status].text}
      </Badge>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>경매 제어</span>
          <div className="flex gap-2">
            {getStatusBadge()}
            {getRoundStatusBadge()}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 경매 제어 버튼들 */}
        <div className="grid grid-cols-2 gap-3">
          {/* 경매 시작 */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="default"
                disabled={!canStartAuction || isLoading || !!isActionLoading}
                className="h-12"
              >
                <Play className="h-4 w-4 mr-2" />
                경매 시작
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>경매를 시작하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  경매가 시작되면 참가자들이 입찰을 할 수 있습니다. 
                  {guests.length > 0 
                    ? `현재 ${guests.length}명의 참가자가 있습니다.`
                    : '참가자가 없습니다.'
                  }
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleStartAuction}
                  disabled={isActionLoading === 'startAuction'}
                >
                  {isActionLoading === 'startAuction' ? '시작 중...' : '시작'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          {/* 경매 종료 */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={!canEndAuction || isLoading || !!isActionLoading}
                className="h-12"
              >
                <Square className="h-4 w-4 mr-2" />
                경매 종료
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>경매를 종료하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  경매를 종료하면 더 이상 입찰을 받을 수 없습니다. 
                  종료 후에는 결과를 확인할 수 있습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleEndAuction}
                  disabled={isActionLoading === 'endAuction'}
                >
                  {isActionLoading === 'endAuction' ? '종료 중...' : '종료'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        {/* 다음 라운드 물품 선택 (선택 시 등록) */}
        {room?.status === 'ACTIVE' && room?.round_status === 'WAITING' && (
          <div className="grid grid-cols-4 gap-2 items-center">
            <div className="col-span-1 text-sm text-muted-foreground">다음 라운드 물품</div>
            <div className="col-span-2">
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="물품 선택 (선택 사항)" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((it) => (
                    <SelectItem key={it.id} value={it.id!}>
                      {it.name} {it.starting_price ? `(${Number(it.starting_price).toLocaleString()}원)` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1">
              <Button 
                onClick={handleRegisterNextItem} 
                variant="outline" 
                size="sm" 
                disabled={!selectedItemId || isLoading || isActionLoading === 'registerItem'}
              >
                {isActionLoading === 'registerItem' ? '등록 중...' : '등록'}
              </Button>
            </div>
          </div>
        )}

        {/* 라운드 제어 버튼들 */}
        <div className="grid grid-cols-2 gap-3">
          {/* 라운드 시작 */}
          <Button
            variant="outline"
            onClick={handleStartRound}
            disabled={!canStartRound || isLoading || !!isActionLoading}
            className="h-10"
          >
            <Play className="h-4 w-4 mr-2" />
            {isActionLoading === 'startRound' ? '시작 중...' : '라운드 시작'}
          </Button>
          
          {/* 라운드 종료 */}
          <Button
            variant="outline"
            onClick={handleEndRound}
            disabled={!canEndRound || isLoading || !!isActionLoading}
            className="h-10"
          >
            <Square className="h-4 w-4 mr-2" />
            {isActionLoading === 'endRound' ? '종료 중...' : '라운드 종료'}
          </Button>
        </div>
        
        {/* 추가 기능들 */}
        <div className="pt-2 border-t space-y-2">
          <Button
            variant="ghost"
            onClick={handleDistributeRewards}
            disabled={room?.status !== 'ENDED' || isLoading || !!isActionLoading}
            className="w-full justify-start"
            size="sm"
          >
            <Trophy className="h-4 w-4 mr-2" />
            {isActionLoading === 'distributeRewards' ? '지급 중...' : '상금 지급'}
          </Button>
        </div>
        
        {/* 상태 정보 */}
        {room && (
          <div className="pt-2 border-t text-sm text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>현재 라운드:</span>
              <span className="font-medium">{room.current_round}라운드</span>
            </div>
            <div className="flex justify-between">
              <span>참가자:</span>
              <span className="font-medium">{guests.length}명</span>
            </div>
            {currentRoundItem && (
              <div className="flex justify-between">
                <span>현재 아이템:</span>
                <span className="font-medium truncate max-w-32">
                  {currentRoundItem.item.name}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
