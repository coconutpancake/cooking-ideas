"use client"

import { useRouter, useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useState, useEffect, useRef, useCallback } from "react"
import { ArrowLeft, Share2, Heart, Clock, ChefHat, CheckCircle2, Circle, Flame, Sparkles, Loader2 } from "lucide-react"
import { StatusBar } from "@/components/shared/StatusBar"
import { getRecipeById } from "@/lib/recipes"

interface Step {
  order: number
  description: string
}

interface StreamMessage {
  type: "chunk" | "steps" | "done"
  content?: string
  steps?: Step[]
  fullText?: string
}

export default function RecipeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const recipeId = params.id as string

  // 从 URL 获取用户已有食材信息
  const availableStr = searchParams.get("available") || ""
  const seasoningsStr = searchParams.get("seasonings") || ""
  const recipeName = searchParams.get("title") || ""

  const availableIngredients = availableStr ? availableStr.split(",").filter(Boolean) : []
  const seasonings = seasoningsStr ? seasoningsStr.split(",").filter(Boolean) : []

  const recipe = getRecipeById(recipeId)

  // 流式步骤状态
  const [streamingSteps, setStreamingSteps] = useState<Step[]>([])
  const [displayedText, setDisplayedText] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoadingApi, setIsLoadingApi] = useState(false)
  const [streamError, setStreamError] = useState<string | null>(null)

  // 用于打字机效果的 ref
  const textBufferRef = useRef("")
  const fullStepsRef = useRef<Step[]>([])
  const textIndexRef = useRef(0)

  // 高亮食材名称在文本中
  const highlightIngredients = useCallback(
    (text: string): React.ReactNode => {
      if (availableIngredients.length === 0) return text

      const allIngredients = [
        ...recipe?.mainIngredients.map((i) => i.name) || [],
        ...seasonings,
      ]

      // 按长度降序排列，避免短词先匹配导致问题
      const sorted = [...new Set(allIngredients)].sort((a, b) => b.length - a.length)

      const parts: React.ReactNode[] = []
      let remaining = text
      let lastIndex = 0

      // 简单的高亮逻辑：找到食材名称就高亮
      for (const ing of sorted) {
        const idx = remaining.indexOf(ing)
        if (idx !== -1) {
          if (idx > lastIndex) {
            parts.push(remaining.slice(lastIndex, idx))
          }
          parts.push(
            <span
              key={`${ing}-${idx}`}
              className="bg-orange-200 dark:bg-orange-800/50 text-orange-700 dark:text-orange-300 px-0.5 rounded"
            >
              {ing}
            </span>
          )
          lastIndex = idx + ing.length
        }
      }

      if (lastIndex < remaining.length) {
        parts.push(remaining.slice(lastIndex))
      }

      return parts.length > 0 ? parts : text
    },
    [availableIngredients, recipe?.mainIngredients, seasonings]
  )

  // 获取流式步骤
  useEffect(() => {
    if (!recipeName) return

    let cancelled = false
    let timeoutId: NodeJS.Timeout | null = null

    const fetchSteps = async () => {
      try {
        setStreamError(null)
        textBufferRef.current = ""
        fullStepsRef.current = []
        textIndexRef.current = 0

        // 如果有本地步骤，直接使用
        if (recipe?.steps && recipe.steps.length > 0) {
          console.log("[RecipeDetail] 使用本地步骤:", recipe.steps.length)
          const text = recipe.steps.map((s) => `${s.order}. ${s.description}`).join("\n")
          textBufferRef.current = text
          fullStepsRef.current = recipe.steps
          const localSteps = recipe.steps

          // 打字机效果
          for (let i = 0; i <= text.length && !cancelled; i++) {
            await new Promise((r) => setTimeout(r, 15))
            if (!cancelled) {
              setDisplayedText(text.slice(0, i))
            }
          }

          // 无论是否被取消，都设置步骤（本地数据已经获取，不存在内存泄漏）
          setStreamingSteps(localSteps)
          setIsStreaming(false)
          return
        }

        // 调用流式 API
        setIsLoadingApi(true)
        setIsStreaming(true)
        console.log("[RecipeDetail] 开始请求 /api/detail，recipeName:", recipeName)

        // 设置 45 秒超时
        timeoutId = setTimeout(() => {
          if (!cancelled) {
            console.error("[RecipeDetail] 请求超时")
            setStreamError("生成超时，请检查网络后重试")
            setIsStreaming(false)
            setIsLoadingApi(false)
          }
        }, 45000)

        const response = await fetch("/api/detail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipeName: recipeName || recipe?.title,
            mainIngredients: recipe?.mainIngredients.map((i) => i.name) || [],
            availableIngredients,
          }),
        })

        clearTimeout(timeoutId || undefined)

        if (!response.ok) {
          throw new Error(`请求失败: ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error("无法读取响应流")

        const decoder = new TextDecoder()
        let buffer = ""

        console.log("[RecipeDetail] 开始读取流...")

        while (!cancelled) {
          const { done, value } = await reader.read()

          if (done) {
            console.log("[RecipeDetail] 流读取完成，buffer:", buffer.slice(0, 100))
            break
          }

          const chunk = decoder.decode(value, { stream: true })
          console.log("[RecipeDetail] 收到 chunk:", chunk.slice(0, 80))
          buffer += chunk

          // 解析 SSE：找到所有完整的 "data: {...}\n\n" 消息
          // 使用正则匹配：data: 开头，遇到 \n\n 或字符串结束
          const sseRegex = /data: (.+?)(?=\n\n|$)/g
          let match
          let lastIndex = 0

          while ((match = sseRegex.exec(buffer)) !== null) {
            lastIndex = match.index + match[0].length
            try {
              const msg: StreamMessage = JSON.parse(match[1])
              console.log("[RecipeDetail] 解析消息:", msg.type)

              if (msg.type === "chunk" && msg.content !== undefined) {
                textBufferRef.current += msg.content
                setDisplayedText(textBufferRef.current)
              } else if (msg.type === "done" && msg.steps) {
                console.log("[RecipeDetail] 收到 done，步骤数:", msg.steps.length)
                fullStepsRef.current = msg.steps
                setStreamingSteps(msg.steps)
                setDisplayedText(msg.fullText || textBufferRef.current)
                setIsStreaming(false)
                setIsLoadingApi(false)
              } else if (msg.type === "steps" && msg.steps) {
                // 中间步骤（部分完成）
                fullStepsRef.current = msg.steps
              }
            } catch (parseError) {
              console.warn("[RecipeDetail] 解析失败:", match[1].slice(0, 50))
            }
          }

          // 保留未完成的部分
          buffer = buffer.slice(lastIndex)
        }

        // 如果流结束但还没收到 done，尝试解析剩余 buffer
        if (!cancelled && buffer.trim()) {
          console.log("[RecipeDetail] 流结束，剩余 buffer:", buffer.slice(0, 100))
        }
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId)
        if ((error as Error).name === "AbortError") return
        console.error("[RecipeDetail] 获取步骤失败:", error)
        setStreamError(error instanceof Error ? error.message : "获取步骤失败，请重试")
        setIsStreaming(false)
        setIsLoadingApi(false)
      }
    }

    fetchSteps()

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [recipeName, recipe?.title, recipe?.mainIngredients, recipe?.steps, availableIngredients])

  if (!recipe) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-32">
        <StatusBar />
        <main className="max-w-lg mx-auto px-4 py-20 text-center">
          <p className="text-zinc-500">菜谱不存在</p>
          <Link
            href="/recommend"
            className="mt-4 inline-block px-6 py-2 bg-orange-500 text-white text-sm font-medium rounded-full"
          >
            返回推荐
          </Link>
        </main>
      </div>
    )
  }

  // 判断主食材是否已有
  const availableSet = new Set(availableIngredients.map((i) => i.toLowerCase()))
  const isIngredientAvailable = (name: string) =>
    availableSet.has(name.toLowerCase()) || availableSet.has(name.replace(/[^\u4e00-\u9fa5]/g, "").toLowerCase())

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-32">
      <StatusBar />

      {/* Hero Image with Overlay */}
      <div className="relative h-72 bg-zinc-200 dark:bg-zinc-800">
        <img
          src={recipe.coverImage}
          alt={recipe.title}
          className="w-full h-full object-cover"
        />

        {/* Top Navigation */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors">
              <Share2 size={18} className="text-white" />
            </button>
            <button className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors">
              <Heart size={18} className="text-white" />
            </button>
          </div>
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <h1 className="text-2xl font-bold text-white">{recipe.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-white/90">
              <Clock size={14} />
              <span className="text-sm">{recipe.cookingTime}分钟</span>
            </div>
            <div className="flex gap-1.5">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Ingredients Section */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mb-3">
            食材清单
          </h2>

          {/* Main Ingredients */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-orange-200 dark:border-orange-900">
            <div className="flex items-center gap-2 mb-3">
              <Flame size={18} className="text-orange-500" />
              <span className="font-medium text-orange-600 dark:text-orange-400">
                主食材 ({recipe.mainIngredients.length})
              </span>
            </div>
            <div className="space-y-2">
              {recipe.mainIngredients.map((ing, i) => {
                const available = isIngredientAvailable(ing.name)
                return (
                  <div key={i} className="flex items-center justify-between">
                    <span
                      className={
                        available
                          ? "text-zinc-700 dark:text-zinc-300"
                          : "text-zinc-400 dark:text-zinc-600"
                      }
                    >
                      {available ? (
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 size={14} className="text-green-500" />
                          {ing.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <Circle size={14} className="text-zinc-300 dark:text-zinc-600" />
                          {ing.name}
                        </span>
                      )}
                    </span>
                    <span
                      className={
                        available
                          ? "text-sm text-green-600 dark:text-green-400"
                          : "text-sm text-zinc-400"
                      }
                    >
                      {ing.amount}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Seasonings */}
          <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-4 mt-3 border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-2 mb-3">
              <Circle size={18} className="text-zinc-400" />
              <span className="font-medium text-zinc-600 dark:text-zinc-400">
                调料与辅料 ({recipe.seasonings.length})
              </span>
            </div>
            <div className="space-y-2">
              {recipe.seasonings.map((ing, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">{ing.name}</span>
                  <span className="text-sm text-zinc-400">{ing.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Steps Section */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mb-3">
            做法步骤
            {isLoadingApi && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-orange-500">
                <Loader2 size={14} className="animate-spin" />
                AI 生成中...
              </span>
            )}
          </h2>

          {streamError ? (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
              <div className="flex items-center justify-between">
                <p className="text-red-600 dark:text-red-400 text-sm flex-1">{streamError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="ml-3 px-4 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  重试
                </button>
              </div>
            </div>
          ) : streamingSteps.length > 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800 space-y-4">
              {streamingSteps.map((step) => (
                <div key={step.order} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                      {step.order}
                    </span>
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed pt-1">
                    {highlightIngredients(step.description)}
                  </p>
                </div>
              ))}
            </div>
          ) : isLoadingApi ? (
            // 流式加载中 - 打字机效果
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                        {i}
                      </span>
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse w-full" />
                      <div
                        className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse w-3/4 mt-2"
                        style={{ animationDelay: `${i * 100}ms` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {/* 打字机光标 */}
              <div className="mt-4 flex items-center gap-2">
                <Loader2 size={16} className="text-orange-500 animate-spin" />
                <span className="text-sm text-zinc-400">{displayedText}</span>
                <span className="w-2 h-4 bg-orange-500 animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800 text-center text-zinc-400">
              正在加载步骤...
            </div>
          )}
        </section>

        {/* Tips Section */}
        {recipe.tips && (
          <section>
            <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mb-3">
              小贴士
            </h2>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-900">
              <p className="text-amber-800 dark:text-amber-300 text-sm leading-relaxed">
                {highlightIngredients(recipe.tips)}
              </p>
            </div>
          </section>
        )}
      </main>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 p-4 safe-area-pb">
        <div className="max-w-lg mx-auto">
          <button className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all">
            <ChefHat size={20} />
            开始做菜
          </button>
        </div>
      </div>
    </div>
  )
}
