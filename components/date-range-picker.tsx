"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface DateRange {
  startDate: Date | null
  endDate: Date | null
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  className?: string
}

const QUICK_OPTIONS = [
  { label: "1個月", months: 1 },
  { label: "3個月", months: 3 },
  { label: "6個月", months: 6 },
  { label: "1年", months: 12 },
  { label: "2年", months: 24 },
]

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectingStart, setSelectingStart] = useState(true)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  // 檢測是否為手機版
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768) // md 斷點
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  const calculatePosition = useCallback(() => {
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    setPopupPosition({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX
    })
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        containerRef.current && 
        !containerRef.current.contains(target) &&
        popupRef.current &&
        !popupRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      window.addEventListener("scroll", calculatePosition, true)
      window.addEventListener("resize", calculatePosition)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      window.removeEventListener("scroll", calculatePosition, true)
      window.removeEventListener("resize", calculatePosition)
    }
  }, [isOpen, calculatePosition])

  const formatDate = (date: Date | null) => {
    if (!date) return ""
    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  const handleQuickSelect = (months: number) => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(endDate.getMonth() - months)
    onChange({ startDate, endDate })
    setIsOpen(false)
  }

  const handleDateClick = (date: Date) => {
    if (selectingStart) {
      onChange({ startDate: date, endDate: null })
      setSelectingStart(false)
    } else {
      if (value.startDate && date < value.startDate) {
        onChange({ startDate: date, endDate: value.startDate })
      } else {
        onChange({ startDate: value.startDate, endDate: date })
      }
      setSelectingStart(true)
      setIsOpen(false)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const isDateInRange = (date: Date) => {
    if (!value.startDate || !value.endDate) return false
    return date > value.startDate && date < value.endDate
  }


  const isRangeStart = (date: Date) => {
    return value.startDate && date.getTime() === value.startDate.getTime()
  }

  const isRangeEnd = (date: Date) => {
    return value.endDate && date.getTime() === value.endDate.getTime()
  }

  const navigateMonth = (direction: "prev" | "next") => {
    const newMonth = new Date(currentMonth)
    if (direction === "prev") {
      newMonth.setMonth(newMonth.getMonth() - 1)
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1)
    }
    setCurrentMonth(newMonth)
  }

  const getNextMonth = () => {
    const nextMonth = new Date(currentMonth)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    return nextMonth
  }

  const renderCalendar = (monthDate: Date) => {
    const days = getDaysInMonth(monthDate)
    const monthYear = monthDate.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
    })

    return (
      <div className="flex-1">
        {/* Calendar Header */}
        <div className="text-center mb-4">
          <h3 className="font-medium">{monthYear}</h3>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 p-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => (
            <div key={index} className="aspect-square">
              {date && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDateClick(date)}
                  className={cn(
                    "w-full h-full text-xs relative",
                    isRangeStart(date) && "bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white rounded-lg z-10",
                    isRangeEnd(date) && "bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white rounded-lg z-10",
                    isDateInRange(date) && "bg-emerald-100 hover:bg-emerald-200 rounded-none",
                    date > new Date() && "text-gray-400 cursor-not-allowed",
                  )}
                  disabled={date > new Date()}
                >
                  {date.getDate()}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderDatePickerContent = () => (
    <>
      {/* Quick Options */}
      <div className="mb-4">
        <p className="text-sm font-medium mb-2">快速選擇</p>
        <div className={cn("flex flex-wrap gap-2", isMobile ? "grid grid-cols-2" : "")}>
          {QUICK_OPTIONS.map((option) => (
            <Button
              key={option.label}
              variant="outline"
              size="sm"
              onClick={() => handleQuickSelect(option.months)}
              className="text-xs"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigateMonth("prev")}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm text-gray-500">選擇日期範圍</div>
        <Button variant="ghost" size="sm" onClick={() => navigateMonth("next")}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className={cn(isMobile ? "space-y-6" : "flex gap-8 overflow-x-auto")}>
        {renderCalendar(currentMonth)}
        {!isMobile && renderCalendar(getNextMonth())}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        {selectingStart ? "選擇開始日期" : "選擇結束日期"}
      </div>
    </>
  )

  const handleToggleOpen = () => {
    if (!isOpen && !isMobile) {
      // 先計算位置再打開 (僅桌面版)
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setPopupPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX
        })
      }
    }
    setIsOpen(!isOpen)
  }

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-full justify-start text-left font-normal", className)}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {value.startDate && value.endDate
              ? `${formatDate(value.startDate)} - ${formatDate(value.endDate)}`
              : value.startDate
                ? `${formatDate(value.startDate)} - 選擇結束日期`
                : "選擇日期區間"}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>選擇日期區間</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 pb-8">
            {renderDatePickerContent()}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <Button
        variant="outline"
        onClick={handleToggleOpen}
        className="w-full justify-start text-left font-normal"
      >
        <Calendar className="mr-2 h-4 w-4" />
        {value.startDate && value.endDate
          ? `${formatDate(value.startDate)} - ${formatDate(value.endDate)}`
          : value.startDate
            ? `${formatDate(value.startDate)} - 選擇結束日期`
            : "選擇日期區間"}
      </Button>

      {isOpen && typeof window !== 'undefined' && createPortal(
        <Card
          ref={popupRef}
          className="absolute shadow-lg w-[700px] bg-white border z-[9999]"
          style={{
            top: popupPosition.top,
            left: popupPosition.left
          }}
        >
          <CardContent className="p-4">
            {renderDatePickerContent()}
          </CardContent>
        </Card>,
        document.body
      )}
    </div>
  )
}
