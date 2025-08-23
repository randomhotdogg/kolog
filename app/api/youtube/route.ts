import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"

const execAsync = promisify(exec)

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
      // 執行 Python 腳本來獲取逐字稿
      const scriptPath = path.join(process.cwd(), "scripts", "youtube_transcript.py")
      const venvPath = path.join(process.cwd(), "venv", "bin", "python")
      const pythonCommand = `"${venvPath}" "${scriptPath}" "${url}"`
      
      const { stdout, stderr } = await execAsync(pythonCommand, {
        timeout: 30000, // 30秒超時
        cwd: process.cwd()
      })

      if (stderr) {
        console.error("Python script stderr:", stderr)
        return NextResponse.json(
          { error: "逐字稿提取過程中發生錯誤" },
          { status: 500 }
        )
      }

      // 解析 Python 腳本的輸出
      const result = JSON.parse(stdout)

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
      console.error("執行 Python 腳本時發生錯誤:", error)
      
      // 檢查是否為超時錯誤
      if (error instanceof Error && error.message.includes('timeout')) {
        return NextResponse.json(
          { error: "逐字稿提取超時，請稍後再試" },
          { status: 408 }
        )
      }

      // 檢查是否為 Python 環境問題
      if (error instanceof Error && error.message.includes('python3')) {
        return NextResponse.json(
          { error: "系統環境配置錯誤，請聯繫管理員" },
          { status: 500 }
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