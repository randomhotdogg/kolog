"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from "@/hooks/use-toast"
import { X, TrendingUp, Plus, Calendar as CalendarIcon, TrendingDown, Eye, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { TrackedStock } from "@/lib/tracking-storage"

interface TrackingSidebarProps {
  trackedStocks: TrackedStock[]
  selectedStock: string | null
  onSelectStock: (symbol: string) => void
  onRemoveStock: (symbol: string) => void
  onAddStock?: (stock: Omit<TrackedStock, "addedAt">) => void
  stockPerformances?: Record<string, { currentPrice: number; percentChange: number; priceChange: number }>
}

export function TrackingSidebar({ 
  trackedStocks, 
  selectedStock, 
  onSelectStock, 
  onRemoveStock, 
  onAddStock,
  stockPerformances = {}
}: TrackingSidebarProps) {
  const [isAddingStock, setIsAddingStock] = useState(false)
  const [symbol, setSymbol] = useState("")
  const [customName, setCustomName] = useState("")
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [symbolError, setSymbolError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isDeleteMode, setIsDeleteMode] = useState(false)
  const [selectedStocks, setSelectedStocks] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  const resetForm = () => {
    setSymbol("")
    setCustomName("")
    setStartDate(new Date())
    setSymbolError("")
    setIsLoading(false)
  }

  const toggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode)
    setSelectedStocks(new Set())
  }

  const toggleStockSelection = (symbol: string) => {
    const newSelected = new Set(selectedStocks)
    if (newSelected.has(symbol)) {
      newSelected.delete(symbol)
    } else {
      newSelected.add(symbol)
    }
    setSelectedStocks(newSelected)
  }

  const handleBatchDelete = () => {
    if (selectedStocks.size === 0) return
    setDeleteDialogOpen(true)
  }

  const handleConfirmBatchDelete = async () => {
    setIsDeleting(true)
    
    try {
      const selectedSymbols = Array.from(selectedStocks)
      
      // 逐一刪除選中的股票
      for (const symbol of selectedSymbols) {
        onRemoveStock(symbol)
      }
      
      toast({
        title: "刪除成功",
        description: `已刪除 ${selectedSymbols.length} 檔股票`,
      })
      
      // 重置狀態
      setSelectedStocks(new Set())
      setIsDeleteMode(false)
      setDeleteDialogOpen(false)
    } catch (error) {
      toast({
        title: "刪除失敗",
        description: "刪除過程中發生錯誤，請重試",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelBatchDelete = () => {
    setDeleteDialogOpen(false)
  }

  const handleAddStock = async () => {
    if (!symbol.trim()) {
      setSymbolError("請輸入股票代號")
      return
    }

    const cleanSymbol = symbol.trim().toUpperCase()
    if (!/^[A-Z]{1,5}$/.test(cleanSymbol)) {
      setSymbolError("股票代號格式錯誤")
      return
    }

    setIsLoading(true)
    setSymbolError("")

    try {
      const response = await fetch(`/api/stock?symbol=${encodeURIComponent(cleanSymbol)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error("股票代號不存在")
      }

      const existingStock = trackedStocks.find(stock => stock.symbol === cleanSymbol)
      if (existingStock) {
        setSymbolError("此股票已在追蹤清單中")
        setIsLoading(false)
        return
      }

      const startPrice = data.data && data.data.length > 0 
        ? data.data.find((item: { timestamp: number; close: number }) => item.timestamp >= Math.floor(startDate.getTime() / 1000))?.close || data.currentPrice
        : data.currentPrice

      const newStock = {
        symbol: cleanSymbol,
        companyName: data.companyName,
        customName: customName.trim() || undefined,
        startTrackingDate: startDate,
        startPrice: startPrice,
        currency: data.currency,
      }

      if (onAddStock) {
        onAddStock(newStock)
      }

      toast({
        title: "成功",
        description: `${cleanSymbol} 已成功新增到追蹤清單`,
      })

      resetForm()
      setIsAddingStock(false)
    } catch {
      setSymbolError("股票代號不存在或無法獲取數據")
    } finally {
      setIsLoading(false)
    }
  }

  const FormContent = () => (
    <div className="space-y-4">
      <div className="space-y-4">
        <div>
          <Label htmlFor="symbol" className="text-sm font-medium text-gray-700 mb-2 block">股票代號 *</Label>
          <Input
            id="symbol"
            placeholder="AAPL"
            value={symbol}
            onChange={(e) => {
              setSymbol(e.target.value.toUpperCase())
              setSymbolError("")
            }}
            className={cn("mt-1", symbolError && "border-red-500")}
          />
          {symbolError && (
            <p className="text-sm text-red-600 mt-2">{symbolError}</p>
          )}
        </div>

        <div>
          <Label htmlFor="customName" className="text-sm font-medium text-gray-700 mb-2 block">自定義名稱</Label>
          <Input
            id="customName"
            placeholder="選填，最多15字"
            value={customName}
            onChange={(e) => setCustomName(e.target.value.slice(0, 15))}
            maxLength={15}
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">起始日期</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal mt-1",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "yyyy年MM月dd日") : "選擇日期"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => date && setStartDate(date)}
                disabled={(date) => date > new Date()}
                initialFocus
                classNames={{
                  day_button: cn(
                    "data-[selected-single=true]:bg-emerald-600 data-[selected-single=true]:text-white data-[selected-single=true]:hover:bg-emerald-600 data-[selected-single=true]:hover:text-white hover:bg-emerald-100 hover:text-emerald-700"
                  ),
                  today: "bg-emerald-50 text-emerald-800 font-semibold"
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          onClick={() => {
            resetForm()
            setIsAddingStock(false)
          }}
          variant="outline"
          className="flex-1"
          disabled={isLoading}
        >
          取消
        </Button>
        <Button
          onClick={handleAddStock}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          disabled={isLoading || !symbol.trim()}
        >
          {isLoading ? "新增中..." : "新增"}
        </Button>
      </div>
    </div>
  )

  if (trackedStocks.length === 0) {
    return (
      <Card className="h-full border-0 shadow-xl bg-white/60 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">開始追蹤投資</h3>
            <p className="text-sm text-gray-600 mb-4">添加股票到追蹤清單</p>
            
            {isMobile ? (
              <Drawer open={isAddingStock} onOpenChange={setIsAddingStock}>
                <DrawerTrigger asChild>
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2 rounded-lg">
                    新增追蹤
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>新增追蹤個股</DrawerTitle>
                  </DrawerHeader>
                  <div className="p-4 pb-8">
                    <FormContent />
                  </div>
                </DrawerContent>
              </Drawer>
            ) : (
              <Popover open={isAddingStock} onOpenChange={setIsAddingStock}>
                <PopoverTrigger asChild>
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2 rounded-lg">
                    新增追蹤
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-6" align="start">
                  <FormContent />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[calc(100vh-280px)] border-0 shadow-xl bg-white/60 backdrop-blur-sm flex flex-col">
      <CardHeader className="pb-1">
        <CardTitle className="text-base font-semibold text-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>追蹤清單</span>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-2 py-0.5">
              {trackedStocks.length}
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={toggleDeleteMode}
            className={cn(
              "p-1 h-6 w-6",
              isDeleteMode && "text-red-600 bg-red-50"
            )}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 px-0 py-0 flex flex-col min-h-0">
        {/* 表頭 */}
        <div className={cn(
          "grid gap-2 py-3 px-4 border-b border-gray-200 bg-gray-50/50",
          isDeleteMode ? "grid-cols-11" : "grid-cols-10"
        )}>
          {isDeleteMode && <div className="col-span-1 text-xs font-medium text-gray-600"></div>}
          <div className="col-span-4 text-xs font-medium text-gray-600">名稱</div>
          <div className="col-span-3 text-xs font-medium text-gray-600">價格</div>
          <div className="col-span-3 text-xs font-medium text-gray-600">績效</div>
        </div>
        
        {/* 股票列表 */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
          {trackedStocks.map((stock) => {
            const performance = stockPerformances[stock.symbol]
            const isSelected = selectedStock === stock.symbol
            const isPositive = performance ? performance.percentChange >= 0 : false
            
            return (
              <div 
                key={stock.symbol} 
                className={cn(
                  "grid gap-2 py-3 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer",
                  isDeleteMode ? "grid-cols-11" : "grid-cols-10",
                  isSelected && "bg-blue-50",
                  selectedStocks.has(stock.symbol) && "bg-red-50"
                )}
                onClick={() => {
                  if (isDeleteMode) {
                    toggleStockSelection(stock.symbol)
                  } else {
                    onSelectStock(stock.symbol)
                  }
                }}
              >
                {/* 選取器欄 */}
                {isDeleteMode && (
                  <div className="col-span-1 flex items-center justify-center">
                    <div 
                      className={cn(
                        "w-4 h-4 rounded-full border-2 cursor-pointer transition-all",
                        selectedStocks.has(stock.symbol) 
                          ? "bg-red-600 border-red-600" 
                          : "border-gray-300 hover:border-red-400"
                      )}
                    >
                      {selectedStocks.has(stock.symbol) && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                      )}
                    </div>
                  </div>
                )}
                {/* 名稱欄 */}
                <div className="col-span-4">
                  <div className="font-medium text-sm text-gray-900">
                    {stock.symbol}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {stock.customName || stock.companyName}
                  </div>
                </div>
                
                {/* 價格欄 */}
                <div className="col-span-3 flex flex-col justify-center">
                  <div className="text-sm font-medium text-gray-900">
                    {performance ? performance.currentPrice.toFixed(2) : '--'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {stock.startPrice.toFixed(2)}
                  </div>
                </div>
                
                {/* 升跌幅欄 */}
                <div className="col-span-3 flex flex-col justify-center">
                  {performance ? (
                    <>
                      <div className={cn(
                        "text-sm font-medium",
                        isPositive ? "text-green-600" : "text-red-600"
                      )}>
                        {isPositive ? "+" : ""}{performance.percentChange.toFixed(2)}%
                      </div>
                      <div className={cn(
                        "text-xs",
                        isPositive ? "text-green-500" : "text-red-500"
                      )}>
                        {isPositive ? "+" : ""}{performance.priceChange.toFixed(2)}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-400">--</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* 底部操作區域 */}
        {isDeleteMode ? (
          <div className="p-4 border-t border-gray-200 bg-red-50 -mx-0 -mb-6 pb-6 rounded-b-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">
                已選中 {selectedStocks.size} 項
              </span>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={toggleDeleteMode}
                className="flex-1"
              >
                取消
              </Button>
              <Button 
                variant="destructive"
                onClick={handleBatchDelete}
                disabled={selectedStocks.size === 0 || isDeleting}
                className="flex-1"
              >
                {isDeleting ? "刪除中..." : `刪除選中項目 (${selectedStocks.size})`}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 border-t border-gray-200">
            {isMobile ? (
              <Drawer open={isAddingStock} onOpenChange={setIsAddingStock}>
                <DrawerTrigger asChild>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-2">
                    新增追蹤
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>新增追蹤個股</DrawerTitle>
                  </DrawerHeader>
                  <div className="p-4 pb-8">
                    <FormContent />
                  </div>
                </DrawerContent>
              </Drawer>
            ) : (
              <Popover open={isAddingStock} onOpenChange={setIsAddingStock}>
                <PopoverTrigger asChild>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-2">
                    新增追蹤
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-6" align="start">
                  <FormContent />
                </PopoverContent>
              </Popover>
            )}
          </div>
        )}
      </CardContent>
      
      {/* 批量刪除確認對話框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除追蹤個股</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除以下 {selectedStocks.size} 檔股票嗎？此操作無法復原。
            </AlertDialogDescription>
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <div className="text-sm text-gray-700">
                {Array.from(selectedStocks).map((symbol) => {
                  const stock = trackedStocks.find(s => s.symbol === symbol)
                  return (
                    <div key={symbol} className="flex justify-between items-center py-1">
                      <span className="font-medium">{symbol}</span>
                      <span className="text-gray-500 text-xs">
                        {stock?.customName || stock?.companyName}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelBatchDelete}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmBatchDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "刪除中..." : "確定刪除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}