import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"
import { Header } from "@/components/header"
import { AuctionItemProvider } from "@/contexts/auction-item-context"
import ErrorBoundary from "@/components/error-boundary"
import "./globals.css"

export const metadata: Metadata = {
  title: "BID - 실시간 경매 시뮬레이션",
  description: "가치를 이야기하다. 모던하고 직관적인 교육용 실시간 경매 플랫폼",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <div className="min-h-screen bg-stone-100 relative overflow-hidden">
          {/* Subtle pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(139,126,102,0.08)_1px,transparent_0)] bg-[length:24px_24px] opacity-50"></div>
          
          <Header />
          <div className="relative z-10 pt-14 sm:pt-16">
            <ErrorBoundary>
              <AuctionItemProvider>
                <Suspense fallback={
                  <div className="flex items-center justify-center h-64">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-10 w-10 border-3 border-emerald-200"></div>
                      <div className="animate-spin rounded-full h-10 w-10 border-3 border-emerald-500 border-t-transparent absolute top-0 left-0"></div>
                    </div>
                  </div>
                }>
                  {children}
                </Suspense>
              </AuctionItemProvider>
            </ErrorBoundary>
          </div>
        </div>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
