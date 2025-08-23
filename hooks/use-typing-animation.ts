"use client"

import { useState, useCallback } from "react"

export function useTypingAnimation() {
  const [isTyping, setIsTyping] = useState(false)
  const [currentText, setCurrentText] = useState("")

  const typeText = useCallback(async (text: string, speed = 20) => {
    setIsTyping(true)
    setCurrentText("")

    for (let i = 0; i <= text.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, speed))
      setCurrentText(text.slice(0, i))
    }

    setIsTyping(false)
    return text
  }, [])

  const resetTyping = useCallback(() => {
    setIsTyping(false)
    setCurrentText("")
  }, [])

  return {
    isTyping,
    currentText,
    typeText,
    resetTyping,
  }
}
