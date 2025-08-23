import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const symbol = searchParams.get("symbol")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  if (!symbol) {
    return NextResponse.json({ error: "股票代號為必填項目" }, { status: 400 })
  }

  const cleanSymbol = symbol.trim().toUpperCase()
  if (!/^[A-Z]{1,5}$/.test(cleanSymbol)) {
    return NextResponse.json(
      {
        error: "股票代號格式不正確",
        details: "請輸入1-5個英文字母的有效美股代號（如：AAPL、MSFT、GOOGL）",
      },
      { status: 400 },
    )
  }

  try {
    let url = `https://query1.finance.yahoo.com/v8/finance/chart/${cleanSymbol}?`

    if (startDate && endDate) {
      let start: number, end: number

      // 檢查是否為Unix時間戳（數字字符串）
      if (!isNaN(Number(startDate)) && !isNaN(Number(endDate))) {
        // 前端傳遞的是Unix時間戳（秒）
        start = Number(startDate)
        end = Number(endDate)
      } else {
        // 傳遞的是日期字符串，需要轉換
        const startDateObj = new Date(startDate)
        const endDateObj = new Date(endDate)

        // 驗證日期是否有效
        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
          console.error("Invalid date format:", { startDate, endDate })
          return NextResponse.json({ error: "日期格式不正確" }, { status: 400 })
        }

        start = Math.floor(startDateObj.getTime() / 1000)
        end = Math.floor(endDateObj.getTime() / 1000)
      }

      // 驗證時間戳是否合理
      if (start <= 0 || end <= 0 || start >= end) {
        console.error("Invalid timestamp range:", { start, end })
        return NextResponse.json({ error: "日期範圍不正確" }, { status: 400 })
      }

      url += `period1=${start}&period2=${end}&interval=1d&includePrePost=true&events=div%2Csplit`
    } else {
      // 默認獲取最近3個月的數據
      const end = Math.floor(Date.now() / 1000)
      const start = end - 90 * 24 * 60 * 60 // 90天前
      url += `period1=${start}&period2=${end}&interval=1d&includePrePost=true&events=div%2Csplit`
    }

    console.log("Fetching from URL:", url) // 添加調試日誌

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
      },
    })

    if (!response.ok) {
      console.error("API Response not OK:", response.status, response.statusText)
      return NextResponse.json(
        {
          error: "股票代號輸入錯誤",
        },
        { status: 400 },
      )
    }

    const data = await response.json()
    console.log("API Response structure:", JSON.stringify(data, null, 2).substring(0, 500)) // 添加響應結構日誌

    if (data.chart?.error) {
      console.error("Yahoo Finance API Error:", data.chart.error)
      const errorCode = data.chart.error.code
      const errorDescription = data.chart.error.description

      if (errorCode === "Not Found" || errorDescription?.includes("No data found")) {
        return NextResponse.json(
          {
            error: "股票代號不存在",
            details: `找不到股票代號 "${cleanSymbol}"，請確認代號是否正確或該股票是否已下市`,
          },
          { status: 404 },
        )
      }

      return NextResponse.json(
        {
          error: "股票數據獲取失敗",
          details: errorDescription || "Yahoo Finance API 返回錯誤",
        },
        { status: 400 },
      )
    }

    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      console.error("Invalid data structure:", data)
      return NextResponse.json(
        {
          error: "股票代號不存在",
          details: `找不到股票代號 "${cleanSymbol}" 的數據，請確認代號是否正確`,
        },
        { status: 404 },
      )
    }

    const result = data.chart.result[0]

    const meta = result.meta
    const timestamps = result.timestamp
    const quotes = result.indicators?.quote?.[0]

    if (!timestamps || !quotes || !meta) {
      console.error("Missing required data fields:", { timestamps: !!timestamps, quotes: !!quotes, meta: !!meta })
      return NextResponse.json(
        {
          error: "股票數據格式不完整，請稍後再試",
        },
        { status: 500 },
      )
    }

    // 處理數據格式
    const stockData = timestamps
      .map((timestamp: number, index: number) => ({
        date: new Date(timestamp * 1000).toISOString().split("T")[0],
        timestamp: timestamp,
        open: quotes.open?.[index] || null,
        high: quotes.high?.[index] || null,
        low: quotes.low?.[index] || null,
        close: quotes.close?.[index] || null,
        volume: quotes.volume?.[index] || null,
      }))
      .filter((item: { close: number | null }) => item.close !== null && !isNaN(item.close as number))

    if (stockData.length === 0) {
      return NextResponse.json(
        {
          error: "該時間範圍內沒有有效的股票數據",
        },
        { status: 404 },
      )
    }

    let filteredData = stockData
    if (!startDate || !endDate) {
      filteredData = stockData.slice(-30)
    }

    const currentPrice = meta.regularMarketPrice || meta.previousClose || 0
    const previousClose = meta.previousClose || 0
    const change = currentPrice - previousClose
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0

    return NextResponse.json({
      symbol: meta.symbol || cleanSymbol,
      companyName: meta.longName || meta.shortName || meta.symbol || cleanSymbol,
      currency: meta.currency || "USD",
      currentPrice: currentPrice,
      previousClose: previousClose,
      change: change,
      changePercent: changePercent,
      data: filteredData,
      meta: {
        timezone: meta.timezone || "America/New_York",
        exchangeName: meta.exchangeName || "Unknown",
        marketState: meta.marketState || "UNKNOWN",
      },
    })
  } catch (error) {
    console.error("獲取股票數據時發生錯誤:", error)

    return NextResponse.json(
      {
        error: "股票代號輸入錯誤",
      },
      { status: 400 },
    )
  }
}
