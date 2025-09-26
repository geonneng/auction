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
    if (!auctionData.name.trim()) {
      toast({
        title: "입력 오류",
        description: "경매 이름을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

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
      const response = await auctionAPI.createRoom(capital)
      if (response.success) {
        console.log("[Create Auction] Room created, redirecting to:", response.roomId)
        setIsCreating(false)
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

  const steps = [
    { number: 1, title: "경매 이름", description: "경매의 이름을 설정하세요" },
    { number: 2, title: "경매 방법", description: "경매 방식을 선택하세요" },
    { number: 3, title: "초기 자본금", description: "참가자들의 초기 자본금을 설정하세요" }
  ]

  return (
    <div>
      <Sidebar />
      <div className="ml-16 p-6 pt-4">
        <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-8">
        <div className="flex items-center justify-center space-x-4 mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-xl">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-7xl font-bold bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            경매 생성
          </h1>
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
        </div>
        <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
          새로운 경매를 생성하고 참가자들을 초대해보세요
        </p>
        <div className="flex items-center justify-center space-x-3">
          <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>

      {/* Progress Steps */}
      <Card className="bg-gradient-to-r from-emerald-50/50 via-blue-50/50 to-purple-50/50 border-emerald-200/30 shadow-xl backdrop-blur-sm">
        <CardContent className="p-10">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center space-x-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-bold shadow-lg transition-all duration-300 ${
                  currentStep >= step.number 
                    ? 'bg-gradient-to-br from-emerald-500 to-blue-600 text-white scale-105' 
                    : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 hover:from-gray-200 hover:to-gray-300'
                }`}>
                  {step.number}
                </div>
                <div className="hidden sm:block">
                  <h3 className="font-semibold text-lg">{step.title}</h3>
                  <p className="text-base text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden sm:block w-16 h-1 mx-6 rounded-full transition-all duration-300 ${
                    step.number < currentStep ? 'bg-gradient-to-r from-emerald-400 to-blue-500' : 'bg-gradient-to-r from-gray-200 to-gray-300'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card className="min-h-[600px] shadow-2xl border border-emerald-200/20 bg-gradient-to-br from-white/95 to-emerald-50/30 backdrop-blur-lg">
        <CardHeader className="pb-8">
          <CardTitle className="flex items-center space-x-4 text-3xl">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
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
                  placeholder="예: 2024년 1학기 경제학 경매"
                  value={auctionData.name}
                  onChange={(e) => setAuctionData(prev => ({ ...prev, name: e.target.value }))}
                  className="text-lg h-14 px-6 text-center shadow-lg border-2 focus:border-primary/50 bg-background/80 backdrop-blur-sm"
                />
                <p className="text-lg text-muted-foreground text-center bg-muted/30 p-4 rounded-lg">
                  참가자들이 쉽게 식별할 수 있는 이름을 입력하세요.
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
                <div className="flex items-start space-x-4 p-6 border-2 rounded-xl hover:bg-muted/50 transition-colors shadow-lg bg-background/80 backdrop-blur-sm">
                  <RadioGroupItem value="fixed" id="fixed" className="mt-2 scale-125" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <Shield className="h-6 w-6 text-primary" />
                      <Label htmlFor="fixed" className="text-xl font-semibold">고정입찰</Label>
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
                
                <div className="flex items-start space-x-4 p-6 border-2 rounded-xl hover:bg-muted/50 transition-colors shadow-lg bg-background/80 backdrop-blur-sm">
                  <RadioGroupItem value="dynamic" id="dynamic" className="mt-2 scale-125" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <Zap className="h-6 w-6 text-primary" />
                      <Label htmlFor="dynamic" className="text-xl font-semibold">변동입찰</Label>
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
              className="text-lg h-12 px-8 shadow-lg"
            >
              이전
            </Button>
            
            {currentStep < 3 ? (
              <Button onClick={handleNext} className="text-lg h-12 px-8 shadow-lg">
                다음
                <ArrowRight className="h-5 w-5 ml-3" />
              </Button>
            ) : (
              <Button 
                onClick={handleCreateAuction}
                disabled={isCreating}
                className="bg-primary hover:bg-primary/90 text-lg h-12 px-8 shadow-lg"
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
