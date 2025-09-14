"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Users, Shield, BadgeCheck, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { signInWithGoogle } from "@/lib/google-auth"

// 表單驗證 schema
const registerSchema = z.object({
  email: z.string().email("請輸入有效的電子郵件地址"),
  password: z.string().min(6, "密碼至少需要6個字符"),
  confirmPassword: z.string().min(6, "密碼至少需要6個字符"),
  full_name: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "密碼不匹配",
  path: ["confirmPassword"],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { register, googleLogin } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      full_name: "",
    },
  })

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...registerData } = data
      await register(registerData)
      router.push("/dashboard")
      toast({
        title: "註冊成功",
        description: "歡迎加入 KOLOG！",
      })
    } catch (error) {
      toast({
        title: "註冊失敗",
        description: (error as Error).message || "註冊過程中發生錯誤",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      // 取得 Google ID Token  
      const idToken = await signInWithGoogle()
      
      // 使用 Google token 進行後端認證（Google 登入自動創建帳戶）
      await googleLogin({ token: idToken })
      
      router.push("/dashboard")
      toast({
        title: "註冊成功",
        description: "歡迎使用 Google 帳號註冊 KOLOG！",
      })
      
    } catch (error) {
      console.error('Google 註冊錯誤:', error)
      
      let errorMessage = "Google 註冊過程中發生錯誤"
      const err = error as Error
      
      if (err.message?.includes('Client ID')) {
        errorMessage = "系統配置錯誤，請聯繫管理員"
      } else if (err.message?.includes('取消')) {
        errorMessage = "註冊已取消"
      } else if (err.message?.includes('未設定')) {
        errorMessage = "Google 註冊功能未完全設定，請使用電子郵件註冊"
      }
      
      toast({
        title: "Google 註冊失敗",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 手機版 Header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-center pt-12 pb-8">
          <div className="flex items-center space-x-2">
            <BadgeCheck className="h-8 w-8 text-emerald-600" />
            <span className="text-2xl font-bold text-gray-900">KOLOG</span>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen">
        {/* 桌面版左側產品展示區域 */}
        <div className="hidden lg:flex lg:w-[35%] bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white p-12 flex-col justify-between">
          {/* 頂部品牌區域 */}
          <div>
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="text-2xl font-bold">KOLOG</span>
            </div>
            
            <h1 className="text-4xl font-bold mb-4">
              加入 KOLOG 社群
            </h1>
            <p className="text-xl text-emerald-100 mb-8 leading-relaxed">
              與數千位投資者一起，利用 AI 技術提升投資決策。立即開始您的智能投資之旅。
            </p>
          </div>

          {/* 中間特色展示 */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative">
              {/* 主要展示卡片 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 w-80 shadow-2xl border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-emerald-100">社群功能</span>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse delay-200"></div>
                    <div className="w-2 h-2 bg-teal-300 rounded-full animate-pulse delay-400"></div>
                  </div>
                </div>

                {/* 用戶統計 */}
                <div className="bg-white/20 rounded-xl p-4 mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-4 h-4 text-white" />
                    <span className="text-sm font-medium">活躍投資者</span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">12,847</div>
                  <div className="text-xs text-emerald-200">本月新增 +2,341 位</div>
                </div>

                {/* 安全保障 */}
                <div className="bg-white/20 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-4 h-4 text-white" />
                    <span className="text-sm font-medium">安全保障</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">256位</div>
                      <div className="text-xs text-emerald-200">加密保護</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">99.9%</div>
                      <div className="text-xs text-emerald-200">正常運行</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 主要註冊表單區域 */}
        <div className="flex-1 lg:w-[65%] flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md">
            {/* 桌面版標題 */}
            <div className="hidden lg:block text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">建立帳戶</h2>
              <p className="text-gray-600">開始您的智能投資之旅</p>
            </div>

            {/* 手機版標題 */}
            <div className="lg:hidden text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">註冊</h1>
            </div>

            <Card className="border-0 shadow-lg lg:shadow-2xl bg-white">
              <CardContent className="p-6 sm:p-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            姓名（選填）
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="您的姓名"
                              className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            郵箱
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="you@email.com"
                              type="email"
                              className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            密碼
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="至少 6 個字符"
                              type="password"
                              className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            確認密碼
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="再次輸入密碼"
                              type="password"
                              className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="text-center">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-full transition duration-200"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            建立中...
                          </>
                        ) : (
                          "建立帳戶"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>

                <div className="mt-6">
                  <div className="text-center text-sm text-gray-600 mb-6">
                    或使用其他方式
                  </div>

                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full h-12 border border-gray-300 rounded-full hover:bg-gray-50 flex items-center justify-center"
                      onClick={handleGoogleRegister}
                      disabled={isLoading}
                    >
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span className="text-gray-700">Google</span>
                    </Button>
                  </div>
                </div>

                <div className="text-center mt-8">
                  <p className="text-gray-600 text-sm">
                    已經有帳號？{" "}
                    <Link href="/account/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                      立即登入
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}