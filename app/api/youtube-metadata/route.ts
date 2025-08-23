import { type NextRequest, NextResponse } from "next/server"

interface YouTubeMetadata {
  videoId: string
  title: string
  publishedAt: string
  description: string
  channelTitle: string
  thumbnails: {
    default: { url: string }
    medium: { url: string }
    high: { url: string }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { videoId, apiKey } = await request.json()

    if (!videoId) {
      return NextResponse.json({ error: "影片 ID 為必填項目" }, { status: 400 })
    }

    if (!apiKey) {
      return NextResponse.json({ error: "YouTube Data API Key 為必填項目" }, { status: 400 })
    }

    try {
      // 使用 YouTube Data API v3 獲取影片資訊
      const youtubeApiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
      
      const response = await fetch(youtubeApiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("YouTube Data API 錯誤:", errorData)
        
        if (response.status === 403) {
          const errorMessage = errorData.error?.message || ""
          if (errorMessage.includes("quotaExceeded")) {
            return NextResponse.json(
              { error: "YouTube API 配額已用完，請稍後再試或檢查 API Key 限制" },
              { status: 429 }
            )
          } else {
            return NextResponse.json(
              { error: "YouTube API Key 無效或權限不足" },
              { status: 403 }
            )
          }
        } else if (response.status === 400) {
          return NextResponse.json(
            { error: "無效的影片 ID 或 API 請求格式錯誤" },
            { status: 400 }
          )
        } else {
          return NextResponse.json(
            { error: "YouTube Data API 暫時無法使用" },
            { status: 500 }
          )
        }
      }

      const data = await response.json()
      
      // 檢查是否找到影片
      if (!data.items || data.items.length === 0) {
        return NextResponse.json(
          { error: "找不到指定的 YouTube 影片" },
          { status: 404 }
        )
      }

      const videoData = data.items[0]
      const snippet = videoData.snippet

      if (!snippet) {
        return NextResponse.json(
          { error: "無法獲取影片詳細資訊" },
          { status: 500 }
        )
      }

      // 格式化回傳資料
      const metadata: YouTubeMetadata = {
        videoId: videoId,
        title: snippet.title || "無標題",
        publishedAt: snippet.publishedAt, // ISO 8601 格式
        description: snippet.description || "",
        channelTitle: snippet.channelTitle || "未知頻道",
        thumbnails: {
          default: snippet.thumbnails?.default || { url: "" },
          medium: snippet.thumbnails?.medium || { url: "" },
          high: snippet.thumbnails?.high || { url: "" }
        }
      }

      return NextResponse.json({
        success: true,
        metadata: metadata,
        publishDate: new Date(snippet.publishedAt).toISOString()
      })

    } catch (fetchError) {
      console.error("呼叫 YouTube Data API 時發生錯誤:", fetchError)
      return NextResponse.json(
        { error: "無法連接到 YouTube 服務，請檢查網路連線" },
        { status: 503 }
      )
    }

  } catch (error) {
    console.error("YouTube 元數據 API 端點錯誤:", error)
    return NextResponse.json(
      { error: "伺服器內部錯誤" },
      { status: 500 }
    )
  }
}