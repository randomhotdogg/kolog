// 股票搜索結果數據結構
export interface StockSearchResult {
  symbol: string
  companyName: string
  exchange?: string
  currency?: string
}

// 股票提及類型
export type MentionType = 'PRIMARY' | 'CASE_STUDY' | 'COMPARISON' | 'MENTION'

// 影片提及公司數據結構
export interface MentionedCompany {
  companyName: string
  context: string
  confidence: number
  mentionType?: MentionType
  searchStatus?: 'pending' | 'found' | 'not_found' | 'error'
  searchedSymbol?: string
  searchResults?: StockSearchResult[]
}

// YouTube 分析數據結構
export interface YouTubeAnalysis {
  videoUrl: string
  videoId: string
  videoTitle?: string // 影片標題
  author?: string // 影片作者/頻道名稱
  summary: string
  sentiment: "bullish" | "bearish" | "neutral"
  confidence: number // 0-100
  reasoning: string
  keyPoints: string[]
  analyzedAt: Date
  publishDate?: Date
  dateSource: "api" | "manual" | "fallback" // 日期來源
  mentionedCompanies?: MentionedCompany[] // 影片提及的公司
}

// 追蹤股票的數據結構
export interface TrackedStock {
  symbol: string
  companyName: string
  customName?: string // 用戶自定義的追蹤名稱，最多15字
  startTrackingDate: Date
  startPrice: number
  currency: string
  addedAt: Date
  youtubeAnalysis?: YouTubeAnalysis // YouTube 分析來源（選填）
}

// 追蹤股票表現數據
export interface TrackingPerformance {
  symbol: string
  currentPrice: number
  startPrice: number
  priceChange: number
  percentChange: number
  trackingDays: number
  data: Array<{
    date: string
    timestamp: number
    open: number
    high: number
    low: number
    close: number
    volume: number
  }>
  allData?: Array<{
    date: string
    timestamp: number
    open: number
    high: number
    low: number
    close: number
    volume: number
  }>
  trackingStartTimestamp?: number
}

// 本地存儲的鍵名
const TRACKING_STORAGE_KEY = "tracked-stocks"
const GEMINI_API_KEY_STORAGE_KEY = "gemini-api-key"
const YOUTUBE_API_KEY_STORAGE_KEY = "youtube-api-key"

// 獲取所有追蹤的股票
export function getTrackedStocks(): TrackedStock[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(TRACKING_STORAGE_KEY)
    if (!stored) return []

    const parsed = JSON.parse(stored)
    return parsed.map((stock: Omit<TrackedStock, "startTrackingDate" | "addedAt"> & { startTrackingDate: string; addedAt: string }) => ({
      ...stock,
      startTrackingDate: new Date(stock.startTrackingDate),
      addedAt: new Date(stock.addedAt),
      // 處理 YouTube 分析日期轉換
      youtubeAnalysis: stock.youtubeAnalysis ? {
        ...stock.youtubeAnalysis,
        analyzedAt: new Date(stock.youtubeAnalysis.analyzedAt),
        publishDate: stock.youtubeAnalysis.publishDate ? new Date(stock.youtubeAnalysis.publishDate) : undefined
      } : undefined
    }))
  } catch (error) {
    console.error("Error loading tracked stocks:", error)
    return []
  }
}

// 添加股票到追蹤清單
export function addTrackedStock(stock: Omit<TrackedStock, "addedAt">): void {
  if (typeof window === "undefined") return

  try {
    const currentStocks = getTrackedStocks()

    // 檢查是否已經追蹤該股票
    const existingIndex = currentStocks.findIndex((s) => s.symbol === stock.symbol)

    const newStock: TrackedStock = {
      ...stock,
      addedAt: new Date(),
    }

    if (existingIndex >= 0) {
      // 更新現有股票
      currentStocks[existingIndex] = newStock
    } else {
      // 添加新股票
      currentStocks.push(newStock)
    }

    localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(currentStocks))
  } catch (error) {
    console.error("Error saving tracked stock:", error)
  }
}

// 移除追蹤的股票
export function removeTrackedStock(symbol: string): void {
  if (typeof window === "undefined") return

  try {
    const currentStocks = getTrackedStocks()
    const filteredStocks = currentStocks.filter((stock) => stock.symbol !== symbol)
    localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(filteredStocks))
  } catch (error) {
    console.error("Error removing tracked stock:", error)
  }
}

// 檢查股票是否已被追蹤
export function isStockTracked(symbol: string): boolean {
  const trackedStocks = getTrackedStocks()
  return trackedStocks.some((stock) => stock.symbol === symbol)
}

// 獲取特定股票的追蹤資訊
export function getTrackedStock(symbol: string): TrackedStock | null {
  const trackedStocks = getTrackedStocks()
  return trackedStocks.find((stock) => stock.symbol === symbol) || null
}

// 更新追蹤股票的自定義名稱
export function updateTrackedStockName(symbol: string, customName: string): void {
  if (typeof window === "undefined") return

  try {
    const currentStocks = getTrackedStocks()
    const stockIndex = currentStocks.findIndex((stock) => stock.symbol === symbol)

    if (stockIndex >= 0) {
      // 限制字數最多15字
      const trimmedName = customName.trim().slice(0, 15)
      currentStocks[stockIndex].customName = trimmedName || undefined
      localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(currentStocks))
    }
  } catch (error) {
    console.error("Error updating tracked stock name:", error)
  }
}

// 新增帶有 YouTube 分析的追蹤股票
export function addTrackedStockWithYouTubeAnalysis(
  stockData: {
    symbol: string
    companyName: string
    startTrackingDate: Date
    startPrice: number
    currency: string
  },
  youtubeAnalysis: Omit<YouTubeAnalysis, "analyzedAt"> & { analyzedAt?: Date }
): void {
  if (typeof window === "undefined") return

  try {
    const analysisWithDate: YouTubeAnalysis = {
      ...youtubeAnalysis,
      analyzedAt: youtubeAnalysis.analyzedAt || new Date()
    }

    const newStock: TrackedStock = {
      ...stockData,
      addedAt: new Date(),
      youtubeAnalysis: analysisWithDate
    }

    const currentStocks = getTrackedStocks()
    const existingIndex = currentStocks.findIndex((s) => s.symbol === stockData.symbol)

    if (existingIndex >= 0) {
      // 更新現有股票，保留 YouTube 分析
      currentStocks[existingIndex] = newStock
    } else {
      // 添加新股票
      currentStocks.push(newStock)
    }

    localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(currentStocks))
  } catch (error) {
    console.error("Error saving tracked stock with YouTube analysis:", error)
  }
}

// 獲取有 YouTube 分析的追蹤股票
export function getTrackedStocksWithYouTubeAnalysis(): TrackedStock[] {
  return getTrackedStocks().filter((stock) => stock.youtubeAnalysis)
}

// Gemini API Key 管理
export function saveGeminiApiKey(apiKey: string): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, apiKey)
  } catch (error) {
    console.error("Error saving Gemini API key:", error)
  }
}

export function getGeminiApiKey(): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)
  } catch (error) {
    console.error("Error loading Gemini API key:", error)
    return null
  }
}

export function removeGeminiApiKey(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY)
  } catch (error) {
    console.error("Error removing Gemini API key:", error)
  }
}

// YouTube API Key 管理
export function saveYouTubeApiKey(apiKey: string): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(YOUTUBE_API_KEY_STORAGE_KEY, apiKey)
  } catch (error) {
    console.error("Error saving YouTube API key:", error)
  }
}

export function getYouTubeApiKey(): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(YOUTUBE_API_KEY_STORAGE_KEY)
  } catch (error) {
    console.error("Error loading YouTube API key:", error)
    return null
  }
}

export function removeYouTubeApiKey(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(YOUTUBE_API_KEY_STORAGE_KEY)
  } catch (error) {
    console.error("Error removing YouTube API key:", error)
  }
}
