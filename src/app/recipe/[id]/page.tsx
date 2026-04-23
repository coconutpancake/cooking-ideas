"use client"

import { useRouter, useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { ArrowLeft, Share2, Heart, Clock, CheckCircle2, Circle, Flame, Sparkles, Loader2 } from "lucide-react"
import { StatusBar } from "@/components/shared/StatusBar"
import { getRecipeById, type Recipe } from "@/lib/recipes"
import { cn } from "@/lib/utils"

// 预设渐变色组合（低饱和色系）
const GRADIENTS = [
  "from-[#F5DDD8] via-[#F0D0C8] to-[#E8C8B8]",
  "from-[#E2D4E6] via-[#D8C8DC] to-[#D0C0D0]",
  "from-[#D5E8D5] via-[#C8DFC8] to-[#B8D8B8]",
  "from-[#E8D4C8] via-[#DEC8B8] to-[#D4BEA8]",
  "from-[#F0E4D8] via-[#E8D8C8] to-[#DECCB8]",
]

function getGradientForTitle(title: string): string {
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash)
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

// 纯几何图案生成器（代替 emoji）
function generatePattern(title: string): string {
  const patterns = [
    // 圆形组合
    `<circle cx="50" cy="50" r="30" fill="none" stroke="white" strokeWidth="2" opacity="0.6"/>
     <circle cx="50" cy="50" r="20" fill="white" opacity="0.2"/>
     <circle cx="40" cy="45" r="8" fill="white" opacity="0.3"/>`,
    // 方圆组合
    `<rect x="25" y="30" width="50" height="40" rx="8" fill="white" opacity="0.2"/>
     <circle cx="50" cy="50" r="25" fill="white" opacity="0.15"/>`,
    // 波浪线
    `<path d="M25 50 Q37 35 50 50 Q62 65 75 50" stroke="white" strokeWidth="2" fill="none" opacity="0.6"/>
     <path d="M30 60 Q42 45 55 60 Q68 75 80 60" stroke="white" strokeWidth="2" fill="none" opacity="0.4"/>`,
    // 三角组合
    `<polygon points="50,25 75,65 25,65" fill="white" opacity="0.2"/>
     <polygon points="50,35 65,60 35,60" fill="white" opacity="0.15"/>`,
  ]
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash)
  }
  return patterns[Math.abs(hash) % patterns.length]
}

interface Step {
  order: number
  description: string
}

// 从 URL 参数构建 AI 菜谱数据
interface AIGeneratedRecipeData {
  isAI: true
  title: string
  emoji: string
  mainIngredients: { name: string; amount: string }[]
  seasonings: { name: string; amount: string }[]
  cookingTime: number
  tags: string[]
  tips?: string
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

  const availableIngredients = useMemo(() => availableStr ? availableStr.split(",").filter(Boolean) : [], [availableStr])
  const missingIngredients = useMemo(() => missingStr ? missingStr.split(",").filter(Boolean) : [], [missingStr])
  const seasonings = useMemo(() => seasoningsStr ? seasoningsStr.split(",").filter(Boolean) : [], [seasoningsStr])

  const localRecipe = getRecipeById(recipeId)
  const isAIRecipe = recipeId.startsWith("ai-")

  const aiRecipeData = useMemo<AIGeneratedRecipeData | null>(() => {
    if (!isAIRecipe || !recipeName) return null
    return {
      isAI: true,
      title: decodeURIComponent(recipeName),
      emoji: decodeURIComponent(emojiParam) || "🍽️",
      mainIngredients: [...availableIngredients, ...missingIngredients].map(name => ({ name, amount: "适量" })),
      seasonings: seasonings.map(name => ({ name, amount: "适量" })),
      cookingTime: 20,
      tags: ["AI 推荐"],
      tips: "根据你冰箱里的食材 AI 智能推荐",
    }
  }, [isAIRecipe, recipeName, emojiParam, availableIngredients, missingIngredients, seasonings])

  const recipe = useMemo(() => aiRecipeData || localRecipe, [aiRecipeData, localRecipe])

  // 步骤状态
  const [streamingSteps, setStreamingSteps] = useState<Step[]>([])
  const [displayedText, setDisplayedText] = useState("")
  const [aiTips, setAiTips] = useState<string | undefined>(undefined)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoadingApi, setIsLoadingApi] = useState(false)
  const [streamError, setStreamError] = useState<string | null>(null)

  // 高亮食材 - 使用奶油暖橘同色系低饱和色
  const highlightIngredients = useCallback(
    (text: string): React.ReactNode => {
      if (availableIngredients.length === 0) return text

      const allIngredients = [
        ...recipe?.mainIngredients.map((i) => i.name) || [],
        ...seasonings,
      ]

      const sorted = [...new Set(allIngredients)].sort((a, b) => b.length - a.length)

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
              className="bg-[#F5DDD8] text-[#B87068] px-0.5 rounded"
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
    [availableIngredients, recipe, seasonings]
  )

  const hasFetchedRef = useRef(false)

  useEffect(() => {
    if (!recipeName || hasFetchedRef.current) return

    const fetchSteps = async () => {
      hasFetchedRef.current = true

      try {
        setStreamError(null)

        if (recipe?.steps && recipe.steps.length > 0) {
          const text = recipe.steps.map((s) => `${s.order}. ${s.description}`).join("\n")
          setStreamingSteps(recipe.steps)
          setDisplayedText(text)
          setIsStreaming(false)
          return
        }

        setIsLoadingApi(true)
        setIsStreaming(true)

        const response = await fetch("/api/detail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipeName: recipeName || recipe?.title,
            mainIngredients: recipe?.mainIngredients.map((i) => i.name) || [],
            availableIngredients,
          }),
        })

        if (!response.ok) {
          throw new Error(`请求失败: ${response.status}`)
        }

        const data = await response.json()

        if (data.success && data.steps) {
          setStreamingSteps(data.steps)
          setDisplayedText(data.fullText || "")
          setAiTips(data.tips)
        } else if (data.error) {
          throw new Error(data.error)
        }
      } catch (error) {
        setStreamError(error instanceof Error ? error.message : "获取步骤失败，请重试")
      } finally {
        setIsStreaming(false)
        setIsLoadingApi(false)
      }
    }

    fetchSteps()
  }, [recipeName, recipe, availableIngredients])

  if (!recipe) {
    return (
      <div className="min-h-screen bg-[var(--background)] pb-32">
        <StatusBar />
        <main className="max-w-lg mx-auto px-5 py-20 text-center">
          <p className="text-[var(--muted-foreground)]">菜谱不存在</p>
          <Link
            href="/recommend"
            className="mt-4 inline-block px-6 py-3 rounded-[var(--radius-full)] btn-primary text-sm font-medium"
          >
            返回推荐
          </Link>
        </main>
      </div>
    )
  }

  const availableSet = new Set(availableIngredients.map((i) => i.toLowerCase()))
  const isIngredientAvailable = (name: string) =>
    availableSet.has(name.toLowerCase()) || availableSet.has(name.replace(/[^\u4e00-\u9fa5]/g, "").toLowerCase())

  const gradient = getGradientForTitle(recipe.title)
  const pattern = generatePattern(recipe.title)

  return (
    <div className="min-h-screen bg-[var(--background)] pb-16 max-w-md mx-auto">

      {/* Hero Banner - 几何图案代替 emoji */}
      <div className={cn("relative h-64 overflow-hidden", gradient)}>
        {/* 几何图案背景 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-32 h-32 opacity-50" dangerouslySetInnerHTML={{ __html: pattern }} />
        </div>

        {/* 顶部导航 */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center hover:bg-white/50 transition-colors"
          >
            <ArrowLeft size={20} className="text-[var(--foreground)]" />
          </button>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center hover:bg-white/50 transition-colors">
              <Share2 size={18} className="text-[var(--foreground)]" />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center hover:bg-white/50 transition-colors">
              <Heart size={18} className="text-[var(--foreground)]" />
            </button>
          </div>
        </div>

        {/* 底部标题 */}
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/20 to-transparent">
          <h1 className="text-2xl font-normal text-title text-white tracking-wide">
            {recipe.title}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5 text-white/90">
              <Clock size={14} />
              <span className="text-sm">{recipe.cookingTime}分钟</span>
            </div>
            <div className="flex gap-1.5">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* 食材清单模块 */}
        <section>
          <h2 className="text-lg font-medium text-[var(--foreground)] mb-3 text-title">
            食材清单
          </h2>

          {/* 主食材 */}
          <div className="rounded-[var(--radius-lg)] p-4 glass-card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-[#F5DDD8] flex items-center justify-center">
                <Flame size={14} className="text-[#B87068]" />
              </div>
              <span className="font-medium text-[#B87068]">
                主食材 ({recipe.mainIngredients.length})
              </span>
            </div>
            <div className="space-y-2.5">
              {recipe.mainIngredients.map((ing, i) => {
                const available = isIngredientAvailable(ing.name)
                return (
                  <div key={i} className="flex items-center justify-between">
                    <span className={available ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}>
                      {available ? (
                        <span className="inline-flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-[#6B8E6B]" />
                          {ing.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <Circle size={14} className="text-[var(--muted)]" />
                          {ing.name}
                        </span>
                      )}
                    </span>
                    <span className={available ? "text-sm text-[#6B8E6B]" : "text-sm text-[var(--muted-foreground)]"}>
                      {ing.amount}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 调料辅料 */}
          <div className="rounded-[var(--radius-lg)] p-4 mt-3 glass-card" style={{ background: 'linear-gradient(135deg, rgba(226,212,230,0.4) 0%, rgba(216,200,220,0.3) 100%)' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-[#E2D4E6] flex items-center justify-center">
                <Circle size={14} className="text-[#8E7B9B]" />
              </div>
              <span className="font-medium text-[#8E7B9B]">
                调料与辅料 ({recipe.seasonings.length})
              </span>
            </div>
            <div className="space-y-2.5">
              {recipe.seasonings.map((ing, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[var(--muted-foreground)]">{ing.name}</span>
                  <span className="text-sm text-[var(--muted-foreground)]">{ing.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI 菜谱步骤模块 - 奶杏裸色基底 + 轻微渐变 */}
        <section>
          <h2 className="text-lg font-medium text-[var(--foreground)] mb-3 text-title">
            做法步骤
            {isLoadingApi && (
              <span className="ml-2 inline-flex items-center gap-1.5 text-xs font-normal text-[var(--primary)]">
                <Loader2 size={14} className="animate-spin" />
                AI 生成中...
              </span>
            )}
          </h2>

          {streamError ? (
            <div className="rounded-[var(--radius-lg)] p-4 glass-card border border-[var(--destructive)]/20">
              <div className="flex items-center justify-between">
                <p className="text-[var(--destructive)] text-sm flex-1">{streamError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="ml-3 px-4 py-1.5 bg-[var(--destructive)]/10 text-[var(--destructive)] text-xs font-medium rounded-full hover:bg-[var(--destructive)]/20 transition-colors"
                >
                  重试
                </button>
              </div>
            </div>
          ) : streamingSteps.length > 0 ? (
            <div className="rounded-[var(--radius-lg)] p-5 glass-card space-y-5">
              {streamingSteps.map((step) => (
                <div key={step.order} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#F5DDD8] flex items-center justify-center">
                    <span className="text-sm font-medium text-[#B87068]">{step.order}</span>
                  </div>
                  <p className="text-[var(--foreground)] leading-relaxed pt-1">
                    {highlightIngredients(step.description)}
                  </p>
                </div>
              ))}
            </div>
          ) : isLoadingApi ? (
            <div className="rounded-[var(--radius-lg)] p-5 glass-card">
              <div className="space-y-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#F5DDD8] flex items-center justify-center">
                      <span className="text-sm font-medium text-[#B87068]">{i}</span>
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="h-4 bg-[var(--muted)] rounded animate-pulse w-full"/>
                      <div className="h-4 bg-[var(--muted)] rounded animate-pulse w-3/4 mt-2" style={{ animationDelay: `${i * 100}ms` }}/>
                    </div>
                  </div>
                ))}
              </div>
              {/* 打字机光标 */}
              <div className="mt-4 flex items-center gap-2">
                <Loader2 size={16} className="text-[var(--primary)] animate-spin" />
                <span className="text-sm text-[var(--muted-foreground)]">{displayedText}</span>
                <span className="w-2 h-4 bg-[var(--primary)] animate-pulse"/>
              </div>
            </div>
          ) : (
            <div className="rounded-[var(--radius-lg)] p-5 glass-card text-center text-[var(--muted-foreground)]">
              正在加载步骤...
            </div>
          )}
        </section>

        {/* 做饭小贴士模块 - 淡奶绿渐变区分 */}
        {isAIRecipe ? (
          aiTips && (
            <section>
              <h2 className="text-lg font-medium text-[var(--foreground)] mb-3 text-title">
                小贴士
              </h2>
              <div className="rounded-[var(--radius-lg)] p-5 glass-card" style={{ background: 'linear-gradient(135deg, rgba(213,232,213,0.5) 0%, rgba(200,223,200,0.4) 100%)' }}>
                <div className="flex items-start gap-3">
                  <Sparkles size={18} className="text-[#5B7E5B] mt-0.5 flex-shrink-0"/>
                  <p className="text-[#5B7E5B] text-sm leading-relaxed">
                    {highlightIngredients(aiTips)}
                  </p>
                </div>
              </div>
            </section>
          )
        ) : (
          recipe.tips && (
            <section>
              <h2 className="text-lg font-medium text-[var(--foreground)] mb-3 text-title">
                小贴士
              </h2>
              <div className="rounded-[var(--radius-lg)] p-5 glass-card" style={{ background: 'linear-gradient(135deg, rgba(213,232,213,0.5) 0%, rgba(200,223,200,0.4) 100%)' }}>
                <div className="flex items-start gap-3">
                  <Sparkles size={18} className="text-[#5B7E5B] mt-0.5 flex-shrink-0"/>
                  <p className="text-[#5B7E5B] text-sm leading-relaxed">
                    {highlightIngredients(recipe.tips)}
                  </p>
                </div>
              </div>
            </section>
          )
        )}

        {/* 底部留白 */}
        <div className="h-8"/>

      </main>
    </div>
  )
}