"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  Gavel, 
  Users, 
  Clock, 
  TrendingUp, 
  Star,
  ArrowRight,
  Sparkles,
  Target,
  BookOpen,
  Lightbulb,
  Settings,
  Zap,
  Shield,
  Globe,
  Timer,
  Package,
  Play,
  Pause
} from "lucide-react"

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-stone-100 relative overflow-hidden">
      {/* Header */}
      <div className="text-center space-y-6 py-12 bg-stone-50/50 rounded-2xl border border-emerald-200/30">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-emerald-600">
            도움말
          </h1>
        </div>
        <p className="text-xl text-emerald-700 max-w-2xl mx-auto">
          가담 플랫폼 사용법을 알아보세요
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-6 space-y-8">
        {/* 변동입찰과 고정입찰 */}
        <section>
          <h2 className="text-3xl font-bold text-emerald-800 mb-6 flex items-center gap-3">
            <Gavel className="h-8 w-8" />
            🔒 고정입찰 vs ⚡ 변동입찰
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-800">
                  <Shield className="h-6 w-6" />
                  🔒 고정입찰 (Fixed Bidding)
                </CardTitle>
                <CardDescription className="text-emerald-700">
                  사전에 정해진 가격으로 입찰하는 방식
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-emerald-700">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 text-emerald-600" />
                    <span>라운드당 <strong>1회만</strong> 입찰 가능</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 text-emerald-600" />
                    <span>입찰 후 <strong>재입찰 불가</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 text-emerald-600" />
                    <span>자본금에서 <strong>즉시 차감</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 text-emerald-600" />
                    <span><strong>명확한 가격</strong> 설정</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 text-emerald-600" />
                    <span><strong>계획적 입찰</strong> 전략</span>
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-emerald-100 rounded-lg">
                  <p className="text-sm text-emerald-800 font-medium">
                    💡 초보자에게 적합하며, 전략적 사고 훈련에 효과적입니다.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Zap className="h-6 w-6" />
                  ⚡ 변동입찰 (Dynamic Bidding)
                </CardTitle>
                <CardDescription className="text-blue-700">
                  실시간으로 가격을 조정하며 입찰하는 방식
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-blue-700">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 text-blue-600" />
                    <span>라운드당 <strong>여러 번</strong> 입찰 가능</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 text-blue-600" />
                    <span><strong>더 높은 금액</strong>으로만 재입찰</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 text-blue-600" />
                    <span>다른 참가자가 더 높게 입찰하면 <strong>자동 취소</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 text-blue-600" />
                    <span><strong>실시간 경쟁</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 text-blue-600" />
                    <span><strong>역동적인</strong> 경매 경험</span>
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">
                    💡 고급 교육과 실전 경험에 적합하며, 경쟁적 환경에서 효과적입니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 사이드바 기능 */}
        <section>
          <h2 className="text-3xl font-bold text-emerald-800 mb-6 flex items-center gap-3">
            <Settings className="h-8 w-8" />
            🎛️ 사이드바 기능
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <Users className="h-6 w-6" />
                  🏠 호스트 페이지
                </CardTitle>
                <CardDescription className="text-amber-700">
                  경매를 관리하고 진행하는 호스트 전용 기능
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                      <Timer className="h-5 w-5" />
                      ⏰ 타이머 기능
                    </h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>• 10초, 30초, 1분, 3분, 5분, 10분, 15분 프리셋</li>
                      <li>• 시작/일시정지/리셋 버튼</li>
                      <li>• 진행률 바로 시간 시각화</li>
                      <li>• 자동 종료 알림</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      📦 경매물품 관리
                    </h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>• 참가자별 물품 조회</li>
                      <li>• 물품 상세 정보 (이름, 설명, 이미지)</li>
                      <li>• 물품 크게 보기 기능</li>
                      <li>• 참가자 선택 드롭다운</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <Target className="h-6 w-6" />
                  👤 게스트 페이지
                </CardTitle>
                <CardDescription className="text-purple-700">
                  경매에 참여하는 게스트 전용 기능
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    📦 경매물품 등록
                  </h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• 물품 이름 입력</li>
                    <li>• 물품 설명 작성</li>
                    <li>• 이미지 업로드 (선택사항)</li>
                    <li>• 등록/수정 기능</li>
                    <li>• 등록 완료 상태 표시</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 경매 생성 및 운영 */}
        <section>
          <h2 className="text-3xl font-bold text-emerald-800 mb-6 flex items-center gap-3">
            <Play className="h-8 w-8" />
            🚀 경매 생성 및 운영
          </h2>
          
          {/* 경매 생성 과정 */}
          <Card className="border-green-200 bg-green-50/50 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Settings className="h-6 w-6" />
                📝 경매 생성 과정
              </CardTitle>
              <CardDescription className="text-green-700">
                단계별로 경매를 생성하는 방법
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                    <div>
                      <h4 className="font-semibold text-green-800">경매 이름 설정</h4>
                      <p className="text-sm text-green-700">입력하지 않으면 "다시마 경매"로 자동 설정</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                    <div>
                      <h4 className="font-semibold text-green-800">경매 방법 선택</h4>
                      <p className="text-sm text-green-700">고정입찰 또는 변동입찰 선택</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                    <div>
                      <h4 className="font-semibold text-green-800">초기 자본금 설정</h4>
                      <p className="text-sm text-green-700">각 참가자의 초기 자본금 설정</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
                    <div>
                      <h4 className="font-semibold text-green-800">경매 시작</h4>
                      <p className="text-sm text-green-700">참가자들에게 참여 링크 공유</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 경매 운영 방법 */}
          <Card className="border-indigo-200 bg-indigo-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-800">
                <Globe className="h-6 w-6" />
                🎮 경매 운영 방법
              </CardTitle>
              <CardDescription className="text-indigo-700">
                호스트와 게스트의 역할별 운영 방법
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 bg-indigo-100 rounded-lg">
                  <h4 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    호스트 역할
                  </h4>
                  <ul className="text-sm text-indigo-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 mt-0.5 text-indigo-600" />
                      <span>경매 시작 및 참여 링크 공유</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 mt-0.5 text-indigo-600" />
                      <span>라운드 관리 및 타이머 설정</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 mt-0.5 text-indigo-600" />
                      <span>참가자 관리 및 자본금 수정</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 mt-0.5 text-indigo-600" />
                      <span>물품 관리 및 조회</span>
                    </li>
                  </ul>
                </div>
                <div className="p-4 bg-indigo-100 rounded-lg">
                  <h4 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    게스트 역할
                  </h4>
                  <ul className="text-sm text-indigo-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 mt-0.5 text-indigo-600" />
                      <span>참여 링크로 접속</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 mt-0.5 text-indigo-600" />
                      <span>닉네임 입력 및 물품 등록</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 mt-0.5 text-indigo-600" />
                      <span>입찰 참여 및 자본 관리</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 mt-0.5 text-indigo-600" />
                      <span>물품 정보 관리</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 주요 기능 요약 */}
        <section>
          <h2 className="text-3xl font-bold text-emerald-800 mb-6 flex items-center gap-3">
            <Star className="h-8 w-8" />
            ✨ 주요 기능 요약
          </h2>
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-emerald-800">실시간 경매</h4>
                      <p className="text-sm text-emerald-700">웹소켓 기반 실시간 통신</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-emerald-800">교육용 설계</h4>
                      <p className="text-sm text-emerald-700">경제 원리 학습에 최적화</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                      <Settings className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-emerald-800">직관적 UI</h4>
                      <p className="text-sm text-emerald-700">사용하기 쉬운 인터페이스</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-emerald-800">무료 사용</h4>
                      <p className="text-sm text-emerald-700">별도 결제 없이 사용 가능</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}