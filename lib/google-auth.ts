"use client"

// Google OAuth 配置
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

// 全域變數來追蹤 Google API 載入狀態
let isGoogleApiLoaded = false
let googleApiLoadPromise: Promise<void> | null = null

// 載入 Google API 腳本
const loadGoogleApi = (): Promise<void> => {
  if (isGoogleApiLoaded) {
    return Promise.resolve()
  }

  if (googleApiLoadPromise) {
    return googleApiLoadPromise
  }

  googleApiLoadPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Google API 只能在瀏覽器環境中載入'))
      return
    }

    // 檢查是否已經載入
    if (window.google?.accounts?.id) {
      isGoogleApiLoaded = true
      resolve()
      return
    }

    // 創建腳本標籤
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    
    script.onload = () => {
      if (window.google?.accounts?.id) {
        isGoogleApiLoaded = true
        resolve()
      } else {
        reject(new Error('Google API 載入失敗'))
      }
    }

    script.onerror = () => {
      reject(new Error('無法載入 Google API'))
    }

    document.head.appendChild(script)
  })

  return googleApiLoadPromise
}

// Google 登入功能
export const signInWithGoogle = async (): Promise<string> => {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google Client ID 未設定，請在環境變數中設定 NEXT_PUBLIC_GOOGLE_CLIENT_ID')
  }

  try {
    await loadGoogleApi()

    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.id) {
        reject(new Error('Google API 未正確載入'))
        return
      }

      // 初始化 Google Identity Services
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: any) => {
          if (response.credential) {
            resolve(response.credential)
          } else {
            reject(new Error('Google 登入失敗：未收到憑證'))
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      })

      // 顯示彈出式登入視窗
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed()) {
          // 如果無法顯示彈出視窗，嘗試使用替代方法
          window.google.accounts.id.renderButton(
            // 創建臨時按鈕容器
            (() => {
              const tempButton = document.createElement('div')
              tempButton.style.display = 'none'
              document.body.appendChild(tempButton)
              
              // 自動點擊按鈕
              setTimeout(() => {
                const button = tempButton.querySelector('div[role="button"]') as HTMLElement
                if (button) {
                  button.click()
                }
              }, 100)
              
              return tempButton
            })(),
            {
              theme: 'outline',
              size: 'large',
            }
          )
        }
        
        if (notification.isSkippedMoment()) {
          reject(new Error('使用者取消 Google 登入'))
        }
      })
    })
  } catch (error) {
    console.error('Google 登入初始化失敗:', error)
    throw error
  }
}

// 類型定義
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          prompt: (callback?: (notification: any) => void) => void
          renderButton: (element: HTMLElement, config: any) => void
        }
      }
    }
  }
}