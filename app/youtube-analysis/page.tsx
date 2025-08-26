"use client"

import NavigationMenu from "@/components/navigation-menu"
import { YouTubeAnalyzer } from "@/components/youtube-analyzer"
import { ProtectedRoute } from "@/components/protected-route"


export default function YouTubePage() {

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white">
        <NavigationMenu className="sticky top-0 z-50" />

        <div className="px-4 py-8">
          <div className="max-w-screen-2xl mx-auto">
            <section id="youtube-section">
              <div>
                <div className="text-center mb-4">
                  <h4 className="text-xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-3">
                    YouTube 股票分析
                    <span className="block text-sm md:text-lg font-normal text-gray-600 mt-1 md:mt-2">
                      輸入 YouTube 股票討論影片，獲取 AI 分析
                    </span>
                  </h4>
                </div>
                
                <YouTubeAnalyzer />
              </div>
            </section>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}