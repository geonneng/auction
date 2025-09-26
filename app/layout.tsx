import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import "./globals.css"

export const metadata: Metadata = {
  title: "다시마 경매 - 실시간 경매 시뮬레이션",
  description: "교육용 실시간 경매 웹 애플리케이션",
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
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.15)_1px,transparent_0)] bg-[length:24px_24px] opacity-30"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10"></div>
          
          <Header />
          <div className="flex relative z-10">
            <Sidebar />
            <main className="flex-1 p-6">
              <Suspense fallback={
                <div className="flex items-center justify-center h-64">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/20"></div>
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent absolute top-0 left-0"></div>
                  </div>
                </div>
              }>
                {children}
              </Suspense>
            </main>
          </div>
        </div>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
