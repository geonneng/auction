"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Clock, Play, Pause, RotateCcw, Timer, Package, Eye } from "lucide-react"
import { useAuctionItem } from "@/contexts/auction-item-context"

interface TimerState {
  isRunning: boolean
  timeLeft: number
  totalTime: number
}

interface AuctionItem {
  id: string
  name: string
  description: string
  image?: string
}

interface SidebarProps {
  roomId?: string
}

export function Sidebar({ roomId }: SidebarProps = {}) {
  const { auctionItem } = useAuctionItem()
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    timeLeft: 300, // 5분 기본값
    totalTime: 300
  })

  const [presetTimes] = useState([10, 30, 60, 180, 300, 600, 900]) // 10초, 30초, 1분, 3분, 5분, 10분, 15분

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (timer.isRunning && timer.timeLeft > 0) {
      interval = setInterval(() => {
        setTimer(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }))
      }, 1000)
    } else if (timer.timeLeft === 0) {
      setTimer(prev => ({
        ...prev,
        isRunning: false
      }))
      // 타이머 완료 알림
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('타이머 완료!', {
            body: '설정된 시간이 완료되었습니다.',
            icon: '/placeholder-logo.svg'
          })
        }
      }
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timer.isRunning, timer.timeLeft])

  const toggleTimer = () => {
    setTimer(prev => ({
      ...prev,
      isRunning: !prev.isRunning
    }))
  }

  const resetTimer = () => {
    setTimer(prev => ({
      ...prev,
      isRunning: false,
      timeLeft: prev.totalTime
    }))
  }

  const setPresetTime = (seconds: number) => {
    setTimer({
      isRunning: false,
      timeLeft: seconds,
      totalTime: seconds
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = () => {
    return ((timer.totalTime - timer.timeLeft) / timer.totalTime) * 100
  }

  return (
    <aside className="w-80 border-r bg-gradient-to-b from-background/95 to-muted/20 backdrop-blur-sm p-6 space-y-6 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto shadow-lg">
      <div className="flex items-center space-x-2 mb-6">
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
          <Timer className="h-4 w-4 text-primary-foreground" />
        </div>
        <h2 className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">경매 타이머</h2>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-2xl font-mono">
            {formatTime(timer.timeLeft)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 진행률 바 */}
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-1000"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>

          {/* 타이머 컨트롤 */}
          <div className="flex space-x-2">
            <Button 
              onClick={toggleTimer}
              variant={timer.isRunning ? "destructive" : "default"}
              className="flex-1"
            >
              {timer.isRunning ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  일시정지
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  시작
                </>
              )}
            </Button>
            <Button onClick={resetTimer} variant="outline" size="icon">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          <Separator />

          {/* 프리셋 시간 */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">빠른 설정</h4>
            <div className="grid grid-cols-2 gap-2">
              {presetTimes.map((seconds) => (
                <Button
                  key={seconds}
                  variant="outline"
                  size="sm"
                  onClick={() => setPresetTime(seconds)}
                  className="text-xs"
                >
                  {formatTime(seconds)}
                </Button>
              ))}
            </div>
          </div>

          {/* 상태 표시 */}
          <div className="flex items-center justify-center">
            <Badge variant={timer.isRunning ? "default" : "secondary"}>
              <Clock className="h-3 w-3 mr-1" />
              {timer.isRunning ? "진행 중" : "대기 중"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 경매 물품 확인 카드 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>경매 물품</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {auctionItem ? (
            <div className="space-y-3">
              <div className="text-center">
                <Badge variant="default" className="text-xs">
                  등록 완료
                </Badge>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    물품 확인
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <Package className="h-5 w-5" />
                      <span>경매 물품 정보</span>
                    </DialogTitle>
                    <DialogDescription>
                      현재 경매 중인 물품의 상세 정보입니다.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {auctionItem.image && (
                      <div className="relative">
                        <img
                          src={auctionItem.image}
                          alt={auctionItem.name}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{auctionItem.name}</h3>
                      {auctionItem.description && (
                        <p className="text-sm text-muted-foreground">
                          {auctionItem.description}
                        </p>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="text-center py-4">
              <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                아직 등록된 물품이 없습니다.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

    </aside>
  )
}
