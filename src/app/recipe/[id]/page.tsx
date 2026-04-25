"use client"

import { useRouter, useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { ArrowLeft, CheckCircle2, Circle, Flame, Loader2, Lightbulb } from "lucide-react"
import { getIngredients } from "@/lib/storage"
import { cn } from "@/lib/utils"

interface Step {
  order: number
  description: string
}

export default function RecipeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const recipeId = params.id as string

  const availableStr = searchParams.get("available") || ""
  const missingStr = searchParams.get("missing") || ""
  const seasoningsStr = searchParams.get("seasonings") || ""
  const recipeName = searchParams.get("title") || ""
  const emojiParam = searchParams.get("emoji") || ""

  // 从 URL 参数解析已有食材列表
  const availableIngredients = useMemo(
    () => availableStr.split(",").filter(Boolean),
    [availableStr]
  )
  const missingIngredients = useMemo(
    () => missingStr.split(",").filter(Boolean),
    [missingStr]
  )
  const seasonings = useMemo(
    () => seasoningsStr.split(",").filter(Boolean),
    [seasoningsStr]
  )

  // 判断是否为 AI 菜谱
  const isAIRecipe = recipeId.startsWith("ai-")

  // 从 localStorage 读取真实用户食材，用于高亮对比
  const userIngredients = useMemo(() => {
    return getIngredients().map((i) => i.name)
  }, [])

  // 真实食材 Set（用于判断是否已有）
  const userIngredientsSet = useMemo(
    () => new Set(userIngredients.map((i) => i.toLowerCase())),
    [userIngredients]
  )

  // 判断某食材是否在用户冰箱中
  const isUserHasIngredient = useCallback(
    (name: string): boolean => {
      const normalized = name.toLowerCase()
      return (
        userIngredientsSet.has(normalized) ||
        userIngredientsSet.has(normalized.replace(/[^\u4e00-\u9fa5]/g, ""))
      )
    },
    [userIngredientsSet]
  )

  // 完整食材列表（主食材 + 调料，用于全量高亮）
  const allIngredientsForHighlight = useMemo(
    () => [
      ...availableIngredients,
      ...missingIngredients,
      ...seasonings,
    ],
    [availableIngredients, missingIngredients, seasonings]
  )

  // 构建菜谱数据（来自 URL 参数）
  const recipeData = useMemo(() => {
    if (!recipeName) return null
    return {
      title: decodeURIComponent(recipeName),
      emoji: decodeURIComponent(emojiParam) || "🍽️",
      mainIngredients: [...availableIngredients, ...missingIngredients].map(
        (name) => ({ name, amount: "适量" })
      ),
      seasonings: seasonings.map((name) => ({ name, amount: "适量" })),
      cookingTime: 20,
      tags: ["简单", "2人份"],
    }
  }, [recipeName, emojiParam, availableIngredients, missingIngredients, seasonings])

  // 步骤状态
  const [steps, setSteps] = useState<Step[]>([])
  const [displayedText, setDisplayedText] = useState("")
  const [tips, setTips] = useState<string | undefined>(undefined)
  const [isLoadingApi, setIsLoadingApi] = useState(false)
  const [streamError, setStreamError] = useState<string | null>(null)

  // 高亮食材 - 全量（主食材 + 调料）
  const highlightIngredients = useCallback(
    (text: string): React.ReactNode => {
      if (allIngredientsForHighlight.length === 0) return text

      const sorted = [...new Set(allIngredientsForHighlight)].sort(
        (a, b) => b.length - a.length
      )

      const parts: React.ReactNode[] = []
      let remaining = text
      let lastIndex = 0

      for (const ing of sorted) {
        const idx = remaining.indexOf(ing)
        if (idx !== -1) {
          if (idx > lastIndex) {
            parts.push(remaining.slice(lastIndex, idx))
          }
          parts.push(
            <span
              key={`${ing}-${idx}`}
              className="bg-orange-50 text-orange-600 px-0.5 rounded"
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
    [allIngredientsForHighlight]
  )

  const hasFetchedRef = useRef(false)

  // 调用 /api/detail 获取真实步骤
  useEffect(() => {
    if (!recipeName || hasFetchedRef.current) return

    hasFetchedRef.current = true
    setIsLoadingApi(true)
    setStreamError(null)

    const fetchSteps = async () => {
      try {
        const response = await fetch("/api/detail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipeName: decodeURIComponent(recipeName),
            mainIngredients: [...availableIngredients, ...missingIngredients],
            availableIngredients: userIngredients,
          }),
        })

        if (!response.ok) {
          throw new Error(`请求失败: ${response.status}`)
        }

        const data = await response.json()

        if (data.success && data.steps) {
          setSteps(data.steps)
          setDisplayedText(data.fullText || "")
          if (data.tips) setTips(data.tips)
        } else if (data.error) {
          throw new Error(data.error)
        }
      } catch (error) {
        setStreamError(
          error instanceof Error ? error.message : "获取步骤失败，请重试"
        )
      } finally {
        setIsLoadingApi(false)
      }
    }

    fetchSteps()
  }, [recipeName, userIngredients])

  // 无菜谱数据时
  if (!recipeData) {
    return (
      <div className="min-h-screen bg-white pb-32">
        <main className="max-w-md mx-auto px-5 py-20 text-center">
          <p className="text-gray-400">菜谱不存在</p>
          <Link
            href="/recommend"
            className="mt-4 inline-block px-6 py-3 rounded-full bg-orange-500 text-white text-sm font-medium"
          >
            返回推荐
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-16 max-w-md mx-auto">

      {/* ── 头部区域 ─────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2 flex items-center">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center -ml-2"
        >
          <ArrowLeft size={22} className="text-black" />
        </button>
      </div>

      {/* ── 标题区 ─────────────────────────────────────────── */}
      <div className="px-5 pb-4">
        <h1 className="text-2xl font-bold text-black leading-tight">
          {recipeData.title}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {recipeData.cookingTime}分钟 · {recipeData.tags[0]} · 2人份
        </p>
      </div>

      {/* Content */}
      <main className="px-5 space-y-5">

        {/* ── 食材清单 ───────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-bold text-black pb-3 border-b border-gray-100">
            食材清单
          </h2>

          {/* 主食材 */}
          <div className="py-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                <Flame size={12} className="text-orange-500" />
              </div>
              <span className="text-sm font-semibold text-black">
                主食材
              </span>
            </div>
            <div className="space-y-0">
              {recipeData.mainIngredients.map((ing, i) => {
                const hasIt = isUserHasIngredient(ing.name)
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      {hasIt ? (
                        <CheckCircle2
                          size={16}
                          className="text-green-500 flex-shrink-0"
                        />
                      ) : (
                        <Circle
                          size={16}
                          className="text-gray-300 flex-shrink-0"
                        />
                      )}
                      <span
                        className={
                          hasIt ? "text-sm text-black" : "text-sm text-gray-400"
                        }
                      >
                        {ing.name}
                      </span>
                    </div>
                    <span className="text-sm text-gray-400">{ing.amount}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 调料辅料 */}
          <div className="py-3 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                <Circle size={12} className="text-gray-400" />
              </div>
              <span className="text-sm font-semibold text-black">
                调料与辅料
              </span>
            </div>
            <div className="space-y-0">
              {recipeData.seasonings.map((ing, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-b-0"
                >
                  <span className="text-sm text-gray-500">{ing.name}</span>
                  <span className="text-sm text-gray-400">{ing.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 做法步骤 ───────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-bold text-black pb-3 border-b border-gray-100 flex items-center gap-2">
            做法步骤
            {isLoadingApi && (
              <span className="inline-flex items-center gap-1.5 text-xs font-normal text-orange-500">
                <Loader2 size={14} className="animate-spin" />
                AI 生成中...
              </span>
            )}
          </h2>

          {streamError ? (
            <div className="py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-sm text-red-500 flex-1">{streamError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="ml-3 px-4 py-1.5 bg-red-50 text-red-500 text-xs font-medium rounded-full"
                >
                  重试
                </button>
              </div>
            </div>
          ) : steps.length > 0 ? (
            <div className="py-4 space-y-4">
              {steps.map((step) => (
                <div key={step.order} className="flex items-start gap-3">
                  {/* 圆形序号徽章 */}
                  <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    {step.order}
                  </div>
                  <p className="text-sm text-black leading-relaxed pt-0.5">
                    {highlightIngredients(step.description)}
                  </p>
                </div>
              ))}
            </div>
          ) : isLoadingApi ? (
            /* 骨架屏加载态 */
            <div className="py-8">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {i}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
                      <div
                        className="h-4 bg-gray-100 rounded animate-pulse w-3/4 mt-2"
                        style={{ animationDelay: `${i * 100}ms` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {/* 打字机光标效果 */}
              {displayedText && (
                <div className="mt-4 flex items-center gap-2">
                  <Loader2
                    size={14}
                    className="text-orange-500 animate-spin"
                  />
                  <span className="text-xs text-gray-400">{displayedText}</span>
                  <span className="w-2 h-4 bg-orange-500 animate-pulse" />
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-gray-400">
              正在加载步骤...
            </div>
          )}
        </section>

        {/* ── 小贴士 - 浅橙色背景，无高亮 ──────────────────────── */}
        {tips && (
          <section className="pb-6">
            <div className="rounded-xl bg-orange-50 p-4">
              <div className="flex items-start gap-2">
                <Lightbulb
                  size={16}
                  className="text-orange-500 mt-0.5 flex-shrink-0"
                />
                <div>
                  <h3 className="text-sm font-semibold text-orange-700 mb-1">
                    小贴士
                  </h3>
                  {/* 纯文本，无高亮 */}
                  <p className="text-sm text-gray-800 leading-relaxed">{tips}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 底部留白 */}
        <div className="h-4" />
      </main>
    </div>
  )
}