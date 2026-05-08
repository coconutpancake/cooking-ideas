"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Search, CheckCircle2, RefreshCw, Loader2, ChefHat, ArrowLeft } from "lucide-react"
import { getRecommendations } from "@/lib/recommendApi"
import { getIngredients } from "@/lib/storage"
import {
  getCachedRecommendations,
  saveCachedRecommendations,
  isCacheValid,
  getIngredientsHash,
  clearCachedRecommendations,
  type CachedRecommendation,
} from "@/lib/storage"
import { cn } from "@/lib/utils"

export default function RecommendPage() {
  const [recommendations, setRecommendations] = useState<CachedRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<string>("全部")
  const [userIngredients, setUserIngredients] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isInitialized, setIsInitialized] = useState(false)

  const cookingMethods = ["全部", "快手菜", "家常菜", "蒸煮", "炒制"]

  const FILTER_MAP: Record<string, (r: CachedRecommendation) => boolean> = {
    "全部": () => true,
    "快手菜": r => r.cookingTime <= 20,
    "家常菜": r => r.cookingMethod === "炒" || r.cookingMethod === "煮",
    "蒸煮": r => r.cookingMethod === "蒸" || r.cookingMethod === "煮",
    "炒制": r => r.cookingMethod === "炒",
  }

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const ingredients = getIngredients().map((i) => i.name)
      setUserIngredients(ingredients)

      if (ingredients.length === 0) {
        setError("请先在首页添加食材，我会为你推荐合适的菜谱")
        setRecommendations([])
        setIsLoading(false)
        return
      }

      // 检查缓存是否有效（食材未变化）
      if (isCacheValid()) {
        const cached = getCachedRecommendations()
        if (cached && cached.length > 0) {
          setRecommendations(cached)
          setIsLoading(false)
          setIsInitialized(true)
          return
        }
      } else {
        // 缓存无效，清除
        clearCachedRecommendations()
      }

      const response = await getRecommendations(ingredients)

      if (response.success && response.data) {
        const data = response.data.recommendations as CachedRecommendation[]
        setRecommendations(data)
        // 存入缓存
        saveCachedRecommendations(data, getIngredientsHash())
      } else {
        setError(response.error || "获取推荐失败")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取推荐失败，请重试")
    } finally {
      setIsLoading(false)
      setIsInitialized(true)
    }
  }, [])

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  // 监听首页食材变化事件，清除缓存
  useEffect(() => {
    const handleIngredientsChanged = () => {
      console.log("[Recommend] 检测到食材变化，清除缓存")
      clearCachedRecommendations()
    }

    window.addEventListener("cooking_ideas_ingredients_changed", handleIngredientsChanged)
    return () => window.removeEventListener("cooking_ideas_ingredients_changed", handleIngredientsChanged)
  }, [])

  const filteredRecommendations = recommendations.filter(
    FILTER_MAP[selectedMethod] || (() => true)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 最外层：手机 App 居中宽度 */}
      <div className="max-w-md mx-auto relative min-h-screen">

      {/* Back Button */}
      <div className="px-5 pt-8 pb-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-orange-500 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>返回冰箱</span>
        </Link>
      </div>

      <main className="pb-8 max-w-md mx-auto">

        {/* ── 标题区 ─────────────────────────────────────────── */}
        <div className="px-5 pt-1 pb-3">
          <h1 className="text-2xl font-bold text-black">今日推荐</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {userIngredients.length > 0
              ? `根据「${userIngredients.slice(0, 3).join("、")}${userIngredients.length > 3 ? "..." : ""}」为你推荐`
              : "根据你的冰箱量身定制"}
          </p>
        </div>

        {/* ── 搜索框 ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 pb-4">
          <div className="flex-1 flex items-center gap-2.5 px-4 py-3 bg-gray-100 rounded-full">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="搜索菜谱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-black placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={fetchRecommendations}
            className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 active:bg-gray-300 transition-colors"
          >
            <RefreshCw size={18} className={cn("text-gray-500", isLoading && "animate-spin")} />
          </button>
        </div>

        {/* ── 横向分类滚动 (Tabs) ─────────────────────────────── */}
        <div className="flex gap-2.5 px-5 pb-4 overflow-x-auto scrollbar-hide">
          {cookingMethods.map((method) => (
            <button
              key={method}
              onClick={() => setSelectedMethod(method)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                selectedMethod === method
                  ? "bg-orange-500 text-white"
                  : "text-gray-500 bg-transparent"
              )}
            >
              {method}
            </button>
          ))}
        </div>

        {/* ── 内容区 ─────────────────────────────────────────── */}
        <div className="px-5">

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-28">
              <div className="w-12 h-12 rounded-full border-2 border-orange-500 border-t-transparent animate-spin"/>
              <p className="mt-5 text-sm text-gray-400">
                {isInitialized ? "根据食材生成灵感中..." : "正在加载..."}
              </p>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
                <ChefHat size={28} className="text-gray-400 opacity-50" />
              </div>
              <p className="text-sm text-gray-400 px-8">{error}</p>
              {userIngredients.length === 0 && (
                <Link
                  href="/"
                  className="mt-6 px-6 py-3 rounded-full bg-orange-500 text-white text-sm font-medium"
                >
                  去添加食材
                </Link>
              )}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredRecommendations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-sm text-gray-400">暂无符合条件的推荐</p>
            </div>
          )}

          {/* Recipe List - 极简纵向列表 */}
          {!isLoading && !error && filteredRecommendations.length > 0 && (
            <div>
              {filteredRecommendations.map((recipe) => {
                const matchPercent = Math.round(recipe.matchingScore * 100)

                return (
                  <Link
                    key={recipe.recipeId}
                    href={`/recipe/${recipe.recipeId}?title=${encodeURIComponent(recipe.title)}&emoji=${encodeURIComponent(recipe.emoji)}&available=${encodeURIComponent(recipe.availableMainIngredients.join(","))}&missing=${encodeURIComponent(recipe.missingMainIngredients.join(","))}&seasonings=${encodeURIComponent(recipe.seasonings.join(","))}`}
                    className="flex items-center justify-between py-4 border-b border-gray-100 active:bg-gray-50"
                  >
                    {/* 左侧内容 */}
                    <div className="flex-1 pr-4">
                      {/* 第一行：菜名 */}
                      <h3 className="text-base font-semibold text-black leading-tight">
                        {recipe.title}
                      </h3>

                      {/* 第二行：匹配度 · 时间 · 烹饪方式 */}
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                        <span className="text-orange-500 font-medium">{matchPercent}%</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-gray-400">{recipe.cookingTime}分钟</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-gray-400">{recipe.cookingMethod}</span>
                      </div>

                      {/* 第三行：食材状态 */}
                      <div className="flex items-center gap-1.5 mt-1">
                        {recipe.isAllAvailable ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 size={12} className="text-green-500" />
                            <span className="text-xs text-green-600 font-medium">食材已备齐</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-orange-500 font-medium">
                              缺少: {recipe.missingMainIngredients.join("、")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 右侧：箭头 */}
                    <div className="flex-shrink-0">
                      <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="text-gray-300">
                        <path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
      </div>
    </div>
  )
}