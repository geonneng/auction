"use client"

import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { useRouter } from "next/navigation"
import { HelpCircle, Plus, Play, Gavel } from "lucide-react"

export function Header() {
  const router = useRouter()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-emerald-100 bg-stone-100/95 backdrop-blur-xl supports-[backdrop-filter]:bg-stone-100/80 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-8">
        {/* Clean Logo */}
        <div 
          className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity duration-200"
          onClick={() => router.push('/')}
        >
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-md">
            <Gavel className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-emerald-800 tracking-tight">
              가담
            </h1>
            <div className="w-full h-0.5 bg-emerald-500 rounded-full"></div>
          </div>
        </div>
        
        {/* Clean Navigation */}
        <NavigationMenu>
          <NavigationMenuList className="space-x-1">
            <NavigationMenuItem>
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center space-x-2 hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 rounded-lg px-4 py-2 h-10 border border-transparent hover:border-emerald-200"
                onClick={() => router.push('/')}
              >
                <Plus className="h-4 w-4" />
                <span>경매 생성</span>
              </Button>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center space-x-2 hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 rounded-lg px-4 py-2 h-10 border border-transparent hover:border-emerald-200"
              >
                <Play className="h-4 w-4" />
                <span>경매 진행</span>
              </Button>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center space-x-2 hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 rounded-lg px-4 py-2 h-10 border border-transparent hover:border-emerald-200"
                onClick={() => router.push('/help')}
              >
                <HelpCircle className="h-4 w-4" />
                <span>도움말</span>
              </Button>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  )
}
