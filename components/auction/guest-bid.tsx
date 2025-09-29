'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

interface GuestBidProps {
  canBid: boolean
  onBid: (amount: number) => Promise<void>
  isLoading?: boolean
}

export function GuestBid({ canBid, onBid, isLoading }: GuestBidProps) {
  const [amount, setAmount] = useState('')

  const handleBid = async () => {
    const parsed = parseInt(amount.trim())
    if (isNaN(parsed) || parsed <= 0) {
      toast({ title: '입찰 금액 오류', description: '올바른 금액을 입력하세요.', variant: 'destructive' })
      return
    }
    try {
      await onBid(parsed)
      setAmount('')
      toast({ title: '입찰 완료', description: `${parsed.toLocaleString()}원으로 입찰했습니다.` })
    } catch (e: any) {
      toast({ title: '입찰 실패', description: e?.message || '오류가 발생했습니다.', variant: 'destructive' })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>입찰</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Input
          placeholder="입찰 금액"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={!canBid || isLoading}
        />
        <Button onClick={handleBid} disabled={!canBid || isLoading}>입찰</Button>
      </CardContent>
    </Card>
  )
}


