"use client"

import { useState, useEffect } from "react"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  AreaChart
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  BarChart3,
  Activity,
  AlertCircle
} from "lucide-react"

interface SentimentTrendPoint {
  date: string
  bullish_count: number
  bearish_count: number
  neutral_count: number
  total_mentions: number
  average_confidence?: number
}

interface StockSentimentTrendData {
  symbol: string
  company_name: string
  period_start: string
  period_end: string
  trend_data: SentimentTrendPoint[]
}

interface StockSentimentTrendChartProps {
  symbol: string
  days?: number
}

type ChartType = 'line' | 'bar' | 'area'

export default function StockSentimentTrendChart({ 
  symbol, 
  days = 30 
}: StockSentimentTrendChartProps) {
  const [trendData, setTrendData] = useState<StockSentimentTrendData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartType, setChartType] = useState<ChartType>('area')

  useEffect(() => {
    if (symbol) {
      fetchSentimentTrend()
    }
  }, [symbol, days])

  const fetchSentimentTrend = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const apiBaseUrl = process.env.NEXT_PUBLIC_YOUTUBE_API_BASE_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(
        `${apiBaseUrl}/video-analysis/stock/${symbol}/sentiment-trend?days=${days}`
      )
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`未找到股票 ${symbol} 的情緒趨勢數據`)
        } else {
          throw new Error('獲取情緒趨勢數據失敗')
        }
      }
      
      const data = await response.json()
      setTrendData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '獲取趨勢數據時發生錯誤')
    } finally {
      setLoading(false)
    }
  }

  const formatChartData = () => {
    if (!trendData) return []
    
    return trendData.trend_data.map(point => ({
      date: new Date(point.date).toLocaleDateString('zh-TW', { 
        month: 'short', 
        day: 'numeric' 
      }),
      fullDate: point.date,
      看多: point.bullish_count,
      看空: point.bearish_count,
      中性: point.neutral_count,
      總提及: point.total_mentions,
      平均信心度: point.average_confidence || 0
    }))
  }

  const chartData = formatChartData()

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`${label} (${data.fullDate})`}</p>
          <div className="space-y-1 mt-2">
            <p className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">看多: {data.看多}</span>
            </p>
            <p className="flex items-center gap-2">
              <TrendingDown className="h-3 w-3 text-red-600" />
              <span className="text-red-600">看空: {data.看空}</span>
            </p>
            <p className="flex items-center gap-2">
              <Minus className="h-3 w-3 text-gray-600" />
              <span className="text-gray-600">中性: {data.中性}</span>
            </p>
            <p className="text-sm text-gray-600 pt-1 border-t">
              總提及: {data.總提及} | 平均信心度: {data.平均信心度.toFixed(1)}%
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            情緒趨勢圖表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mx-auto mb-2"></div>
              <p className="text-gray-500">載入趨勢數據中...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            情緒趨勢圖表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!trendData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            情緒趨勢圖表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                暫無趨勢數據
              </h3>
              <p className="text-gray-500">
                在選定的時間範圍內沒有找到 {symbol} 的分析記錄
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="看多" stroke="#16a34a" strokeWidth={2} />
            <Line type="monotone" dataKey="看空" stroke="#dc2626" strokeWidth={2} />
            <Line type="monotone" dataKey="中性" stroke="#6b7280" strokeWidth={2} />
          </LineChart>
        )
      
      case 'bar':
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="看多" fill="#16a34a" />
            <Bar dataKey="看空" fill="#dc2626" />
            <Bar dataKey="中性" fill="#6b7280" />
          </BarChart>
        )
      
      case 'area':
      default:
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="看多" 
              stackId="1" 
              stroke="#16a34a" 
              fill="#16a34a" 
              fillOpacity={0.6}
            />
            <Area 
              type="monotone" 
              dataKey="看空" 
              stackId="1" 
              stroke="#dc2626" 
              fill="#dc2626" 
              fillOpacity={0.6}
            />
            <Area 
              type="monotone" 
              dataKey="中性" 
              stackId="1" 
              stroke="#6b7280" 
              fill="#6b7280" 
              fillOpacity={0.6}
            />
          </AreaChart>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {trendData.symbol} - {trendData.company_name}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              情緒趨勢 ({days} 天) • 
              共 {chartData.reduce((sum, item) => sum + item.總提及, 0)} 次提及
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600 border-green-200">
              <TrendingUp className="h-3 w-3 mr-1" />
              看多: {chartData.reduce((sum, item) => sum + item.看多, 0)}
            </Badge>
            <Badge variant="outline" className="text-red-600 border-red-200">
              <TrendingDown className="h-3 w-3 mr-1" />
              看空: {chartData.reduce((sum, item) => sum + item.看空, 0)}
            </Badge>
            <Badge variant="outline" className="text-gray-600 border-gray-200">
              <Minus className="h-3 w-3 mr-1" />
              中性: {chartData.reduce((sum, item) => sum + item.中性, 0)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button
            variant={chartType === 'area' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('area')}
          >
            <Activity className="h-4 w-4 mr-1" />
            面積圖
          </Button>
          <Button
            variant={chartType === 'line' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('line')}
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            折線圖
          </Button>
          <Button
            variant={chartType === 'bar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('bar')}
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            柱狀圖
          </Button>
        </div>
        
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}