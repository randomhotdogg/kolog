"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {  
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ExternalLink,
  Calendar,
  Bot,
  User,
  MessageSquare,
  Lightbulb,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Star,
  Target,
  BookOpen,
  BarChart3,
  Eye,
  Quote
} from "lucide-react"
import { type YouTubeAnalysis, type MentionType } from "@/lib/tracking-storage"

interface YouTubeAnalysisCardProps {
  analysis: YouTubeAnalysis
  className?: string
}

export function YouTubeAnalysisCard({ analysis, className = "" }: YouTubeAnalysisCardProps) {
  // MentionType 相關函數
  const getMentionTypeIcon = (mentionType?: MentionType) => {
    switch (mentionType) {
      case "PRIMARY":
        return <Target className="h-4 w-4 text-green-600" />
      case "CASE_STUDY":
        return <BookOpen className="h-4 w-4 text-blue-600" />
      case "COMPARISON":
        return <BarChart3 className="h-4 w-4 text-orange-600" />
      case "MENTION":
        return <Eye className="h-4 w-4 text-gray-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  const getMentionTypeColor = (mentionType?: MentionType) => {
    switch (mentionType) {
      case "PRIMARY":
        return "text-green-700 bg-green-50 border-green-200"
      case "CASE_STUDY":
        return "text-blue-700 bg-blue-50 border-blue-200"
      case "COMPARISON":
        return "text-orange-700 bg-orange-50 border-orange-200"
      case "MENTION":
        return "text-gray-600 bg-gray-50 border-gray-200"
      default:
        return "text-gray-500 bg-gray-50 border-gray-200"
    }
  }

  const getMentionTypeText = (mentionType?: MentionType) => {
    switch (mentionType) {
      case "PRIMARY":
        return "主要標的"
      case "CASE_STUDY":
        return "案例研究"
      case "COMPARISON":
        return "對比分析"
      case "MENTION":
        return "簡單提及"
      default:
        return "未分類"
    }
  }

  const getConfidenceStars = (confidence: number) => {
    if (confidence >= 90) return 3
    if (confidence >= 70) return 2
    if (confidence >= 50) return 1
    return 0
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const openYouTubeVideo = () => {
    window.open(analysis.videoUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <Card className={`relative overflow-hidden bg-gradient-to-br from-red-50/30 via-white to-white border border-red-100 shadow-lg flex flex-col ${className}`}>
      {/* 頂部裝飾條 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-red-500"></div>
      
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-start gap-3">
          
          <div className="flex-1 min-w-0">
            {analysis.videoTitle ? (
              <>
                <h3 className="text-base font-bold text-gray-900 leading-tight mb-2" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {analysis.videoTitle}
                </h3>
                {analysis.author && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <User className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{analysis.author}</span>
                  </div>
                )}
              </>
            ) : (
              analysis.author && (
                <div className="flex items-center gap-1.5 text-base font-semibold text-gray-900">
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span>{analysis.author}</span>
                </div>
              )
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={openYouTubeVideo}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex-shrink-0 p-2 h-8 w-8 rounded-lg transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden px-4 pb-4">
        <div className="h-full overflow-y-auto space-y-4">
          
          {/* 分析概覽標籤 */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={`${getSentimentColor(analysis.sentiment)} inline-flex items-center gap-1.5 text-xs px-2 py-1 font-medium`}>
              {getSentimentIcon(analysis.sentiment)}
              {getSentimentText(analysis.sentiment)}
            </Badge>
            <Badge variant="outline" className="inline-flex items-center gap-1.5 text-xs px-2 py-1 text-gray-600 border-gray-200">
              <Calendar className="h-3 w-3" />
              {analysis.publishDate ? formatDate(analysis.publishDate) : formatDate(analysis.analyzedAt)}
            </Badge>
          </div>

          {/* 影片摘要 */}
          <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4 text-gray-600" />
              <h4 className="text-sm font-semibold text-gray-900">影片摘要</h4>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {analysis.summary}
            </p>
          </div>

          {/* 影片提及公司與對應股票代號 */}
          {analysis.mentionedCompanies && analysis.mentionedCompanies.length > 0 && (
            <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-indigo-600" />
                <h4 className="text-sm font-semibold text-gray-900">影片提及公司與對應股票代號</h4>
              </div>
              <div className="bg-white rounded-lg border border-indigo-100 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-medium text-gray-600">公司名稱</TableHead>
                      <TableHead className="text-xs font-medium text-gray-600">股票代號</TableHead>
                      <TableHead className="text-xs font-medium text-gray-600 text-center">信心度</TableHead>
                      <TableHead className="text-xs font-medium text-gray-600 text-center">狀態</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.mentionedCompanies.map((company, index) => (
                      <TableRow key={index} className="hover:bg-indigo-50/30">
                        <TableCell className="text-sm font-medium text-gray-900">
                          {company.companyName}
                        </TableCell>
                        <TableCell className="text-sm text-gray-700">
                          {company.searchedSymbol ? (
                            <Badge variant="outline" className="text-xs px-2 py-0.5 text-green-700 bg-green-50 border-green-200 font-medium">
                              {company.searchedSymbol}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 text-center">
                          {company.confidence}%
                        </TableCell>
                        <TableCell className="text-center">
                          {company.searchStatus === 'found' && (
                            <div className="flex items-center justify-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              <span className="text-xs">已找到</span>
                            </div>
                          )}
                          {company.searchStatus === 'not_found' && (
                            <div className="flex items-center justify-center gap-1 text-gray-500">
                              <XCircle className="h-3 w-3" />
                              <span className="text-xs">未找到</span>
                            </div>
                          )}
                          {company.searchStatus === 'error' && (
                            <div className="flex items-center justify-center gap-1 text-amber-600">
                              <AlertCircle className="h-3 w-3" />
                              <span className="text-xs">錯誤</span>
                            </div>
                          )}
                          {!company.searchStatus && (
                            <div className="flex items-center justify-center gap-1 text-gray-400">
                              <span className="text-xs">待處理</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="text-xs text-gray-500 pt-3 flex items-center gap-1.5">
                <Search className="h-3 w-3" />
                共找到 {analysis.mentionedCompanies.filter(c => c.searchStatus === 'found').length} 個對應股票代號
              </div>
            </div>
          )}

          {/* 分析理由 */}
          <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-3">
              <Bot className="h-4 w-4 text-blue-600" />
              <h4 className="text-sm font-semibold text-gray-900">AI 分析理由</h4>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {analysis.reasoning}
            </p>
          </div>

          {/* 關鍵論點 */}
          {analysis.keyPoints.length > 0 && (
            <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-amber-600" />
                <h4 className="text-sm font-semibold text-gray-900">關鍵論點</h4>
              </div>
              <ul className="space-y-2">
                {analysis.keyPoints.map((point, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0"></span>
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 影片提及公司 */}
          {analysis.mentionedCompanies && analysis.mentionedCompanies.length > 0 && (
            <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-100">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-purple-600" />
                <h4 className="text-sm font-semibold text-gray-900">影片提及公司</h4>
              </div>
              <div className="space-y-3">
                {analysis.mentionedCompanies.map((company, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 border border-purple-100">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{company.companyName}</span>
                          {company.searchStatus === 'found' && company.searchedSymbol && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5 text-green-600 bg-green-50 border-green-200">
                              找到代號: {company.searchedSymbol}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mb-2">提及內容: "{company.context}"</p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-500">信心度: {company.confidence}%</span>
                          {company.searchStatus === 'found' && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              <span>已轉換為股票分析</span>
                            </div>
                          )}
                          {company.searchStatus === 'not_found' && (
                            <div className="flex items-center gap-1 text-gray-500">
                              <XCircle className="h-3 w-3" />
                              <span>未找到對應股票</span>
                            </div>
                          )}
                          {company.searchStatus === 'error' && (
                            <div className="flex items-center gap-1 text-amber-600">
                              <AlertCircle className="h-3 w-3" />
                              <span>搜索時發生錯誤</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {company.searchStatus === 'found' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {company.searchStatus === 'not_found' && (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                        {company.searchStatus === 'error' && (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="text-xs text-gray-500 pt-2 border-t border-purple-200/60 flex items-center gap-1.5">
                  <Search className="h-3 w-3" />
                  自動搜索結果：共找到 {analysis.mentionedCompanies.filter(c => c.searchStatus === 'found').length} 個對應股票代號
                </div>
              </div>
            </div>
          )}

          {/* 發布日期（如果有的話） */}
          {analysis.publishDate && (
            <div className="text-xs text-gray-500 pt-2 border-t border-gray-200/60 flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              影片發布日期: {formatDate(analysis.publishDate)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}