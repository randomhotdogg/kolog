# 前後端分離部署指南

## 概述

專案已重構為前後端分離架構：
- **前端**: Next.js (部署到 Vercel)  
- **後端**: Python FastAPI (部署到 Railway/DigitalOcean/AWS)

## 🐍 Python 後端部署

### 1. 準備後端專案

```bash
# 進入 Python 後端目錄
cd kolog-youtube-backend

# 複製環境變數範例文件
cp .env.example .env

# 編輯環境變數
# vim .env
```

### 2. Railway 部署（推薦）

1. **連接 GitHub**
   - 前往 [Railway](https://railway.app)
   - 選擇 "Deploy from GitHub repo"
   - 選擇 `kolog-youtube-backend` 目錄

2. **環境變數設定**
   ```
   ALLOWED_ORIGINS=https://your-nextjs-domain.vercel.app,http://localhost:3000
   API_HOST=0.0.0.0
   API_PORT=8000
   ```

3. **部署設定**
   - Railway 自動偵測 Dockerfile
   - 服務會自動建構和部署
   - 取得部署後的 URL (如：`https://your-app.railway.app`)

### 3. DigitalOcean App Platform

```bash
# 1. 推送 Docker 映像
docker build -t your-registry/youtube-backend .
docker push your-registry/youtube-backend

# 2. 在 DigitalOcean 建立 App
# 3. 選擇 Docker 容器部署  
# 4. 設定環境變數和域名
```

### 4. 本地開發測試

```bash
# 使用 Docker Compose
docker-compose up -d

# 或本地 Python 環境
cd app
pip install -r ../requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API 文檔：http://localhost:8000/docs

## 🌐 Next.js 前端部署

### 1. 環境變數設定

在 Vercel 專案設定中加入：

**開發環境** (`.env.local`):
```
NEXT_PUBLIC_YOUTUBE_API_BASE_URL=http://localhost:8000/api/v1
```

**正式環境** (Vercel Environment Variables):
```
NEXT_PUBLIC_YOUTUBE_API_BASE_URL=https://your-python-backend.railway.app/api/v1
```

### 2. Vercel 部署

```bash
# 安裝 Vercel CLI（如果還沒有）
npm i -g vercel

# 部署到 Vercel
vercel

# 或推送到 GitHub，Vercel 自動部署
git add .
git commit -m "前後端分離重構完成"
git push origin main
```

## 🧪 測試流程

### 1. 後端 API 測試

```bash
# 健康檢查
curl https://your-python-backend.railway.app/health

# 測試逐字稿 API
curl -X POST https://your-python-backend.railway.app/api/v1/youtube/transcript \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

### 2. 前端功能測試

1. 前往 Next.js 部署域名
2. 測試 YouTube 分析功能：
   - 輸入有效的 YouTube URL
   - 檢查逐字稿獲取
   - 驗證 AI 分析結果
   - 測試股票追蹤功能

### 3. CORS 測試

確保前端域名在後端 CORS 設定中：
```python
# kolog-youtube-backend/app/main.py
allow_origins=[
    "https://your-nextjs-domain.vercel.app",  # 正式環境
    "http://localhost:3000",  # 開發環境
]
```

## 🔧 常見問題排除

### CORS 錯誤
- 檢查後端 `ALLOWED_ORIGINS` 環境變數
- 確認前端 URL 完全匹配（包含 https/http）

### API 連線失敗  
- 驗證 `NEXT_PUBLIC_YOUTUBE_API_BASE_URL` 設定
- 檢查後端服務是否正常運行 (`/health` 端點)

### Docker 建構失敗
- 檢查 `requirements.txt` 依賴版本
- 確認 Dockerfile 路徑正確

## 📊 監控和日誌

### Railway 監控
- 查看 Railway Dashboard 中的服務狀態
- 檢查日誌輸出和錯誤訊息

### Vercel 監控  
- 使用 Vercel Analytics 追蹤前端效能
- 檢查 Function Logs 中的 API 呼叫

## 🔄 回滾策略

如果遇到問題需要回滾：

### 快速回滾到整合式架構
1. 恢復 `api/youtube-transcript.py` 文件
2. 恢復 `app/api/gemini/route.ts`  
3. 恢復 `requirements.txt`
4. 修改前端 API 呼叫回到本地端點

### 緊急修復
- Railway: 可快速回滾到上一個部署版本
- Vercel: 支援一鍵回滾到穩定版本

---

💡 **注意**: 完成部署後，建議保留原始的整合式架構檔案作為備份，直到新架構經過完整測試。