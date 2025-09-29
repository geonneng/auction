'use client'

import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff, Users, Clock } from 'lucide-react'

interface ConnectionStatusProps {
  isConnected: boolean
  lastUpdated: Date | null
  participantCount: number
}

export function ConnectionStatus({ 
  isConnected, 
  lastUpdated, 
  participantCount 
}: ConnectionStatusProps) {
  const getLastUpdatedText = () => {
    if (!lastUpdated) return '업데이트 없음'
    
    const now = new Date()
    const diff = now.getTime() - lastUpdated.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (seconds < 60) return `${seconds}초 전`
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    return lastUpdated.toLocaleDateString()
  }
  
  return (
    <div className="flex items-center gap-4">
      {/* 참가자 수 */}
      <div className="flex items-center gap-1 text-sm text-gray-600">
        <Users className="h-4 w-4" />
        <span>{participantCount}명</span>
      </div>
      
      {/* 마지막 업데이트 시간 */}
      <div className="flex items-center gap-1 text-sm text-gray-600">
        <Clock className="h-4 w-4" />
        <span>{getLastUpdatedText()}</span>
      </div>
      
      {/* 연결 상태 */}
      <Badge 
        variant={isConnected ? "default" : "destructive"}
        className="flex items-center gap-1"
      >
        {isConnected ? (
          <>
            <Wifi className="h-3 w-3" />
            실시간 연결됨
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            연결 끊김
          </>
        )}
      </Badge>
    </div>
  )
}
