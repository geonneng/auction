"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Clock, Play, Pause, RotateCcw, Timer, Package, Eye, ChevronRight, ChevronLeft } from "lucide-react"
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
  const { getAllGuests, selectedGuestItem, selectedGuest, setSelectedGuest } = useAuctionItem()
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedSection, setExpandedSection] = useState<'timer' | 'items' | null>(null)
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
      setTimer(prev => ({ ...prev, isRunning: false }))
      // 알림음이나 알림 등을 여기에 추가할 수 있습니다
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('타이머 종료', { body: '설정한 시간이 끝났습니다!' })
      }
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timer.isRunning, timer.timeLeft])

  const toggleTimer = () => {
    setTimer(prev => ({ ...prev, isRunning: !prev.isRunning }))
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

  const handleSectionToggle = (section: 'timer' | 'items') => {
    if (expandedSection === section) {
      setExpandedSection(null)
      setIsExpanded(false)
    } else {
      setExpandedSection(section)
      setIsExpanded(true)
    }
  }

  return (
    <>
      {/* 얇은 아이콘 사이드바 */}
      <aside className="fixed left-0 top-16 w-16 border-r border-stone-200 bg-stone-100/95 backdrop-blur-sm shadow-lg h-[calc(100vh-4rem)] z-40 flex flex-col items-center py-4 space-y-4">
        {/* 타이머 아이콘 */}
        <div className="flex flex-col items-center space-y-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSectionToggle('timer')}
            className={`w-12 h-12 rounded-xl transition-all duration-200 ${
              expandedSection === 'timer' ? 'bg-primary/20 text-primary' : 'hover:bg-primary/10'
            }`}
            title="타이머"
          >
            <Timer className="h-5 w-5" />
          </Button>
          <span className="text-xs font-medium text-muted-foreground text-center">
            타이머
          </span>
        </div>

        {/* 물품 관리 아이콘 */}
        <div className="flex flex-col items-center space-y-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSectionToggle('items')}
            className={`w-12 h-12 rounded-xl transition-all duration-200 ${
              expandedSection === 'items' ? 'bg-primary/20 text-primary' : 'hover:bg-primary/10'
            }`}
            title="경매 물품"
          >
            <Package className="h-5 w-5" />
          </Button>
          <span className="text-xs font-medium text-muted-foreground text-center">
            경매물품
          </span>
        </div>
      </aside>

      {/* 확장된 콘텐츠 패널 */}
      {isExpanded && (
        <div className="fixed left-16 top-16 w-80 border-r border-stone-200 bg-stone-100/95 backdrop-blur-sm shadow-lg h-[calc(100vh-4rem)] overflow-y-auto z-39 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">
              {expandedSection === 'timer' ? '경매 타이머' : '경매 물품'}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsExpanded(false)
                setExpandedSection(null)
              }}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* 타이머 섹션 */}
          {expandedSection === 'timer' && (
            <div className="space-y-6">
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
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">빠른 설정</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {presetTimes.map((seconds) => (
                        <Button
                          key={seconds}
                          onClick={() => setPresetTime(seconds)}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          disabled={timer.isRunning}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {seconds < 60 ? `${seconds}초` : `${Math.floor(seconds / 60)}분`}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">타이머 상태</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">현재 상태:</span>
                    <Badge variant={timer.isRunning ? "default" : "secondary"}>
                      {timer.isRunning ? "진행 중" : "일시정지"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">총 시간:</span>
                    <span className="text-sm font-mono">{formatTime(timer.totalTime)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">진행률:</span>
                    <Badge variant="outline">
                      {Math.round(getProgressPercentage())}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 물품 관리 섹션 */}
          {expandedSection === 'items' && (
            <div className="space-y-6">
              {getAllGuests().length > 0 ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <Badge variant="default" className="text-xs">
                      {getAllGuests().length}명 등록
                    </Badge>
                  </div>
                  
                  {/* 게스트 선택 */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-muted-foreground">게스트 선택</label>
                    <div className="space-y-2">
                      {getAllGuests().map((guestName) => (
                        <Button
                          key={guestName}
                          variant={selectedGuest === guestName ? "default" : "outline"}
                          size="sm"
                          className="w-full justify-start text-xs"
                          onClick={() => setSelectedGuest(guestName)}
                        >
                          {guestName}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* 선택된 게스트의 물품 표시 */}
                  {selectedGuestItem && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="secondary" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          {selectedGuest}님 물품 확인
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl max-w-4xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center space-x-2 text-xl">
                            <Package className="h-6 w-6" />
                            <span>{selectedGuest}님의 경매 물품</span>
                          </DialogTitle>
                          <DialogDescription className="text-base">
                            {selectedGuest}님이 등록한 물품의 상세 정보입니다.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6">
                          {selectedGuestItem.image && (
                            <div className="relative">
                              <img
                                src={selectedGuestItem.image}
                                alt={selectedGuestItem.name}
                                className="w-full h-80 object-contain bg-stone-50 rounded-xl shadow-lg"
                              />
                            </div>
                          )}
                          <div className="space-y-4">
                            <h3 className="font-bold text-2xl mb-4 text-center">{selectedGuestItem.name}</h3>
                            {selectedGuestItem.description && (
                              <p className="text-lg leading-relaxed text-foreground bg-muted/30 p-4 rounded-lg">
                                {selectedGuestItem.description}
                              </p>
                            )}
                            <div className="text-sm text-muted-foreground mt-4 text-center border-t pt-4">
                              등록자: <span className="font-semibold">{selectedGuest}</span>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    아직 등록된 물품이 없습니다.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}