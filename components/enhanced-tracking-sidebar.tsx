"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, TrendingUp, TrendingDown, X, Edit2, Check } from "lucide-react"
import { useTrackingService } from "@/lib/tracking-service"
import { type TrackedStock } from "@/lib/tracking-storage"
import { useToast } from "@/hooks/use-toast"

interface EnhancedTrackingSidebarProps {
  selectedStock: string | null
  onSelectStock: (symbol: string) => void
  onStockAdded: () => void
  stockPerformances: Record<string, { 
    currentPrice: number; 
    percentChange: number; 
    priceChange: number 
  }>
}

export function EnhancedTrackingSidebar({ 
  selectedStock, 
  onSelectStock, 
  onStockAdded,
  stockPerformances 
}: EnhancedTrackingSidebarProps) {
  const [trackedStocks, setTrackedStocks] = useState<TrackedStock[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingStock, setEditingStock] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [isAddingStock, setIsAddingStock] = useState(false)
  const [newStockSymbol, setNewStockSymbol] = useState("")
  
  const trackingService = useTrackingService()
  const { toast } = useToast()

  const loadTrackedStocks = async () => {
    try {
      setIsLoading(true)
      const stocks = await trackingService.getTrackedStocks()
      setTrackedStocks(stocks)
    } catch (error) {
      console.error('無法載入追蹤股票:', error)
      toast({
        title: "載入失敗",
        description: "無法載入股票追蹤清單",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTrackedStocks()
  }, [])

  const handleRemoveStock = async (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      await trackingService.removeTrackedStock(symbol)
      await loadTrackedStocks()
      onStockAdded() // 通知父組件刷新數據
      
      toast({
        title: "移除成功",
        description: `已移除 ${symbol} 的追蹤`,
      })
    } catch (error: any) {
      toast({
        title: "移除失敗",
        description: error.message || "無法移除股票追蹤",
        variant: "destructive",
      })
    }
  }

  const handleStartEditing = (stock: TrackedStock, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingStock(stock.symbol)
    setEditingName(stock.customName || "")
  }

  const handleSaveEdit = async (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      await trackingService.updateTrackedStockName(symbol, editingName)
      await loadTrackedStocks()
      setEditingStock(null)
      
      toast({
        title: "更新成功",
        description: "股票名稱已更新",
      })
    } catch (error: any) {
      toast({
        title: "更新失敗",
        description: error.message || "無法更新股票名稱",
        variant: "destructive",
      })
    }
  }

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingStock(null)
    setEditingName("")
  }

  const handleAddStock = async () => {
    if (!newStockSymbol.trim()) return
    
    try {
      // 這裡需要實際的股票查詢 API
      // 暫時使用模擬數據
      const mockStockData = {
        symbol: newStockSymbol.toUpperCase(),
        companyName: `${newStockSymbol.toUpperCase()} 公司`,
        startTrackingDate: new Date(),
        startPrice: 100, // 這裡需要從真實 API 獲取
        currency: "USD"
      }
      
      await trackingService.addTrackedStock(mockStockData)
      await loadTrackedStocks()
      onStockAdded()
      
      setNewStockSymbol("")
      setIsAddingStock(false)
      
      toast({
        title: "新增成功",
        description: `已開始追蹤 ${mockStockData.symbol}`,
      })
    } catch (error: any) {
      toast({
        title: "新增失敗",
        description: error.message || "無法新增股票追蹤",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <Card className="h-full border-0 shadow-xl bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            追蹤清單
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-gray-600">載入中...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full border-0 shadow-xl bg-white/60 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          追蹤清單
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddingStock(true)}
            className="h-7 w-7 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="px-3 py-0">
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-2 pr-3">
            {/* 新增股票輸入 */}
            {isAddingStock && (
              <div className="p-3 border rounded-lg bg-gray-50">
                <div className="flex gap-2">
                  <Input
                    placeholder="輸入股票代號"
                    value={newStockSymbol}
                    onChange={(e) => setNewStockSymbol(e.target.value)}
                    className="h-8 text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddStock()
                      }
                    }}
                  />
                  <Button size="sm" onClick={handleAddStock} className="h-8">
                    新增
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setIsAddingStock(false)}
                    className="h-8"
                  >
                    取消
                  </Button>
                </div>
              </div>
            )}

            {trackedStocks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-2">還沒有追蹤任何股票</p>
                <p className="text-xs">點擊 + 按鈕開始追蹤</p>
              </div>
            ) : (
              trackedStocks.map((stock) => {
                const performance = stockPerformances[stock.symbol]
                const isSelected = selectedStock === stock.symbol
                const isEditing = editingStock === stock.symbol
                
                return (
                  <div
                    key={stock.symbol}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected 
                        ? "border-emerald-200 bg-emerald-50" 
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                    onClick={() => onSelectStock(stock.symbol)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-900">
                            {stock.symbol}
                          </span>
                          {performance && (
                            <div className="flex items-center">
                              {performance.percentChange >= 0 ? (
                                <TrendingUp className="h-3 w-3 text-green-600" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-red-600" />
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* 自訂名稱編輯 */}
                        {isEditing ? (
                          <div className="flex items-center gap-1 mt-1">
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="h-6 text-xs"
                              onClick={(e) => e.stopPropagation()}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveEdit(stock.symbol, e)
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={(e) => handleSaveEdit(stock.symbol, e)}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 mt-1">
                            <p className="text-xs text-gray-600 truncate">
                              {stock.customName || stock.companyName}
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 w-4 p-0 opacity-50 hover:opacity-100"
                              onClick={(e) => handleStartEditing(stock, e)}
                            >
                              <Edit2 className="h-2 w-2" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                        onClick={(e) => handleRemoveStock(stock.symbol, e)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* 績效顯示 */}
                    {performance && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">
                          ${performance.currentPrice.toFixed(2)}
                        </span>
                        <Badge
                          variant={performance.percentChange >= 0 ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {performance.percentChange >= 0 ? "+" : ""}
                          {performance.percentChange.toFixed(2)}%
                        </Badge>
                      </div>
                    )}
                    
                    {/* 追蹤開始日期 */}
                    <div className="text-xs text-gray-500 mt-1">
                      追蹤自 {stock.startTrackingDate.toLocaleDateString()}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}