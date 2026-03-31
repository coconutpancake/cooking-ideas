"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, SlidersHorizontal, Clock, CheckCircle2, AlertCircle, RefreshCw, Loader2, ChefHat, ArrowLeft } from "lucide-react"
import { StatusBar } from "@/components/shared/StatusBar"
import { getRecommendations, type Recommendation } from "@/lib/recommendApi"
import { getIngredients } from "@/lib/storage"
import { cn } from "@/lib/utils"

// 预设渐变色组合（莫兰迪柔和色系，不含蓝色）
const GRADIENTS = [
  "from-amber-200 via-orange-200 to-rose-200",
  "from-stone-200 via-amber-100 to-orange-100",
  "from-rose-200 via-orange-200 to-yellow-100",
  "from-emerald-100 via-green-100 to-teal-100",
  "from-violet-100 via-purple-100 to-fuchsia-100",
  "from-orange-200 via-amber-100 to-yellow-100",
  "from-pink-100 via-rose-100 to-orange-100",
  "from-lime-100 via-green-100 to-emerald-100",
]

// 根据菜名生成固定渐变色
function getGradientForTitle(title: string): string {
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash)
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

export default function RecommendPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<string>("全部")
  const [userIngredients, setUserIngredients] = useState<string[]>([])

  const cookingMethods = ["全部", "炒", "煮", "蒸", "烤", "炸", "凉拌"]

  const fetchRecommendations = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const ingredients = getIngredients().map((i) => i.name)
      setUserIngredients(ingredients)

      if (ingredients.length === 0) {
        setError("请先在首页添加食材，我会为你推荐合适的菜谱")
        setRecommendations([])
        return
      }

      console.log("[RecommendPage] 开始获取推荐，食材:", ingredients)
      const response = await getRecommendations(ingredients)

      if (response.success && response.data) {
        setRecommendations(response.data.recommendations)
        console.log("[RecommendPage] ✅ 获取到", response.data.recommendations.length, "条推荐")
      } else {
        setError(response.error || "获取推荐失败")
      }
    } catch (err) {
      console.error("[RecommendPage] ❌ 获取推荐失败:", err)
      setError(err instanceof Error ? err.message : "获取推荐失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [])

  // 过滤后的推荐
  const filteredRecommendations =
    selectedMethod === "全部"
      ? recommendations
      : recommendations.filter((r) => r.cookingMethod === selectedMethod)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <StatusBar />

      {/* Back Button */}
      <div className="px-4 py-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-orange-500 transition-colors"
        >
          <ArrowLeft size={18} />
          返回冰箱
        </Link>
      </div>

      <main className="pb-8 max-w-lg mx-auto">
        {/* Search Header */}
        <div className="sticky top-14 z-30 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3 p-4">
            {/* Search Input */}
            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">
              <Search size={18} className="text-zinc-400" />
              <input
                type="text"
                placeholder="搜索菜谱..."
                className="flex-1 bg-transparent outline-none text-sm text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400"
              />
            </div>
            {/* Refresh Button */}
            <button
              onClick={fetchRecommendations}
              className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <RefreshCw size={20} className={cn("text-zinc-600 dark:text-zinc-400", isLoading && "animate-spin")} />
            </button>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
            {cookingMethods.map((method) => (
              <button
                key={method}
                onClick={() => setSelectedMethod(method)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  selectedMethod === method
                    ? "bg-orange-500 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                )}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* User Ingredients Summary */}
          {userIngredients.length > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3">
              <p className="text-sm text-orange-700 dark:text-orange-400">
                <ChefHat size={14} className="inline mr-1" />
                根据「{userIngredients.join("、")}」为你推荐
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={40} className="text-orange-500 animate-spin" />
              <p className="mt-4 text-sm text-zinc-500">正在为你计算最佳推荐...</p>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle size={48} className="text-zinc-300 dark:text-zinc-600" />
              <p className="mt-4 text-sm text-zinc-500 px-8">{error}</p>
              {userIngredients.length === 0 && (
                <Link
                  href="/"
                  className="mt-4 px-6 py-2 bg-orange-500 text-white text-sm font-medium rounded-full"
                >
                  去添加食材
                </Link>
              )}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredRecommendations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ChefHat size={48} className="text-zinc-300 dark:text-zinc-600" />
              <p className="mt-4 text-sm text-zinc-500">暂无符合条件的推荐</p>
            </div>
          )}

          {/* Recipe List */}
          {!isLoading && !error && filteredRecommendations.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                为你推荐 ({filteredRecommendations.length})
              </h2>

              {filteredRecommendations.map((recipe) => {
                // 构建完整主食材列表（已有 + 缺失）
                const allMainIngredients = [...recipe.availableMainIngredients, ...recipe.missingMainIngredients]
                return (
                <Link
                  key={recipe.recipeId}
                  href={`/recipe/${recipe.recipeId}?title=${encodeURIComponent(recipe.title)}&emoji=${encodeURIComponent(recipe.emoji)}&available=${encodeURIComponent(recipe.availableMainIngredients.join(","))}&missing=${encodeURIComponent(recipe.missingMainIngredients.join(","))}&seasonings=${encodeURIComponent(recipe.seasonings.join(","))}`}
                  className="block bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm border border-zinc-100 dark:border-zinc-800 hover:shadow-md transition-shadow"
                >
                  {/* Emoji + Gradient Block */}
                  <div className={cn("relative h-48 bg-gradient-to-br", getGradientForTitle(recipe.title))}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-7xl drop-shadow-lg">{recipe.emoji}</span>
                    </div>
                    {/* Time badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full">
                      <Clock size={12} className="text-white" />
                      <span className="text-xs text-white">{recipe.cookingTime}分钟</span>
                    </div>
                    {/* Method badge */}
                    <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full">
                      <span className="text-xs font-medium text-zinc-700">
                        {recipe.cookingMethod}
                      </span>
                    </div>
                    {/* Match score badge */}
                    <div className="absolute bottom-3 left-3 px-2 py-1 bg-orange-500/90 backdrop-blur-sm rounded-full">
                      <span className="text-xs font-medium text-white">
                        匹配度 {Math.round(recipe.matchingScore * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">
                          {recipe.title}
                        </h3>
                      </div>
                    </div>

                    {/* Availability Status */}
                    <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      {recipe.isAllAvailable ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <CheckCircle2 size={14} className="text-green-600 dark:text-green-400" />
                          </div>
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            主食材已备齐
                          </span>
                          <span className="text-xs text-zinc-400">，可以开始做菜！</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            <AlertCircle size={14} className="text-zinc-400" />
                          </div>
                          <span className="text-sm text-zinc-500">
                            缺少{" "}
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">
                              {recipe.missingMainIngredients.length}种
                            </span>
                            {" "}主食材
                          </span>
                          <div className="flex gap-1 ml-1">
                            {recipe.missingMainIngredients.slice(0, 2).map((ing) => (
                              <span
                                key={ing}
                                className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs rounded"
                              >
                                {ing}
                              </span>
                            ))}
                            {recipe.missingMainIngredients.length > 2 && (
                              <span className="text-xs text-zinc-400">
                                +{recipe.missingMainIngredients.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )
              })}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
