"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"
import { TrackingSidebar } from "@/components/tracking-sidebar"
import { TrackingPerformanceDisplay } from "@/components/tracking-performance"
import NavigationMenu from "@/components/navigation-menu"
import { ProtectedRoute } from "@/components/protected-route"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import { YouTubeAnalysisCard } from "@/components/youtube-analysis-card"
import {
  getTrackedStocks,
  addTrackedStock,
  removeTrackedStock,
  type TrackedStock,
  type TrackingPerformance,
} from "@/lib/tracking-storage"

export default function DashboardPage() {
  const [trackedStocks, setTrackedStocks] = useState<TrackedStock[]>([])
  const [selectedTrackedStock, setSelectedTrackedStock] = useState<string | null>(null)
  const [trackingPerformance, setTrackingPerformance] = useState<TrackingPerformance | null>(null)
  const [allStockPerformances, setAllStockPerformances] = useState<Record<string, { currentPrice: number; percentChange: number; priceChange: number }>>({})

  useEffect(() => {
    const stocks = getTrackedStocks()
    setTrackedStocks(stocks)
    // 為所有追蹤股票獲取即時價格
    if (stocks.length > 0) {
      fetchAllStockPrices(stocks)
    }
  }, [])

  // 獲取所有追蹤股票的即時價格
  const fetchAllStockPrices = async (stocks: TrackedStock[]) => {
    const performances: Record<string, { currentPrice: number; percentChange: number; priceChange: number }> = {}
    
    for (const stock of stocks) {
      try {
        const response = await fetch(`/api/stock?symbol=${encodeURIComponent(stock.symbol)}`)
        const data = await response.json()
        
        if (response.ok && data.currentPrice) {
          const priceChange = data.currentPrice - stock.startPrice
          const percentChange = (priceChange / stock.startPrice) * 100
          
          performances[stock.symbol] = {
            currentPrice: data.currentPrice,
            percentChange: percentChange,
            priceChange: priceChange
          }
        }
      } catch (error) {
        console.error(`Error fetching price for ${stock.symbol}:`, error)
      }
    }
    
    setAllStockPerformances(performances)
  }

  const handleRemoveFromTracking = (symbol: string) => {
    removeTrackedStock(symbol)
    const updatedStocks = getTrackedStocks()
    setTrackedStocks(updatedStocks)
    // 重新獲取所有股票價格
    fetchAllStockPrices(updatedStocks)
    // 從 allStockPerformances 中移除該股票
    const newPerformances = { ...allStockPerformances }
    delete newPerformances[symbol]
    setAllStockPerformances(newPerformances)
    if (selectedTrackedStock === symbol) {
      setSelectedTrackedStock(null)
      setTrackingPerformance(null)
    }
  }

  const handleSelectTrackedStock = async (symbol: string) => {
    setSelectedTrackedStock(symbol)
    const trackedStock = trackedStocks.find((stock) => stock.symbol === symbol)

    if (trackedStock) {
      try {
        // 獲取追蹤開始前7天到現在的數據
        const trackingStartTime = trackedStock.startTrackingDate.getTime()
        const sevenDaysBeforeStart = trackingStartTime - (7 * 24 * 60 * 60 * 1000) // 前7天
        const startTimestamp = Math.floor(sevenDaysBeforeStart / 1000)
        const endTimestamp = Math.floor(new Date().getTime() / 1000)
        const url = `/api/stock?symbol=${encodeURIComponent(symbol)}&startDate=${startTimestamp}&endDate=${endTimestamp}`

        const response = await fetch(url)
        const data = await response.json()

        if (!response.ok) {
          throw new Error("無法獲取追蹤股票數據")
        }

        // 只計算追蹤表現，不影響查詢區塊的狀態
        if (data.data && data.data.length > 0) {
          const trackingStartTimestamp = Math.floor(trackedStock.startTrackingDate.getTime() / 1000)
          const filteredData = data.data.filter((item: { timestamp: number }) => item.timestamp >= trackingStartTimestamp)

          if (filteredData.length > 0) {
            const currentPrice = data.currentPrice
            const priceChange = currentPrice - trackedStock.startPrice
            const percentChange = (priceChange / trackedStock.startPrice) * 100
            const trackingDays = Math.ceil(
              (new Date().getTime() - trackedStock.startTrackingDate.getTime()) / (1000 * 60 * 60 * 24),
            )

            setTrackingPerformance({
              symbol: symbol,
              currentPrice: currentPrice,
              startPrice: trackedStock.startPrice,
              priceChange: priceChange,
              percentChange: percentChange,
              trackingDays: trackingDays,
              data: filteredData, // 追蹤期間的數據
              allData: data.data, // 包含前7天的完整數據
              trackingStartTimestamp: trackingStartTimestamp, // 追蹤開始時間戳
            })
          }
        }
      } catch (error) {
        console.error("無法獲取追蹤股票數據:", error)
        setTrackingPerformance(null)
      }
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        <NavigationMenu className="sticky top-0 z-50" />

      <div className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {/* 追蹤頁面 */}
          <section id="tracking-section" className="px-2">
            {/* 擴展寬度容器 */}
            <div className="max-w-none mx-auto">
                
                {/* Resizable 面板佈局 */}
                <ResizablePanelGroup
                  direction="horizontal" 
                  className="h-[650px] max-h-[650px] rounded-lg border"
                >
                  {/* 左側追蹤清單面板 */}
                  <ResizablePanel defaultSize={22} minSize={18} maxSize={35}>
                    <div className="h-full p-4">
                      <TrackingSidebar
                        trackedStocks={trackedStocks}
                        selectedStock={selectedTrackedStock}
                        onSelectStock={handleSelectTrackedStock}
                        onRemoveStock={handleRemoveFromTracking}
                        onAddStock={(stock) => {
                          addTrackedStock(stock)
                          const updatedStocks = getTrackedStocks()
                          setTrackedStocks(updatedStocks)
                          fetchAllStockPrices(updatedStocks)
                        }}
                        stockPerformances={allStockPerformances}
                      />
                    </div>
                  </ResizablePanel>

                  <ResizableHandle withHandle />

                  {/* 中間圖表面板 */}
                  <ResizablePanel 
                    defaultSize={selectedTrackedStock && trackedStocks.find(stock => stock.symbol === selectedTrackedStock)?.youtubeAnalysis ? 53 : 78}
                    minSize={35} 
                    maxSize={82}
                  >
                    <div className="h-full p-4">
                      {trackingPerformance ? (
                        <TrackingPerformanceDisplay
                          performance={trackingPerformance}
                          onNameUpdate={() => {
                            setTrackedStocks(getTrackedStocks())
                          }}
                        />
                      ) : (
                        <Card className="h-full border-0 shadow-xl bg-white/95 backdrop-blur-sm rounded-xl">
                          <CardContent className="flex flex-col items-center justify-center h-full py-20">
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-8">
                              <BarChart3 className="h-10 w-10 text-emerald-600" />
                            </div>
                            <p className="text-gray-700 text-center max-w-md text-lg font-medium mb-2">
                              請從左側的追蹤清單中選擇
                            </p>
                            {trackedStocks.length === 0 && (
                              <p className="text-gray-500 mt-6 text-center max-w-sm">
                                還沒有追蹤任何股票？可以在追蹤清單中直接新增追蹤！
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </ResizablePanel>

                  {/* 右側 YouTube 分析面板 - 只在有分析時顯示 */}
                  {selectedTrackedStock && (() => {
                    const currentStock = trackedStocks.find(stock => stock.symbol === selectedTrackedStock)
                    return currentStock?.youtubeAnalysis && (
                      <>
                        <ResizableHandle withHandle />
                        <ResizablePanel defaultSize={25} minSize={18} maxSize={40}>
                          <div className="h-full p-4">
                            <YouTubeAnalysisCard
                              analysis={currentStock.youtubeAnalysis}
                              className="h-full border-0 shadow-xl bg-white/95 backdrop-blur-sm rounded-xl"
                            />
                          </div>
                        </ResizablePanel>
                      </>
                    )
                  })()}
                </ResizablePanelGroup>
            </div>
          </section>
        </div>
      </div>
      </div>
    </ProtectedRoute>
  )
}