'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface GuestStatusProps {
  nickname?: string
  capital?: number
  round?: number
  roundStatus?: string
}

export function GuestStatus({ nickname, capital, round, roundStatus }: GuestStatusProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>내 상태</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 text-sm">
        <div className="text-muted-foreground">닉네임</div>
        <div className="font-medium">{nickname || '-'}</div>
        <div className="text-muted-foreground">자본금</div>
        <div className="font-medium">{Number(capital || 0).toLocaleString()}원</div>
        <div className="text-muted-foreground">현재 라운드</div>
        <div className="font-medium">{round || 0}</div>
        <div className="text-muted-foreground">라운드 상태</div>
        <div className="font-medium">{roundStatus || '-'}</div>
      </CardContent>
    </Card>
  )
}


