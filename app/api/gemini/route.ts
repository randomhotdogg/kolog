import { type NextRequest, NextResponse } from "next/server"

// Gemini API 分析結果介面
interface StockAnalysis {
  symbol: string
  companyName: string
  sentiment: "bullish" | "bearish" | "neutral"
  confidence: number // 0-100
  reasoning: string
  keyPoints: string[]
}

interface MentionedCompany {
  companyName: string
  context: string
  confidence: number
}

interface GeminiAnalysisResult {
  videoTitle?: string
  summary: string
  stockAnalyses: StockAnalysis[]
  overallSentiment: "bullish" | "bearish" | "neutral"
  publishDate?: string
  mentionedCompanies?: MentionedCompany[]
}

export async function POST(request: NextRequest) {
  try {
    const { transcript, apiKey, videoUrl } = await request.json()

    if (!transcript) {
      return NextResponse.json({ error: "逐字稿內容為必填項目" }, { status: 400 })
    }

    if (!apiKey) {
      return NextResponse.json({ error: "Google Gemini API Key 為必填項目" }, { status: 400 })
    }

    // 建立分析 prompt
    const analysisPrompt = `
你是一位專業的美股分析師。請仔細分析以下 YouTube 影片逐字稿，識別其中提到的美股股票，並提供投資觀點分析。

逐字稿內容：
${transcript}

## 股票提及類型分類（新增 - 最重要）

請根據上下文判斷每個股票的提及類型：

**主要投資標的（PRIMARY）**：
- 作者明確推薦買入/賣出/持有的股票
- 詳細分析財務表現、業務前景的公司
- 影片的主要討論焦點
- 給出具體投資建議或價格目標

**案例參考（CASE_STUDY）**：
- 作為成功/失敗例子的歷史案例
- 用來說明投資策略或市場趨勢的範例
- "像是..."、"例如..."、"曾經..."等語境

**比較對象（COMPARISON）**：
- 用作行業比較、競爭分析的公司
- 簡單提及但非投資焦點的標的
- "相比之下..."、"跟XX比較..."等語境

**簡單提及（MENTION）**：
- 僅作為背景資訊或順帶提到
- 沒有任何投資含義的提及

## 股票代號識別規則

1. 美股股票代號格式：1-5個大寫英文字母，如 AAPL、MSFT、GOOGL、BRK.B
2. 只識別明確提到的股票代號，不要猜測或推斷
3. 公司名稱不等於股票代號（例如：蘋果公司=AAPL，微軟=MSFT，特斯拉=TSLA）
4. 如果只提到公司名稱而沒有明確代號，請根據常識對應正確代號
5. 不確定的情況下，寧可不識別也不要錯誤識別

## 公司名稱識別規則

除了明確的股票代號，還要識別影片中提及的美股相關公司名稱：
1. 識別所有提及的知名美股公司名稱
2. 記錄提及的上下文（前後文內容）
3. 根據提及類型評估信心度和重要性

## 信心度評分標準（新增）

**90-100分**：主要投資標的，有詳細分析和明確建議
**70-89分**：重要案例研究，有投資價值討論
**50-69分**：比較對象，有一定分析價值
**30-49分**：簡單提及，投資參考價值低
**10-29分**：純粹舉例或背景提及

## 回答格式

請按照以下 JSON 格式回答，不要包含任何額外的文字。**重要**：所有中文文字與英文/數字之間必須加空格：

{
  "summary": "影片內容摘要（100-200字）",
  "stockAnalyses": [
    {
      "symbol": "股票代號（必須是1-5個大寫英文字母）",
      "companyName": "完整公司名稱",
      "mentionType": "PRIMARY/CASE_STUDY/COMPARISON/MENTION",
      "sentiment": "bullish/bearish/neutral",
      "confidence": 信心度數字(0-100),
      "reasoning": "分析理由和依據（50-100字）",
      "keyPoints": ["具體論點1", "具體論點2", "具體論點3"],
      "identificationReason": "為什麼識別出這個股票代號的理由",
      "contextQuote": "原文中相關的關鍵句子（20-50字）"
    }
  ],
  "mentionedCompanies": [
    {
      "companyName": "公司名稱（如：蘋果公司、特斯拉、微軟等）",
      "context": "提及的上下文內容（20-50字的前後文）",
      "mentionType": "PRIMARY/CASE_STUDY/COMPARISON/MENTION", 
      "confidence": 信心度數字(0-100)
    }
  ],
  "overallSentiment": "bullish/bearish/neutral"
}

## 範例說明

**文字格式範例**（重要）：
- 正確：「AAPL 股價持續上漲，Q3 財報表現亮眼，上漲 15%」
- 錯誤：「AAPL股價持續上漲，Q3財報表現亮眼，上漲15%」

**主要投資標的範例**：
- "我強烈推薦買入蘋果公司..." → mentionType: "PRIMARY", confidence: 90+
- "SFM 是我目前最看好的股票..." → mentionType: "PRIMARY", confidence: 85+

**案例參考範例**：
- "就像特斯拉當年一樣..." → mentionType: "CASE_STUDY", confidence: 60-70
- "Beyond Meat 的失敗告訴我們..." → mentionType: "CASE_STUDY", confidence: 50-60

**比較對象範例**：
- "相較於亞馬遜，這家公司..." → mentionType: "COMPARISON", confidence: 40-50
- "跟 Nvidia 比護城河..." → mentionType: "COMPARISON", confidence: 30-40

## 嚴格要求

1. symbol 必須是有效的美股代號格式（1-5個大寫字母）
2. 只有非常確定的股票才加入 stockAnalyses
3. mentionType 必須是四種類型之一
4. 根據 mentionType 調整 confidence 分數
5. PRIMARY 類型的股票應該有更詳細的 reasoning 和 keyPoints
6. 避免重複：如果已在 stockAnalyses 中的公司，不要再加入 mentionedCompanies
7. sentiment 只能是 "bullish"、"bearish"、"neutral" 其中一個
8. confidence 必須是 0-100 的整數
9. 必須返回有效的 JSON 格式
10. **文字格式要求**：所有中文輸出（包括 summary、reasoning、keyPoints、context 等）必須確保中文與英文/數字之間有空格，例如：「AAPL 股價」、「上漲 15%」、「Q3 財報」
`

    try {
      // 呼叫 Google Gemini API
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: analysisPrompt
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.3,
              topK: 32,
              topP: 1,
              maxOutputTokens: 2048,
            },
          }),
        }
      )

      if (!geminiResponse.ok) {
        const errorData = await geminiResponse.json().catch(() => ({}))
        console.error("Gemini API 錯誤:", errorData)
        
        if (geminiResponse.status === 400) {
          return NextResponse.json(
            { error: "API Key 無效或請求格式錯誤" },
            { status: 400 }
          )
        } else if (geminiResponse.status === 429) {
          return NextResponse.json(
            { error: "API 請求次數已達上限，請稍後再試" },
            { status: 429 }
          )
        } else {
          return NextResponse.json(
            { error: "Google Gemini API 暫時無法使用" },
            { status: 500 }
          )
        }
      }

      const geminiData = await geminiResponse.json()
      
      // 提取 AI 回應內容
      const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

      if (!aiResponse) {
        return NextResponse.json(
          { error: "AI 分析服務返回了空的回應" },
          { status: 500 }
        )
      }

      // 解析 AI 的 JSON 回應
      let analysisResult: GeminiAnalysisResult
      try {
        // 清理 AI 回應中可能的多餘字符
        const cleanedResponse = aiResponse.replace(/```json\s*|\s*```/g, '').trim()
        analysisResult = JSON.parse(cleanedResponse)
      } catch (parseError) {
        console.error("解析 AI 回應失敗:", parseError)
        console.error("AI 原始回應:", aiResponse)
        return NextResponse.json(
          { error: "AI 分析結果格式錯誤，請稍後再試" },
          { status: 500 }
        )
      }

      // 驗證分析結果格式
      if (!analysisResult.summary || !Array.isArray(analysisResult.stockAnalyses)) {
        return NextResponse.json(
          { error: "AI 分析結果格式不完整" },
          { status: 500 }
        )
      }

      // 股票代號格式驗證函數
      const isValidStockSymbol = (symbol: string): boolean => {
        if (!symbol || typeof symbol !== 'string') return false
        // 美股代號格式：1-5個大寫字母，可能包含一個點
        const stockSymbolRegex = /^[A-Z]{1,5}(\.[A-Z])?$/
        return stockSymbolRegex.test(symbol.trim().toUpperCase())
      }

      // 過濾和驗證股票分析結果
      const validStockAnalyses = analysisResult.stockAnalyses.filter(analysis => {
        // 基本欄位檢查
        const hasRequiredFields = (
          analysis.symbol &&
          analysis.companyName &&
          ['bullish', 'bearish', 'neutral'].includes(analysis.sentiment) &&
          typeof analysis.confidence === 'number' &&
          analysis.confidence >= 0 &&
          analysis.confidence <= 100
        )

        // 股票代號格式檢查
        const hasValidSymbol = isValidStockSymbol(analysis.symbol)

        if (hasRequiredFields && !hasValidSymbol) {
          console.warn(`過濾無效股票代號: ${analysis.symbol}`)
        }

        return hasRequiredFields && hasValidSymbol
      }).map(analysis => ({
        ...analysis,
        symbol: analysis.symbol.trim().toUpperCase() // 確保格式統一
      }))

      return NextResponse.json({
        success: true,
        analysis: {
          ...analysisResult,
          stockAnalyses: validStockAnalyses,
          videoUrl: videoUrl,
          analyzedAt: new Date().toISOString()
        }
      })

    } catch (fetchError) {
      console.error("呼叫 Gemini API 時發生錯誤:", fetchError)
      return NextResponse.json(
        { error: "無法連接到 AI 分析服務，請檢查網路連線" },
        { status: 503 }
      )
    }

  } catch (error) {
    console.error("Gemini API 端點錯誤:", error)
    return NextResponse.json(
      { error: "伺服器內部錯誤" },
      { status: 500 }
    )
  }
}