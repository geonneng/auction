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
        {/* Modern Hero Section */}
        <div className="relative h-[60vh] sm:h-[65vh] md:h-[70vh] min-h-[500px] sm:min-h-[600px] w-full bg-gradient-to-br from-emerald-50/80 via-amber-50/60 to-emerald-100/40 overflow-hidden">
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
                  <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-emerald-900 tracking-tight animate-scale-in-up font-handwriting">
                    BID
                  </h1>
                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-2/3 h-1 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 rounded-full animate-scale-in-delayed"></div>
                  
                  {/* Modern Decorative Elements */}
                  <div className="absolute -top-4 -left-4 w-3 h-3 bg-emerald-500 rounded-full animate-pulse-slow"></div>
                  <div className="absolute -top-4 -right-4 w-3 h-3 bg-emerald-500 rounded-full animate-pulse-slow delay-500"></div>
                  <div className="absolute -bottom-4 -left-4 w-3 h-3 bg-emerald-500 rounded-full animate-pulse-slow delay-1000"></div>
                  <div className="absolute -bottom-4 -right-4 w-3 h-3 bg-emerald-500 rounded-full animate-pulse-slow delay-1500"></div>
                </div>
                
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-emerald-800 tracking-wide animate-slide-in-left delay-300 font-handwriting">
                  경매형 교육놀이
                </h2>
              </div>
              
              {/* Modern CTA Section */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mt-12 sm:mt-16 animate-scale-in-up delay-700">
                <button 
                  onClick={() => {
                    const formElement = document.getElementById('auction-form');
                    formElement?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="group relative px-6 sm:px-8 md:px-12 py-3 sm:py-4 md:py-5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center overflow-hidden border-2 border-emerald-700 font-handwriting"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-emerald-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  <Gavel className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 relative z-10" />
                  <span className="relative z-10">경매 시작하기</span>
                </button>
                
                <Dialog open={showWelcomeDialog} onOpenChange={(open) => {
                  setShowWelcomeDialog(open)
                  if (!open) {
                    localStorage.setItem('hasSeenWelcome', 'true')
                  }
                }}>
                  <DialogTrigger asChild>
                    <button className="group relative px-6 sm:px-8 md:px-12 py-3 sm:py-4 md:py-5 border-2 border-emerald-600 hover:border-emerald-700 text-emerald-800 hover:text-emerald-900 rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 flex items-center justify-center overflow-hidden bg-emerald-50/80 backdrop-blur-sm font-handwriting">
                      <div className="absolute inset-0 bg-emerald-100 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                      <Target className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 relative z-10" />
                      <span className="relative z-10">사용법 보기</span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-emerald-800 text-center">
                        🎯 BID - 실시간 경매 시뮬레이션
                      </DialogTitle>
                      <DialogDescription className="text-center text-lg sm:text-xl md:text-2xl">
                        경매형 교육놀이. 교육용 경매 플랫폼의 모든 기능을 알아보세요
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-8 py-4">
                      {/* 애플리케이션 개요 */}
                      <section>
                        <h3 className="text-2xl sm:text-3xl font-bold text-emerald-700 mb-4">📱 애플리케이션 개요</h3>
                        <div className="p-4 border border-emerald-200 rounded-lg bg-emerald-50/50">
                          <p className="text-base sm:text-lg text-emerald-700">
                            <strong>BID</strong>는 교육용 실시간 경매 플랫폼으로, 참가자들이 가상의 자본금으로 경매에 참여할 수 있는 웹 애플리케이션입니다.
                          </p>
                        </div>
                      </section>

                      {/* 주요 기능 */}
                      <section>
                        <h3 className="text-2xl sm:text-3xl font-bold text-emerald-700 mb-6">🎮 주요 기능</h3>
                        
                        {/* 1. 경매 생성 및 관리 */}
                        <div className="mb-6">
                          <h4 className="text-xl font-bold text-emerald-800 mb-3">1. 경매 생성 및 관리</h4>
                          <div className="p-4 border border-emerald-200 rounded-lg bg-emerald-50/50">
                            <ul className="text-sm sm:text-base space-y-2 text-emerald-700">
                              <li>• <strong>경매 이름 설정</strong>: 사용자 정의 경매 이름 또는 기본값 "다시마 경매"</li>
                              <li>• <strong>경매 방식 선택</strong>: 고정입찰 (Fixed Bidding) / 변동입찰 (Dynamic Bidding)</li>
                              <li>• <strong>초기 자본금 설정</strong>: 참가자들의 시작 자본금 조정 가능</li>
                              <li>• <strong>QR 코드 생성</strong>: 참가자 초대를 위한 QR 코드 자동 생성</li>
                            </ul>
                          </div>
                        </div>

                        {/* 2. 참가자 관리 */}
                        <div className="mb-6">
                          <h4 className="text-xl font-bold text-emerald-800 mb-3">2. 참가자 관리</h4>
                          <div className="p-4 border border-blue-200 rounded-lg bg-blue-50/50">
                            <ul className="text-sm sm:text-base space-y-2 text-blue-700">
                              <li>• <strong>실시간 참가자 목록</strong>: 최대 6명까지 참가 가능</li>
                              <li>• <strong>자본금 관리</strong>: 개별 참가자 자본금 수정 / 전체 참가자 자본금 일괄 수정</li>
                              <li>• <strong>입찰 상태 표시</strong>: 실시간 입찰 상태 모니터링</li>
                            </ul>
                          </div>
                        </div>

                        {/* 3. 경매 진행 시스템 */}
                        <div className="mb-6">
                          <h4 className="text-xl font-bold text-emerald-800 mb-3">3. 경매 진행 시스템</h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-4 border border-emerald-200 rounded-lg bg-emerald-50/50">
                              <h5 className="text-lg font-bold text-emerald-800 mb-2">🔒 고정입찰 (Fixed Bidding)</h5>
                              <ul className="text-sm space-y-1 text-emerald-700">
                                <li>• <strong>일회성 입찰</strong>: 라운드당 1회만 입찰 가능</li>
                                <li>• <strong>입찰 금액 숨김</strong>: 라운드 진행 중 입찰 금액 비공개, 순위만 표시</li>
                                <li>• <strong>라운드 종료 후 공개</strong>: 모든 입찰 금액과 결과 공개</li>
                              </ul>
                            </div>
                            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50/50">
                              <h5 className="text-lg font-bold text-blue-800 mb-2">⚡ 변동입찰 (Dynamic Bidding)</h5>
                              <ul className="text-sm space-y-1 text-blue-700">
                                <li>• <strong>재입찰 가능</strong>: 실시간으로 더 높은 금액 재입찰 가능</li>
                                <li>• <strong>실시간 최고 입찰자 표시</strong>: 현재 최고 입찰자와 금액 실시간 업데이트</li>
                                <li>• <strong>자동 입찰 취소</strong>: 새로운 입찰 시 이전 입찰 자동 취소 및 자본 환원</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* 4. 경매 물품 관리 */}
                        <div className="mb-6">
                          <h4 className="text-xl font-bold text-emerald-800 mb-3">4. 경매 물품 관리</h4>
                          <div className="p-4 border border-amber-200 rounded-lg bg-amber-50/50">
                            <ul className="text-sm sm:text-base space-y-2 text-amber-700">
                              <li>• <strong>물품 등록</strong>: 참가자가 사이드바를 통해 경매 물품 등록</li>
                              <li>• <strong>물품 선택</strong>: 호스트가 등록된 물품 중 라운드용 물품 선택</li>
                              <li>• <strong>물품 정보 표시</strong>: 물품명, 설명, 등록자 정보 표시</li>
                              <li>• <strong>등록자 닉네임 표시</strong>: 물품 등록자의 닉네임 명확히 표시</li>
                            </ul>
                          </div>
                        </div>

                        {/* 5. 낙찰 및 금액 분배 */}
                        <div className="mb-6">
                          <h4 className="text-xl font-bold text-emerald-800 mb-3">5. 낙찰 및 금액 분배</h4>
                          <div className="p-4 border border-green-200 rounded-lg bg-green-50/50">
                            <ul className="text-sm sm:text-base space-y-2 text-green-700">
                              <li>• <strong>낙찰자 결정</strong>: 라운드 종료 시 최고 입찰자 자동 선정</li>
                              <li>• <strong>낙찰 금액 전달</strong>: 물품 등록자에게 낙찰 금액 전달 기능</li>
                              <li>• <strong>수동 분배 시스템</strong>: 호스트가 직접 낙찰 금액 전달 버튼 클릭</li>
                              <li>• <strong>자본금 업데이트</strong>: 전달 후 물품 등록자 자본금 자동 증가</li>
                            </ul>
                          </div>
                        </div>

                        {/* 6. 라운드 관리 */}
                        <div className="mb-6">
                          <h4 className="text-xl font-bold text-emerald-800 mb-3">6. 라운드 관리</h4>
                          <div className="p-4 border border-purple-200 rounded-lg bg-purple-50/50">
                            <ul className="text-sm sm:text-base space-y-2 text-purple-700">
                              <li>• <strong>라운드 시작/종료</strong>: 호스트가 라운드 진행 상황 제어</li>
                              <li>• <strong>상태 표시</strong>: WAITING (대기) / ACTIVE (진행) / ENDED (종료)</li>
                              <li>• <strong>라운드별 물품 등록</strong>: 각 라운드마다 새로운 물품 등록 가능</li>
                              <li>• <strong>자동 초기화</strong>: 라운드 종료 후 다음 라운드 준비</li>
                            </ul>
                          </div>
                        </div>
                      </section>

                      {/* 사용자 인터페이스 */}
                      <section>
                        <h3 className="text-2xl sm:text-3xl font-bold text-emerald-700 mb-6">🎨 사용자 인터페이스</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="p-4 border border-indigo-200 rounded-lg bg-indigo-50/50">
                            <h4 className="text-lg font-bold text-indigo-800 mb-3">🏠 호스트 페이지</h4>
                            <ul className="text-sm space-y-1 text-indigo-700">
                              <li>• <strong>경매 제어 섹션</strong>: 라운드 시작/종료, 물품 등록 관리</li>
                              <li>• <strong>참가자 목록</strong>: 실시간 참가자 상태 및 자본금 표시</li>
                              <li>• <strong>입찰 현황</strong>: 실시간 입찰 순위 및 결과 표시</li>
                              <li>• <strong>낙찰 결과</strong>: 낙찰자 정보 및 금액 전달 버튼</li>
                            </ul>
                          </div>
                          <div className="p-4 border border-pink-200 rounded-lg bg-pink-50/50">
                            <h4 className="text-lg font-bold text-pink-800 mb-3">👤 참가자 페이지</h4>
                            <ul className="text-sm space-y-1 text-pink-700">
                              <li>• <strong>입찰 인터페이스</strong>: 직관적인 입찰 금액 입력</li>
                              <li>• <strong>자본금 표시</strong>: 현재 보유 자본금 실시간 표시</li>
                              <li>• <strong>입찰 상태</strong>: 입찰 가능 여부 및 상태 안내</li>
                              <li>• <strong>물품 등록</strong>: 사이드바를 통한 경매 물품 등록</li>
                            </ul>
                          </div>
                        </div>
                      </section>

                      {/* 기술적 특징 */}
                      <section>
                        <h3 className="text-2xl sm:text-3xl font-bold text-emerald-700 mb-6">🔧 기술적 특징</h3>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="p-4 border border-cyan-200 rounded-lg bg-cyan-50/50">
                            <h4 className="text-lg font-bold text-cyan-800 mb-2">실시간 통신</h4>
                            <ul className="text-sm space-y-1 text-cyan-700">
                              <li>• 폴링 시스템 (2초 간격)</li>
                              <li>• 상태 동기화</li>
                              <li>• 오류 처리</li>
                            </ul>
                          </div>
                          <div className="p-4 border border-orange-200 rounded-lg bg-orange-50/50">
                            <h4 className="text-lg font-bold text-orange-800 mb-2">데이터 관리</h4>
                            <ul className="text-sm space-y-1 text-orange-700">
                              <li>• localStorage 활용</li>
                              <li>• React hooks</li>
                              <li>• TypeScript</li>
                            </ul>
                          </div>
                          <div className="p-4 border border-red-200 rounded-lg bg-red-50/50">
                            <h4 className="text-lg font-bold text-red-800 mb-2">보안 및 안정성</h4>
                            <ul className="text-sm space-y-1 text-red-700">
                              <li>• 입력 검증</li>
                              <li>• 오류 경계</li>
                              <li>• 상태 복구</li>
                            </ul>
                          </div>
                        </div>
                      </section>

                      {/* 교육적 가치 */}
                      <section>
                        <h3 className="text-2xl sm:text-3xl font-bold text-emerald-700 mb-6">🎯 교육적 가치</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="p-4 border border-teal-200 rounded-lg bg-teal-50/50">
                            <h4 className="text-lg font-bold text-teal-800 mb-3">경제 개념 학습</h4>
                            <ul className="text-sm space-y-1 text-teal-700">
                              <li>• <strong>경매 메커니즘</strong>: 공정한 경매 과정을 통한 가격 발견 학습</li>
                              <li>• <strong>자본 관리</strong>: 제한된 자본으로 최적의 입찰 전략 수립</li>
                              <li>• <strong>경쟁 심리</strong>: 다른 참가자와의 경쟁을 통한 의사결정 능력 향상</li>
                            </ul>
                          </div>
                          <div className="p-4 border border-violet-200 rounded-lg bg-violet-50/50">
                            <h4 className="text-lg font-bold text-violet-800 mb-3">협업 및 소통</h4>
                            <ul className="text-sm space-y-1 text-violet-700">
                              <li>• <strong>팀워크</strong>: 호스트와 참가자 간의 협력적 경매 진행</li>
                              <li>• <strong>의사소통</strong>: 물품 등록 및 경매 진행을 통한 소통 능력 향상</li>
                              <li>• <strong>책임감</strong>: 자신의 입찰에 대한 책임감과 신중한 의사결정</li>
                            </ul>
                          </div>
                        </div>
                      </section>

                      {/* 사용 시나리오 */}
                      <section>
                        <h3 className="text-2xl sm:text-3xl font-bold text-emerald-700 mb-6">🚀 사용 시나리오</h3>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="p-4 border border-lime-200 rounded-lg bg-lime-50/50">
                            <h4 className="text-lg font-bold text-lime-800 mb-2">1. 교육 현장</h4>
                            <ul className="text-sm space-y-1 text-lime-700">
                              <li>• 경제 수업: 시장 메커니즘 실습</li>
                              <li>• 경영 수업: 경매 전략 및 의사결정 학습</li>
                              <li>• 수학 수업: 확률과 통계 개념 적용</li>
                            </ul>
                          </div>
                          <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50/50">
                            <h4 className="text-lg font-bold text-yellow-800 mb-2">2. 기업 교육</h4>
                            <ul className="text-sm space-y-1 text-yellow-700">
                              <li>• 신입사원 교육: 협상 스킬 및 의사결정 능력 향상</li>
                              <li>• 팀 빌딩: 팀원 간 경쟁과 협력을 통한 유대감 형성</li>
                              <li>• 리더십 교육: 호스트 역할을 통한 리더십 경험</li>
                            </ul>
                          </div>
                          <div className="p-4 border border-rose-200 rounded-lg bg-rose-50/50">
                            <h4 className="text-lg font-bold text-rose-800 mb-2">3. 가족/친구 모임</h4>
                            <ul className="text-sm space-y-1 text-rose-700">
                              <li>• 재미있는 게임: 가상 자본으로 하는 재미있는 경매 게임</li>
                              <li>• 전략 게임: 심리전과 전략을 통한 흥미로운 대결</li>
                              <li>• 소통 도구: 새로운 형태의 소통과 상호작용 경험</li>
                            </ul>
                          </div>
                        </div>
                      </section>

                      {/* 마무리 */}
                      <section>
                        <div className="p-6 border-2 border-emerald-300 rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 text-center">
                          <p className="text-base sm:text-lg text-emerald-700 font-medium">
                            이 웹앱은 교육과 재미를 동시에 제공하는 혁신적인 경매 시뮬레이션 플랫폼입니다. 
                            실제 경제 활동의 핵심 요소들을 체험할 수 있도록 설계되었으며, 
                            다양한 연령대와 상황에서 활용할 수 있습니다.
                          </p>
                        </div>
                      </section>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              {/* Modern Feature Pills */}
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-8 sm:mt-12 animate-fade-in-up delay-1000">
                <div className="px-4 sm:px-6 py-2 sm:py-3 bg-emerald-100/80 text-emerald-800 rounded-full text-xs sm:text-sm font-semibold border border-emerald-300 shadow-sm font-handwriting">
                  경매 시뮬레이션
                </div>
                <div className="px-4 sm:px-6 py-2 sm:py-3 bg-amber-100/80 text-amber-800 rounded-full text-xs sm:text-sm font-semibold border border-amber-300 shadow-sm font-handwriting">
                  놀이와 감상
                </div>
                <div className="px-4 sm:px-6 py-2 sm:py-3 bg-emerald-100/80 text-emerald-800 rounded-full text-xs sm:text-sm font-semibold border border-emerald-300 shadow-sm font-handwriting">
                  가치와 토론
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Form Section */}
        <div id="auction-form" className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8 py-12 sm:py-16">{/* Header */}

      {/* Progress Steps */}
      <Card className="bg-stone-50/90 border-emerald-200/30 shadow-lg">
        <CardContent className="p-6 sm:p-8 md:p-10">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center space-x-3 sm:space-x-6">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-sm sm:text-lg font-bold shadow-lg transition-all duration-300 ${
                  currentStep >= step.number 
                    ? 'bg-emerald-600 text-white scale-105' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}>
                  {step.number}
                </div>
                <div className="hidden sm:block">
                  <h3 className="font-semibold text-base sm:text-lg">{step.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden sm:block w-8 sm:w-16 h-1 mx-3 sm:mx-6 rounded-full transition-all duration-300 ${
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
        <CardHeader className="pb-6 sm:pb-8">
          <CardTitle className="flex items-center space-x-3 sm:space-x-4 text-xl sm:text-2xl md:text-3xl">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <span className="text-emerald-800">
              {steps[currentStep - 1].title}
            </span>
          </CardTitle>
          <CardDescription className="text-base sm:text-lg md:text-xl text-muted-foreground/80">
            {steps[currentStep - 1].description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Auction Name */}
          {currentStep === 1 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                <Label htmlFor="auction-name" className="text-base sm:text-lg md:text-xl font-semibold">경매 이름</Label>
                <Input
                  id="auction-name"
                  placeholder="입력하지 않으면 '다시마 경매'로 설정됩니다"
                  value={auctionData.name}
                  onChange={(e) => setAuctionData(prev => ({ ...prev, name: e.target.value }))}
                  className="text-sm sm:text-base md:text-lg h-12 sm:h-14 px-4 sm:px-6 text-center shadow-lg border-2 focus:border-primary/50 bg-background/80 backdrop-blur-sm"
                />
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground text-center bg-muted/30 p-3 sm:p-4 rounded-lg">
                  경매 이름을 입력하거나 비워두세요. 비워두면 "다시마 경매"로 자동 설정됩니다.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Auction Method */}
          {currentStep === 2 && (
            <div className="space-y-4 sm:space-y-6">
              <Label className="text-base sm:text-lg md:text-xl font-semibold">경매 방법 선택</Label>
              <RadioGroup 
                value={auctionData.method} 
                onValueChange={(value) => setAuctionData(prev => ({ ...prev, method: value }))}
                className="space-y-4 sm:space-y-6"
              >
                <div 
                  onClick={() => setAuctionData(prev => ({ ...prev, method: 'fixed' }))}
                  className={`cursor-pointer flex items-start space-x-3 sm:space-x-4 p-4 sm:p-6 border-2 rounded-xl transition-colors shadow-md ${
                    auctionData.method === 'fixed' 
                      ? 'border-emerald-500 bg-emerald-50/50' 
                      : 'border-stone-200 bg-stone-50 hover:border-emerald-300 hover:bg-emerald-50/30'
                  }`}
                >
                  <RadioGroupItem value="fixed" id="fixed" className="mt-1 sm:mt-2 scale-110 sm:scale-125" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                      <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                      <Label htmlFor="fixed" className="text-base sm:text-lg md:text-xl font-semibold cursor-pointer">고정입찰</Label>
                    </div>
                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-2 sm:mb-3">
                      처음 결정한 가격으로 참가자들과 비교하여 입찰하는 방식입니다.
                    </p>
                    <ul className="text-xs sm:text-sm md:text-base text-muted-foreground space-y-1 sm:space-y-2">
                      <li>• 라운드당 1회만 입찰 가능</li>
                      <li>• 입찰 후 재입찰 불가</li>
                      <li>• 자본금에서 즉시 차감</li>
                      <li>• 계획적 입찰 전략</li>
                    </ul>
                  </div>
                </div>
                
                <div 
                  onClick={() => setAuctionData(prev => ({ ...prev, method: 'dynamic' }))}
                  className={`cursor-pointer flex items-start space-x-3 sm:space-x-4 p-4 sm:p-6 border-2 rounded-xl transition-colors shadow-md ${
                    auctionData.method === 'dynamic' 
                      ? 'border-emerald-500 bg-emerald-50/50' 
                      : 'border-stone-200 bg-stone-50 hover:border-emerald-300 hover:bg-emerald-50/30'
                  }`}
                >
                  <RadioGroupItem value="dynamic" id="dynamic" className="mt-1 sm:mt-2 scale-110 sm:scale-125" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                      <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                      <Label htmlFor="dynamic" className="text-base sm:text-lg md:text-xl font-semibold cursor-pointer">변동입찰</Label>
                    </div>
                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-2 sm:mb-3">
                      실시간으로 가격을 조정하며 입찰하는 방식입니다.
                    </p>
                    <ul className="text-xs sm:text-sm md:text-base text-muted-foreground space-y-1 sm:space-y-2">
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
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                <Label htmlFor="initial-capital" className="text-base sm:text-lg md:text-xl font-semibold">초기 자본금</Label>
                <div className="relative">
                  <DollarSign className="absolute left-4 sm:left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                  <Input
                    id="initial-capital"
                    type="number"
                    placeholder="10000"
                    value={auctionData.initialCapital}
                    onChange={(e) => setAuctionData(prev => ({ ...prev, initialCapital: e.target.value }))}
                    min="1"
                    className="text-sm sm:text-base md:text-lg h-12 sm:h-14 pl-12 sm:pl-16 pr-4 sm:pr-6 text-center shadow-lg border-2 focus:border-primary/50 bg-background/80 backdrop-blur-sm"
                  />
                </div>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground text-center bg-muted/30 p-3 sm:p-4 rounded-lg">
                  참가자들이 경매에 사용할 초기 자본금을 설정하세요.
                </p>
              </div>

              {/* Preview */}
              <Card className="bg-muted/30 shadow-lg border-2">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">경매 설정 미리보기</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 text-sm sm:text-base">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">경매 이름:</span>
                    <span className="font-semibold">{auctionData.name || "미설정"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">경매 방법:</span>
                    <Badge variant="outline" className="text-xs sm:text-sm px-2 sm:px-3 py-1">
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
          <div className="flex justify-between pt-6 sm:pt-8">
            <Button 
              variant="outline" 
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="text-sm sm:text-base md:text-lg h-10 sm:h-12 px-4 sm:px-6 md:px-8 shadow-lg border-emerald-200 hover:bg-emerald-50"
            >
              이전
                </Button>
            
            {currentStep < 3 ? (
              <Button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700 text-sm sm:text-base md:text-lg h-10 sm:h-12 px-4 sm:px-6 md:px-8 shadow-lg">
                다음
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2 sm:ml-3" />
              </Button>
            ) : (
              <Button 
                onClick={handleCreateAuction}
                disabled={isCreating}
                className="bg-emerald-600 hover:bg-emerald-700 text-sm sm:text-base md:text-lg h-10 sm:h-12 px-4 sm:px-6 md:px-8 shadow-lg"
              >
                {isCreating ? "생성 중..." : "경매 생성하기"}
                <Gavel className="h-4 w-4 sm:h-5 sm:w-5 ml-2 sm:ml-3" />
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
