'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff } from 'lucide-react'

interface SimpleHostDashboardProps {
  roomId: string
  auctionType: 'fixed' | 'dynamic'
}

export function SimpleHostDashboard({ roomId, auctionType }: SimpleHostDashboardProps) {
  const [roomData, setRoomData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 간단한 데이터 로딩 (한 번만)
  useEffect(() => {
    let mounted = true
    
    const loadData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/auction?roomId=${roomId}`, {
          method: 'GET',
          cache: 'no-store'
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const data = await response.json()
        
        if (mounted) {
          setRoomData(data.room || data.state)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    
    loadData()
    
    return () => {
      mounted = false
    }
  }, [roomId]) // roomId만 의존성으로

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p>로딩 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="font-medium">오류 발생</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {roomData?.name || `경매방 ${roomId}`}
              </h1>
              <p className="text-sm text-gray-600">
                {auctionType === 'fixed' ? '고정입찰' : '변동입찰'} • 방 ID: {roomId}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Wifi className="h-3 w-3" />
                연결됨
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 기본 정보 카드 */}
          <Card>
            <CardHeader>
              <CardTitle>경매 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>상태:</span>
                  <Badge variant="secondary">
                    {roomData?.status || 'PRE-START'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>라운드:</span>
                  <span>{roomData?.current_round || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>참가자:</span>
                  <span>{roomData?.guests?.length || 0}명</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 참가자 목록 (간단) */}
          <Card>
            <CardHeader>
              <CardTitle>참가자 목록</CardTitle>
            </CardHeader>
            <CardContent>
              {!roomData?.guests || roomData.guests.length === 0 ? (
                <p className="text-gray-500 text-sm">참가자가 없습니다</p>
              ) : (
                <div className="space-y-2">
                  {roomData.guests.slice(0, 5).map((guest: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{guest.nickname}</span>
                      <span>{Number(guest.capital || 0).toLocaleString()}원</span>
                    </div>
                  ))}
                  {roomData.guests.length > 5 && (
                    <p className="text-xs text-gray-500">
                      외 {roomData.guests.length - 5}명 더
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 제어 패널 (기본) */}
          <Card>
            <CardHeader>
              <CardTitle>기본 제어</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                기본 호스트 대시보드가 로드되었습니다.
              </p>
              <div className="mt-4">
                <Badge variant="outline">
                  {auctionType === 'fixed' ? '고정입찰 모드' : '변동입찰 모드'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
