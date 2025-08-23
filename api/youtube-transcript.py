from http.server import BaseHTTPRequestHandler
import json
import re
import sys
import traceback
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter
try:
    from youtube_transcript_api._errors import TranscriptsDisabled, VideoUnavailable, TooManyRequests, RequestBlocked
except ImportError:
    # 如果無法導入具體的錯誤類別，使用通用的 Exception
    class TranscriptsDisabled(Exception):
        pass
    class VideoUnavailable(Exception):
        pass
    class TooManyRequests(Exception):
        pass
    class RequestBlocked(Exception):
        pass

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
    video_id = None
    try:
        # 提取影片 ID
        video_id = extract_video_id(video_url)
        if not video_id:
            return {
                'success': False,
                'error': '無效的 YouTube URL',
                'debug_info': f'無法從 URL 提取影片 ID: {video_url}'
            }
        
        print(f"[DEBUG] 嘗試獲取影片 {video_id} 的逐字稿", file=sys.stderr)
        
        # 嘗試獲取逐字稿（優先中文，其次英文）
        transcript_data = None
        language_used = None
        last_error = None
        
        # 1. 優先中文
        for lang in ['zh-TW', 'zh-CN', 'zh']:
            try:
                print(f"[DEBUG] 嘗試語言: {lang}", file=sys.stderr)
                transcript_data = YouTubeTranscriptApi.get_transcript(video_id, languages=[lang])
                language_used = lang
                print(f"[DEBUG] 成功獲取 {lang} 逐字稿", file=sys.stderr)
                break
            except (TranscriptsDisabled, VideoUnavailable) as e:
                last_error = e
                print(f"[DEBUG] {lang} 語言不可用: {type(e).__name__} - {str(e)}", file=sys.stderr)
                break  # 如果影片本身有問題，不要繼續嘗試其他語言
            except Exception as e:
                last_error = e
                print(f"[DEBUG] {lang} 語言失敗: {type(e).__name__} - {str(e)}", file=sys.stderr)
                continue
        
        # 2. 其次英文
        if not transcript_data and not isinstance(last_error, (TranscriptsDisabled, VideoUnavailable)):
            try:
                print(f"[DEBUG] 嘗試語言: en", file=sys.stderr)
                transcript_data = YouTubeTranscriptApi.get_transcript(video_id, languages=['en'])
                language_used = 'en'
                print(f"[DEBUG] 成功獲取 en 逐字稿", file=sys.stderr)
            except (TranscriptsDisabled, VideoUnavailable) as e:
                last_error = e
                print(f"[DEBUG] en 語言失敗: {type(e).__name__} - {str(e)}", file=sys.stderr)
            except Exception as e:
                last_error = e
                print(f"[DEBUG] en 語言失敗: {type(e).__name__} - {str(e)}", file=sys.stderr)
        
        # 3. 最後嘗試任何可用的逐字稿
        if not transcript_data and not isinstance(last_error, (TranscriptsDisabled, VideoUnavailable)):
            try:
                print(f"[DEBUG] 嘗試任何可用語言", file=sys.stderr)
                transcript_data = YouTubeTranscriptApi.get_transcript(video_id)
                language_used = 'auto'
                print(f"[DEBUG] 成功獲取自動語言逐字稿", file=sys.stderr)
            except Exception as e:
                last_error = e
                print(f"[DEBUG] 自動語言失敗: {type(e).__name__} - {str(e)}", file=sys.stderr)
        
        # 處理各種錯誤情況
        if not transcript_data:
            if isinstance(last_error, RequestBlocked):
                return {
                    'success': False,
                    'error': '請求被 YouTube 封鎖。這通常發生在雲端服務器環境中，因為 YouTube 會封鎖雲端服務商的 IP 地址（如 Vercel、AWS、Google Cloud 等）。',
                    'error_type': 'IP_BLOCKED',
                    'debug_info': f'影片 ID: {video_id}, 錯誤: RequestBlocked - {str(last_error)}'
                }
            elif isinstance(last_error, TranscriptsDisabled):
                return {
                    'success': False,
                    'error': '此影片的逐字稿功能已被停用或不可用',
                    'error_type': 'TRANSCRIPTS_DISABLED',
                    'debug_info': f'影片 ID: {video_id}, 錯誤: TranscriptsDisabled - {str(last_error)}'
                }
            elif isinstance(last_error, VideoUnavailable):
                return {
                    'success': False,
                    'error': '影片不存在、已被移除或為私人影片',
                    'error_type': 'VIDEO_UNAVAILABLE',
                    'debug_info': f'影片 ID: {video_id}, 錯誤: VideoUnavailable - {str(last_error)}'
                }
            elif isinstance(last_error, TooManyRequests):
                return {
                    'success': False,
                    'error': 'API 請求過於頻繁，請稍後再試',
                    'error_type': 'TOO_MANY_REQUESTS',
                    'debug_info': f'影片 ID: {video_id}, 錯誤: TooManyRequests - {str(last_error)}'
                }
            else:
                return {
                    'success': False,
                    'error': f'無法獲取逐字稿：{str(last_error)}',
                    'error_type': 'UNKNOWN_ERROR',
                    'debug_info': f'影片 ID: {video_id}, 錯誤: {type(last_error).__name__} - {str(last_error)}'
                }
        
        # 格式化為純文字
        try:
            formatter = TextFormatter()
            transcript_text = formatter.format_transcript(transcript_data)
            
            # 檢查逐字稿是否為空
            if not transcript_text or len(transcript_text.strip()) < 10:
                return {
                    'success': False,
                    'error': '獲取的逐字稿內容過短或為空',
                    'error_type': 'EMPTY_TRANSCRIPT',
                    'debug_info': f'影片 ID: {video_id}, 逐字稿長度: {len(transcript_text) if transcript_text else 0}'
                }
            
            print(f"[DEBUG] 成功格式化逐字稿，長度: {len(transcript_text)}", file=sys.stderr)
            
            return {
                'success': True,
                'transcript': transcript_text,
                'language': language_used,
                'video_id': video_id
            }
            
        except Exception as format_error:
            return {
                'success': False,
                'error': f'格式化逐字稿時發生錯誤：{str(format_error)}',
                'error_type': 'FORMAT_ERROR',
                'debug_info': f'影片 ID: {video_id}, 格式化錯誤: {str(format_error)}'
            }
            
    except Exception as e:
        # 記錄完整的錯誤堆疊
        error_trace = traceback.format_exc()
        print(f"[ERROR] 處理 YouTube URL 時發生未預期的錯誤:\n{error_trace}", file=sys.stderr)
        
        return {
            'success': False,
            'error': f'處理 YouTube URL 時發生錯誤：{str(e)}',
            'error_type': 'PROCESSING_ERROR',
            'debug_info': f'影片 ID: {video_id}, URL: {video_url}, 錯誤: {str(e)}'
        }

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        start_time = None
        try:
            import time
            start_time = time.time()
            
            print(f"[INFO] 收到 POST 請求", file=sys.stderr)
            
            # 設定回應標頭
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            # 讀取請求內容
            content_length = int(self.headers.get('Content-Length', 0))
            print(f"[DEBUG] Content-Length: {content_length}", file=sys.stderr)
            
            if content_length == 0:
                result = {
                    'success': False,
                    'error': '請求內容不能為空',
                    'error_type': 'EMPTY_REQUEST'
                }
            else:
                body = self.rfile.read(content_length)
                print(f"[DEBUG] 收到請求體: {body[:200]}{'...' if len(body) > 200 else ''}", file=sys.stderr)
                
                try:
                    data = json.loads(body.decode('utf-8'))
                    url = data.get('url', '').strip()
                    
                    print(f"[INFO] 處理 URL: {url}", file=sys.stderr)
                    
                    if not url:
                        result = {
                            'success': False,
                            'error': 'YouTube URL 為必填項目',
                            'error_type': 'MISSING_URL'
                        }
                    else:
                        # 驗證是否為有效的 YouTube URL
                        youtube_regex = r'^https?://(www\.)?(youtube\.com/(watch\?v=|embed/)|youtu\.be/)[\w-]+'
                        if not re.match(youtube_regex, url):
                            result = {
                                'success': False,
                                'error': '請提供有效的 YouTube URL',
                                'error_type': 'INVALID_URL',
                                'debug_info': f'提供的 URL: {url}'
                            }
                        else:
                            # 獲取逐字稿
                            print(f"[INFO] 開始獲取逐字稿", file=sys.stderr)
                            result = get_transcript(url)
                            print(f"[INFO] 逐字稿獲取{'成功' if result.get('success') else '失敗'}", file=sys.stderr)
                            
                except json.JSONDecodeError as json_error:
                    result = {
                        'success': False,
                        'error': f'無效的 JSON 格式: {str(json_error)}',
                        'error_type': 'JSON_DECODE_ERROR',
                        'debug_info': f'JSON 錯誤: {str(json_error)}'
                    }
                    print(f"[ERROR] JSON 解析錯誤: {json_error}", file=sys.stderr)
            
        except Exception as e:
            # 記錄完整的錯誤堆疊
            error_trace = traceback.format_exc()
            print(f"[ERROR] 處理請求時發生未預期的錯誤:\n{error_trace}", file=sys.stderr)
            
            result = {
                'success': False,
                'error': f'伺服器內部錯誤：{str(e)}',
                'error_type': 'SERVER_ERROR',
                'debug_info': f'伺服器錯誤: {str(e)}'
            }
        
        # 記錄處理時間
        if start_time:
            processing_time = time.time() - start_time
            print(f"[INFO] 請求處理時間: {processing_time:.2f} 秒", file=sys.stderr)
            result['processing_time'] = round(processing_time, 2)
        
        # 回傳 JSON 結果
        try:
            response_json = json.dumps(result, ensure_ascii=False, indent=2)
            print(f"[DEBUG] 回應結果: {response_json[:300]}{'...' if len(response_json) > 300 else ''}", file=sys.stderr)
            self.wfile.write(response_json.encode('utf-8'))
        except Exception as json_error:
            print(f"[ERROR] 回應序列化錯誤: {json_error}", file=sys.stderr)
            fallback_response = json.dumps({
                'success': False,
                'error': 'JSON 序列化錯誤',
                'error_type': 'RESPONSE_SERIALIZATION_ERROR'
            }, ensure_ascii=False)
            self.wfile.write(fallback_response.encode('utf-8'))
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
        # 提供基本的狀態檢查和環境資訊
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        # 獲取環境資訊
        import os
        import platform
        
        result = {
            'success': True,
            'message': 'YouTube 逐字稿 API 運作正常',
            'endpoint': '/api/youtube-transcript',
            'method': 'POST',
            'required_fields': ['url'],
            'environment': {
                'platform': platform.platform(),
                'python_version': platform.python_version(),
                'vercel_url': os.environ.get('VERCEL_URL', 'Not in Vercel'),
                'vercel_env': os.environ.get('VERCEL_ENV', 'Not in Vercel'),
                'is_vercel': bool(os.environ.get('VERCEL')),
            },
            'api_info': {
                'youtube_transcript_api_version': '0.6.2',
                'supported_languages': ['zh-TW', 'zh-CN', 'zh', 'en', 'auto'],
                'error_types': ['IP_BLOCKED', 'TRANSCRIPTS_DISABLED', 'VIDEO_UNAVAILABLE', 'TOO_MANY_REQUESTS']
            },
            'debug': {
                'note': '如果遇到問題，請檢查回應中的 debug_info 和 error_type 欄位'
            }
        }
        
        response_json = json.dumps(result, ensure_ascii=False, indent=2)
        self.wfile.write(response_json.encode('utf-8'))
        return