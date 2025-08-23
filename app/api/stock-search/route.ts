import { type NextRequest, NextResponse } from "next/server"

// Yahoo Finance Search API 回應介面
interface YahooFinanceSearchResult {
  symbol: string
  longname?: string
  shortname?: string
  exchDisp?: string
  typeDisp?: string
}

interface YahooFinanceSearchResponse {
  explains?: any[]
  count?: number
  quotes?: YahooFinanceSearchResult[]
  news?: any[]
  nav?: any[]
}

// 我們的 API 回應格式
interface StockSearchResult {
  symbol: string
  name: string
  exchange: string
  type: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "查詢參數不能為空" },
        { status: 400 }
      )
    }

    const cleanQuery = query.trim()

    // 調用 Yahoo Finance Search API
    const yahooUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(cleanQuery)}`
    
    console.log(`搜索股票: ${cleanQuery}`)
    
    const response = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      console.error(`Yahoo Finance API 錯誤: ${response.status}`)
      return NextResponse.json(
        { error: "無法連接到股票搜索服務" },
        { status: 503 }
      )
    }

    const data: YahooFinanceSearchResponse = await response.json()
    
    // 過濾和處理搜索結果
    const validResults: StockSearchResult[] = []
    
    if (data.quotes && Array.isArray(data.quotes)) {
      for (const quote of data.quotes) {
        // 只處理美股（NYSE, NASDAQ 等）
        const exchange = quote.exchDisp || ''
        const isUSStock = ['NYSE', 'NASDAQ', 'NYSEArca', 'BATS', 'NAS', 'NYQ', 'NMS'].includes(exchange)
        
        // 確保有有效的股票代號和名稱
        const hasValidSymbol = quote.symbol && /^[A-Z]{1,5}(\.[A-Z])?$/.test(quote.symbol)
        const hasValidName = quote.longname || quote.shortname
        
        if (isUSStock && hasValidSymbol && hasValidName) {
          validResults.push({
            symbol: quote.symbol,
            name: quote.longname || quote.shortname || quote.symbol,
            exchange: exchange,
            type: quote.typeDisp || 'Stock'
          })
        }
      }
    }

    // 按照相關性排序（名稱包含查詢詞的排在前面）
    const sortedResults = validResults.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().includes(cleanQuery.toLowerCase())
      const bNameMatch = b.name.toLowerCase().includes(cleanQuery.toLowerCase())
      
      if (aNameMatch && !bNameMatch) return -1
      if (!aNameMatch && bNameMatch) return 1
      
      // 如果都匹配或都不匹配，按名稱長度排序（更短的可能更準確）
      return a.name.length - b.name.length
    })

    // 限制返回結果數量
    const limitedResults = sortedResults.slice(0, 5)

    console.log(`搜索 "${cleanQuery}" 找到 ${limitedResults.length} 個結果`)

    return NextResponse.json({
      success: true,
      query: cleanQuery,
      count: limitedResults.length,
      results: limitedResults
    })

  } catch (error) {
    console.error("股票搜索 API 錯誤:", error)
    return NextResponse.json(
      { error: "搜索過程中發生錯誤" },
      { status: 500 }
    )
  }
}