'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

interface GuestJoinProps {
  roomId: string
  onJoined: (nickname: string) => void
  join: (roomId: string, nickname: string) => Promise<void>
  isLoading?: boolean
}

export function GuestJoin({ roomId, onJoined, join, isLoading }: GuestJoinProps) {
  const [nickname, setNickname] = useState('')

  const handleJoin = async () => {
    if (!nickname.trim()) {
      toast({ title: '닉네임 필요', description: '닉네임을 입력하세요.', variant: 'destructive' })
      return
    }
    try {
      await join(roomId, nickname.trim())
      onJoined(nickname.trim())
      toast({ title: '입장 완료', description: `${nickname} 이름으로 입장했습니다.` })
    } catch (e: any) {
      toast({ title: '입장 실패', description: e?.message || '오류가 발생했습니다.', variant: 'destructive' })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>방 참가</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Input
          placeholder="닉네임을 입력하세요"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <Button onClick={handleJoin} disabled={isLoading}>참가</Button>
      </CardContent>
    </Card>
  )
}


