def handler(req, res):
    """測試用的簡化版本"""
    try:
        # 直接回傳成功訊息
        result = {
            'success': True,
            'message': 'Python Function 測試成功！',
            'method': req.method if hasattr(req, 'method') else 'unknown',
            'timestamp': '2025-08-23'
        }
        
        # 嘗試設定標頭和回傳結果
        if hasattr(res, 'setHeader'):
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')
        
        if hasattr(res, 'json'):
            res.status(200).json(result)
        else:
            # 備用方法
            return result
            
    except Exception as e:
        # 如果有任何錯誤，回傳錯誤資訊
        return {
            'success': False,
            'error': f'Function 錯誤: {str(e)}',
            'timestamp': '2025-08-23'
        }