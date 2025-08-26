"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, AuthToken, LoginData, RegisterData, GoogleAuthData } from './types'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (data: LoginData) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  googleLogin: (data: GoogleAuthData) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 檢查本地存儲中的 token
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('auth_user')
    
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      // 驗證 token 是否仍然有效
      verifyToken(storedToken)
    }
    
    setIsLoading(false)
  }, [])

  const verifyToken = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-token`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Token 無效')
      }
    } catch (error) {
      console.error('Token 驗證失敗:', error)
      logout()
    }
  }

  const login = async (data: LoginData) => {
    setIsLoading(true)
    try {
      console.log('🔗 正在連接 API:', `${API_BASE_URL}/api/v1/auth/login`)
      console.log('📤 發送登入數據:', { email: data.email, password: '***' })
      
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || '登入失敗')
      }

      const authData: AuthToken = await response.json()
      
      // 保存認證資訊
      setToken(authData.access_token)
      setUser(authData.user)
      localStorage.setItem('auth_token', authData.access_token)
      localStorage.setItem('auth_user', JSON.stringify(authData.user))
      
    } catch (error) {
      console.error('登入錯誤:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterData) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || '註冊失敗')
      }

      const authData: AuthToken = await response.json()
      
      // 保存認證資訊
      setToken(authData.access_token)
      setUser(authData.user)
      localStorage.setItem('auth_token', authData.access_token)
      localStorage.setItem('auth_user', JSON.stringify(authData.user))
      
    } catch (error) {
      console.error('註冊錯誤:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const googleLogin = async (data: GoogleAuthData) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Google 登入失敗')
      }

      const authData: AuthToken = await response.json()
      
      // 保存認證資訊
      setToken(authData.access_token)
      setUser(authData.user)
      localStorage.setItem('auth_token', authData.access_token)
      localStorage.setItem('auth_user', JSON.stringify(authData.user))
      
    } catch (error) {
      console.error('Google 登入錯誤:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    googleLogin,
    logout,
    isAuthenticated: !!user && !!token,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}