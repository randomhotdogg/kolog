# YouTube 股票分析功能設定指南

## 快速開始

1. **執行自動設定腳本**
   ```bash
   ./setup.sh
   ```

2. **手動設定（如果自動設定失敗）**
   ```bash
   # 建立 Python 虛擬環境
   python3 -m venv venv
   
   # 啟動虛擬環境
   source venv/bin/activate
   
   # 安裝依賴套件
   pip install youtube-transcript-api==1.2.2
   
   # 安裝 npm 依賴
   npm install
   ```

3. **啟動開發伺服器**
   ```bash
   npm run dev
   ```

## API Key 設定

### Google Gemini API Key（必需）
1. 前往 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 建立新的 API Key（免費）
3. 在應用程式中點擊「設定」按鈕輸入 API Key

### YouTube Data API Key（選填，推薦）
1. 前往 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. 建立新的專案或選擇現有專案
3. 啟用 YouTube Data API v3
4. 建立 API Key（建議設定使用限制）
5. 在應用程式中的 API Key 設定頁面輸入此 Key

**注意**：
- 如果沒有設定 YouTube API Key，系統會使用當前日期作為股票追蹤的起始日期
- 如果有設定 YouTube API Key，系統會自動獲取影片的實際發布日期，讓追蹤更準確

## 使用方式

1. 點擊「YouTube 分析」頁籤
2. 輸入 YouTube 影片連結
3. 點擊「分析」按鈕
4. 查看 AI 分析結果
5. 選擇要追蹤的股票

## 注意事項

### 支援的影片類型
- ✅ 有手動或自動逐字稿的影片
- ✅ 公開影片
- ❌ 私人或已刪除的影片
- ❌ 沒有逐字稿的影片

### 常見錯誤及解決方法

1. **「影片無法存取或已被移除」**
   - 確認影片連結正確且影片為公開狀態
   - 嘗試其他影片

2. **「此影片沒有可用的逐字稿」**
   - 選擇有開啟逐字稿功能的影片
   - 通常知名財經頻道的影片會有逐字稿

3. **「API Key 無效」**
   - 檢查 Gemini API Key 是否正確
   - 確認 API Key 有足夠的配額