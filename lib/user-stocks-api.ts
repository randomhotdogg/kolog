"use client"

import { useAuthApi } from '@/hooks/use-auth-api'

export interface UserStock {
  id: number
  symbol: string
  company_name: string
  custom_name?: string
  start_tracking_date: string
  start_price: number
  currency: string
  youtube_analysis?: string
  created_at: string
  updated_at?: string
}

export interface CreateUserStock {
  symbol: string
  company_name: string
  custom_name?: string
  start_tracking_date: string
  start_price: number
  currency: string
  youtube_analysis?: string
}

export function useUserStocksApi() {
  const { authFetch } = useAuthApi()

  const getUserStocks = async (): Promise<UserStock[]> => {
    const response = await authFetch('/api/v1/user/stocks/')
    
    if (!response.ok) {
      throw new Error('無法取得股票追蹤清單')
    }
    
    return response.json()
  }

  const addUserStock = async (stockData: CreateUserStock): Promise<UserStock> => {
    const response = await authFetch('/api/v1/user/stocks/', {
      method: 'POST',
      body: JSON.stringify(stockData),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || '無法新增股票追蹤')
    }
    
    return response.json()
  }

  const updateUserStock = async (stockId: number, stockData: CreateUserStock): Promise<UserStock> => {
    const response = await authFetch(`/api/v1/user/stocks/${stockId}`, {
      method: 'PUT',
      body: JSON.stringify(stockData),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || '無法更新股票追蹤')
    }
    
    return response.json()
  }

  const deleteUserStock = async (stockId: number): Promise<void> => {
    const response = await authFetch(`/api/v1/user/stocks/${stockId}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || '無法移除股票追蹤')
    }
  }

  const updateStockCustomName = async (stockId: number, customName: string): Promise<void> => {
    const response = await authFetch(`/api/v1/user/stocks/${stockId}/name`, {
      method: 'PATCH',
      body: JSON.stringify(customName),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || '無法更新股票名稱')
    }
  }

  return {
    getUserStocks,
    addUserStock,
    updateUserStock,
    deleteUserStock,
    updateStockCustomName,
  }
}