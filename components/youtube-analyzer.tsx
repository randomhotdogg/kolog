"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { 
  Play, 
  Loader2, 
  Youtube, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Settings,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Plus,
  ChevronDown,
  ChevronUp,
  Star,
  Bot
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  getGeminiApiKey, 
  saveGeminiApiKey,
  getYouTubeApiKey,
  saveYouTubeApiKey,
  addTrackedStockWithYouTubeAnalysis,
  isStockTracked,
  type YouTubeAnalysis,
  type MentionType
} from "@/lib/tracking-storage"

interface StockAnalysis {
  symbol: string
  companyName: string
  mentionType?: MentionType
  sentiment: "bullish" | "bearish" | "neutral"
  confidence: number
  reasoning: string
  keyPoints: string[]
  identificationReason?: string // AI 識別該股票的理由
}

interface MentionedCompany {
  companyName: string
  context: string
  confidence: number
  searchStatus?: 'pending' | 'found' | 'not_found' | 'error'
  searchedSymbol?: string
  searchResults?: StockSearchResult[]
}

interface StockSearchResult {
  symbol: string
  name: string
  exchange: string
  type: string
}

interface AnalysisResult {
  summary: string
  stockAnalyses: StockAnalysis[]
  overallSentiment: "bullish" | "bearish" | "neutral"
  videoUrl: string
  analyzedAt: string
  videoTitle?: string
  publishDate?: string
  dateSource?: "api" | "manual" | "fallback"
  mentionedCompanies?: MentionedCompany[]
  author?: string
}

interface YouTubeAnalyzerProps {
  onStockAdded?: () => void
}

export function YouTubeAnalyzer({ onStockAdded }: YouTubeAnalyzerProps) {
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [youtubeApiKey, setYoutubeApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false)
  const [addedStocks, setAddedStocks] = useState<Set<string>>(new Set())
  const [showAddStockDialog, setShowAddStockDialog] = useState(false)
  const [newStock, setNewStock] = useState<Partial<StockAnalysis>>({
    sentiment: "neutral",
    confidence: 50
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isTranscriptCollapsed, setIsTranscriptCollapsed] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // 載入已儲存的 API keys
  useEffect(() => {
    const savedGeminiKey = getGeminiApiKey()
    const savedYouTubeKey = getYouTubeApiKey()
    
    if (savedGeminiKey) {
      setApiKey(savedGeminiKey)
    }
    if (savedYouTubeKey) {
      setYoutubeApiKey(savedYouTubeKey)
    }
  }, [])

  const validateYouTubeUrl = (url: string): boolean => {
    const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/
    return youtubeRegex.test(url)
  }

  const handleApiKeySave = () => {
    if (apiKey.trim()) {
      saveGeminiApiKey(apiKey.trim())
    }
    if (youtubeApiKey.trim()) {
      saveYouTubeApiKey(youtubeApiKey.trim())
    }
    setApiKeyDialogOpen(false)
  }

  const handleAnalyze = async () => {
    if (!youtubeUrl.trim()) {
      setError("請輸入 YouTube 影片連結")
      return
    }

    if (!validateYouTubeUrl(youtubeUrl.trim())) {
      setError("請輸入有效的 YouTube 影片連結")
      return
    }

    if (!apiKey.trim()) {
      setError("請先設定 Google Gemini API Key")
      setApiKeyDialogOpen(true)
      return
    }

    setLoading(true)
    setError(null)
    setAnalysisResult(null)
    setTranscript(null)
    setAddedStocks(new Set()) // 重置已加入追蹤的狀態

    try {
      // 第一步：獲取 YouTube 逐字稿
      const apiBaseUrl = process.env.NEXT_PUBLIC_YOUTUBE_API_BASE_URL || 'http://localhost:8000/api/v1'
      const transcriptResponse = await fetch(`${apiBaseUrl}/youtube/transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: youtubeUrl.trim() })
      })

      const transcriptData = await transcriptResponse.json()

      if (!transcriptResponse.ok) {
        setError(transcriptData.error || "無法獲取影片逐字稿")
        return
      }

      setTranscript(transcriptData.transcript)
      setIsAnalyzing(true) // 開始 AI 分析載入狀態

      // 第二步：嘗試獲取 YouTube 影片元數據
      let videoMetadata = null
      let publishDate = null
      let dateSource: "api" | "manual" | "fallback" = "fallback"

      if (youtubeApiKey.trim()) {
        try {
          const metadataResponse = await fetch(`${apiBaseUrl}/youtube/metadata`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              video_id: transcriptData.video_id,
              api_key: youtubeApiKey.trim()
            })
          })

          if (metadataResponse.ok) {
            const metadataData = await metadataResponse.json()
            if (metadataData.success) {
              videoMetadata = metadataData.metadata
              publishDate = new Date(metadataData.publish_date)
              dateSource = "api"
            }
          }
        } catch (metadataError) {
          console.warn("獲取影片元數據失敗，將使用當前日期:", metadataError)
        }
      }

      // 如果無法獲取 API 日期，使用當前日期作為降級方案
      if (!publishDate) {
        publishDate = new Date()
        dateSource = "fallback"
      }

      // 第三步：AI 分析
      const analysisResponse = await fetch(`${apiBaseUrl}/analysis/gemini`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcriptData.transcript,
          api_key: apiKey.trim(),
          video_url: youtubeUrl.trim()
        })
      })

      const analysisData = await analysisResponse.json()

      if (!analysisResponse.ok) {
        setError(analysisData.error || "AI 分析失敗")
        return
      }

      // 將元數據資訊加入分析結果
      const enhancedAnalysis = {
        ...analysisData.analysis,
        videoTitle: videoMetadata?.title || analysisData.analysis.video_title,
        author: videoMetadata?.channelTitle,
        publishDate: publishDate.toISOString(),
        dateSource: dateSource,
        // 統一欄位命名：後端使用 snake_case，前端轉換為 camelCase
        stockAnalyses: (analysisData.analysis.stock_analyses || []).map((stock: any) => ({
          ...stock,
          companyName: stock.company_name || stock.companyName,
          mentionType: stock.mention_type || stock.mentionType,
          keyPoints: stock.key_points || stock.keyPoints || [],
          identificationReason: stock.identification_reason || stock.identificationReason,
          contextQuote: stock.context_quote || stock.contextQuote
        })),
        mentionedCompanies: (analysisData.analysis.mentioned_companies || []).map((company: any) => ({
          ...company,
          companyName: company.company_name || company.companyName,
          mentionType: company.mention_type || company.mentionType
        })),
        overallSentiment: analysisData.analysis.overall_sentiment
      }
      
      // 第四步：自動化處理提及的公司，轉換為股票代號
      let finalStockAnalyses = [...(enhancedAnalysis.stockAnalyses || [])]
      const processedMentionedCompanies = []
      
      if (enhancedAnalysis.mentionedCompanies && enhancedAnalysis.mentionedCompanies.length > 0) {
        console.log(`開始處理 ${enhancedAnalysis.mentionedCompanies.length} 個提及的公司`)
        
        for (const mentionedCompany of enhancedAnalysis.mentionedCompanies) {
          try {
            // 跳過沒有公司名稱的項目
            if (!mentionedCompany.companyName) {
              console.log('跳過空的公司名稱')
              continue
            }
            
            console.log(`搜索公司: ${mentionedCompany.companyName}`)
            
            // 查詢股票代號
            const searchResponse = await fetch(`/api/stock-search?q=${encodeURIComponent(mentionedCompany.companyName)}`)
            const searchData = await searchResponse.json()
            
            const processedCompany = {
              ...mentionedCompany,
              searchStatus: 'found' as const,
              searchResults: []
            }
            
            if (searchResponse.ok && searchData.success && searchData.results.length > 0) {
              const bestMatch = searchData.results[0] // 取第一個最佳匹配結果
              processedCompany.searchResults = searchData.results
              processedCompany.searchedSymbol = bestMatch.symbol
              
              // 檢查是否已經存在於股票分析中
              const existingStock = finalStockAnalyses.find(stock => stock.symbol === bestMatch.symbol)
              if (!existingStock) {
                // 為這個公司創建基本的股票分析項目
                const newStockAnalysis = {
                  symbol: bestMatch.symbol,
                  companyName: bestMatch.name,
                  sentiment: 'neutral' as const,
                  confidence: Math.max(50, mentionedCompany.confidence), // 至少50分信心度
                  reasoning: `基於影片中提及「${mentionedCompany.companyName}」，上下文：${mentionedCompany.context}`,
                  keyPoints: [`影片中提及：${mentionedCompany.context}`],
                  identificationReason: `從提及的公司名稱「${mentionedCompany.companyName}」自動識別出股票代號 ${bestMatch.symbol}`
                }
                
                finalStockAnalyses.push(newStockAnalysis)
                console.log(`成功轉換公司「${mentionedCompany.companyName}」為股票 ${bestMatch.symbol}`)
              } else {
                console.log(`股票 ${bestMatch.symbol} 已存在於分析結果中，跳過`)
              }
            } else {
              processedCompany.searchStatus = 'not_found' as const
              console.log(`未找到公司「${mentionedCompany.companyName}」的股票代號`)
            }
            
            processedMentionedCompanies.push(processedCompany)
            
          } catch (searchError) {
            console.error(`搜索公司「${mentionedCompany.companyName}」時出錯:`, searchError)
            processedMentionedCompanies.push({
              ...mentionedCompany,
              searchStatus: 'error' as const,
              searchResults: []
            })
          }
        }
      }
      
      // 更新最終分析結果
      const finalAnalysis = {
        ...enhancedAnalysis,
        stockAnalyses: finalStockAnalyses,
        mentionedCompanies: processedMentionedCompanies
      }
      
      setAnalysisResult(finalAnalysis)

    } catch (error) {
      console.error("分析過程發生錯誤:", error)
      setError("分析過程中發生未預期錯誤，請稍後再試")
    } finally {
      setLoading(false)
      setIsAnalyzing(false)
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

  const handleAddToTracking = async (stockAnalysis: StockAnalysis) => {
    try {
      // 使用影片發布日期作為追蹤開始日期（如果有的話）
      const trackingStartDate = analysisResult?.publishDate 
        ? new Date(analysisResult.publishDate)
        : new Date(analysisResult?.analyzedAt || new Date())

      // 獲取股票歷史數據，包含影片發布日期的歷史價格
      const startTimestamp = Math.floor(trackingStartDate.getTime() / 1000)
      const endTimestamp = Math.floor(new Date().getTime() / 1000)
      const stockResponse = await fetch(`/api/stock?symbol=${stockAnalysis.symbol}&startDate=${startTimestamp}&endDate=${endTimestamp}`)
      const stockData = await stockResponse.json()

      if (!stockResponse.ok) {
        throw new Error("無法獲取股票資料")
      }

      // 計算追蹤開始日期的起始價格
      let startPrice = stockData.currentPrice // 預設值
      
      if (stockData.data && stockData.data.length > 0) {
        // 尋找追蹤開始日期當天或之後的第一筆數據
        const targetData = stockData.data.find((item: { timestamp: number; close: number }) => 
          item.timestamp >= startTimestamp
        )
        
        if (targetData) {
          startPrice = targetData.close
        } else {
          // 如果沒有找到對應日期的數據，使用最早的數據
          startPrice = stockData.data[0].close
        }
      }

      const youtubeAnalysisData: Omit<YouTubeAnalysis, "analyzedAt"> = {
        videoUrl: analysisResult?.videoUrl || youtubeUrl,
        videoId: extractVideoId(youtubeUrl) || "",
        videoTitle: analysisResult?.videoTitle,
        author: analysisResult?.author,
        summary: analysisResult?.summary || "",
        sentiment: stockAnalysis.sentiment,
        confidence: stockAnalysis.confidence,
        reasoning: stockAnalysis.reasoning,
        keyPoints: stockAnalysis.keyPoints,
        publishDate: trackingStartDate,
        dateSource: analysisResult?.dateSource || "fallback",
      }

      addTrackedStockWithYouTubeAnalysis(
        {
          symbol: stockAnalysis.symbol,
          companyName: stockAnalysis.companyName,
          startTrackingDate: trackingStartDate,
          startPrice: startPrice,
          currency: stockData.currency || "USD"
        },
        youtubeAnalysisData
      )

      // 更新本地狀態
      setAddedStocks(prev => new Set([...prev, stockAnalysis.symbol]))
      
      onStockAdded?.()

    } catch (error) {
      console.error("加入追蹤失敗:", error)
      setError("加入追蹤失敗，請稍後再試")
    }
  }

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }


  // 獲取信心度星級
  // 處理表格行展開狀態
  const toggleRowExpansion = (rowKey: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(rowKey)) {
        newSet.delete(rowKey)
      } else {
        newSet.add(rowKey)
      }
      return newSet
    })
  }

  const isRowExpanded = (rowKey: string) => expandedRows.has(rowKey)

  const getConfidenceStars = (confidence: number) => {
    if (confidence >= 90) return 3
    if (confidence >= 70) return 2
    if (confidence >= 50) return 1
    return 0
  }

  // 渲染信心度星星
  const renderConfidenceStars = (confidence: number) => {
    const stars = getConfidenceStars(confidence)
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < stars 
                ? 'text-yellow-500 fill-yellow-500' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-gray-600 ml-1">{confidence}%</span>
      </div>
    )
  }


  const handleAddNewStock = () => {
    if (!newStock.symbol || !newStock.companyName) {
      setError("請填寫完整的股票資訊")
      return
    }

    // 驗證股票代號格式
    const stockSymbolRegex = /^[A-Z]{1,5}(\.[A-Z])?$/
    if (!stockSymbolRegex.test(newStock.symbol.toUpperCase().trim())) {
      setError("股票代號格式不正確，請輸入1-5個大寫字母")
      return
    }

    const stockAnalysis: StockAnalysis = {
      symbol: newStock.symbol.toUpperCase().trim(),
      companyName: newStock.companyName.trim(),
      sentiment: newStock.sentiment || "neutral",
      confidence: newStock.confidence || 50,
      reasoning: newStock.reasoning || "手動添加",
      keyPoints: newStock.keyPoints || [],
      identificationReason: "用戶手動添加"
    }

    // 無法直接修改原始分析結果，所以忽略手動新增功能
    setNewStock({
      sentiment: "neutral",
      confidence: 50
    })
    setShowAddStockDialog(false)
    setError(null)
  }

  // 獲取當前有效的股票分析列表
  const getCurrentStockAnalyses = (): StockAnalysis[] => {
    return analysisResult?.stockAnalyses || []
  }

  // 按 MentionType 分組股票分析
  const getStockAnalysesByType = () => {
    const analyses = getCurrentStockAnalyses()
    return {
      PRIMARY: analyses.filter(stock => stock.mentionType === 'PRIMARY'),
      CASE_STUDY: analyses.filter(stock => stock.mentionType === 'CASE_STUDY'), 
      COMPARISON: analyses.filter(stock => stock.mentionType === 'COMPARISON'),
      MENTION: analyses.filter(stock => stock.mentionType === 'MENTION'),
      UNCLASSIFIED: analyses.filter(stock => !stock.mentionType)
    }
  }

  // 獲取 mentionType 的配置
  const getMentionTypeConfig = (mentionType?: MentionType) => {
    switch (mentionType) {
      case "PRIMARY":
        return {
          icon: "🎯",
          title: "主要投資標的",
          bgColor: "bg-green-50/80",
          borderColor: "border-green-200",
          titleColor: "text-green-800"
        }
      case "CASE_STUDY":
        return {
          icon: "📚", 
          title: "案例研究",
          bgColor: "bg-blue-50/80",
          borderColor: "border-blue-200",
          titleColor: "text-blue-800"
        }
      case "COMPARISON":
        return {
          icon: "🔍",
          title: "比較分析", 
          bgColor: "bg-orange-50/80",
          borderColor: "border-orange-200",
          titleColor: "text-orange-800"
        }
      case "MENTION":
        return {
          icon: "👁️",
          title: "簡單提及",
          bgColor: "bg-gray-50/80", 
          borderColor: "border-gray-200",
          titleColor: "text-gray-700"
        }
      default:
        return {
          icon: "📊",
          title: "其他股票",
          bgColor: "bg-gray-50/80",
          borderColor: "border-gray-200", 
          titleColor: "text-gray-700"
        }
    }
  }

  // 渲染單個股票表格
  const renderStockTable = (
    analyses: StockAnalysis[], 
    type: MentionType | 'UNCLASSIFIED',
    config: {
      icon: string
      title: string  
      bgColor: string
      borderColor: string
      titleColor: string
    }
  ) => {
    if (analyses.length === 0) return null

    return (
      <div key={type} className={`rounded-xl border ${config.bgColor} ${config.borderColor} overflow-hidden`}>
        {/* 標題區域 */}
        <div className="p-4 border-b border-gray-200/50">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{config.icon}</span>
            <h4 className={`font-semibold text-base ${config.titleColor}`}>
              {config.title} ({analyses.length})
            </h4>
          </div>
        </div>
        
        {/* 表格區域 */}
        <div className="bg-white/80 overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="w-full">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-gray-200/50">
                <TableHead className="font-medium text-gray-700 w-[120px]">股票代號</TableHead>
                <TableHead className="font-medium text-gray-700">公司名稱</TableHead>
                <TableHead className="font-medium text-gray-700 w-[100px]">投資觀點</TableHead>
                <TableHead className="font-medium text-gray-700 w-[120px] text-center">信心度</TableHead>
                <TableHead className="font-medium text-gray-700 w-[80px] text-center">動作</TableHead>
                <TableHead className="font-medium text-gray-700 w-[60px] text-center">詳情</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analyses.map((stock, index) => {
                const originalIndex = getCurrentStockAnalyses().indexOf(stock)
                const rowKey = `${type}-${stock.symbol}`
                const isExpanded = isRowExpanded(rowKey)
                
                return (
                  <React.Fragment key={stock.symbol}>
                    {/* 主要數據行 */}
                    <TableRow className="hover:bg-gray-50/50 border-gray-200/30">
                      <TableCell className="font-bold text-gray-900">
                        {stock.symbol}
                      </TableCell>
                      <TableCell className="text-gray-700 break-words max-w-0">
                        {stock.companyName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getSentimentColor(stock.sentiment)}>
                          {getSentimentIcon(stock.sentiment)}
                          {getSentimentText(stock.sentiment)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {renderConfidenceStars(stock.confidence)}
                      </TableCell>
                      <TableCell className="text-center">
                        {addedStocks.has(stock.symbol) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            className="text-green-600 border-green-300 bg-green-50"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            已追蹤
                          </Button>
                        ) : isStockTracked(stock.symbol) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            className="text-orange-600 border-orange-300 bg-orange-50"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            已存在
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleAddToTracking(stock)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            追蹤
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRowExpansion(rowKey)}
                          className="h-8 w-8 p-0 hover:bg-gray-200/50"
                        >
                          <ChevronDown 
                            className={`h-4 w-4 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </Button>
                      </TableCell>
                    </TableRow>
                    
                    {/* 展開詳情行 */}
                    {isExpanded && (
                      <TableRow className="hover:bg-transparent border-0">
                        <TableCell colSpan={6} className="p-0">
                          <div className="bg-gray-50/50 p-4 border-t border-gray-200/30 max-w-full overflow-hidden">
                            {renderExpandedContent(stock, originalIndex)}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })}
            </TableBody>
          </Table>
          </div>
        </div>
      </div>
    )
  }

  // 渲染展開內容
  const renderExpandedContent = (stock: StockAnalysis, originalIndex: number) => {
    return (
      <div className="space-y-4 w-full max-w-full">
        
        {/* 分析理由 */}
        <div>
          <h6 className="text-sm font-medium text-gray-900 mb-2">分析理由</h6>
          <p className="text-sm text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
            {stock.reasoning}
          </p>
        </div>
        
        {/* 關鍵論點 */}
        {stock.keyPoints && stock.keyPoints.length > 0 && (
          <div>
            <h6 className="text-sm font-medium text-gray-900 mb-2">關鍵論點</h6>
            <ul className="space-y-2">
              {stock.keyPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                  <span className="leading-relaxed break-words">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI 識別依據 */}
        {stock.identificationReason && (
          <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200/50">
            <div className="flex items-start gap-2">
              <Bot className="h-4 w-4 text-amber-600 mt-1 flex-shrink-0" />
              <div>
                <h6 className="text-sm font-medium text-amber-900 mb-1">AI 識別依據</h6>
                <p className="text-sm text-amber-800 break-words">
                  {stock.identificationReason}
                </p>
              </div>
            </div>
          </div>
        )}
        
      </div>
    )
  }

  // 渲染按類型分組的股票分析（表格版）
  const renderStockAnalysesByType = () => {
    const groupedAnalyses = getStockAnalysesByType()
    const typeOrder: (MentionType | 'UNCLASSIFIED')[] = ['PRIMARY', 'CASE_STUDY', 'COMPARISON', 'MENTION', 'UNCLASSIFIED']
    
    return (
      <div className="space-y-6">
        {typeOrder.map(type => {
          const analyses = groupedAnalyses[type]
          const config = getMentionTypeConfig(type === 'UNCLASSIFIED' ? undefined : type as MentionType)
          return renderStockTable(analyses, type, config)
        })}
      </div>
    )
  }

  // 處理逐字稿的摺疊顯示
  const getDisplayedTranscript = () => {
    if (!transcript) return ""
    
    const lines = transcript.split('\n')
    if (isTranscriptCollapsed && lines.length > 10) {
      return lines.slice(0, 10).join('\n')
    }
    return transcript
  }

  const getRemainingLinesCount = () => {
    if (!transcript) return 0
    const lines = transcript.split('\n')
    return Math.max(0, lines.length - 10)
  }

  return (
    <div className="space-y-6">
      {/* API Key 設定對話框 */}
      <Dialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>API Key 設定</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Gemini API Key */}
            <div className="space-y-2">
              <Label htmlFor="gemini-api-key">Google Gemini API Key (必需)</Label>
              <div className="relative">
                <Input
                  id="gemini-api-key"
                  type={showApiKey ? "text" : "password"}
                  placeholder="請輸入您的 Gemini API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <div className="text-xs text-gray-600">
                <p>請至 <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a> 取得免費 API Key（用於 AI 分析）</p>
              </div>
            </div>

            {/* YouTube API Key */}
            <div className="space-y-2">
              <Label htmlFor="youtube-api-key">YouTube Data API Key (選填)</Label>
              <div className="relative">
                <Input
                  id="youtube-api-key"
                  type={showApiKey ? "text" : "password"}
                  placeholder="請輸入您的 YouTube Data API Key"
                  value={youtubeApiKey}
                  onChange={(e) => setYoutubeApiKey(e.target.value)}
                />
              </div>
              <div className="text-xs text-gray-600">
                <p>請至 <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a> 取得 API Key（用於獲取影片發布日期）</p>
                <p className="text-yellow-600 mt-1">⚠️ 選填：若未設定將使用當前日期作為追蹤起始日期</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setApiKeyDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleApiKeySave} disabled={!apiKey.trim()}>
                儲存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 主要分析界面 */}
      <Card className="border-0 shadow-xl bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base md:text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Youtube className="h-5 w-5 md:h-6 md:w-6 text-red-600 fill-red-600" />
            YouTube 股票分析
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="ml-auto">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>API Key 設定</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Gemini API Key */}
                  <div className="space-y-2">
                    <Label htmlFor="current-gemini-key">Google Gemini API Key</Label>
                    <div className="relative">
                      <Input
                        id="current-gemini-key"
                        type={showApiKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="請輸入 Gemini API Key"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  {/* YouTube API Key */}
                  <div className="space-y-2">
                    <Label htmlFor="current-youtube-key">YouTube Data API Key (選填)</Label>
                    <div className="relative">
                      <Input
                        id="current-youtube-key"
                        type={showApiKey ? "text" : "password"}
                        value={youtubeApiKey}
                        onChange={(e) => setYoutubeApiKey(e.target.value)}
                        placeholder="請輸入 YouTube Data API Key"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button onClick={handleApiKeySave}>儲存</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">YouTube 影片連結</Label>
              <div className="flex gap-2 md:gap-3">
                <div className="flex-1 relative">
                  <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 text-gray-400" />
                  <Input
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={!youtubeUrl.trim() || loading || !apiKey.trim()}
                  className="px-6 bg-red-600 hover:bg-red-700"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  {loading ? "分析中..." : "分析"}
                </Button>
              </div>
            </div>

            {!apiKey && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  請先設定 Google Gemini API Key 才能使用分析功能
                  <Button 
                    variant="link" 
                    className="p-0 h-auto ml-2" 
                    onClick={() => setApiKeyDialogOpen(true)}
                  >
                    立即設定
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI 分析 Loading Skeleton */}
      {isAnalyzing && (
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              AI 分析進行中...
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 影片資訊 skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-20" />
              <div className="p-4 bg-red-50 rounded-lg space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            </div>

            {/* 影片摘要 skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-20" />
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </div>

            {/* 整體市場觀點 skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>

            {/* 股票分析結果 skeleton - 只顯示主要投資標的表格 */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
              
              {/* 主要投資標的表格 skeleton */}
              <div className="rounded-xl border bg-green-50/80 border-green-200 overflow-hidden">
                {/* 標題區域 */}
                <div className="p-4 border-b border-gray-200/50">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎯</span>
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                
                {/* 表格區域 */}
                <div className="bg-white/80 overflow-hidden">
                  <div className="overflow-x-auto">
                    {/* 表頭 skeleton */}
                    <div className="border-b border-gray-200/50 p-4">
                      <div className="grid grid-cols-6 gap-4">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                    
                    {/* 表格行 skeleton */}
                    {[1, 2].map((i) => (
                      <div key={i} className="border-b border-gray-200/30 p-4">
                        <div className="grid grid-cols-6 gap-4 items-center">
                          <Skeleton className="h-4 w-14 font-bold" />
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-5 w-16 rounded-full" />
                          <div className="flex items-center gap-1">
                            <Skeleton className="h-3 w-3 rounded-full" />
                            <Skeleton className="h-3 w-3 rounded-full" />
                            <Skeleton className="h-3 w-3 rounded-full" />
                            <Skeleton className="h-3 w-8 ml-1" />
                          </div>
                          <Skeleton className="h-8 w-16 rounded-md" />
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 分析結果 */}
      {analysisResult && !isAnalyzing && (
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              分析結果
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 影片資訊 */}
            {analysisResult.videoTitle && (
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">影片資訊</h3>
                <div className="p-4 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-700 mb-2">{analysisResult.videoTitle}</h4>
                  <div className="flex items-center gap-4 text-xs text-red-600">
                    <span>發布日期: {analysisResult.publishDate ? new Date(analysisResult.publishDate).toLocaleDateString('zh-TW') : '未知'}</span>
                    <span>日期來源: {
                      analysisResult.dateSource === 'api' ? '✓ YouTube API' :
                      analysisResult.dateSource === 'manual' ? '⚙️ 手動設定' :
                      '⚠️ 系統預設'
                    }</span>
                  </div>
                </div>
              </div>
            )}

            {/* 影片摘要 */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">影片摘要</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {analysisResult.summary}
                </p>
              </div>
            </div>

            {/* 整體市場觀點 */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">整體市場觀點</h3>
              <Badge variant="outline" className={`${getSentimentColor(analysisResult.overallSentiment)} inline-flex items-center gap-1`}>
                {getSentimentIcon(analysisResult.overallSentiment)}
                {getSentimentText(analysisResult.overallSentiment)}
              </Badge>
            </div>

            {/* 股票分析結果 */}
            {getCurrentStockAnalyses().length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">
                    股票分析結果 ({getCurrentStockAnalyses().length} 支股票)
                  </h3>
                  <Button
                    onClick={() => setShowAddStockDialog(true)}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    新增股票
                  </Button>
                </div>
                
                {renderStockAnalysesByType()}
              </div>
            )}

            {getCurrentStockAnalyses().length === 0 && analysisResult && (
              <div className="space-y-3">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    AI 沒有識別出股票代號，您可以手動新增
                  </AlertDescription>
                </Alert>
                <div className="flex justify-center">
                  <Button
                    onClick={() => setShowAddStockDialog(true)}
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    手動新增股票
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 逐字稿內容 */}
      {transcript && (
        <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center justify-between">
              影片逐字稿
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsTranscriptCollapsed(!isTranscriptCollapsed)}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
              >
                {isTranscriptCollapsed ? (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    展開全文
                  </>
                ) : (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    收合
                  </>
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Textarea
                value={getDisplayedTranscript()}
                readOnly
                className={`text-sm resize-none ${isTranscriptCollapsed ? 'min-h-[240px]' : 'min-h-[400px]'}`}
                placeholder="逐字稿內容..."
              />
              {isTranscriptCollapsed && getRemainingLinesCount() > 0 && (
                <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                  <span>還有 {getRemainingLinesCount()} 行內容未顯示</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 手動新增股票對話框 */}
      <Dialog open={showAddStockDialog} onOpenChange={setShowAddStockDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新增股票</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="new-stock-symbol">股票代號</Label>
                <Input
                  id="new-stock-symbol"
                  placeholder="如 AAPL"
                  value={newStock.symbol || ''}
                  onChange={(e) => setNewStock({...newStock, symbol: e.target.value.toUpperCase()})}
                />
              </div>
              <div>
                <Label htmlFor="new-stock-company">公司名稱</Label>
                <Input
                  id="new-stock-company"
                  placeholder="Apple Inc."
                  value={newStock.companyName || ''}
                  onChange={(e) => setNewStock({...newStock, companyName: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="new-stock-sentiment">投資觀點</Label>
                <select
                  id="new-stock-sentiment"
                  value={newStock.sentiment || 'neutral'}
                  onChange={(e) => setNewStock({...newStock, sentiment: e.target.value as "bullish" | "bearish" | "neutral"})}
                  className="w-full h-10 text-sm border border-gray-300 rounded px-3"
                >
                  <option value="bullish">看多</option>
                  <option value="bearish">看空</option>
                  <option value="neutral">中性</option>
                </select>
              </div>
              <div>
                <Label htmlFor="new-stock-confidence">信心度 (%)</Label>
                <Input
                  id="new-stock-confidence"
                  type="number"
                  min="0"
                  max="100"
                  value={newStock.confidence || 50}
                  onChange={(e) => setNewStock({...newStock, confidence: parseInt(e.target.value) || 50})}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="new-stock-reasoning">分析理由</Label>
              <Textarea
                id="new-stock-reasoning"
                placeholder="請說明您為什麼對這支股票有這個觀點..."
                value={newStock.reasoning || ''}
                onChange={(e) => setNewStock({...newStock, reasoning: e.target.value})}
                className="min-h-[80px] resize-none"
              />
            </div>
            
            {error && newStock.symbol && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddStockDialog(false)
                  setNewStock({ sentiment: "neutral", confidence: 50 })
                  setError(null)
                }}
              >
                取消
              </Button>
              <Button
                onClick={handleAddNewStock}
                disabled={!newStock.symbol || !newStock.companyName}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                新增
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}