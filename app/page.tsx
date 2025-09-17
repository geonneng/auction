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
import SocketManager from "@/lib/socket"
import type { HostData } from "@/types/auction"
import { toast } from "@/hooks/use-toast"

export default function HomePage() {
  const router = useRouter()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [initialCapital, setInitialCapital] = useState("10000")
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    const socketManager = SocketManager.getInstance()
    const socket = socketManager.connect()

    socket.on("host:created", (data: HostData) => {
      console.log("[v0] Room created, redirecting to:", data.roomId)
      setIsCreating(false)
      setIsCreateModalOpen(false)
      router.push(`/host/${data.roomId}`)
    })

    socket.on("app:error", (error) => {
      console.error("[v0] Socket error:", error)
      setIsCreating(false)
      const message = (error && (error.message || error.error || error.reason))
        || (typeof error === "string" ? error : "알 수 없는 오류가 발생했습니다")
      toast({
        title: "오류",
        description: message,
        variant: "destructive",
      })
    })

    return () => {
      // Don't disconnect here as we need the connection for the host dashboard
    }
  }, [router])

  const handleCreateAuction = () => {
    const socket = SocketManager.getInstance().getSocket()
    if (!socket) {
      toast({
        title: "연결 오류",
        description: "서버에 연결할 수 없습니다.",
        variant: "destructive",
      })
      return
    }

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
    if (socket.connected) {
      socket.emit("host:create", { initialCapital: capital })
    } else {
      // 연결이 되면 한 번만 시도
      const onConnect = () => {
        socket.off("connect", onConnect)
        socket.emit("host:create", { initialCapital: capital })
      }
      socket.on("connect", onConnect)

      // 일정 시간 내 미연결 시 사용자에게 알림
      setTimeout(() => {
        if (!socket.connected) {
          setIsCreating(false)
          socket.off("connect", onConnect)
          toast({
            title: "연결 대기 시간 초과",
            description: "잠시 후 다시 시도해주세요.",
            variant: "destructive",
          })
        }
      }, 5000)
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
