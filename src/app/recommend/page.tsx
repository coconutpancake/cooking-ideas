"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, Clock, CheckCircle2, AlertCircle, RefreshCw, Loader2, ChefHat, ArrowLeft, Sparkles } from "lucide-react"
import { StatusBar } from "@/components/shared/StatusBar"
import { getRecommendations, type Recommendation } from "@/lib/recommendApi"
import { getIngredients } from "@/lib/storage"
import { cn } from "@/lib/utils"

// 预设渐变色组合（低饱和奶油暖橘色系）
const GRADIENTS = [
  "from-[#F5DDD8] via-[#F0D0C8] to-[#E8C8B8]",
  "from-[#E2D4E6] via-[#D8C8DC] to-[#D0C0D0]",
  "from-[#D5E8D5] via-[#C8DFC8] to-[#B8D8B8]",
  "from-[#E8D4C8] via-[#DEC8B8] to-[#D4BEA8]",
  "from-[#F0E4D8] via-[#E8D8C8] to-[#DECCB8]",
  "from-[#E4D8E8] via-[#D8D0E0] to-[#D0C8D8]",
  "from-[#D8E8E4] via-[#C8E0D8] to-[#C0D8D0]",
]

function getGradientForTitle(title: string): string {
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash)
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

// 无 emoji 的菜谱卡片 - 用纯色块代替
function RecipeCardGraphic({ title, gradient }: { title: string; gradient: string }) {
  // 用食材相关的几何图形组合代替 emoji
  return (
    <div className={cn("relative w-full h-full flex items-center justify-center", gradient)}>
      {/* 抽象几何图案 - 手绘风格 */}
      <svg viewBox="0 0 100 100" className="w-24 h-24 opacity-60">
        <circle cx="50" cy="50" r="35" fill="none" stroke="white" strokeWidth="2" strokeDasharray="4 3"/>
        <circle cx="50" cy="50" r="25" fill="white" fillOpacity="0.2"/>
        <circle cx="35" cy="40" r="8" fill="white" fillOpacity="0.4"/>
        <circle cx="60" cy="55" r="6" fill="white" fillOpacity="0.3"/>
        <rect x="40" y="30" width="15" height="10" rx="3" fill="white" fillOpacity="0.3" transform="rotate(15 47 35)"/>
      </svg>
    </div>
  )
}

export default function RecommendPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<string>("全部")
  const [userIngredients, setUserIngredients] = useState<string[]>([])

  // 筛选分类 - 低饱和色块胶囊
  const cookingMethods = ["全部", "快手菜", "家常菜", "蒸煮", "炒制"]

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

      const response = await getRecommendations(ingredients)

      if (response.success && response.data) {
        setRecommendations(response.data.recommendations)
      } else {
        setError(response.error || "获取推荐失败")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取推荐失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const filteredRecommendations =
    selectedMethod === "全部"
      ? recommendations
      : recommendations.filter((r) => {
          if (selectedMethod === "快手菜") return r.cookingTime <= 20
          if (selectedMethod === "家常菜") return r.cookingMethod === "炒" || r.cookingMethod === "煮"
          if (selectedMethod === "蒸煮") return r.cookingMethod === "蒸" || r.cookingMethod === "煮"
          if (selectedMethod === "炒制") return r.cookingMethod === "炒"
          return true
        })

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <StatusBar />

      {/* Back Button */}
      <div className="px-5 py-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
        >
          <ArrowLeft size={18} />
          返回冰箱
        </Link>
      </div>

      <main className="pb-8 max-w-lg mx-auto">

        {/* Sticky Header */}
        <div className="sticky top-14 z-30 bg-[var(--background)]/90 backdrop-blur-md">

          {/* 标题区 - 圆润复古字体 */}
          <div className="px-5 pt-2 pb-4">
            <h1 className="text-2xl font-normal text-title text-[var(--foreground)] tracking-wide">
              今日推荐
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">根据你的冰箱量身定制</p>
          </div>

          {/* 搜索栏 - 奶油磨砂质感 */}
          <div className="flex items-center gap-3 px-5 pb-3">
            <div className="flex-1 flex items-center gap-2.5 px-4 py-3 rounded-[var(--radius-xl)] glass-card">
              <Search size={16} className="text-[var(--muted-foreground)]" />
              <input
                type="text"
                placeholder="搜索菜谱..."
                className="flex-1 bg-transparent outline-none text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
              />
            </div>
            <button
              onClick={fetchRecommendations}
              className="p-3 rounded-[var(--radius-lg)] glass-card hover:bg-white/80 transition-colors"
            >
              <RefreshCw size={18} className={cn("text-[var(--muted-foreground)]", isLoading && "animate-spin")} />
            </button>
          </div>

          {/* 筛选胶囊 - 低饱和色块 */}
          <div className="flex gap-2.5 px-5 pb-5 overflow-x-auto scrollbar-hide">
            {cookingMethods.map((method) => (
              <button
                key={method}
                onClick={() => setSelectedMethod(method)}
                className={cn(
                  "px-4 py-2 rounded-[var(--radius-full)] text-sm font-medium whitespace-nowrap transition-all",
                  selectedMethod === method
                    ? "tag-active"
                    : "bg-white/60 text-[var(--muted-foreground)] hover:bg-white/80"
                )}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 space-y-5">

          {/* User Ingredients Summary - 淡奶绿渐变 */}
          {userIngredients.length > 0 && (
            <div className="bg-gradient-to-r from-[#D5E8D5] to-[#C8DFC8] rounded-[var(--radius-lg)] p-4">
              <p className="text-sm text-[#5B7E5B] font-medium flex items-center gap-2">
                <Sparkles size={14} />
                根据「{userIngredients.slice(0, 3).join("、")}{userIngredients.length > 3 ? "..." : ""}」为你推荐
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-28">
              <div className="w-12 h-12 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin"/>
              <p className="mt-5 text-sm text-[var(--muted-foreground)]">正在为你计算最佳推荐...</p>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-[var(--radius-xl)] bg-[var(--muted)] flex items-center justify-center mb-4">
                <ChefHat size={28} className="text-[var(--muted-foreground)] opacity-50" />
              </div>
              <p className="text-sm text-[var(--muted-foreground)] px-8">{error}</p>
              {userIngredients.length === 0 && (
                <Link
                  href="/"
                  className="mt-6 px-6 py-3 rounded-[var(--radius-full)] btn-primary text-sm font-medium shadow-md"
                >
                  去添加食材
                </Link>
              )}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredRecommendations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="opacity-30">
                <rect x="12" y="8" width="40" height="48" rx="8" fill="var(--muted)"/>
                <line x1="12" y1="28" x2="52" y2="28" stroke="var(--foreground)" strokeWidth="2"/>
              </svg>
              <p className="mt-4 text-sm text-[var(--muted-foreground)]">暂无符合条件的推荐</p>
            </div>
          )}

          {/* Recipe List - 2列瀑布流 */}
          {!isLoading && !error && filteredRecommendations.length > 0 && (
            <>
              <div className="flex items-center justify-between px-1 pt-2">
                <h2 className="text-base font-medium text-[var(--foreground)]">
                  为你推荐 <span className="text-[var(--muted-foreground)]">({filteredRecommendations.length})</span>
                </h2>
              </div>

              <div className="masonry-grid">
                {filteredRecommendations.map((recipe) => {
                  const gradient = getGradientForTitle(recipe.title)
                  const matchPercent = Math.round(recipe.matchingScore * 100)

                  return (
                    <Link
                      key={recipe.recipeId}
                      href={`/recipe/${recipe.recipeId}?title=${encodeURIComponent(recipe.title)}&emoji=${encodeURIComponent(recipe.emoji)}&available=${encodeURIComponent(recipe.availableMainIngredients.join(","))}&missing=${encodeURIComponent(recipe.missingMainIngredients.join(","))}&seasonings=${encodeURIComponent(recipe.seasonings.join(","))}`}
                      className="block rounded-[var(--radius-xl)] glass-card overflow-hidden hover:shadow-lg transition-all duration-300 animate-fade-in"
                    >
                      {/* 卡片头部 - 渐变色块 + 几何图案 */}
                      <div className={cn("relative h-40", gradient)}>
                        <RecipeCardGraphic title={recipe.title} gradient={gradient} />

                        {/* 时间标签 */}
                        <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 backdrop-blur-sm">
                          <Clock size={11} className="text-[var(--foreground)]" />
                          <span className="text-xs font-medium text-[var(--foreground)]">{recipe.cookingTime}分钟</span>
                        </div>

                        {/* 匹配度标签 */}
                        <div className={cn(
                          "absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-medium",
                          matchPercent >= 80 ? "match-high" : matchPercent >= 60 ? "match-medium" : "match-low"
                        )}>
                          {matchPercent}% 匹配
                        </div>
                      </div>

                      {/* 卡片内容 */}
                      <div className="p-4">
                        <h3 className="text-base font-medium text-[var(--foreground)] leading-snug">
                          {recipe.title}
                        </h3>

                        {/* 可用性状态 */}
                        <div className="mt-3 pt-3 border-t border-[var(--border)]/50">
                          {recipe.isAllAvailable ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-[var(--accent-green)] flex items-center justify-center">
                                <CheckCircle2 size={11} className="text-[#5B7E5B]" />
                              </div>
                              <span className="text-xs font-medium text-[#5B7E5B]">主食材已备齐</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-[var(--muted)] flex items-center justify-center">
                                <AlertCircle size={11} className="text-[var(--muted-foreground)]" />
                              </div>
                              <span className="text-xs text-[var(--muted-foreground)]">
                                缺少 {recipe.missingMainIngredients.length} 种
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}