#!/usr/bin/env python3
"""
YouTube 逐字稿提取腳本
使用 youtube-transcript-api 套件提取 YouTube 影片的逐字稿
"""

import sys
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
            ytt_api = YouTubeTranscriptApi()
            transcript_list = ytt_api.list(video_id)
            
            # 檢查是否有可用的逐字稿
            available_transcripts = list(transcript_list)
            if not available_transcripts:
                return {
                    'success': False,
                    'error': '此影片沒有可用的逐字稿'
                }
            
            # 嘗試獲取逐字稿的優先順序
            transcript = None
            
            # 1. 優先中文
            for lang in ['zh-TW', 'zh-CN', 'zh']:
                try:
                    transcript = transcript_list.find_transcript([lang])
                    break
                except:
                    continue
            
            # 2. 其次英文
            if not transcript:
                try:
                    transcript = transcript_list.find_transcript(['en'])
                except:
                    pass
            
            # 3. 最後嘗試任何手動創建的逐字稿
            if not transcript:
                try:
                    transcript = transcript_list.find_manually_created_transcript()
                except:
                    pass
            
            # 4. 最後嘗試任何自動生成的逐字稿
            if not transcript:
                try:
                    transcript = transcript_list.find_generated_transcript()
                except:
                    pass
            
            # 如果仍然沒有找到逐字稿
            if not transcript:
                available_langs = [t.language_code for t in available_transcripts]
                return {
                    'success': False,
                    'error': f'無法獲取逐字稿，可用語言: {", ".join(available_langs)}'
                }
            
            # 獲取逐字稿數據
            transcript_data = transcript.fetch()
            
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
                'language': transcript.language_code,
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

if __name__ == '__main__':
    if len(sys.argv) != 2:
        result = {
            'success': False,
            'error': '請提供 YouTube URL 作為參數'
        }
    else:
        video_url = sys.argv[1]
        result = get_transcript(video_url)
    
    # 輸出 JSON 格式的結果
    print(json.dumps(result, ensure_ascii=False, indent=2))