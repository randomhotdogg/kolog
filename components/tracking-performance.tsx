"use client"

import type React from "react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit2, Check, X } from "lucide-react"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis } from "recharts"
import { useState } from "react"
import { updateTrackedStockName, getTrackedStock } from "@/lib/tracking-storage"
import type { TrackingPerformance } from "@/lib/tracking-storage"

interface TrackingPerformanceProps {
  performance: TrackingPerformance
  onNameUpdate?: () => void // 回調函數，用於通知名稱更新
}

export function TrackingPerformanceDisplay({ performance, onNameUpdate }: TrackingPerformanceProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingName, setEditingName] = useState("")

  const trackedStock = getTrackedStock(performance.symbol)
  const displayName = trackedStock?.customName || performance.symbol

  const isPositive = performance.priceChange >= 0
  
  // 動態佈局策略
  
  // 使用完整數據（包含前7天）來生成圖表數據
  const allDataForChart = performance.allData || performance.data
  const trackingStartTimestamp = performance.trackingStartTimestamp || performance.data[0]?.timestamp || 0
  
  const chartData = allDataForChart.map((item) => {
    const isTrackingPoint = item.timestamp >= trackingStartTimestamp
    const dateObj = new Date(item.timestamp * 1000)
    
    // 根據數據長度決定日期格式
    const formatDate = (date: Date, dataLength: number) => {
      if (dataLength > 90) {
        // 超過90天顯示月/日格式
        return date.toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" })
      } else if (dataLength > 60) {
        // 60-90天顯示簡化格式
        return date.toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" })
      } else {
        // 少於60天顯示月/日
        return date.toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" })
      }
    }
    
    return {
      date: formatDate(dateObj, allDataForChart.length),
      price: item.close,
      timestamp: item.timestamp,
      isTracking: isTrackingPoint,
    }
  })

  // 計算合適的日期標籤間隔
  const getDateInterval = (dataLength: number) => {
    if (dataLength <= 14) return 0 // 顯示所有日期
    if (dataLength <= 30) return 2 // 每隔2天顯示
    if (dataLength <= 60) return 4 // 每隔4天顯示
    if (dataLength <= 90) return 6 // 每隔6天顯示
    return Math.ceil(dataLength / 12) // 顯示約12個標籤
  }

  const dateInterval = getDateInterval(chartData.length)

  // 計算追蹤起始點數據 - 找到追蹤開始的第一個數據點
  const trackingStartData = chartData.find(item => item.isTracking)
  const startPoint = {
    date: trackingStartData?.date || '',
    price: performance.startPrice,
    timestamp: trackingStartData?.timestamp || 0
  }

  // 計算最高報酬率點 (確保有數據)
  const highestReturnPoint = performance.data.length > 0 ? performance.data.reduce((highest, current) => {
    const currentReturn = ((current.close - performance.startPrice) / performance.startPrice) * 100
    const highestReturn = ((highest.close - performance.startPrice) / performance.startPrice) * 100
    
    return currentReturn > highestReturn ? current : highest
  }, performance.data[0]) : performance.data[0]

  const highestReturnData = highestReturnPoint ? {
    date: new Date(highestReturnPoint.timestamp * 1000).toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" }),
    price: highestReturnPoint.close,
    timestamp: highestReturnPoint.timestamp,
    returnPercent: ((highestReturnPoint.close - performance.startPrice) / performance.startPrice) * 100
  } : null

  // 計算最高報酬率出現的天數（從追蹤開始算起）
  const highestReturnDays = highestReturnData ? 
    Math.ceil((highestReturnData.timestamp * 1000 - performance.data[0].timestamp * 1000) / (1000 * 60 * 60 * 24)) : 0

  // 計算開始追蹤一週內的平均報酬率
  const firstWeekData = performance.data.length > 0 ? performance.data.filter(item => {
    const daysDiff = Math.ceil((item.timestamp * 1000 - performance.data[0].timestamp * 1000) / (1000 * 60 * 60 * 24))
    return daysDiff <= 7
  }) : []

  const firstWeekAverageReturn = firstWeekData.length > 0 ? 
    firstWeekData.reduce((sum, item) => {
      const returnPercent = ((item.close - performance.startPrice) / performance.startPrice) * 100
      return sum + returnPercent
    }, 0) / firstWeekData.length : 0

  // 檢查是否為今天開始追蹤
  const isStartedToday = () => {
    const today = new Date()
    const startDate = new Date(performance.data[0]?.timestamp * 1000)
    
    return today.toDateString() === startDate.toDateString()
  }

  const showDetailedMetrics = !isStartedToday()

  const handleStartEdit = () => {
    setEditingName(displayName)
    setIsEditing(true)
  }

  const handleSaveName = () => {
    const trimmedName = editingName.trim()
    if (trimmedName && trimmedName !== performance.symbol) {
      updateTrackedStockName(performance.symbol, trimmedName)
      onNameUpdate?.()
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingName("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveName()
    } else if (e.key === "Escape") {
      handleCancelEdit()
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload
      const dotColor = isPositive ? "#10B981" : "#EF4444"
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-gray-700 min-w-[140px]">
          <div className="text-sm font-medium mb-2">
            {new Date(data.timestamp * 1000).toLocaleDateString("zh-TW", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: dotColor }}></div>
            <span className="text-sm text-gray-300">收盤價</span>
            <span className="text-sm font-bold ml-auto">${data.price.toFixed(2)}</span>
          </div>
        </div>
      )
    }
    return null
  }


  const chartConfig = {
    price: {
      label: "收盤價",
      color: isPositive ? "#10B981" : "#EF4444",
    },
  }


  return (
    <div className="flex flex-col h-full">
      {/* 圖表卡片 - 佔滿整個面板 */}
      <Card className="border-0 shadow-xl bg-white/60 backdrop-blur-sm flex flex-col h-full">
          <CardContent className="flex flex-col h-full">
            <div className="pb-3 flex-shrink-0">
              {/* 整合的標題區域 */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="min-w-0 flex-1">
                    {/* 第一行：自定義名稱 + 編輯功能 */}
                    <div className="flex items-center gap-2 mb-1">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={handleKeyPress}
                            maxLength={15}
                            className="h-7 w-36 text-lg font-bold"
                            autoFocus
                          />
                          <Button size="sm" variant="ghost" onClick={handleSaveName} className="h-7 w-7 p-0">
                            <Check className="h-3 w-3 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-7 w-7 p-0">
                            <X className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900 truncate">{displayName}</h3>
                          <Button size="sm" variant="ghost" onClick={handleStartEdit} className="h-6 w-6 p-0 opacity-60 hover:opacity-100">
                            <Edit2 className="h-3 w-3 text-gray-500 hover:text-gray-700" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* 第二行：公司名稱 */}
                    {trackedStock?.companyName && (
                      <div className="text-sm text-gray-600 mb-2">
                        {trackedStock.companyName}
                      </div>
                    )}
                    
                    {/* 第三行：追蹤期間 */}
                    <div className="text-xs text-gray-500">
                      追蹤期間：{new Date(performance.data[0]?.timestamp * 1000).toLocaleDateString("zh-TW")} 至{" "}
                      {new Date(performance.data[performance.data.length - 1]?.timestamp * 1000).toLocaleDateString("zh-TW")}
                    </div>
                  </div>
                </div>
                
                {/* 右上角關鍵數據 */}
                <div className="flex-shrink-0 ml-4">
                  <div className="bg-gray-50/80 rounded-lg p-3 min-w-[180px]">
                    <div className="space-y-2">
                      {/* 起始價格 */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">起始價格</span>
                        <span className="text-sm font-semibold text-gray-900">${performance.startPrice.toFixed(2)}</span>
                      </div>
                      
                      {/* 追蹤天數 */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">追蹤天數</span>
                        <span className="text-sm font-semibold text-gray-900">{performance.trackingDays} 天</span>
                      </div>
                      
                      {/* 最高報酬 - 只在有詳細指標時顯示 */}
                      {showDetailedMetrics && highestReturnData && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">最高報酬</span>
                          <span className="text-sm font-semibold text-amber-600">+{highestReturnData.returnPercent.toFixed(2)}%</span>
                        </div>
                      )}
                      
                      {/* 最高報酬出現 - 只在有詳細指標時顯示 */}
                      {showDetailedMetrics && highestReturnData && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">最高報酬出現</span>
                          <span className="text-sm font-semibold text-amber-600">第 {highestReturnDays} 天</span>
                        </div>
                      )}
                      
                      {/* 一週平均績效 - 只在有詳細指標時顯示 */}
                      {showDetailedMetrics && firstWeekData.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">一週平均績效</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {firstWeekAverageReturn >= 0 ? "+" : ""}{firstWeekAverageReturn.toFixed(2)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <ChartContainer config={chartConfig} className="flex-1 w-full min-h-0">
              <LineChart data={chartData} margin={{ top: 35, right: 40, left: 10, bottom: 10 }}>
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  tickMargin={10}
                  interval={dateInterval}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  domain={[(dataMin: number) => Math.max(0, dataMin * 0.995), (dataMax: number) => dataMax * 1.005]}
                  tickFormatter={(value) => `$${value.toFixed(2)}`}
                  tickMargin={10}
                />
                <ChartTooltip cursor={{ stroke: "#e5e7eb", strokeWidth: 1 }} content={CustomTooltip} />
                
                {/* 股價線條 - 統一實線樣式 */}
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="var(--color-price)"
                  strokeWidth={3}
                  connectNulls={true}
                  dot={(props: { cx: number; cy: number; payload: { timestamp: number; price: number; isTracking: boolean } }) => {
                    const { cx, cy, payload } = props
                    
                    // 只在追蹤期間顯示標記
                    if (!payload.isTracking) return null
                    
                    // 追蹤起始點標記
                    if (payload.timestamp === startPoint.timestamp) {
                      const startPointColor = isPositive ? "#10B981" : "#EF4444"
                      // 智能定位：如果太接近頂部，則放在下方
                      const shouldPlaceBelow = cy < 120
                      const labelY = shouldPlaceBelow ? cy + 50 : cy - 100
                      const dashLineY1 = shouldPlaceBelow ? labelY : labelY + 16 // 標籤端
                      const dashLineY2 = shouldPlaceBelow ? cy + 8 : cy - 8 // 圓點端
                      
                      return (
                        <g key={`start-${payload.timestamp}`}>
                          {/* 數據點圓圈 */}
                          <circle 
                            cx={cx} 
                            cy={cy} 
                            r={5} 
                            fill={startPointColor} 
                            stroke="#fff" 
                            strokeWidth={2}
                          />
                          
                          {/* 虛線連接 */}
                          <line
                            x1={cx}
                            y1={dashLineY1}
                            x2={cx}
                            y2={dashLineY2}
                            stroke={startPointColor}
                            strokeWidth={1.5}
                            strokeDasharray="3,3"
                            opacity={0.8}
                          />
                          
                          {/* 標籤背景 */}
                          <rect
                            x={cx - 20}
                            y={labelY}
                            width={40}
                            height={16}
                            rx={8}
                            fill={startPointColor}
                            fillOpacity={0.95}
                            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                          />
                          
                          {/* 標籤文字 */}
                          <text 
                            x={cx} 
                            y={labelY + 12} 
                            textAnchor="middle" 
                            className="text-xs font-medium"
                            fill="#fff"
                          >
                            開始
                          </text>
                        </g>
                      )
                    }
                    
                    // 最高報酬率點標記
                    if (highestReturnData && payload.timestamp === highestReturnData.timestamp) {
                      const labelText = `+${highestReturnData.returnPercent.toFixed(1)}%`
                      const labelWidth = Math.max(labelText.length * 6 + 12, 50) // 確保最小寬度
                      // 智能定位：如果太接近頂部，則放在下方
                      const shouldPlaceBelow = cy < 50
                      const labelY = shouldPlaceBelow ? cy + 28 : cy - 28
                      const textY = shouldPlaceBelow ? cy + 40 : cy - 16
                      
                      return (
                        <g key={`highest-${payload.timestamp}`}>
                          <circle 
                            cx={cx} 
                            cy={cy} 
                            r={5} 
                            fill="#F59E0B" 
                            stroke="#fff" 
                            strokeWidth={2}
                          />
                          <rect
                            x={cx - labelWidth/2}
                            y={labelY}
                            width={labelWidth}
                            height={16}
                            rx={8}
                            fill="#F59E0B"
                            fillOpacity={0.9}
                          />
                          <text 
                            x={cx} 
                            y={textY} 
                            textAnchor="middle" 
                            className="text-xs font-medium"
                            fill="#fff"
                          >
                            {labelText}
                          </text>
                        </g>
                      )
                    }
                    
                    return null
                  }}
                  activeDot={{ r: 6, fill: "var(--color-price)", strokeWidth: 2, stroke: "#fff" }}
                  connectNulls={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
    </div>
  )
}
