"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from "@/hooks/use-toast"
import { X, TrendingUp, Plus, Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { TrackedStock } from "@/lib/tracking-storage"

interface TrackingListProps {
  trackedStocks: TrackedStock[]
  selectedStock: string | null
  onSelectStock: (symbol: string) => void
  onRemoveStock: (symbol: string) => void
  onAddStock?: (stock: Omit<TrackedStock, "addedAt">) => void
  onRefresh?: () => void
}

export function TrackingList({ trackedStocks, selectedStock, onSelectStock, onRemoveStock, onAddStock, onRefresh }: TrackingListProps) {
  const [isAddingStock, setIsAddingStock] = useState(false)
  const [symbol, setSymbol] = useState("")
  const [customName, setCustomName] = useState("")
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [symbolError, setSymbolError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { toast } = useToast()

  // 檢測是否為手機版
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768) // md 斷點
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
      // 驗證股票代號是否有效
      const response = await fetch(`/api/stock?symbol=${encodeURIComponent(cleanSymbol)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error("股票代號不存在")
      }

      // 檢查是否已經追蹤
      const existingStock = trackedStocks.find(stock => stock.symbol === cleanSymbol)
      if (existingStock) {
        setSymbolError("此股票已在追蹤清單中")
        setIsLoading(false)
        return
      }

      // 計算起始價格
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

  // 表單內容組件
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
                    "data-[selected-single=true]:bg-emerald-600 data-[selected-single=true]:text-white data-[range-start=true]:bg-emerald-600 data-[range-start=true]:text-white data-[range-end=true]:bg-emerald-600 data-[range-end=true]:text-white hover:bg-emerald-100 hover:text-emerald-700"
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
      <Card className="border-0 shadow-xl bg-white/60 backdrop-blur-sm">
        <CardContent className="py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">開始追蹤您的投資</h3>
            <p className="text-gray-600">搜尋股票並加入追蹤清單，以監控您的投資表現</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-xl bg-white/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg md:text-xl font-semibold text-gray-800">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg items-center justify-center hidden md:flex">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            追蹤清單
            {isMobile ? (
              <Drawer open={isAddingStock} onOpenChange={(open) => {
                setIsAddingStock(open)
                if (!open) {
                  resetForm()
                }
              }}>
                <DrawerTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 w-6 md:h-8 md:w-8 p-0 border-emerald-200 text-emerald-600 hover:text-white hover:bg-emerald-600 hover:border-emerald-600 transition-all duration-200 shadow-sm"
                  >
                    <Plus className="h-3 w-3 md:h-4 md:w-4" />
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
              <Popover open={isAddingStock} onOpenChange={(open) => {
                setIsAddingStock(open)
                if (!open) {
                  resetForm()
                }
              }}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 w-6 md:h-8 md:w-8 p-0 border-emerald-200 text-emerald-600 hover:text-white hover:bg-emerald-600 hover:border-emerald-600 transition-all duration-200 shadow-sm"
                  >
                    <Plus className="h-3 w-3 md:h-4 md:w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-6" align="start">
                  <FormContent />
                </PopoverContent>
              </Popover>
            )}
          </div>
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs md:text-sm px-2 py-0.5 md:px-3 md:py-1">
            {trackedStocks.length} 檔
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {trackedStocks.map((stock) => (
            <div key={stock.symbol} className="relative group">
              <Badge
                variant={selectedStock === stock.symbol ? "default" : "outline"}
                className={`
                  cursor-pointer transition-all duration-200 pr-6 py-1 text-xs
                  ${
                    selectedStock === stock.symbol
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                      : "hover:bg-emerald-50 hover:border-emerald-300 border-gray-300"
                  }
                `}
                onClick={() => onSelectStock(stock.symbol)}
              >
                <div className="flex flex-col items-start gap-0.5">
                  <span className="font-medium text-xs">{stock.customName || stock.symbol}</span>
                  <span className="text-xs opacity-75">
                    {new Date(stock.startTrackingDate).toLocaleDateString("zh-TW", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="absolute -top-1 -right-1 h-5 w-5 p-0 rounded-full bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveStock(stock.symbol)
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
