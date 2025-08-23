"use client"

import { useState } from "react"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Bar } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

interface StockDataPoint {
  date: string
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface StockChartProps {
  data: StockDataPoint[]
  symbol: string
}

interface CandlestickProps {
  payload: StockDataPoint
  x: number
  y: number
  width: number
  height: number
}

// 自定義K線圖組件
const Candlestick = ({ payload, x, y, width, height }: CandlestickProps) => {
  if (!payload) return null

  const { open = 0, high = 0, low = 0, close = 0 } = payload
  const isPositive = close >= open
  const color = isPositive ? "#10b981" : "#ef4444"

  // 防止除零錯誤
  const range = high - low
  if (range === 0) return null

  const bodyHeight = Math.abs(close - open) * (height / range)
  const bodyY = y + (high - Math.max(open, close)) * (height / range)

  return (
    <g>
      {/* 上下影線 */}
      <line x1={x + width / 2} y1={y} x2={x + width / 2} y2={y + height} stroke={color} strokeWidth={1} />
      {/* K線實體 */}
      <rect
        x={x + width * 0.2}
        y={bodyY}
        width={width * 0.6}
        height={Math.max(bodyHeight, 1)}
        fill={color}
        stroke={color}
      />
    </g>
  )
}

export function StockChart({ data, symbol }: StockChartProps) {
  const [showCandlestick, setShowCandlestick] = useState(true)
  const [showLine, setShowLine] = useState(true)
  const [showVolume, setShowVolume] = useState(false)

  // 準備圖表數據
  const chartData = data.map((item) => ({
    ...item,
    date: new Date(item.timestamp).toLocaleDateString("zh-TW", {
      month: "2-digit",
      day: "2-digit",
    }),
    // 為了在同一個圖表中顯示成交量，需要縮放
    scaledVolume: item.volume / 1000000, // 轉換為百萬股
  }))

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { timestamp: number; price: number } }>; label?: string }) => {
    if (!active || !payload || payload.length === 0) return null

    // 從payload中獲取數據，優先從第一個有效的payload項目中獲取
    let data = null
    for (const item of payload) {
      if (item.payload && typeof item.payload === "object") {
        data = item.payload
        break
      }
    }

    if (!data) return null

    const { open = 0, high = 0, low = 0, close = 0, timestamp } = data

    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg min-w-[140px] z-50">
        {/* 日期標題 */}
        <div className="font-semibold text-gray-800 mb-2 text-sm">
          {new Date(timestamp).toLocaleDateString("zh-TW", {
            year: "numeric",
            month: "1-digit",
            day: "1-digit",
          })}
        </div>

        {/* 股價資訊 */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
            <span className="text-gray-600 min-w-[50px]">最高價</span>
            <span className="font-medium text-gray-800">{high.toFixed(2)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
            <span className="text-gray-600 min-w-[50px]">最低價</span>
            <span className="font-medium text-gray-800">{low.toFixed(2)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
            <span className="text-gray-600 min-w-[50px]">開盤價</span>
            <span className="font-medium text-gray-800">{open.toFixed(2)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
            <span className="text-gray-600 min-w-[50px]">收盤價</span>
            <span className="font-medium text-gray-800">{close.toFixed(2)}</span>
          </div>
        </div>
      </div>
    )
  }

  const chartConfig = {
    close: {
      label: "收盤價",
      color: "#3b82f6",
    },
    scaledVolume: {
      label: "成交量",
      color: "#e5e7eb",
    },
    high: {
      label: "K線",
      color: "transparent",
    },
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {symbol} 股價走勢圖
            <Badge variant="outline" className="text-xs">
              {data.length} 天數據
            </Badge>
          </CardTitle>

          {/* 圖表控制選項 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="candlestick" checked={showCandlestick} onCheckedChange={setShowCandlestick} />
              <label htmlFor="candlestick" className="text-sm font-medium cursor-pointer">
                K線圖
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="line" checked={showLine} onCheckedChange={setShowLine} />
              <label htmlFor="line" className="text-sm font-medium cursor-pointer">
                折線圖
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="volume" checked={showVolume} onCheckedChange={setShowVolume} />
              <label htmlFor="volume" className="text-sm font-medium cursor-pointer">
                成交量
              </label>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="h-96">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
            <YAxis
              yAxisId="price"
              domain={["dataMin - 5", "dataMax + 5"]}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            {showVolume && (
              <YAxis
                yAxisId="volume"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}M`}
              />
            )}

            <ChartTooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "#94a3b8", strokeWidth: 1, strokeDasharray: "3 3" }}
            />

            {/* 成交量柱狀圖 */}
            {showVolume && (
              <Bar yAxisId="volume" dataKey="scaledVolume" fill="var(--color-scaledVolume)" opacity={0.3} />
            )}

            {showCandlestick && (
              <Bar
                yAxisId="price"
                dataKey="high"
                fill="var(--color-high)"
                shape={(props: unknown) => <Candlestick {...(props as Record<string, unknown>)} />}
              />
            )}

            {/* 折線圖 */}
            {showLine && (
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="close"
                stroke="var(--color-close)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "var(--color-close)" }}
              />
            )}
          </ComposedChart>
        </ChartContainer>

        {/* 圖表說明 */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
          {showCandlestick && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500"></div>
              <span>綠色K線：收盤價高於開盤價</span>
              <div className="w-3 h-3 bg-red-500 ml-2"></div>
              <span>紅色K線：收盤價低於開盤價</span>
            </div>
          )}
          {showLine && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-blue-500"></div>
              <span>藍色線：收盤價走勢</span>
            </div>
          )}
          {showVolume && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300"></div>
              <span>灰色柱：成交量（百萬股）</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
