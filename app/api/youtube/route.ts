import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "YouTube URL 為必填項目" }, { status: 400 })
    }

    // 驗證是否為有效的 YouTube URL
    const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/
    if (!youtubeRegex.test(url)) {
      return NextResponse.json({ error: "請提供有效的 YouTube URL" }, { status: 400 })
    }

    try {
      // 調用 Vercel Python Function
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000'
      
      const pythonFunctionUrl = `${baseUrl}/api/youtube-transcript`
      
      const response = await fetch(pythonFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
        // 30秒超時
        signal: AbortSignal.timeout(30000)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '未知錯誤' }))
        return NextResponse.json(
          { error: errorData.error || "逐字稿提取過程中發生錯誤" },
          { status: response.status }
        )
      }

      const result = await response.json()

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "無法獲取 YouTube 影片逐字稿" },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        videoId: result.video_id,
        transcript: result.transcript,
        language: result.language,
        url: url
      })

    } catch (error) {
      console.error("調用 Python Function 時發生錯誤:", error)
      
      // 檢查是否為超時錯誤
      if (error instanceof Error && error.name === 'TimeoutError') {
        return NextResponse.json(
          { error: "逐字稿提取超時，請稍後再試" },
          { status: 408 }
        )
      }

      // 檢查是否為網路錯誤
      if (error instanceof Error && error.message.includes('fetch')) {
        return NextResponse.json(
          { error: "無法連接到逐字稿服務，請稍後再試" },
          { status: 503 }
        )
      }

      return NextResponse.json(
        { error: "無法處理您的請求，請確認影片包含逐字稿" },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("YouTube API 錯誤:", error)
    return NextResponse.json(
      { error: "伺服器內部錯誤" },
      { status: 500 }
    )
  }
}