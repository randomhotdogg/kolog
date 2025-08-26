"use client"
import { BadgeCheck, Play, BarChart3, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { AuthModal } from "@/components/auth-modal"

export default function NavigationMenu({ className }: { className?: string }) {
  const pathname = usePathname()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { user, logout, isAuthenticated } = useAuth()

  
  return (
    <div className={cn("w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60", className)}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BadgeCheck className="h-6 w-6 text-emerald-600" />
            <span className="font-bold text-lg text-gray-900">KOLOG</span>
          </Link>
          
          <div className="flex items-center gap-1 md:gap-2">
            {/* 只有登入用戶才能看到功能按鈕 */}
            {isAuthenticated && (
              <>
                <Button
                  variant={pathname === "/youtube-analysis" ? "default" : "ghost"}
                  size="sm"
                  asChild
                  className={pathname === "/youtube-analysis" ? "bg-red-600 hover:bg-red-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"}
                >
                  <Link 
                    href="/youtube-analysis" 
                    className="flex items-center gap-1 md:gap-2"
                  >
                    <Play className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="text-xs md:text-sm hidden sm:inline">YouTube 分析</span>
                  </Link>
                </Button>
                
                <Button
                  variant={pathname === "/dashboard" ? "default" : "ghost"}
                  size="sm"
                  asChild
                  className={pathname === "/dashboard" ? "bg-emerald-600 hover:bg-emerald-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"}
                >
                  <Link 
                    href="/dashboard" 
                    className="flex items-center gap-1 md:gap-2"
                  >
                    <BarChart3 className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="text-xs md:text-sm hidden sm:inline">投資追蹤</span>
                  </Link>
                </Button>
              </>
            )}

            {/* 認證相關按鈕 */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar_url} alt={user?.full_name || user?.email} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-600">
                        {user?.full_name ? user.full_name[0] : user?.email[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem disabled>
                    <User className="mr-2 h-4 w-4" />
                    {user?.full_name || user?.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    登出
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowAuthModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <span className="text-xs md:text-sm">登入</span>
              </Button>
            )}
            
          </div>
          
          {/* 認證彈窗 */}
          <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
        </div>
      </div>
    </div>
  )
}