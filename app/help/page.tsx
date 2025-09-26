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
  Globe
} from "lucide-react"

export default function HelpPage() {
  const features = [
    {
      icon: <Gavel className="h-6 w-6" />,
      title: "실시간 경매",
      description: "실시간으로 진행되는 경매 시스템으로 경제 원리를 체험할 수 있습니다.",
      details: [
        "실시간 가격 변동 확인",
        "즉시 입찰 결과 반영",
        "경매 진행 상황 모니터링"
      ]
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "다중 참가자",
      description: "여러 명이 동시에 참여하여 경쟁적인 경매 환경을 조성합니다.",
      details: [
        "동시 접속 지원",
        "참가자별 입찰 내역 추적",
        "실시간 참가자 수 표시"
      ]
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "타이머 기능",
      description: "경매 시간을 정확히 관리하여 공정한 경매를 진행합니다.",
      details: [
        "커스터마이징 가능한 타이머",
        "경매 종료 알림",
        "시간 경과 시각화"
      ]
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "가격 추적",
      description: "실시간 가격 변동을 확인하고 경매 동향을 파악할 수 있습니다.",
      details: [
        "실시간 가격 차트",
        "최고가 추적",
        "입찰 히스토리"
      ]
    }
  ]

  const auctionTypes = [
    {
      title: "변동입찰",
      description: "경매가 진행되면서 가격이 실시간으로 변동하는 방식",
      features: [
        "실시간 가격 변동",
        "동적 입찰 시스템",
        "경쟁적 경매 환경"
      ],
      icon: <Zap className="h-5 w-5" />
    },
    {
      title: "고정입찰",
      description: "사전에 정해진 가격으로 입찰하는 방식",
      features: [
        "명확한 가격 설정",
        "계획적 입찰 전략",
        "안정적인 경매 진행"
      ],
      icon: <Shield className="h-5 w-5" />
    }
  ]

  const steps = [
    {
      number: 1,
      title: "경매 생성",
      description: "경매 이름, 방법, 초기 자본금을 설정하여 새로운 경매를 생성합니다.",
      details: [
        "경매 이름 설정",
        "경매 방법 선택 (변동입찰/고정입찰)",
        "초기 자본금 설정"
      ]
    },
    {
      number: 2,
      title: "참가자 초대",
      description: "생성된 경매 코드를 참가자들에게 공유하여 경매에 참여할 수 있도록 합니다.",
      details: [
        "경매 코드 생성",
        "QR 코드 또는 링크 공유",
        "참가자 접속 확인"
      ]
    },
    {
      number: 3,
      title: "경매 진행",
      description: "실시간으로 경매를 진행하고 결과를 확인합니다.",
      details: [
        "타이머 설정 및 시작",
        "실시간 입찰 진행",
        "경매 결과 확인"
      ]
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center space-x-3 mb-6">
          <BookOpen className="h-10 w-10 text-emerald-500" />
          <h1 className="text-6xl font-bold bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            도움말
          </h1>
          <BookOpen className="h-10 w-10 text-blue-500" />
        </div>
        <p className="text-2xl text-muted-foreground max-w-3xl mx-auto">
          가치오름 플랫폼 사용법과 주요 기능을 자세히 알아보세요
        </p>
        <Badge variant="secondary" className="text-base px-4 py-2">
          <Lightbulb className="h-4 w-4 mr-2" />
          사용 가이드
        </Badge>
      </div>

      {/* 주요 기능 */}
      <section>
        <h2 className="text-3xl font-bold mb-8 flex items-center space-x-3">
          <Settings className="h-8 w-8" />
          <span>주요 기능</span>
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="text-primary">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </div>
                <CardDescription className="text-lg">{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feature.details.map((detail, idx) => (
                    <li key={idx} className="flex items-center space-x-3 text-base">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 경매 방법 */}
      <section>
        <h2 className="text-3xl font-bold mb-8 flex items-center space-x-3">
          <Gavel className="h-8 w-8" />
          <span>경매 방법</span>
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {auctionTypes.map((type, index) => (
            <Card key={index} className="border-2 hover:border-primary/40 transition-colors">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="text-primary">
                    {type.icon}
                  </div>
                  <CardTitle className="text-xl">{type.title}</CardTitle>
                </div>
                <CardDescription className="text-base">{type.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <h4 className="font-semibold text-base text-muted-foreground">특징</h4>
                  <ul className="space-y-2">
                    {type.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center space-x-3 text-base">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 사용 방법 */}
      <section>
        <h2 className="text-3xl font-bold mb-8 flex items-center space-x-3">
          <Target className="h-8 w-8" />
          <span>사용 방법</span>
        </h2>
        <div className="space-y-6">
          {steps.map((step, index) => (
            <Card key={index} className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
                    <p className="text-lg text-muted-foreground mb-4">{step.description}</p>
                    <ul className="space-y-1">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-center space-x-3 text-base">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 추가 정보 */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3 text-2xl">
            <Globe className="h-6 w-6" />
            <span>추가 정보</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6 text-base">
            <div>
              <h4 className="font-semibold mb-3 text-lg">지원 브라우저</h4>
              <p className="text-muted-foreground text-lg">Chrome, Firefox, Safari, Edge 최신 버전</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">권장 환경</h4>
              <p className="text-muted-foreground">안정적인 인터넷 연결 권장</p>
            </div>
          </div>
          <Separator />
          <p className="text-sm text-muted-foreground text-center">
            더 자세한 문의사항이 있으시면 관리자에게 연락해주세요.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
