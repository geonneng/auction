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
          <h1 className="text-4xl sm:text-5xl font-bold text-emerald-600">
            BID 도움말
          </h1>
        </div>
        <p className="text-lg sm:text-xl text-emerald-700 max-w-2xl mx-auto">
          실시간 경매 시뮬레이션 플랫폼의 모든 기능을 알아보세요
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        {/* 애플리케이션 개요 */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold text-emerald-800 mb-6 flex items-center gap-3">
            <BookOpen className="h-8 w-8" />
            📱 애플리케이션 개요
          </h2>
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="pt-6">
              <p className="text-base sm:text-lg text-emerald-700">
                <strong>BID</strong>는 교육용 실시간 경매 플랫폼으로, 참가자들이 가상의 자본금으로 경매에 참여할 수 있는 웹 애플리케이션입니다. 
                실제 경제 활동의 핵심 요소들을 체험할 수 있도록 설계되었으며, 다양한 연령대와 상황에서 활용할 수 있습니다.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* 주요 기능 */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold text-emerald-800 mb-6 flex items-center gap-3">
            <Settings className="h-8 w-8" />
            🎮 주요 기능
          </h2>
          
          {/* 1. 경매 생성 및 관리 */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-emerald-700 mb-4">1. 경매 생성 및 관리</h3>
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardContent className="pt-6">
                <ul className="text-sm sm:text-base space-y-2 text-emerald-700">
                  <li>• <strong>경매 이름 설정</strong>: 사용자 정의 경매 이름 또는 기본값 "다시마 경매"</li>
                  <li>• <strong>경매 방식 선택</strong>: 고정입찰 (Fixed Bidding) / 변동입찰 (Dynamic Bidding)</li>
                  <li>• <strong>초기 자본금 설정</strong>: 참가자들의 시작 자본금 조정 가능</li>
                  <li>• <strong>QR 코드 생성</strong>: 참가자 초대를 위한 QR 코드 자동 생성</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* 2. 참가자 관리 */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-emerald-700 mb-4">2. 참가자 관리</h3>
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="pt-6">
                <ul className="text-sm sm:text-base space-y-2 text-blue-700">
                  <li>• <strong>실시간 참가자 목록</strong>: 최대 6명까지 참가 가능</li>
                  <li>• <strong>자본금 관리</strong>: 개별 참가자 자본금 수정 / 전체 참가자 자본금 일괄 수정</li>
                  <li>• <strong>입찰 상태 표시</strong>: 실시간 입찰 상태 모니터링</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* 3. 경매 진행 시스템 */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-emerald-700 mb-4">3. 경매 진행 시스템</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-emerald-200 bg-emerald-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-800">
                    <Shield className="h-6 w-6" />
                    🔒 고정입찰 (Fixed Bidding)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1 text-emerald-700">
                    <li>• <strong>일회성 입찰</strong>: 라운드당 1회만 입찰 가능</li>
                    <li>• <strong>입찰 금액 숨김</strong>: 라운드 진행 중 입찰 금액 비공개, 순위만 표시</li>
                    <li>• <strong>라운드 종료 후 공개</strong>: 모든 입찰 금액과 결과 공개</li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Zap className="h-6 w-6" />
                    ⚡ 변동입찰 (Dynamic Bidding)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1 text-blue-700">
                    <li>• <strong>재입찰 가능</strong>: 실시간으로 더 높은 금액 재입찰 가능</li>
                    <li>• <strong>실시간 최고 입찰자 표시</strong>: 현재 최고 입찰자와 금액 실시간 업데이트</li>
                    <li>• <strong>자동 입찰 취소</strong>: 새로운 입찰 시 이전 입찰 자동 취소 및 자본 환원</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 4. 경매 물품 관리 */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-emerald-700 mb-4">4. 경매 물품 관리</h3>
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="pt-6">
                <ul className="text-sm sm:text-base space-y-2 text-amber-700">
                  <li>• <strong>물품 등록</strong>: 참가자가 사이드바를 통해 경매 물품 등록</li>
                  <li>• <strong>물품 선택</strong>: 호스트가 등록된 물품 중 라운드용 물품 선택</li>
                  <li>• <strong>물품 정보 표시</strong>: 물품명, 설명, 등록자 정보 표시</li>
                  <li>• <strong>등록자 닉네임 표시</strong>: 물품 등록자의 닉네임 명확히 표시</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* 5. 낙찰 및 금액 분배 */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-emerald-700 mb-4">5. 낙찰 및 금액 분배</h3>
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="pt-6">
                <ul className="text-sm sm:text-base space-y-2 text-green-700">
                  <li>• <strong>낙찰자 결정</strong>: 라운드 종료 시 최고 입찰자 자동 선정</li>
                  <li>• <strong>낙찰 금액 전달</strong>: 물품 등록자에게 낙찰 금액 전달 기능</li>
                  <li>• <strong>수동 분배 시스템</strong>: 호스트가 직접 낙찰 금액 전달 버튼 클릭</li>
                  <li>• <strong>자본금 업데이트</strong>: 전달 후 물품 등록자 자본금 자동 증가</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* 6. 라운드 관리 */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-emerald-700 mb-4">6. 라운드 관리</h3>
            <Card className="border-purple-200 bg-purple-50/50">
              <CardContent className="pt-6">
                <ul className="text-sm sm:text-base space-y-2 text-purple-700">
                  <li>• <strong>라운드 시작/종료</strong>: 호스트가 라운드 진행 상황 제어</li>
                  <li>• <strong>상태 표시</strong>: WAITING (대기) / ACTIVE (진행) / ENDED (종료)</li>
                  <li>• <strong>라운드별 물품 등록</strong>: 각 라운드마다 새로운 물품 등록 가능</li>
                  <li>• <strong>자동 초기화</strong>: 라운드 종료 후 다음 라운드 준비</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 사용자 인터페이스 */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold text-emerald-800 mb-6 flex items-center gap-3">
            <Settings className="h-8 w-8" />
            🎨 사용자 인터페이스
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-indigo-200 bg-indigo-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-800">
                  <Users className="h-6 w-6" />
                  🏠 호스트 페이지
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-indigo-700">
                  <li>• <strong>경매 제어 섹션</strong>: 라운드 시작/종료, 물품 등록 관리</li>
                  <li>• <strong>참가자 목록</strong>: 실시간 참가자 상태 및 자본금 표시</li>
                  <li>• <strong>입찰 현황</strong>: 실시간 입찰 순위 및 결과 표시</li>
                  <li>• <strong>낙찰 결과</strong>: 낙찰자 정보 및 금액 전달 버튼</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-pink-200 bg-pink-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-pink-800">
                  <Target className="h-6 w-6" />
                  👤 참가자 페이지
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-pink-700">
                  <li>• <strong>입찰 인터페이스</strong>: 직관적인 입찰 금액 입력</li>
                  <li>• <strong>자본금 표시</strong>: 현재 보유 자본금 실시간 표시</li>
                  <li>• <strong>입찰 상태</strong>: 입찰 가능 여부 및 상태 안내</li>
                  <li>• <strong>물품 등록</strong>: 사이드바를 통한 경매 물품 등록</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 기술적 특징 */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold text-emerald-800 mb-6 flex items-center gap-3">
            <Settings className="h-8 w-8" />
            🔧 기술적 특징
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-cyan-200 bg-cyan-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyan-800">
                  <Clock className="h-6 w-6" />
                  실시간 통신
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-cyan-700">
                  <li>• 폴링 시스템 (2초 간격)</li>
                  <li>• 상태 동기화</li>
                  <li>• 오류 처리</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <Package className="h-6 w-6" />
                  데이터 관리
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-orange-700">
                  <li>• localStorage 활용</li>
                  <li>• React hooks</li>
                  <li>• TypeScript</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <Shield className="h-6 w-6" />
                  보안 및 안정성
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-red-700">
                  <li>• 입력 검증</li>
                  <li>• 오류 경계</li>
                  <li>• 상태 복구</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 교육적 가치 */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold text-emerald-800 mb-6 flex items-center gap-3">
            <BookOpen className="h-8 w-8" />
            🎯 교육적 가치
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-teal-200 bg-teal-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-teal-800">
                  <TrendingUp className="h-6 w-6" />
                  경제 개념 학습
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-teal-700">
                  <li>• <strong>경매 메커니즘</strong>: 공정한 경매 과정을 통한 가격 발견 학습</li>
                  <li>• <strong>자본 관리</strong>: 제한된 자본으로 최적의 입찰 전략 수립</li>
                  <li>• <strong>경쟁 심리</strong>: 다른 참가자와의 경쟁을 통한 의사결정 능력 향상</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-violet-200 bg-violet-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-violet-800">
                  <Users className="h-6 w-6" />
                  협업 및 소통
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-violet-700">
                  <li>• <strong>팀워크</strong>: 호스트와 참가자 간의 협력적 경매 진행</li>
                  <li>• <strong>의사소통</strong>: 물품 등록 및 경매 진행을 통한 소통 능력 향상</li>
                  <li>• <strong>책임감</strong>: 자신의 입찰에 대한 책임감과 신중한 의사결정</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 사용 시나리오 */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold text-emerald-800 mb-6 flex items-center gap-3">
            <Play className="h-8 w-8" />
            🚀 사용 시나리오
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-lime-200 bg-lime-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lime-800">
                  <BookOpen className="h-6 w-6" />
                  1. 교육 현장
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-lime-700">
                  <li>• 경제 수업: 시장 메커니즘 실습</li>
                  <li>• 경영 수업: 경매 전략 및 의사결정 학습</li>
                  <li>• 수학 수업: 확률과 통계 개념 적용</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <Users className="h-6 w-6" />
                  2. 기업 교육
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-yellow-700">
                  <li>• 신입사원 교육: 협상 스킬 및 의사결정 능력 향상</li>
                  <li>• 팀 빌딩: 팀원 간 경쟁과 협력을 통한 유대감 형성</li>
                  <li>• 리더십 교육: 호스트 역할을 통한 리더십 경험</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-rose-200 bg-rose-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-rose-800">
                  <Target className="h-6 w-6" />
                  3. 가족/친구 모임
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-rose-700">
                  <li>• 재미있는 게임: 가상 자본으로 하는 재미있는 경매 게임</li>
                  <li>• 전략 게임: 심리전과 전략을 통한 흥미로운 대결</li>
                  <li>• 소통 도구: 새로운 형태의 소통과 상호작용 경험</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 마무리 */}
        <section>
          <Card className="border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50">
            <CardContent className="pt-6 text-center">
              <p className="text-base sm:text-lg text-emerald-700 font-medium">
                이 웹앱은 교육과 재미를 동시에 제공하는 혁신적인 경매 시뮬레이션 플랫폼입니다. 
                실제 경제 활동의 핵심 요소들을 체험할 수 있도록 설계되었으며, 
                다양한 연령대와 상황에서 활용할 수 있습니다.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}