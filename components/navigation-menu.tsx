"use client"
import { BadgeCheck, BookOpen, Youtube, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function NavigationMenu({ className }: { className?: string }) {
  const pathname = usePathname()
  
  return (
    <div className={cn("w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60", className)}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BadgeCheck className="h-6 w-6 text-emerald-600" />
            <span className="font-bold text-lg text-gray-900">KOLOG</span>
          </Link>
          
          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant={pathname === "/" ? "default" : "ghost"}
              size="sm"
              asChild
              className={pathname === "/" ? "bg-red-600 hover:bg-red-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"}
            >
              <Link href="/" className="flex items-center gap-1 md:gap-2">
                <Youtube className="h-3 w-3 md:h-4 md:w-4" />
                <span className="text-xs md:text-sm hidden sm:inline">YouTube分析</span>
              </Link>
            </Button>
            
            <Button
              variant={pathname === "/dashboard" ? "default" : "ghost"}
              size="sm"
              asChild
              className={pathname === "/dashboard" ? "bg-emerald-600 hover:bg-emerald-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"}
            >
              <Link href="/dashboard" className="flex items-center gap-1 md:gap-2">
                <BarChart3 className="h-3 w-3 md:h-4 md:w-4" />
                <span className="text-xs md:text-sm hidden sm:inline">投資追蹤</span>
              </Link>
            </Button>
            
          </div>
        </div>
      </div>
    </div>
  )
}