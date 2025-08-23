#!/bin/bash

echo "🚀 設置股票儀表板 YouTube 分析功能..."

# 檢查 Python 虛擬環境
if [ ! -d "venv" ]; then
    echo "📦 建立 Python 虛擬環境..."
    python3 -m venv venv
fi

# 啟動虛擬環境並安裝依賴
echo "📚 安裝 Python 依賴套件..."
source venv/bin/activate
pip install youtube-transcript-api==0.6.2

# 給 Python 腳本執行權限
chmod +x scripts/youtube_transcript.py

# 安裝 npm 依賴（如果需要）
if [ ! -d "node_modules" ]; then
    echo "📦 安裝 npm 依賴套件..."
    npm install
fi

echo "✅ 設置完成！"
echo ""
echo "📋 使用說明："
echo "1. 啟動開發伺服器：npm run dev"
echo "2. 前往 YouTube 分析頁籤"
echo "3. 設定您的 Google Gemini API Key"
echo "4. 輸入 YouTube 影片連結開始分析"
echo ""
echo "🔑 取得 API Key：https://aistudio.google.com/app/apikey"