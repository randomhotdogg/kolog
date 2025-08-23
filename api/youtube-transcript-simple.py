from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        try:
            # 讀取請求內容
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                body = self.rfile.read(content_length)
                data = json.loads(body.decode('utf-8'))
                url = data.get('url', '')
            else:
                url = ''
            
            result = {
                'success': False,
                'error': 'YouTube 逐字稿功能暫時不可用',
                'error_type': 'SERVICE_UNAVAILABLE',
                'debug_info': f'收到 URL: {url}',
                'note': '這是簡化版本，用於測試部署問題'
            }
            
        except Exception as e:
            result = {
                'success': False,
                'error': f'處理請求時發生錯誤：{str(e)}',
                'error_type': 'REQUEST_ERROR'
            }
        
        response_json = json.dumps(result, ensure_ascii=False)
        self.wfile.write(response_json.encode('utf-8'))
        return
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        return
    
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        result = {
            'success': True,
            'message': 'YouTube 逐字稿 API 簡化版本運作正常',
            'endpoint': '/api/youtube-transcript-simple',
            'method': 'POST',
            'status': '測試版本，用於檢查部署問題'
        }
        
        response_json = json.dumps(result, ensure_ascii=False)
        self.wfile.write(response_json.encode('utf-8'))
        return