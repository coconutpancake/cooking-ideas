"use client"

import { useRouter, useParams, useSearchParams } from "next/navigation"
import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { ArrowLeft } from "lucide-react"
import { getIngredients } from "@/lib/storage"
import { RecipeHeader, IngredientList, StepList, TipsCard } from "@/components/shared/RecipeDetailComponents"
import type { Ingredient } from "@/lib/recipes"

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
          <button
            onClick={() => router.push("/recommend")}
            className="mt-4 inline-block px-6 py-3 rounded-full bg-orange-500 text-white text-sm font-medium"
          >
            返回推荐
          </button>
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
        <RecipeHeader
          title={recipeData.title}
          cookingTime={recipeData.cookingTime}
          tags={recipeData.tags}
        />
      </div>

      {/* Content */}
      <main className="px-5 space-y-5">

        {/* ── 食材清单 ───────────────────────────────────────── */}
        <IngredientList
          mainIngredients={recipeData.mainIngredients}
          seasonings={recipeData.seasonings}
          isUserHasIngredient={isUserHasIngredient}
        />

        {/* ── 做法步骤 ───────────────────────────────────────── */}
        <StepList
          steps={steps}
          isLoading={isLoadingApi}
          displayedText={displayedText}
          streamError={streamError}
          onRetry={() => window.location.reload()}
          highlightFn={highlightIngredients}
        />

        {/* ── 小贴士 ──────────────────────────────────────────── */}
        {tips && <TipsCard tips={tips} />}

        {/* 底部留白 */}
        <div className="h-4" />
      </main>
    </div>
  )
}