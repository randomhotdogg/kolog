from http.server import BaseHTTPRequestHandler
import json
import re
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter

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
    """獲取 YouTube 影片的逐字稿"""
    try:
        # 提取影片 ID
        video_id = extract_video_id(video_url)
        if not video_id:
            return {
                'success': False,
                'error': '無效的 YouTube URL'
            }
        
        # 嘗試獲取逐字稿（優先中文，其次英文）
        try:
            # 直接嘗試獲取逐字稿，按語言優先順序
            transcript_data = None
            language_used = None
            
            # 1. 優先中文
            for lang in ['zh-TW', 'zh-CN', 'zh']:
                try:
                    transcript_data = YouTubeTranscriptApi.get_transcript(video_id, languages=[lang])
                    language_used = lang
                    break
                except:
                    continue
            
            # 2. 其次英文
            if not transcript_data:
                try:
                    transcript_data = YouTubeTranscriptApi.get_transcript(video_id, languages=['en'])
                    language_used = 'en'
                except:
                    pass
            
            # 3. 最後嘗試任何可用的逐字稿
            if not transcript_data:
                try:
                    transcript_data = YouTubeTranscriptApi.get_transcript(video_id)
                    language_used = 'auto'
                except:
                    pass
            
            # 如果仍然沒有獲取到逐字稿
            if not transcript_data:
                return {
                    'success': False,
                    'error': '此影片沒有可用的逐字稿（可能是私人影片、已刪除或不支援逐字稿）'
                }
            
            # 格式化為純文字
            formatter = TextFormatter()
            transcript_text = formatter.format_transcript(transcript_data)
            
            # 檢查逐字稿是否為空
            if not transcript_text or len(transcript_text.strip()) < 10:
                return {
                    'success': False,
                    'error': '獲取的逐字稿內容過短或為空'
                }
            
            return {
                'success': True,
                'transcript': transcript_text,
                'language': language_used,
                'video_id': video_id
            }
            
        except Exception as e:
            error_msg = str(e)
            if "Could not retrieve a transcript" in error_msg:
                return {
                    'success': False,
                    'error': '此影片沒有可用的逐字稿（可能是私人影片、已刪除或不支援逐字稿）'
                }
            elif "no element found" in error_msg:
                return {
                    'success': False,
                    'error': '影片無法存取或已被移除'
                }
            else:
                return {
                    'success': False,
                    'error': f'獲取逐字稿時發生錯誤：{error_msg}'
                }
            
    except Exception as e:
        return {
            'success': False,
            'error': f'處理 YouTube URL 時發生錯誤：{str(e)}'
        }

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # 設定回應標頭
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            # 讀取請求內容
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                result = {
                    'success': False,
                    'error': '請求內容不能為空'
                }
            else:
                body = self.rfile.read(content_length)
                try:
                    data = json.loads(body.decode('utf-8'))
                    url = data.get('url', '').strip()
                    
                    if not url:
                        result = {
                            'success': False,
                            'error': 'YouTube URL 為必填項目'
                        }
                    else:
                        # 驗證是否為有效的 YouTube URL
                        youtube_regex = r'^https?://(www\.)?(youtube\.com/(watch\?v=|embed/)|youtu\.be/)[\w-]+'
                        if not re.match(youtube_regex, url):
                            result = {
                                'success': False,
                                'error': '請提供有效的 YouTube URL'
                            }
                        else:
                            # 獲取逐字稿
                            result = get_transcript(url)
                            
                except json.JSONDecodeError:
                    result = {
                        'success': False,
                        'error': '無效的 JSON 格式'
                    }
            
        except Exception as e:
            result = {
                'success': False,
                'error': f'伺服器內部錯誤：{str(e)}'
            }
        
        # 回傳 JSON 結果
        response_json = json.dumps(result, ensure_ascii=False)
        self.wfile.write(response_json.encode('utf-8'))
        return
    
    def do_OPTIONS(self):
        # 處理 CORS preflight 請求
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        return
    
    def do_GET(self):
        # 提供基本的狀態檢查
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        result = {
            'success': True,
            'message': 'YouTube 逐字稿 API 運作正常',
            'endpoint': '/api/youtube-transcript',
            'method': 'POST',
            'required_fields': ['url']
        }
        
        response_json = json.dumps(result, ensure_ascii=False)
        self.wfile.write(response_json.encode('utf-8'))
        return