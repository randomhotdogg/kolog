#!/usr/bin/env python3
"""
YouTube 逐字稿提取腳本 - Vercel 版本
"""

import json
import re
import os
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

def extract_video_id(url):
    """從 YouTube URL 提取影片 ID"""
    patterns = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})',
        r'youtube\.com/watch\?.*v=([a-zA-Z0-9_-]{11})',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    return None

def get_transcript(video_url):
    """獲取 YouTube 影片的逐字稿（模擬版本）"""
    try:
        # 提取影片 ID
        video_id = extract_video_id(video_url)
        if not video_id:
            return {
                'success': False,
                'error': '無效的 YouTube URL'
            }
        
        # 在 Vercel 環境中，我們返回一個模擬的逐字稿
        # 實際生產環境中，你需要使用 YouTube Data API 或其他服務
        mock_transcript = f"""
        這是影片 {video_id} 的模擬逐字稿。
        
        由於 Vercel 的限制，我們無法直接執行 youtube-transcript-api。
        建議使用以下替代方案：
        
        1. 使用 YouTube Data API v3
        2. 使用 RapidAPI 的 YouTube Transcript 服務
        3. 實現客戶端 JavaScript 解決方案
        
        影片 ID: {video_id}
        URL: {video_url}
        """
        
        return {
            'success': True,
            'transcript': mock_transcript.strip(),
            'language': 'zh-TW',
            'video_id': video_id,
            'note': '這是模擬數據，實際功能需要配置外部 API'
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'處理 YouTube URL 時發生錯誤：{str(e)}'
        }

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # 讀取請求內容
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # 解析 JSON 數據
            request_data = json.loads(post_data.decode('utf-8'))
            url = request_data.get('url')
            
            if not url:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                self.end_headers()
                response = {'error': 'YouTube URL 為必填項目'}
                self.wfile.write(json.dumps(response, ensure_ascii=False).encode())
                return
            
            # 獲取逐字稿
            result = get_transcript(url)
            
            # 設置響應頭
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            # 返回結果
            self.wfile.write(json.dumps(result, ensure_ascii=False).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_response = {'error': f'伺服器內部錯誤：{str(e)}'}
            self.wfile.write(json.dumps(error_response, ensure_ascii=False).encode())
    
    def do_OPTIONS(self):
        # 處理 CORS 預檢請求
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(b'')

if __name__ == '__main__':
    # 測試代碼
    test_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    result = get_transcript(test_url)
    print(json.dumps(result, ensure_ascii=False, indent=2))