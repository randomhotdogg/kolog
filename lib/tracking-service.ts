"use client"

import { useAuth } from './auth-context'
import { useUserStocksApi, type UserStock, type CreateUserStock } from './user-stocks-api'
import { 
  getTrackedStocks as getLocalTrackedStocks,
  addTrackedStock as addLocalTrackedStock,
  removeTrackedStock as removeLocalTrackedStock,
  updateTrackedStockName as updateLocalTrackedStockName,
  type TrackedStock 
} from './tracking-storage'

// 轉換函式：將 UserStock 轉換為 TrackedStock
export function userStockToTrackedStock(userStock: UserStock): TrackedStock {
  return {
    symbol: userStock.symbol,
    companyName: userStock.company_name,
    customName: userStock.custom_name,
    startTrackingDate: new Date(userStock.start_tracking_date),
    startPrice: userStock.start_price,
    currency: userStock.currency,
    addedAt: new Date(userStock.created_at),
    youtubeAnalysis: userStock.youtube_analysis ? JSON.parse(userStock.youtube_analysis) : undefined,
  }
}

// 轉換函式：將 TrackedStock 轉換為 CreateUserStock
export function trackedStockToCreateUserStock(trackedStock: Omit<TrackedStock, "addedAt">): CreateUserStock {
  return {
    symbol: trackedStock.symbol,
    company_name: trackedStock.companyName,
    custom_name: trackedStock.customName,
    start_tracking_date: trackedStock.startTrackingDate.toISOString(),
    start_price: trackedStock.startPrice,
    currency: trackedStock.currency,
    youtube_analysis: trackedStock.youtubeAnalysis ? JSON.stringify(trackedStock.youtubeAnalysis) : undefined,
  }
}

export function useTrackingService() {
  const { isAuthenticated } = useAuth()
  const userStocksApi = useUserStocksApi()

  const getTrackedStocks = async (): Promise<TrackedStock[]> => {
    if (isAuthenticated) {
      try {
        const userStocks = await userStocksApi.getUserStocks()
        return userStocks.map(userStockToTrackedStock)
      } catch (error) {
        console.error('無法從伺服器取得股票追蹤清單:', error)
        // 如果後端失敗，退回到本地存儲
        return getLocalTrackedStocks()
      }
    } else {
      return getLocalTrackedStocks()
    }
  }

  const addTrackedStock = async (stock: Omit<TrackedStock, "addedAt">): Promise<void> => {
    if (isAuthenticated) {
      try {
        const createData = trackedStockToCreateUserStock(stock)
        await userStocksApi.addUserStock(createData)
      } catch (error) {
        console.error('無法新增股票追蹤到伺服器:', error)
        throw error
      }
    } else {
      addLocalTrackedStock(stock)
    }
  }

  const removeTrackedStock = async (symbol: string): Promise<void> => {
    if (isAuthenticated) {
      try {
        // 先取得所有股票，找到對應的 ID
        const userStocks = await userStocksApi.getUserStocks()
        const stockToRemove = userStocks.find(stock => stock.symbol === symbol)
        
        if (stockToRemove) {
          await userStocksApi.deleteUserStock(stockToRemove.id)
        }
      } catch (error) {
        console.error('無法從伺服器移除股票追蹤:', error)
        throw error
      }
    } else {
      removeLocalTrackedStock(symbol)
    }
  }

  const updateTrackedStockName = async (symbol: string, customName: string): Promise<void> => {
    if (isAuthenticated) {
      try {
        // 先取得所有股票，找到對應的 ID
        const userStocks = await userStocksApi.getUserStocks()
        const stockToUpdate = userStocks.find(stock => stock.symbol === symbol)
        
        if (stockToUpdate) {
          await userStocksApi.updateStockCustomName(stockToUpdate.id, customName)
        }
      } catch (error) {
        console.error('無法更新伺服器上的股票名稱:', error)
        throw error
      }
    } else {
      updateLocalTrackedStockName(symbol, customName)
    }
  }

  const isStockTracked = async (symbol: string): Promise<boolean> => {
    const trackedStocks = await getTrackedStocks()
    return trackedStocks.some(stock => stock.symbol === symbol)
  }

  const getTrackedStock = async (symbol: string): Promise<TrackedStock | null> => {
    const trackedStocks = await getTrackedStocks()
    return trackedStocks.find(stock => stock.symbol === symbol) || null
  }

  return {
    getTrackedStocks,
    addTrackedStock,
    removeTrackedStock,
    updateTrackedStockName,
    isStockTracked,
    getTrackedStock,
  }
}