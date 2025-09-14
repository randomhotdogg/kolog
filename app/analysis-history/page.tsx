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
import { Input } from "@/components/ui/input"
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Youtube,
  Search,
  Filter,
  Calendar,
  Star,
  AlertCircle,
  ExternalLink,
  Eye,
  BarChart3
} from "lucide-react"

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

interface VideoWithAnalyses {
  id: number
  video_id: string
  url: string
  title: string | null
  channel_title: string | null
  published_at: string | null
  summary: string | null
  overall_sentiment: string | null
  date_source: string | null
  analyzed_at: string
  created_at: string
  stock_analyses: StockAnalysis[]
}

export default function AnalysisHistoryPage() {
  const router = useRouter()
  const [videos, setVideos] = useState<VideoWithAnalyses[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSentiment, setSelectedSentiment] = useState<string>("")
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const PAGE_SIZE = 10

  useEffect(() => {
    fetchAnalysisHistory(0, true)
  }, [searchQuery, selectedSentiment])

  const fetchAnalysisHistory = async (pageOffset: number = 0, reset: boolean = false) => {
    try {
      setLoading(pageOffset === 0)
      const apiBaseUrl = process.env.NEXT_PUBLIC_YOUTUBE_API_BASE_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(
        `${apiBaseUrl}/video-analysis/videos?limit=${PAGE_SIZE}&offset=${pageOffset}`
      )
      
      if (!response.ok) {
        throw new Error('獲取分析歷史失敗')
      }
      
      const data = await response.json()
      
      if (reset) {
        setVideos(data)
        setPage(0)
      } else {
        setVideos(prev => [...prev, ...data])
        setPage(pageOffset / PAGE_SIZE)
      }
      
      setHasMore(data.length === PAGE_SIZE)
      setError(null)
    } catch (err) {
      setError('獲取分析歷史時發生錯誤')
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextOffset = (page + 1) * PAGE_SIZE
      fetchAnalysisHistory(nextOffset, false)
    }
  }

  const filteredVideos = videos.filter(video => {
    const matchesSearch = !searchQuery || 
      video.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.channel_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.stock_analyses.some(analysis => 
        analysis.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        analysis.company_name.toLowerCase().includes(searchQuery.toLowerCase())
      )

    const matchesSentiment = !selectedSentiment || video.overall_sentiment === selectedSentiment

    return matchesSearch && matchesSentiment
  })

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
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
      </div>
    )
  }

  const getMentionTypeText = (mentionType: string | null) => {
    switch (mentionType) {
      case 'PRIMARY':
        return '主要標的'
      case 'CASE_STUDY':
        return '案例研究'
      case 'COMPARISON':
        return '比較分析'
      case 'MENTION':
        return '簡單提及'
      default:
        return '其他'
    }
  }

  const getMentionTypeColor = (mentionType: string | null) => {
    switch (mentionType) {
      case 'PRIMARY':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'CASE_STUDY':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'COMPARISON':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'MENTION':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300'
    }
  }

  if (loading && videos.length === 0) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white">
          <NavigationMenu className="sticky top-0 z-50" />
          <div className="px-4 py-8">
            <div className="max-w-screen-xl mx-auto">
              <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-16 w-full" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))}
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
          <div className="max-w-screen-xl mx-auto space-y-6">
            {/* 頁面標題 */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                分析歷史記錄
              </h1>
              <p className="text-gray-600 mt-1">查看您的 YouTube 影片分析歷史</p>
            </div>

            {/* 搜索和篩選 */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="搜索影片標題、頻道名稱或股票代號..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <select
                      value={selectedSentiment}
                      onChange={(e) => setSelectedSentiment(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">所有情緒</option>
                      <option value="bullish">看多</option>
                      <option value="bearish">看空</option>
                      <option value="neutral">中性</option>
                    </select>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/analytics-dashboard')}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      儀表板
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* 分析記錄列表 */}
            <div className="space-y-4">
              {filteredVideos.map((video) => (
                <Card key={video.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                          {video.title || '無標題'}
                        </h3>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <Youtube className="h-4 w-4" />
                            {video.channel_title || '未知頻道'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(video.analyzed_at)}
                          </span>
                          {video.overall_sentiment && (
                            <Badge variant="outline" className={getSentimentColor(video.overall_sentiment)}>
                              {getSentimentIcon(video.overall_sentiment)}
                              整體：{getSentimentText(video.overall_sentiment)}
                            </Badge>
                          )}
                        </div>
                        
                        {video.summary && (
                          <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                            {video.summary}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(video.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          觀看
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/video/${video.video_id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          詳情
                        </Button>
                      </div>
                    </div>
                    
                    {/* 股票分析列表 */}
                    {video.stock_analyses.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">
                          股票分析 ({video.stock_analyses.length})
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {video.stock_analyses.map((analysis) => (
                            <div 
                              key={analysis.id}
                              className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => router.push(`/stock/${analysis.symbol}`)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="font-medium text-gray-900">{analysis.symbol}</p>
                                  <p className="text-xs text-gray-600 truncate">
                                    {analysis.company_name}
                                  </p>
                                </div>
                                {renderConfidenceStars(analysis.confidence)}
                              </div>
                              
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className={`${getSentimentColor(analysis.sentiment)} text-xs`}>
                                  {getSentimentIcon(analysis.sentiment)}
                                  {getSentimentText(analysis.sentiment)}
                                </Badge>
                                
                                {analysis.mention_type && (
                                  <Badge variant="outline" className={`${getMentionTypeColor(analysis.mention_type)} text-xs`}>
                                    {getMentionTypeText(analysis.mention_type)}
                                  </Badge>
                                )}
                              </div>
                              
                              {analysis.reasoning && (
                                <p className="text-xs text-gray-700 line-clamp-2">
                                  {analysis.reasoning}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 載入更多按鈕 */}
            {hasMore && !loading && filteredVideos.length > 0 && (
              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? '載入中...' : '載入更多'}
                </Button>
              </div>
            )}

            {/* 空狀態 */}
            {!loading && filteredVideos.length === 0 && (
              <Card>
                <CardContent className="py-16">
                  <div className="text-center">
                    <Youtube className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      尚無分析記錄
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {searchQuery || selectedSentiment 
                        ? '沒有符合篩選條件的記錄'
                        : '開始分析 YouTube 影片來建立歷史記錄'
                      }
                    </p>
                    <Button onClick={() => router.push('/youtube-analysis')}>
                      開始分析影片
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {loading && videos.length > 0 && (
              <div className="flex justify-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                  載入中...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}