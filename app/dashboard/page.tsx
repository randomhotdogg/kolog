"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"
import { TrackingSidebar } from "@/components/tracking-sidebar"
import { TrackingPerformanceDisplay } from "@/components/tracking-performance"
import NavigationMenu from "@/components/navigation-menu"
import { ProtectedRoute } from "@/components/protected-route"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white">
        <NavigationMenu className="sticky top-0 z-50" />

      <div className="px-4 py-8">
        <div className="max-w-screen-2xl mx-auto">
          {/* 追蹤頁面 */}
          <section id="tracking-section" className="-mx-4 px-2">
            {/* 擴展寬度容器 */}
            <div className="max-w-none mx-auto">
                <div className="text-center mb-6 md:mb-8">
                  <h4 className="text-xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-3">
                    投資追蹤
                    <span className="block text-sm md:text-lg font-normal text-gray-600 mt-1 md:mt-2">
                      管理您的股票投資組合，追蹤績效表現
                    </span>
                  </h4>
                </div>
                
                {/* 左右分欄佈局 */}
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-[600px]">
                {/* 左側追蹤清單 */}
                <div className="w-full lg:w-72 flex-shrink-0 lg:max-h-[calc(100vh-200px)]">
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

                {/* 右側詳細資訊 */}
                <div className="flex-1 min-w-0">
                  {trackingPerformance ? (
                    <TrackingPerformanceDisplay
                      performance={trackingPerformance}
                      onNameUpdate={() => {
                        setTrackedStocks(getTrackedStocks())
                      }}
                    />
                  ) : (
                    <Card className="h-[calc(100vh-280px)] border-0 shadow-xl bg-white/60 backdrop-blur-sm">
                      <CardContent className="flex flex-col items-center justify-center h-full py-16">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                          <BarChart3 className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600 text-center max-w-md">
                          請從左側的追蹤清單中選擇
                        </p>
                        {trackedStocks.length === 0 && (
                          <p className="text-sm text-gray-500 mt-4">
                            還沒有追蹤任何股票？可以在追蹤清單中直接新增追蹤！
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      </div>
    </ProtectedRoute>
  )
}