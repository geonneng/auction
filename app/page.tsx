"use client"

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
import { useState } from "react"
import { useRouter } from "next/navigation"
import { auctionAPI } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { Sidebar } from "@/components/sidebar"
import { ModernGrid } from "@/components/ui/modern-grid"
import { GeometricShapes } from "@/components/ui/geometric-shapes"
import { ModernGlow } from "@/components/ui/modern-glow"

export default function HomePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [auctionData, setAuctionData] = useState({
    name: "",
    method: "fixed", // "fixed" or "dynamic"
    initialCapital: "10000"
  })
  const [isCreating, setIsCreating] = useState(false)

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
        {/* Modern Hero Section */}
        <div className="relative h-[70vh] min-h-[600px] w-full bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 overflow-hidden">
          {/* Modern Background Elements */}
          <ModernGrid />
          <GeometricShapes />
          <ModernGlow />
          
          {/* Main content */}
          <div className="relative z-20 flex items-center justify-center h-full">
            <div className="text-center space-y-12 max-w-5xl mx-auto px-6">
              {/* Clean Typography */}
              <div className="space-y-8">
                <div className="inline-block relative">
                  <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-slate-900 tracking-tight animate-scale-in-up">
                    가치오름
                  </h1>
                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-2/3 h-0.5 bg-emerald-500 rounded-full animate-scale-in-delayed"></div>
                </div>
                
                <h2 className="text-2xl md:text-3xl font-light text-slate-600 tracking-wide animate-slide-in-left delay-300">
                  실시간 경매 시뮬레이션
                </h2>
              </div>
              
              {/* Modern CTA Section */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center mt-16 animate-scale-in-up delay-700">
                <button 
                  onClick={() => {
                    const formElement = document.getElementById('auction-form');
                    formElement?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="group relative px-10 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-semibold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  <Gavel className="w-5 h-5 mr-3 relative z-10" />
                  <span className="relative z-10">경매 시작하기</span>
                </button>
                
                <button 
                  onClick={() => router.push('/help')}
                  className="group relative px-10 py-4 border-2 border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 flex items-center justify-center overflow-hidden bg-white/50 backdrop-blur-sm"
                >
                  <div className="absolute inset-0 bg-slate-50 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  <Target className="w-5 h-5 mr-3 relative z-10" />
                  <span className="relative z-10">사용법 보기</span>
                </button>
              </div>
              
              {/* Clean Feature Pills */}
              <div className="flex flex-wrap justify-center gap-3 mt-12 animate-fade-in-up delay-1000">
                <div className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                  실시간 입찰
                </div>
                <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  교육용 설계
                </div>
                <div className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  직관적 UI
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
                      사전에 정해진 가격으로 입찰하는 방식입니다.
                    </p>
                    <ul className="text-base text-muted-foreground space-y-2">
                      <li>• 명확한 가격 설정</li>
                      <li>• 계획적 입찰 전략</li>
                      <li>• 안정적인 경매 진행</li>
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
                      경매가 진행되면서 가격이 실시간으로 변동하는 방식입니다.
                    </p>
                    <ul className="text-base text-muted-foreground space-y-2">
                      <li>• 실시간 가격 변동</li>
                      <li>• 동적 입찰 시스템</li>
                      <li>• 경쟁적 경매 환경</li>
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
