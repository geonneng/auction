'use client'

import { useState } from 'react'
import { 
  useRoom,
  useItems,
  useCurrentRoundItem,
  useIsLoading,
  useAuctionActions
} from '@/stores/auction-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, Play, Star } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import type { AuctionItem } from '@/types/auction'

export function ItemManager() {
  const room = useRoom()
  const items = useItems()
  const currentRoundItem = useCurrentRoundItem()
  const isLoading = useIsLoading()
  const actions = useAuctionActions()
  
  const [isActionLoading, setIsActionLoading] = useState('')
  
  const handleSetCurrentItem = async (item: AuctionItem) => {
    if (!room) return
    
    try {
      setIsActionLoading(`setItem-${item.id}`)
      
      const { auctionAPI } = await import('@/lib/api')
      const response = await auctionAPI.registerAuctionItem(room.id, item)
      
      if (response.success) {
        actions.setCurrentRoundItem({
          item,
          registeredAt: new Date()
        })
        
        toast({
          title: "아이템 등록 완료",
          description: `"${item.name}"이 현재 라운드 아이템으로 등록되었습니다.`,
        })
      } else {
        throw new Error(response.error || '아이템 등록에 실패했습니다')
      }
    } catch (error) {
      toast({
        title: "아이템 등록 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading('')
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          경매 아이템 관리
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 현재 라운드 아이템 */}
        {currentRoundItem && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-blue-600" />
                  <Badge variant="default" className="text-xs">
                    현재 라운드
                  </Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {currentRoundItem.item.name}
                </h3>
                {currentRoundItem.item.description && (
                  <p className="text-sm text-gray-600 mb-2">
                    {currentRoundItem.item.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {currentRoundItem.item.starting_price && (
                    <span>시작가: {currentRoundItem.item.starting_price.toLocaleString()}원</span>
                  )}
                  <span>
                    등록시간: {currentRoundItem.registeredAt.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 아이템 목록 */}
        <div className="space-y-2">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">등록된 아이템이 없습니다</p>
            </div>
          ) : (
            items.map((item) => {
              const isCurrentItem = currentRoundItem?.item.id === item.id
              const canSetAsCurrent = room?.round_status === 'WAITING' && !isCurrentItem
              const isItemLoading = isActionLoading === `setItem-${item.id}`
              
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isCurrentItem 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {item.name}
                      </h4>
                      {isCurrentItem && (
                        <Badge variant="default" size="sm">
                          현재
                        </Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600 line-clamp-1 mb-1">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {item.starting_price && (
                        <span>시작가: {item.starting_price.toLocaleString()}원</span>
                      )}
                      <span>
                        등록: {new Date(item.created_at || '').toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-3">
                    <Button
                      size="sm"
                      variant={isCurrentItem ? "secondary" : "outline"}
                      onClick={() => handleSetCurrentItem(item)}
                      disabled={!canSetAsCurrent || isLoading || isItemLoading}
                    >
                      {isItemLoading ? (
                        '설정 중...'
                      ) : isCurrentItem ? (
                        <Star className="h-3 w-3" />
                      ) : (
                        <>
                          <Play className="h-3 w-3 mr-1" />
                          설정
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
        
        {/* 도움말 */}
        <div className="text-xs text-gray-500 pt-2 border-t">
          <p>• 아이템을 현재 라운드로 설정한 후 라운드를 시작할 수 있습니다</p>
          <p>• 참가자들이 사이드바를 통해 아이템을 등록할 수 있습니다</p>
        </div>
      </CardContent>
    </Card>
  )
}
