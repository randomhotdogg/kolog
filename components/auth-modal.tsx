"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { Loader2, Smartphone } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { signInWithGoogle } from "@/lib/google-auth"

// 表單驗證 schema
const loginSchema = z.object({
  email: z.string().email("請輸入有效的電子郵件地址"),
  password: z.string().min(6, "密碼至少需要6個字符"),
})

const registerSchema = z.object({
  email: z.string().email("請輸入有效的電子郵件地址"),
  password: z.string().min(6, "密碼至少需要6個字符"),
  full_name: z.string().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>
type RegisterFormData = z.infer<typeof registerSchema>

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const { login, register, googleLogin } = useAuth()
  const { toast } = useToast()

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      full_name: "",
    },
  })

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      await login(data)
      onOpenChange(false)
      toast({
        title: "登入成功",
        description: "歡迎回到 KOLOG！",
      })
      loginForm.reset()
    } catch (error: any) {
      toast({
        title: "登入失敗",
        description: error.message || "請檢查您的電子郵件和密碼",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      await register(data)
      onOpenChange(false)
      toast({
        title: "註冊成功",
        description: "歡迎加入 KOLOG！",
      })
      registerForm.reset()
    } catch (error: any) {
      toast({
        title: "註冊失敗",
        description: error.message || "註冊過程中發生錯誤",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      // 取得 Google ID Token
      const idToken = await signInWithGoogle()
      
      // 使用 Google token 進行後端認證
      await googleLogin({ token: idToken })
      
      onOpenChange(false)
      toast({
        title: "登入成功",
        description: "歡迎使用 Google 帳號登入 KOLOG！",
      })
      
    } catch (error: any) {
      console.error('Google 登入錯誤:', error)
      
      let errorMessage = "Google 登入過程中發生錯誤"
      
      if (error.message?.includes('Client ID')) {
        errorMessage = "系統配置錯誤，請聯繫管理員"
      } else if (error.message?.includes('取消')) {
        errorMessage = "登入已取消"
      } else if (error.message?.includes('未設定')) {
        errorMessage = "Google 登入功能未完全設定，請使用電子郵件登入"
      }
      
      toast({
        title: "Google 登入失敗",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const switchMode = () => {
    setIsLogin(!isLogin)
    loginForm.reset()
    registerForm.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
            <Smartphone className="h-6 w-6 text-gray-600" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            {isLogin ? "歡迎使用 KOLOG" : "建立 KOLOG 帳號"}
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            {isLogin ? "請在下方登入或註冊。" : "請在下方填寫資訊。"}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {isLogin ? (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>電郵</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="you@email.com" 
                          type="email"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>密碼</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="請輸入密碼" 
                          type="password"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-gray-800 hover:bg-gray-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      登入中...
                    </>
                  ) : (
                    "使用電子郵件登入"
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>姓名 (選填)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="您的姓名" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>電郵</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="you@email.com" 
                          type="email"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>密碼</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="請設定密碼" 
                          type="password"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-gray-800 hover:bg-gray-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      註冊中...
                    </>
                  ) : (
                    "使用電子郵件註冊"
                  )}
                </Button>
              </form>
            </Form>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">或</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            使用 Google 帳號登入
          </Button>

          <div className="text-center">
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
              onClick={switchMode}
            >
              {isLogin ? "還沒有帳號？立即註冊" : "已有帳號？立即登入"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}