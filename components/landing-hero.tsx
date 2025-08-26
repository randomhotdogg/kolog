"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TrendingUp, Video, BadgeCheck, Search, Play } from "lucide-react"

export function LandingHero() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center min-h-screen py-20">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Brand */}
            {/* <div className="flex items-center space-x-3">
            <BadgeCheck className="h-6 w-6 text-emerald-600" />
            <span className="font-bold text-lg text-gray-900">KOLOG</span>
            </div> */}

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                <span className="text-gray-900 block">AI 股票分析</span>
                <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent block">
                  從這裡開始
                </span>
              </h1>
            </div>

            {/* Description */}
            <p className="text-lg text-gray-600 leading-relaxed max-w-md">
              輸入 YouTube 股票討論影片，獲取 AI 分析報告。<br/>讓投資不再盲目！
            </p>

            {/* CTA Button */}
            <div className="pt-4">
              <Link href="/youtube-analysis">
                <Button 
                  size="lg" 
                  className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-8 py-6 text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  開始你的第一次分析
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-96 h-96 lg:w-[480px] lg:h-[480px]">
              {/* Main Circle Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-emerald-400 to-green-500 rounded-full shadow-2xl"></div>
              
              {/* 3D Elements */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Phone Mockup */}
                <div className="relative z-10 bg-white rounded-3xl p-2 shadow-xl transform rotate-12 hover:rotate-6 transition-transform duration-500">
                  <div className="w-48 h-80 bg-gradient-to-br from-green-100 to-emerald-200 rounded-2xl p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-4 h-4 bg-gray-800 rounded-full"></div>
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                      </div>
                      <div className="w-4 h-4 bg-gray-800 rounded-full"></div>
                    </div>
                    
                    {/* App UI */}
                    <div className="bg-white rounded-xl p-3 mb-3 shadow-sm">
                      <div className="flex items-center space-x-2 mb-2">
                        <Video className="w-4 h-4 text-red-500" />
                        <div className="text-xs font-bold text-gray-900">股票分析</div>
                      </div>
                      <div className="w-full h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mb-2 flex items-center justify-center">
                        <Play className="w-6 h-6 text-white" />
                      </div>
                      <div className="space-y-1">
                        <div className="h-2 bg-gray-200 rounded-full"></div>
                        <div className="h-2 bg-gray-200 rounded-full w-3/4"></div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        <div className="text-xs font-bold text-gray-900">AI 分析結果</div>
                      </div>
                      <div className="space-y-1">
                        <div className="h-1.5 bg-emerald-200 rounded-full"></div>
                        <div className="h-1.5 bg-emerald-200 rounded-full w-4/5"></div>
                        <div className="h-1.5 bg-emerald-200 rounded-full w-2/3"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute top-40 left-10 bg-white rounded-2xl p-4 shadow-xl transform -rotate-12 hover:rotate-0 transition-transform duration-500">
                  <Search className="w-8 h-8 text-green-500" />
                </div>

                <div className="absolute bottom-40 right-10 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl p-4 shadow-xl transform rotate-12 hover:rotate-6 transition-transform duration-500">
                  <BadgeCheck className="w-8 h-8" />
                </div>
              </div>

              {/* Decorative rings */}
              <div className="absolute inset-0 border-2 border-green-300/30 rounded-full animate-pulse"></div>
              <div className="absolute inset-8 border border-emerald-300/20 rounded-full animate-pulse delay-1000"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}