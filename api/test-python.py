from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        result = {
            'success': True,
            'message': '測試 Python Function 運作正常！',
            'timestamp': '2025-08-23'
        }
        
        response_json = json.dumps(result, ensure_ascii=False)
        self.wfile.write(response_json.encode('utf-8'))
        return
    
    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        try:
            # 讀取請求內容
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                body = self.rfile.read(content_length)
                data = json.loads(body.decode('utf-8'))
            else:
                data = {}
            
            result = {
                'success': True,
                'message': '測試 Python Function POST 請求成功！',
                'received_data': data,
                'timestamp': '2025-08-23'
            }
            
        except Exception as e:
            result = {
                'success': False,
                'error': f'錯誤：{str(e)}',
                'timestamp': '2025-08-23'
            }
        
        response_json = json.dumps(result, ensure_ascii=False)
        self.wfile.write(response_json.encode('utf-8'))
        return