"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { 
  Gavel, 
  Settings,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  Shield,
  DollarSign,
  Clock,
  Users
} from "lucide-react"
import { useRouter } from "next/navigation"
import { auctionAPI } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { Sidebar } from "@/components/sidebar"
import { TraditionalPattern } from "@/components/ui/traditional-pattern"
import { TraditionalElements } from "@/components/ui/traditional-elements"
import { TraditionalGlow } from "@/components/ui/traditional-glow"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function HomePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [auctionData, setAuctionData] = useState({
    name: "",
    method: "fixed", // "fixed" or "dynamic"
    initialCapital: "10000"
  })
  const [isCreating, setIsCreating] = useState(false)
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false)

  // 페이지 로드 시 자동으로 사용법 팝업 표시
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome')
    if (!hasSeenWelcome) {
      setShowWelcomeDialog(true)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleCreateAuction = async () => {
    // 경매 이름이 비어있으면 "다시마 경매"로 자동 설정
    const auctionName = auctionData.name.trim() || "다시마 경매"

    const capital = Number.parseInt(auctionData.initialCapital)
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
      const response = await auctionAPI.createRoom(capital, auctionName)
      if (response.success) {
        console.log("[Create Auction] Room created, redirecting to:", response.roomId)
        setIsCreating(false)
        
        // 경매 방식에 따라 다른 페이지로 리다이렉트
        if (auctionData.method === 'dynamic') {
          router.push(`/host-dynamic/${response.roomId}`)
        } else {
        router.push(`/host/${response.roomId}`)
        }
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

  const steps = [
    { number: 1, title: "경매 이름", description: "경매의 이름을 설정하세요" },
    { number: 2, title: "경매 방법", description: "경매 방식을 선택하세요" },
    { number: 3, title: "초기 자본금", description: "참가자들의 초기 자본금을 설정하세요" }
  ]

  return (
    <div>
      <Sidebar />
      <div className="ml-16">
        {/* Traditional Hero Section */}
        <div className="relative h-[70vh] min-h-[600px] w-full bg-gradient-to-br from-emerald-50/80 via-amber-50/60 to-emerald-100/40 overflow-hidden">
          {/* Traditional Background Elements */}
          <TraditionalPattern />
          <TraditionalElements />
          <TraditionalGlow />
          
          {/* Main content */}
          <div className="relative z-20 flex items-center justify-center h-full">
            <div className="text-center space-y-12 max-w-5xl mx-auto px-6">
              {/* Traditional Typography */}
              <div className="space-y-8">
                <div className="inline-block relative">
                  <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-emerald-900 tracking-tight animate-scale-in-up font-handwriting">
                    가담
                  </h1>
                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-2/3 h-1 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 rounded-full animate-scale-in-delayed"></div>
                  
                  {/* Traditional Decorative Elements */}
                  <div className="absolute -top-4 -left-4 w-3 h-3 bg-emerald-500 rounded-full animate-pulse-slow"></div>
                  <div className="absolute -top-4 -right-4 w-3 h-3 bg-emerald-500 rounded-full animate-pulse-slow delay-500"></div>
                  <div className="absolute -bottom-4 -left-4 w-3 h-3 bg-emerald-500 rounded-full animate-pulse-slow delay-1000"></div>
                  <div className="absolute -bottom-4 -right-4 w-3 h-3 bg-emerald-500 rounded-full animate-pulse-slow delay-1500"></div>
                </div>
                
                <h2 className="text-2xl md:text-3xl font-semibold text-emerald-800 tracking-wide animate-slide-in-left delay-300 font-handwriting">
                  가치를 이야기하다
                </h2>
              </div>
              
              {/* Traditional CTA Section */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center mt-16 animate-scale-in-up delay-700">
                <button 
                  onClick={() => {
                    const formElement = document.getElementById('auction-form');
                    formElement?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="group relative px-12 py-5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center overflow-hidden border-2 border-emerald-700 font-handwriting"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-emerald-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  <Gavel className="w-5 h-5 mr-3 relative z-10" />
                  <span className="relative z-10">경매 시작하기</span>
                </button>
                
                <Dialog open={showWelcomeDialog} onOpenChange={(open) => {
                  setShowWelcomeDialog(open)
                  if (!open) {
                    localStorage.setItem('hasSeenWelcome', 'true')
                  }
                }}>
                  <DialogTrigger asChild>
                    <button className="group relative px-12 py-5 border-2 border-emerald-600 hover:border-emerald-700 text-emerald-800 hover:text-emerald-900 rounded-xl font-bold text-lg transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 flex items-center justify-center overflow-hidden bg-emerald-50/80 backdrop-blur-sm font-handwriting">
                      <div className="absolute inset-0 bg-emerald-100 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                      <Target className="w-5 h-5 mr-3 relative z-10" />
                      <span className="relative z-10">사용법 보기</span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-4xl font-bold text-emerald-800 text-center">
                        🎯 가담 - 실시간 경매 시뮬레이션 사용법
                      </DialogTitle>
                      <DialogDescription className="text-center text-2xl">
                        가치를 이야기하다. 교육용 경매 플랫폼의 모든 기능을 알아보세요
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-8 py-4">
                      {/* 변동입찰과 고정입찰 */}
                      <section>
                        <h3 className="text-3xl font-bold text-emerald-700 mb-6">🔒 고정입찰 vs ⚡ 변동입찰</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="p-4 border border-emerald-200 rounded-lg bg-emerald-50/50">
                            <h4 className="text-xl font-bold text-emerald-800 mb-3">🔒 고정입찰 (Fixed Bidding)</h4>
                            <ul className="text-lg space-y-2 text-emerald-700">
                              <li>• 사전에 정해진 가격으로 입찰</li>
                              <li>• 라운드당 1회만 입찰 가능</li>
                              <li>• 입찰 후 재입찰 불가</li>
                              <li>• 자본금에서 즉시 차감</li>
                              <li>• 낙찰 실패 시 자본금 환불 없음</li>
                              <li>• 계획적 입찰 전략</li>
                            </ul>
                          </div>
                          <div className="p-4 border border-blue-200 rounded-lg bg-blue-50/50">
                            <h4 className="text-xl font-bold text-blue-800 mb-3">⚡ 변동입찰 (Dynamic Bidding)</h4>
                            <ul className="text-lg space-y-2 text-blue-700">
                              <li>• 실시간으로 가격 조정하며 입찰</li>
                              <li>• 라운드당 여러 번 입찰 가능</li>
                              <li>• 더 높은 금액으로만 재입찰</li>
                              <li>• 다른 참가자가 더 높게 입찰하면 자동 취소</li>
                              <li>• 실시간 경쟁</li>
                              <li>• 역동적인 경매 경험</li>
                            </ul>
                          </div>
                        </div>
                      </section>

                      {/* 사이드바 기능 */}
                      <section>
                        <h3 className="text-3xl font-bold text-emerald-700 mb-6">🎛️ 사이드바 기능</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="p-4 border border-amber-200 rounded-lg bg-amber-50/50">
                            <h4 className="text-xl font-bold text-amber-800 mb-3">🏠 호스트 페이지</h4>
                            <ul className="text-lg space-y-2 text-amber-700">
                              <li>• ⏰ 타이머: 10초~15분 프리셋</li>
                              <li>• 📦 경매물품: 참가자별 물품 조회</li>
                              <li>• 물품 상세 정보 확인</li>
                              <li>• 물품 크게 보기 기능</li>
                            </ul>
                          </div>
                          <div className="p-4 border border-purple-200 rounded-lg bg-purple-50/50">
                            <h4 className="text-xl font-bold text-purple-800 mb-3">👤 게스트 페이지</h4>
                            <ul className="text-lg space-y-2 text-purple-700">
                              <li>• 📦 경매물품 등록</li>
                              <li>• 물품 이름, 설명 입력</li>
                              <li>• 이미지 업로드 (선택)</li>
                              <li>• 등록/수정 기능</li>
                            </ul>
                          </div>
                        </div>
                      </section>

                      {/* 경매 생성 및 운영 */}
                      <section>
                        <h3 className="text-3xl font-bold text-emerald-700 mb-6">🚀 경매 생성 및 운영</h3>
                        <div className="space-y-4">
                          <div className="p-4 border border-green-200 rounded-lg bg-green-50/50">
                            <h4 className="text-xl font-bold text-green-800 mb-3">📝 경매 생성 과정</h4>
                            <ol className="text-lg space-y-2 text-green-700">
                              <li>1. 경매 이름 설정 (입력하지 않으면 "다시마 경매")</li>
                              <li>2. 경매 방법 선택 (고정입찰/변동입찰)</li>
                              <li>3. 초기 자본금 설정</li>
                              <li>4. 경매 시작 및 참가자 초대</li>
                            </ol>
                          </div>
                          <div className="p-4 border border-indigo-200 rounded-lg bg-indigo-50/50">
                            <h4 className="text-xl font-bold text-indigo-800 mb-3">🎮 경매 운영 방법</h4>
                            <div className="grid md:grid-cols-2 gap-4 text-lg">
                              <div>
                                <h5 className="font-semibold text-indigo-700 mb-1">호스트 역할:</h5>
                                <ul className="space-y-1 text-indigo-600">
                                  <li>• 경매 시작 및 참여 링크 공유</li>
                                  <li>• 라운드 관리 및 타이머 설정</li>
                                  <li>• 참가자 관리 및 자본금 수정</li>
                                  <li>• 물품 관리 및 조회</li>
                                </ul>
                              </div>
                              <div>
                                <h5 className="font-semibold text-indigo-700 mb-1">게스트 역할:</h5>
                                <ul className="space-y-1 text-indigo-600">
                                  <li>• 참여 링크로 접속</li>
                                  <li>• 닉네임 입력 및 물품 등록</li>
                                  <li>• 입찰 참여 및 자본 관리</li>
                                  <li>• 물품 정보 관리</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* 주요 기능 요약 */}
                      <section>
                        <h3 className="text-xl font-bold text-emerald-700 mb-4">✨ 주요 기능 요약</h3>
                        <div className="p-4 border border-emerald-200 rounded-lg bg-emerald-50/50">
                          <ul className="text-sm space-y-1 text-emerald-700">
                            <li>• 실시간 경매: 웹소켓 기반 실시간 통신</li>
                            <li>• 교육용 설계: 경제 원리 학습에 최적화</li>
                            <li>• 직관적 UI: 사용하기 쉬운 인터페이스</li>
                            <li>• 무료 사용: 별도 결제 없이 사용 가능</li>
                          </ul>
                        </div>
                      </section>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              {/* Traditional Feature Pills */}
              <div className="flex flex-wrap justify-center gap-4 mt-12 animate-fade-in-up delay-1000">
                <div className="px-6 py-3 bg-emerald-100/80 text-emerald-800 rounded-full text-sm font-semibold border border-emerald-300 shadow-sm font-handwriting">
                  경매 시뮬레이션
                </div>
                <div className="px-6 py-3 bg-amber-100/80 text-amber-800 rounded-full text-sm font-semibold border border-amber-300 shadow-sm font-handwriting">
                  놀이와 감상
                </div>
                <div className="px-6 py-3 bg-emerald-100/80 text-emerald-800 rounded-full text-sm font-semibold border border-emerald-300 shadow-sm font-handwriting">
                  가치와 토론
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Form Section */}
        <div id="auction-form" className="max-w-5xl mx-auto p-6 space-y-8 py-16">{/* Header */}

      {/* Progress Steps */}
      <Card className="bg-stone-50/90 border-emerald-200/30 shadow-lg">
        <CardContent className="p-10">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center space-x-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-bold shadow-lg transition-all duration-300 ${
                  currentStep >= step.number 
                    ? 'bg-emerald-600 text-white scale-105' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}>
                  {step.number}
                </div>
                <div className="hidden sm:block">
                  <h3 className="font-semibold text-lg">{step.title}</h3>
                  <p className="text-base text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden sm:block w-16 h-1 mx-6 rounded-full transition-all duration-300 ${
                    step.number < currentStep ? 'bg-emerald-500' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card className="min-h-[600px] shadow-lg border border-emerald-200/30 bg-stone-50/80">
        <CardHeader className="pb-8">
          <CardTitle className="flex items-center space-x-4 text-3xl">
            <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <span className="text-emerald-800">
              {steps[currentStep - 1].title}
            </span>
          </CardTitle>
          <CardDescription className="text-xl text-muted-foreground/80">
            {steps[currentStep - 1].description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Auction Name */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="auction-name" className="text-xl font-semibold">경매 이름</Label>
                <Input
                  id="auction-name"
                  placeholder="입력하지 않으면 '다시마 경매'로 설정됩니다"
                  value={auctionData.name}
                  onChange={(e) => setAuctionData(prev => ({ ...prev, name: e.target.value }))}
                  className="text-lg h-14 px-6 text-center shadow-lg border-2 focus:border-primary/50 bg-background/80 backdrop-blur-sm"
                />
                <p className="text-lg text-muted-foreground text-center bg-muted/30 p-4 rounded-lg">
                  경매 이름을 입력하거나 비워두세요. 비워두면 "다시마 경매"로 자동 설정됩니다.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Auction Method */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <Label className="text-xl font-semibold">경매 방법 선택</Label>
              <RadioGroup 
                value={auctionData.method} 
                onValueChange={(value) => setAuctionData(prev => ({ ...prev, method: value }))}
                className="space-y-6"
              >
                <div 
                  onClick={() => setAuctionData(prev => ({ ...prev, method: 'fixed' }))}
                  className={`cursor-pointer flex items-start space-x-4 p-6 border-2 rounded-xl transition-colors shadow-md ${
                    auctionData.method === 'fixed' 
                      ? 'border-emerald-500 bg-emerald-50/50' 
                      : 'border-stone-200 bg-stone-50 hover:border-emerald-300 hover:bg-emerald-50/30'
                  }`}
                >
                  <RadioGroupItem value="fixed" id="fixed" className="mt-2 scale-125" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <Shield className="h-6 w-6 text-emerald-600" />
                      <Label htmlFor="fixed" className="text-xl font-semibold cursor-pointer">고정입찰</Label>
                    </div>
                    <p className="text-lg text-muted-foreground mb-3">
                      처음 결정한 가격으로 참가자들과 비교하여 입찰하는 방식입니다.
                    </p>
                    <ul className="text-base text-muted-foreground space-y-2">
                      <li>• 라운드당 1회만 입찰 가능</li>
                      <li>• 입찰 후 재입찰 불가</li>
                      <li>• 자본금에서 즉시 차감</li>
                      <li>• 계획적 입찰 전략</li>
                    </ul>
                  </div>
                </div>
                
                <div 
                  onClick={() => setAuctionData(prev => ({ ...prev, method: 'dynamic' }))}
                  className={`cursor-pointer flex items-start space-x-4 p-6 border-2 rounded-xl transition-colors shadow-md ${
                    auctionData.method === 'dynamic' 
                      ? 'border-emerald-500 bg-emerald-50/50' 
                      : 'border-stone-200 bg-stone-50 hover:border-emerald-300 hover:bg-emerald-50/30'
                  }`}
                >
                  <RadioGroupItem value="dynamic" id="dynamic" className="mt-2 scale-125" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <Zap className="h-6 w-6 text-emerald-600" />
                      <Label htmlFor="dynamic" className="text-xl font-semibold cursor-pointer">변동입찰</Label>
                    </div>
                    <p className="text-lg text-muted-foreground mb-3">
                      실시간으로 가격을 조정하며 입찰하는 방식입니다.
                    </p>
                    <ul className="text-base text-muted-foreground space-y-2">
                      <li>• 라운드당 여러 번 입찰 가능</li>
                      <li>• 더 높은 금액으로만 재입찰</li>
                      <li>• 다른 참가자가 더 높게 입찰하면 자동 취소</li>
                      <li>• 실시간 경쟁</li>
                    </ul>
                  </div>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Step 3: Initial Capital */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="initial-capital" className="text-xl font-semibold">초기 자본금</Label>
                <div className="relative">
                  <DollarSign className="absolute left-6 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                  <Input
                    id="initial-capital"
                    type="number"
                    placeholder="10000"
                    value={auctionData.initialCapital}
                    onChange={(e) => setAuctionData(prev => ({ ...prev, initialCapital: e.target.value }))}
                    min="1"
                    className="text-lg h-14 pl-16 pr-6 text-center shadow-lg border-2 focus:border-primary/50 bg-background/80 backdrop-blur-sm"
                  />
                </div>
                <p className="text-lg text-muted-foreground text-center bg-muted/30 p-4 rounded-lg">
                  참가자들이 경매에 사용할 초기 자본금을 설정하세요.
                </p>
              </div>

              {/* Preview */}
              <Card className="bg-muted/30 shadow-lg border-2">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">경매 설정 미리보기</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-base">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">경매 이름:</span>
                    <span className="font-semibold">{auctionData.name || "미설정"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">경매 방법:</span>
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      {auctionData.method === "fixed" ? "고정입찰" : "변동입찰"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">초기 자본금:</span>
                    <span className="font-semibold text-primary">{Number(auctionData.initialCapital).toLocaleString()}원</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-8">
            <Button 
              variant="outline" 
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="text-lg h-12 px-8 shadow-lg border-emerald-200 hover:bg-emerald-50"
            >
              이전
                </Button>
            
            {currentStep < 3 ? (
              <Button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700 text-lg h-12 px-8 shadow-lg">
                다음
                <ArrowRight className="h-5 w-5 ml-3" />
              </Button>
            ) : (
              <Button 
                onClick={handleCreateAuction}
                disabled={isCreating}
                className="bg-emerald-600 hover:bg-emerald-700 text-lg h-12 px-8 shadow-lg"
              >
                {isCreating ? "생성 중..." : "경매 생성하기"}
                <Gavel className="h-5 w-5 ml-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  )
}
