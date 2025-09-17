"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { auctionAPI } from "@/lib/api"
import type { HostData } from "@/types/auction"
import { toast } from "@/hooks/use-toast"

export default function HomePage() {
  const router = useRouter()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [initialCapital, setInitialCapital] = useState("10000")
  const [isCreating, setIsCreating] = useState(false)

  // No need for useEffect with socket connections anymore

  const handleCreateAuction = async () => {
    const capital = Number.parseInt(initialCapital)
    if (isNaN(capital) || capital <= 0) {
      toast({
        title: "입력 오류",
        description: "올바른 초기 자본금을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    
    try {
      const response = await auctionAPI.createRoom(capital)
      if (response.success) {
        console.log("[v0] Room created, redirecting to:", response.roomId)
        setIsCreating(false)
        setIsCreateModalOpen(false)
        router.push(`/host/${response.roomId}`)
      } else {
        toast({
          title: "오류",
          description: response.error || "경매 생성에 실패했습니다.",
          variant: "destructive",
        })
        setIsCreating(false)
      }
    } catch (error) {
      console.error("Failed to create auction:", error)
      toast({
        title: "연결 오류",
        description: "서버에 연결할 수 없습니다.",
        variant: "destructive",
      })
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">다시마 경매</CardTitle>
          <CardDescription className="text-lg">실시간 경매 시뮬레이션 플랫폼</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="w-full">
                새 경매 시작하기
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>경매 설정</DialogTitle>
                <DialogDescription>게스트들의 초기 자본금을 설정해주세요.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="initial-capital">초기 자본금</Label>
                  <Input
                    id="initial-capital"
                    type="number"
                    placeholder="10000"
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(e.target.value)}
                    min="1"
                  />
                </div>
                <Button onClick={handleCreateAuction} className="w-full" disabled={isCreating}>
                  {isCreating ? "생성 중..." : "경매 생성"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="text-center text-sm text-muted-foreground">
            게스트는 호스트가 제공하는 링크를 통해 참여할 수 있습니다.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
