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
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">다</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              다시마 경매
            </h1>
          </div>
        </div>
        
        <NavigationMenu>
          <NavigationMenuList className="space-x-2">
            <NavigationMenuItem>
              <Button 
                variant="ghost" 
                className="flex items-center space-x-3 hover:bg-primary/10 hover:text-primary transition-all duration-200 rounded-lg px-6 py-3 h-12"
                onClick={() => router.push('/')}
              >
                <Plus className="h-5 w-5" />
                <span className="font-medium text-lg">경매 생성</span>
              </Button>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Button 
                variant="ghost" 
                className="flex items-center space-x-3 hover:bg-primary/10 hover:text-primary transition-all duration-200 rounded-lg px-6 py-3 h-12"
              >
                <Play className="h-5 w-5" />
                <span className="font-medium text-lg">경매 진행</span>
              </Button>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Button 
                variant="ghost" 
                className="flex items-center space-x-3 hover:bg-primary/10 hover:text-primary transition-all duration-200 rounded-lg px-6 py-3 h-12"
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
