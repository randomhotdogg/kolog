"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import NavigationMenu from "@/components/navigation-menu"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Youtube,
  Calendar,
  BarChart3,
  AlertCircle,
  Star
} from "lucide-react"
import StockSentimentTrendChart from "@/components/stock-sentiment-trend-chart"

interface StockAnalysis {
  id: number
  symbol: string
  company_name: string
  mention_type: string | null
  sentiment: "bullish" | "bearish" | "neutral"
  confidence: number
  reasoning: string | null
  key_points: string[] | null
  identification_reason: string | null
  context_quote: string | null
  created_at: string
}

interface Video {
  id: number
  video_id: string
  url: string
  title: string | null
  channel_title: string | null
  published_at: string | null
  summary: string | null
  overall_sentiment: string | null
  analyzed_at: string
  created_at: string
}

interface StockSentimentSummary {
  symbol: string
  company_name: string
  total_mentions: number
  bullish_count: number
  bearish_count: number
  neutral_count: number
  average_confidence: number
  latest_analysis_date: string | null
}

interface StockHistoryData {
  symbol: string
  analyses: StockAnalysis[]
  videos: Video[]
  sentiment_summary: StockSentimentSummary
}

export default function StockDetailPage() {
  const params = useParams()
  const router = useRouter()
  const symbol = params.symbol as string
  
  const [stockData, setStockData] = useState<StockHistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (symbol) {
      fetchStockHistory(symbol.toUpperCase())
    }
  }, [symbol])

  const fetchStockHistory = async (stockSymbol: string) => {
    try {
      setLoading(true)
      const apiBaseUrl = process.env.NEXT_PUBLIC_YOUTUBE_API_BASE_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(`${apiBaseUrl}/video-analysis/stock/${stockSymbol}/history?days=90`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError(`未找到股票 ${stockSymbol} 的分析記錄`)
        } else {
          throw new Error('獲取股票歷史數據失敗')
        }
        return
      }
      
      const data = await response.json()
      setStockData(data)
      setError(null)
    } catch (err) {
      setError('獲取股票歷史數據時發生錯誤')
    } finally {
      setLoading(false)
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "bullish":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "bearish":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "bullish":
        return "text-green-600 bg-green-50 border-green-200"
      case "bearish":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getSentimentText = (sentiment: string) => {
    switch (sentiment) {
      case "bullish":
        return "看多"
      case "bearish":
        return "看空"
      default:
        return "中性"
    }
  }

  const renderConfidenceStars = (confidence: number) => {
    const stars = Math.floor(confidence / 34) + 1 // 將 0-100 映射到 1-3 星
    const maxStars = Math.min(stars, 3)
    
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < maxStars 
                ? 'text-yellow-500 fill-yellow-500' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-gray-600 ml-1">{confidence}%</span>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white">
          <NavigationMenu className="sticky top-0 z-50" />
          <div className="px-4 py-8">
            <div className="max-w-screen-xl mx-auto">
              <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-96 w-full" />
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white">
          <NavigationMenu className="sticky top-0 z-50" />
          <div className="px-4 py-8">
            <div className="max-w-screen-xl mx-auto">
              <Button 
                onClick={() => router.back()} 
                variant="outline" 
                className="mb-6"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white">
        <NavigationMenu className="sticky top-0 z-50" />
        
        <div className="px-4 py-8">
          <div className="max-w-screen-xl mx-auto space-y-6">
            {/* 頁面標題和返回按鈕 */}
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => router.back()} 
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {stockData?.sentiment_summary.symbol} - {stockData?.sentiment_summary.company_name}
                </h1>
                <p className="text-gray-600 mt-1">股票分析歷史記錄</p>
              </div>
            </div>

            {/* 情緒趨勢圖表 */}
            {stockData && (
              <StockSentimentTrendChart 
                symbol={stockData.sentiment_summary.symbol} 
                days={90}
              />
            )}

            {/* 統計概覽 */}
            {stockData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">總提及次數</p>
                        <p className="text-2xl font-bold">{stockData.sentiment_summary.total_mentions}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">看多</p>
                        <p className="text-2xl font-bold text-green-600">{stockData.sentiment_summary.bullish_count}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="text-sm text-gray-600">看空</p>
                        <p className="text-2xl font-bold text-red-600">{stockData.sentiment_summary.bearish_count}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="text-sm text-gray-600">平均信心度</p>
                        <p className="text-2xl font-bold">{stockData.sentiment_summary.average_confidence}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 分析記錄列表 */}
            {stockData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Youtube className="h-5 w-5 text-red-600" />
                    分析記錄 ({stockData.analyses.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stockData.analyses.map((analysis) => {
                      // 找到對應的影片
                      const video = stockData.videos.find(v => v.id === analysis.id)
                      
                      return (
                        <div key={analysis.id} className="p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              {video && (
                                <div className="mb-2">
                                  <h4 className="font-medium text-gray-900 line-clamp-2">
                                    {video.title || '無標題'}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    {video.channel_title || '未知頻道'} • {formatDate(analysis.created_at)}
                                  </p>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-3 mb-2">
                                <Badge variant="outline" className={getSentimentColor(analysis.sentiment)}>
                                  {getSentimentIcon(analysis.sentiment)}
                                  {getSentimentText(analysis.sentiment)}
                                </Badge>
                                {renderConfidenceStars(analysis.confidence)}
                                {analysis.mention_type && (
                                  <Badge variant="outline" className="text-xs">
                                    {analysis.mention_type === 'PRIMARY' ? '主要標的' :
                                     analysis.mention_type === 'CASE_STUDY' ? '案例研究' :
                                     analysis.mention_type === 'COMPARISON' ? '比較分析' : '簡單提及'}
                                  </Badge>
                                )}
                              </div>
                              
                              {analysis.reasoning && (
                                <p className="text-sm text-gray-700 mb-2">
                                  {analysis.reasoning}
                                </p>
                              )}
                              
                              {analysis.key_points && analysis.key_points.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-gray-600">關鍵論點：</p>
                                  <ul className="text-sm text-gray-700 space-y-1">
                                    {analysis.key_points.map((point, idx) => (
                                      <li key={idx} className="flex items-start gap-2">
                                        <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                                        <span>{point}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            
                            {video && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(video.url, '_blank')}
                                className="ml-4"
                              >
                                <Youtube className="h-4 w-4 mr-1" />
                                觀看
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}