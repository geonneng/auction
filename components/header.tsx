"use client"

import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { useRouter } from "next/navigation"
import { HelpCircle, Plus, Play } from "lucide-react"

export function Header() {
  const router = useRouter()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-20 items-center justify-between px-6">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">가</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              가치오름
            </h1>
          </div>
        </div>
        
        <NavigationMenu>
          <NavigationMenuList className="space-x-2">
            <NavigationMenuItem>
              <Button 
                variant="ghost" 
                className="flex items-center space-x-3 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-blue-50 hover:text-emerald-600 transition-all duration-300 rounded-xl px-6 py-3 h-12 border border-transparent hover:border-emerald-200"
                onClick={() => router.push('/')}
              >
                <Plus className="h-5 w-5" />
                <span className="font-medium text-lg">경매 생성</span>
              </Button>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Button 
                variant="ghost" 
                className="flex items-center space-x-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 transition-all duration-300 rounded-xl px-6 py-3 h-12 border border-transparent hover:border-blue-200"
              >
                <Play className="h-5 w-5" />
                <span className="font-medium text-lg">경매 진행</span>
              </Button>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Button 
                variant="ghost" 
                className="flex items-center space-x-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-600 transition-all duration-300 rounded-xl px-6 py-3 h-12 border border-transparent hover:border-purple-200"
                onClick={() => router.push('/help')}
              >
                <HelpCircle className="h-5 w-5" />
                <span className="font-medium text-lg">도움말</span>
              </Button>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  )
}
