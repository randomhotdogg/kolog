"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown, TrendingUp, TrendingDown, BarChart3, DollarSign } from "lucide-react"

interface StockDataPoint {
  date: string
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface StockDataTableProps {
  data: StockDataPoint[]
  symbol: string
  currency: string
}

type SortField = "date" | "open" | "high" | "low" | "close" | "volume"
type SortDirection = "asc" | "desc"

export function StockDataTable({ data, symbol, currency }: StockDataTableProps) {
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [showAll, setShowAll] = useState(false)

  // 計算統計資訊
  const statistics = useMemo(() => {
    if (data.length === 0) return null

    const validData = data.filter(
      (d) =>
        d.close != null &&
        d.high != null &&
        d.low != null &&
        d.open != null &&
        d.volume != null &&
        !isNaN(d.close) &&
        !isNaN(d.high) &&
        !isNaN(d.low) &&
        !isNaN(d.open) &&
        !isNaN(d.volume),
    )

    if (validData.length === 0) return null

    const prices = validData.map((d) => d.close)
    const volumes = validData.map((d) => d.volume)
    const highs = validData.map((d) => d.high)
    const lows = validData.map((d) => d.low)

    const maxPrice = Math.max(...highs)
    const minPrice = Math.min(...lows)
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
    const totalVolume = volumes.reduce((sum, vol) => sum + vol, 0)
    const avgVolume = totalVolume / volumes.length

    // 計算價格變化
    const firstPrice = validData[0].close
    const lastPrice = validData[validData.length - 1].close
    const totalChange = lastPrice - firstPrice
    const totalChangePercent = firstPrice !== 0 ? (totalChange / firstPrice) * 100 : 0

    // 計算波動率（標準差）
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length
    const volatility = Math.sqrt(variance)

    const maxAmplitude = minPrice !== 0 ? ((maxPrice - minPrice) / minPrice) * 100 : 0

    return {
      maxPrice,
      minPrice,
      avgPrice,
      totalVolume,
      avgVolume,
      totalChange,
      totalChangePercent,
      volatility,
      maxAmplitude,
      dataPoints: validData.length,
    }
  }, [data])

  // 排序數據
  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      let aValue: number | string = a[sortField]
      let bValue: number | string = b[sortField]

      if (sortField === "date") {
        aValue = new Date(a.timestamp).getTime()
        bValue = new Date(b.timestamp).getTime()
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      }

      return 0
    })

    return showAll ? sorted : sorted.slice(0, 10)
  }, [data, sortField, sortDirection, showAll])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const formatCurrency = (value: number) => {
    const safeValue = value ?? 0
    return `${currency === "USD" ? "$" : ""}${safeValue.toFixed(2)}`
  }

  const formatVolume = (volume: number) => {
    const safeVolume = volume ?? 0
    if (safeVolume >= 1000000) {
      return `${(safeVolume / 1000000).toFixed(1)}M`
    } else if (safeVolume >= 1000) {
      return `${(safeVolume / 1000).toFixed(1)}K`
    }
    return safeVolume.toString()
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button variant="ghost" size="sm" onClick={() => handleSort(field)} className="h-auto p-1 font-medium">
      {children}
      {sortField === field && (
        <span className="ml-1">
          {sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </span>
      )}
    </Button>
  )

  if (!statistics) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>股價數據表格</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">暫無數據</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* 左側：數據表格 */}
      <Card className="lg:col-span-3 border-0 shadow-xl bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {symbol} 詳細數據
              <Badge variant="outline">{statistics.dataPoints} 筆記錄</Badge>
            </CardTitle>
            <Button variant="outline" onClick={() => setShowAll(!showAll)}>
              {showAll ? "顯示前10筆" : "顯示全部"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <SortButton field="date">日期</SortButton>
                  </TableHead>
                  <TableHead className="text-right">
                    <SortButton field="open">開盤價</SortButton>
                  </TableHead>
                  <TableHead className="text-right">
                    <SortButton field="high">最高價</SortButton>
                  </TableHead>
                  <TableHead className="text-right">
                    <SortButton field="low">最低價</SortButton>
                  </TableHead>
                  <TableHead className="text-right">
                    <SortButton field="close">收盤價</SortButton>
                  </TableHead>
                  <TableHead className="text-right">
                    <SortButton field="volume">成交量</SortButton>
                  </TableHead>
                  <TableHead className="text-right">日變化</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((item, index) => {
                  const open = item.open ?? 0
                  const close = item.close ?? 0
                  const dailyChange = close - open
                  const dailyChangePercent = open !== 0 ? (dailyChange / open) * 100 : 0
                  const isPositive = dailyChange >= 0

                  return (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{formatDate(item.timestamp)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.open)}</TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        {formatCurrency(item.high)}
                      </TableCell>
                      <TableCell className="text-right text-red-600 font-medium">{formatCurrency(item.low)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.close)}</TableCell>
                      <TableCell className="text-right text-gray-600">{formatVolume(item.volume)}</TableCell>
                      <TableCell className={`text-right font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
                        <div className="flex items-center justify-end gap-1">
                          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          <span>
                            {isPositive ? "+" : ""}
                            {formatCurrency(dailyChange)}
                          </span>
                          <span className="text-xs">
                            ({isPositive ? "+" : ""}
                            {dailyChangePercent.toFixed(2)}%)
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {!showAll && data.length > 10 && (
            <div className="mt-4 text-center text-sm text-gray-500">
              顯示前 10 筆記錄，共 {data.length} 筆 •{" "}
              <Button variant="link" size="sm" onClick={() => setShowAll(true)} className="p-0 h-auto">
                查看全部
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 右側：關鍵資訊小卡片 */}
      <div className="space-y-4">
        {/* 期間變化 */}
        <Card className="border-0 shadow-xl bg-white/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">期間變化</p>
                <p className="text-xl font-bold">
                  {statistics.totalChange >= 0 ? "+" : ""}
                  {formatCurrency(statistics.totalChange)}
                </p>
                <p className={`text-sm ${statistics.totalChangePercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {statistics.totalChangePercent >= 0 ? "+" : ""}
                  {statistics.totalChangePercent.toFixed(2)}%
                </p>
              </div>
              {statistics.totalChange >= 0 ? (
                <TrendingUp className="h-6 w-6 text-green-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* 價格區間 */}
        <Card className="border-0 shadow-xl bg-white/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">價格區間</p>
                <p className="text-lg font-bold">
                  {formatCurrency(statistics.minPrice)} ~ {formatCurrency(statistics.maxPrice)}
                </p>
                <p className="text-sm text-gray-600">最大震幅: {statistics.maxAmplitude.toFixed(2)}%</p>
              </div>
              <BarChart3 className="h-6 w-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        {/* 平均價格 */}
        <Card className="border-0 shadow-xl bg-white/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">平均價格</p>
                <p className="text-lg font-bold">{formatCurrency(statistics.avgPrice)}</p>
                <p className="text-sm text-gray-600">波動率: {formatCurrency(statistics.volatility)}</p>
              </div>
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        {/* 總成交量 */}
        <Card className="border-0 shadow-xl bg-white/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">總成交量</p>
                <p className="text-lg font-bold">{formatVolume(statistics.totalVolume)}</p>
                <p className="text-sm text-gray-600">平均: {formatVolume(statistics.avgVolume)}</p>
              </div>
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
