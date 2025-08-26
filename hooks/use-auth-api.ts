"use client"

import { useAuth } from '@/lib/auth-context'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function useAuthApi() {
  const { token, logout } = useAuth()

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    })

    // 如果 token 過期，自動登出
    if (response.status === 401) {
      logout()
      throw new Error('認證已過期，請重新登入')
    }

    return response
  }

  return { authFetch }
}