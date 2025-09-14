"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import NavigationMenu from "@/components/navigation-menu"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Youtube,
  Calendar,
  Users,
  Activity,
  Star,
  AlertCircle,
  ExternalLink
} from "lucide-react"
import StockSentimentTrendChart from "@/components/stock-sentiment-trend-chart"

interface StockSentimentSummary {
  symbol: string
  company_name: string
  total_mentions: number
  bullish_count: number
  bearish_count: number
  neutral_count: number
  average_confidence: number
  latest_analysis_date: string
}

interface StockAnalysis {
  id: number
  symbol: string
  company_name: string
  mention_type: string | null
  sentiment: "bullish" | "bearish" | "neutral"
  confidence: number
  reasoning: string | null
  key_points: string[] | null
  created_at: string
}

interface VideoWithAnalyses {
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
  stock_analyses: StockAnalysis[]
}

interface DashboardStats {
  total_videos_analyzed: number
  total_stocks_mentioned: number
  most_mentioned_stocks: StockSentimentSummary[]
  recent_analyses: VideoWithAnalyses[]
}

export default function AnalyticsDashboardPage() {
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<number>(30) // 預設 30 天

  useEffect(() => {
    fetchDashboardData()
  }, [timeRange])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const apiBaseUrl = process.env.NEXT_PUBLIC_YOUTUBE_API_BASE_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(`${apiBaseUrl}/video-analysis/dashboard?days=${timeRange}`)
      
      if (!response.ok) {
        throw new Error('獲取儀表板數據失敗')
      }
      
      const data = await response.json()
      setDashboardData(data)
      setError(null)
    } catch (err) {
      setError('獲取儀表板數據時發生錯誤')
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

  const getSentimentDistribution = (stock: StockSentimentSummary) => {
    const total = stock.total_mentions
    if (total === 0) return { bullish: 0, bearish: 0, neutral: 0 }
    
    return {
      bullish: Math.round((stock.bullish_count / total) * 100),
      bearish: Math.round((stock.bearish_count / total) * 100),
      neutral: Math.round((stock.neutral_count / total) * 100)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white">
          <NavigationMenu className="sticky top-0 z-50" />
          <div className="px-4 py-8">
            <div className="max-w-screen-2xl mx-auto">
              <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Skeleton className="h-96" />
                  <Skeleton className="h-96" />
                </div>
              </div>
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
          <div className="max-w-screen-2xl mx-auto space-y-6">
            {/* 頁面標題和時間範圍選擇器 */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  股票分析儀表板
                </h1>
                <p className="text-gray-600 mt-1">YouTube 影片股票分析數據總覽</p>
              </div>
              
              <div className="flex gap-2">
                {[7, 30, 90].map((days) => (
                  <Button
                    key={days}
                    variant={timeRange === days ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange(days)}
                  >
                    {days} 天
                  </Button>
                ))}
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* 統計概覽卡片 */}
            {dashboardData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Youtube className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">分析影片數</p>
                          <p className="text-2xl font-bold">{dashboardData.total_videos_analyzed}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <BarChart3 className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">涉及股票數</p>
                          <p className="text-2xl font-bold">{dashboardData.total_stocks_mentioned}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Activity className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">分析總數</p>
                          <p className="text-2xl font-bold">
                            {dashboardData.most_mentioned_stocks.reduce((sum, stock) => sum + stock.total_mentions, 0)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Users className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">分析師數</p>
                          <p className="text-2xl font-bold">
                            {new Set(dashboardData.recent_analyses.map(v => v.channel_title)).size}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 熱門股票排行榜 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        熱門股票排行
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {dashboardData.most_mentioned_stocks.slice(0, 10).map((stock, index) => {
                          const distribution = getSentimentDistribution(stock)
                          
                          return (
                            <div 
                              key={stock.symbol} 
                              className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => router.push(`/stock/${stock.symbol}`)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <p className="font-medium">{stock.symbol}</p>
                                    <p className="text-sm text-gray-600 truncate max-w-[200px]">
                                      {stock.company_name}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold">{stock.total_mentions}</p>
                                  <p className="text-xs text-gray-500">次提及</p>
                                </div>
                              </div>
                              
                              {/* 情緒分布條 */}
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                <div className="h-2 rounded-full flex">
                                  <div 
                                    className="bg-green-500 rounded-l-full"
                                    style={{ width: `${distribution.bullish}%` }}
                                  ></div>
                                  <div 
                                    className="bg-red-500"
                                    style={{ width: `${distribution.bearish}%` }}
                                  ></div>
                                  <div 
                                    className="bg-gray-400 rounded-r-full"
                                    style={{ width: `${distribution.neutral}%` }}
                                  ></div>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex gap-4">
                                  <span className="text-green-600">看多 {distribution.bullish}%</span>
                                  <span className="text-red-600">看空 {distribution.bearish}%</span>
                                  <span className="text-gray-600">中性 {distribution.neutral}%</span>
                                </div>
                                <span className="text-gray-500">
                                  平均信心度 {stock.average_confidence}%
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      
                      {dashboardData.most_mentioned_stocks.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>尚無股票分析數據</p>
                          <p className="text-sm mt-1">開始分析 YouTube 影片來查看熱門股票</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* 熱門股票趨勢圖表 */}
                  {dashboardData.most_mentioned_stocks.length > 0 && (
                    <Card className="md:col-span-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-purple-600" />
                          熱門股票情緒趨勢
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                          最熱門股票的情緒變化趨勢（過去30天）
                        </p>
                      </CardHeader>
                      <CardContent>
                        <StockSentimentTrendChart 
                          symbol={dashboardData.most_mentioned_stocks[0].symbol}
                          days={30}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* 最近分析 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-green-600" />
                        最近分析
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {dashboardData.recent_analyses.slice(0, 5).map((video) => (
                          <div 
                            key={video.id} 
                            className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => window.open(video.url, '_blank')}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 line-clamp-2 mb-1">
                                  {video.title || '無標題'}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {video.channel_title || '未知頻道'} • {formatDate(video.analyzed_at)}
                                </p>
                              </div>
                              <ExternalLink className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
                            </div>
                            
                            {video.overall_sentiment && (
                              <div className="mb-2">
                                <Badge variant="outline" className={getSentimentColor(video.overall_sentiment)}>
                                  {getSentimentIcon(video.overall_sentiment)}
                                  整體：{getSentimentText(video.overall_sentiment)}
                                </Badge>
                              </div>
                            )}
                            
                            <div className="flex flex-wrap gap-2">
                              {video.stock_analyses.slice(0, 3).map((analysis) => (
                                <Badge key={analysis.id} variant="secondary" className="text-xs">
                                  {analysis.symbol}
                                </Badge>
                              ))}
                              {video.stock_analyses.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{video.stock_analyses.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {dashboardData.recent_analyses.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>尚無分析記錄</p>
                          <p className="text-sm mt-1">開始分析 YouTube 影片來查看記錄</p>
                        </div>
                      )}
                      
                      {dashboardData.recent_analyses.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => router.push('/analysis-history')}
                          >
                            查看完整歷史記錄
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}