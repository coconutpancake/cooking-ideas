"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ChevronDown, ChevronUp, X, Plus, RefreshCw, Upload } from "lucide-react"
import { StatusBar } from "@/components/shared/StatusBar"
import { ImageUploader } from "@/components/shared/ImageUploader"
import { useIngredients } from "@/hooks/useIngredients"
import { cn } from "@/lib/utils"
import type { IngredientItem } from "@/lib/mockApi"

// ─── 食材分类 ───────────────────────────────────────────────
type CategoryKey = "meat" | "vegetable" | "other"

interface CategoryConfig {
  key: CategoryKey
  label: string
  bgLight: string
  tagBg: string
  tagText: string
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: "meat",
    label: "肉类海鲜",
    bgLight: "bg-gradient-to-br from-[#F5DDD8] to-[#F0D0C8]",
    tagBg: "bg-[#F5DDD8]",
    tagText: "text-[#B87068]",
  },
  {
    key: "vegetable",
    label: "蔬菜水果",
    bgLight: "bg-gradient-to-br from-[#D5E8D5] to-[#C8DFC8]",
    tagBg: "bg-[#D5E8D5]",
    tagText: "text-[#6B8E6B]",
  },
  {
    key: "other",
    label: "调料其他",
    bgLight: "bg-gradient-to-br from-[#E2D4E6] to-[#D8C8DC]",
    tagBg: "bg-[#E2D4E6]",
    tagText: "text-[#8E7B9B]",
  },
]

// 食材分类映射
function classifyIngredient(name: string): CategoryKey {
  const n = name.toLowerCase()
  if (/猪|牛|羊|鸡|鸭|鹅|肉|鱼|虾|蟹|贝|蛤|螺|鱿鱼|章鱼|牛排|香肠|腊肉|火腿|培根|排骨|蹄|内脏|肝|腰|肚/.test(n)) return "meat"
  if (/菜|蔬|番茄|西红柿|黄瓜|土豆|马铃薯|萝卜|胡萝卜|洋葱|葱|蒜|姜|椒|茄子|豆角|四季豆|西兰花|菠菜|白菜|生菜|油菜|芹菜|韭菜|香菜|茼蒿|苦瓜|丝瓜|冬瓜|南瓜|莲藕|竹笋|菌|菇|木耳|豆腐|豆浆|腐竹|水果|苹果|香蕉|梨|桃|橙|橘|葡萄|草莓|蓝莓|芒果|西瓜|菠萝|柠檬/.test(n)) return "vegetable"
  return "other"
}

// ─── SVG 冰箱组件 ────────────────────────────────────────────
function FridgeIllustration({ hasIngredients }: { hasIngredients: boolean }) {
  return (
    <div className="relative w-full max-w-xs mx-auto">
      <svg viewBox="0 0 200 240" className="w-full h-auto" fill="none">
        {/* 冰箱身体 */}
        <rect x="30" y="20" width="140" height="200" rx="16" fill="#F5EDE5" stroke="#E0D6CA" strokeWidth="2"/>

        {/* 冰箱门把手 */}
        <rect x="145" y="90" width="8" height="40" rx="4" fill="#D4C4B0"/>
        <rect x="145" y="150" width="8" height="30" rx="4" fill="#D4C4B0"/>

        {/* 冰箱门分割线 */}
        <line x1="30" y1="120" x2="170" y2="120" stroke="#E0D6CA" strokeWidth="2"/>

        {/* 冰箱脚 */}
        <rect x="50" y="218" width="20" height="8" rx="4" fill="#D4C4B0"/>
        <rect x="130" y="218" width="20" height="8" rx="4" fill="#D4C4B0"/>

        {/* 冰箱内食物图标（手绘风格） */}
        {!hasIngredients && (
          <>
            {/* 空冰箱提示 - 蔬菜 */}
            <circle cx="80" cy="80" r="15" fill="#C8DFC8" opacity="0.5"/>
            <circle cx="110" cy="85" r="12" fill="#F5DDD8" opacity="0.5"/>
            {/* 空冰箱提示 - 肉类 */}
            <rect x="75" y="150" width="25" height="18" rx="4" fill="#E2D4E6" opacity="0.4"/>
            <rect x="110" y="155" width="20" height="14" rx="4" fill="#E2D4E6" opacity="0.4"/>
          </>
        )}
      </svg>

      {/* 食材气泡提示 */}
      {hasIngredients && (
        <div className="absolute top-4 right-0 animate-float">
          <div className="px-3 py-1.5 bg-white rounded-full shadow-md text-xs text-[#9B8E82]">
            已放入冰箱 ✓
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 主组件 ──────────────────────────────────────────────────
export default function HomePage() {
  const { ingredients, isLoading, add, remove, refresh } = useIngredients()
  const [isFridgeExpanded, setIsFridgeExpanded] = useState(true)
  const [showUploadTip, setShowUploadTip] = useState(false)
  const [lastIdentified, setLastIdentified] = useState<IngredientItem[] | null>(null)

  const handleIngredientsIdentified = (newIngredients: IngredientItem[]) => {
    setLastIdentified(newIngredients)
    setShowUploadTip(true)
    setTimeout(() => setShowUploadTip(false), 3000)
  }

  const addManualIngredient = () => {
    const name = prompt("请输入食材名称：")
    if (name?.trim()) {
      add(name.trim())
    }
  }

  // 按分类分组
  const grouped = useMemo(() => {
    const map: Record<CategoryKey, typeof ingredients> = { meat: [], vegetable: [], other: [] }
    ingredients.forEach((item) => {
      map[classifyIngredient(item.name)].push(item)
    })
    return map
  }, [ingredients])

  const hasIngredients = ingredients.length > 0

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <StatusBar />

      <main className="pb-28 max-w-lg mx-auto px-4">

        {/* ── Hero：冰箱图案 + 上传按钮 ─────────────────────── */}
        <section className="flex flex-col items-center pt-8 pb-6">
          {/* 冰箱插画 */}
          <FridgeIllustration hasIngredients={hasIngredients} />

          {/* 上传食材按钮 - 奶油暖橘磨砂质感 */}
          <button
            onClick={() => document.querySelector<HTMLButtonElement>('[data-upload-btn]')?.click()}
            className="mt-4 px-6 py-3 rounded-[var(--radius-xl)] btn-primary text-sm font-medium tracking-wide flex items-center gap-2"
          >
            <Upload size={16} />
            上传食材
          </button>

          <p className="mt-3 text-sm text-[var(--muted-foreground)] text-caption">
            拍照或上传，AI 帮你发现美味灵感
          </p>

          {/* 隐藏的真实上传按钮 */}
          <div className="sr-only">
            <ImageUploader onIngredientsIdentified={handleIngredientsIdentified} />
          </div>

          {/* 成功提示 */}
          {showUploadTip && lastIdentified && (
            <div className="mt-4 px-5 py-3 rounded-[var(--radius-lg)] glass-card animate-fade-in">
              <p className="text-sm text-[var(--primary)] font-medium">
                已添加：{lastIdentified.map(i => i.name).join("、")}
              </p>
            </div>
          )}
        </section>

        {/* ── 冰箱区块 ──────────────────────────────────────── */}
        <section className="mt-4">

          {/* 冰箱容器 - 奶油磨砂质感 */}
          <div className="rounded-[var(--radius-2xl)] glass-card overflow-hidden">

            {/* 冰箱 Header */}
            <button
              onClick={() => setIsFridgeExpanded(!isFridgeExpanded)}
              className="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[rgba(255,255,255,0.5)] transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* 冰箱图标 SVG */}
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect x="4" y="2" width="20" height="24" rx="4" fill="#F5EDE5" stroke="#D4C4B0" strokeWidth="1.5"/>
                  <line x1="4" y1="14" x2="24" y2="14" stroke="#D4C4B0" strokeWidth="1.5"/>
                  <rect x="19" y="6" width="2" height="5" rx="1" fill="#D4C4B0"/>
                  <rect x="19" y="17" width="2" height="4" rx="1" fill="#D4C4B0"/>
                </svg>
                <span className="text-title text-lg text-[var(--foreground)]">
                  我的冰箱
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--accent-purple)] text-[#8E7B9B]">
                  {ingredients.length} 种食材
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    refresh()
                  }}
                  className="p-2 rounded-full hover:bg-[var(--muted)] transition-colors"
                  aria-label="刷新"
                >
                  <RefreshCw size={16} className="text-[var(--muted-foreground)]" />
                </button>
                {isFridgeExpanded ? (
                  <ChevronUp size={20} className="text-[var(--muted-foreground)]" />
                ) : (
                  <ChevronDown size={20} className="text-[var(--muted-foreground)]" />
                )}
              </div>
            </button>

            {/* 冰箱内部：分层展示 */}
            {isFridgeExpanded && (
              <div className="px-4 pb-5 space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-7 h-7 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : !hasIngredients ? (
                  <div className="py-10 text-center">
                    <svg className="mx-auto mb-3" width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <rect x="8" y="4" width="32" height="40" rx="6" fill="#F0EBE3" stroke="#E0D6CA" strokeWidth="2"/>
                      <line x1="8" y1="24" x2="40" y2="24" stroke="#E0D6CA" strokeWidth="2"/>
                    </svg>
                    <p className="text-[var(--muted-foreground)] text-sm">冰箱里空空如也</p>
                    <p className="text-[var(--muted-foreground)] text-xs mt-1 opacity-60">点击上方按钮添加食材</p>
                  </div>
                ) : (
                  CATEGORIES.map((cat) => {
                    const items = grouped[cat.key]
                    if (items.length === 0) return null
                    return (
                      <div key={cat.key} className={cn("rounded-[var(--radius-lg)] p-4", cat.bgLight)}>
                        {/* 层标题 */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className={cn("text-sm font-medium", cat.tagText)}>
                            {cat.label}
                          </span>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", cat.tagBg, cat.tagText)}>
                            {items.length}
                          </span>
                        </div>
                        {/* 食材标签 */}
                        <div className="flex flex-wrap gap-2">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                                "bg-white/80 text-[var(--foreground)] shadow-sm",
                                "group transition-all duration-150 hover:bg-white"
                              )}
                            >
                              {item.name}
                              <button
                                onClick={() => remove(item.id)}
                                className="w-5 h-5 rounded-full bg-[var(--muted)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--destructive)] hover:text-white"
                                aria-label={`删除 ${item.name}`}
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })
                )}

                {/* 手动添加按钮 */}
                {hasIngredients && (
                  <button
                    onClick={addManualIngredient}
                    className="w-full mt-3 py-3 border-2 border-dashed border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--muted-foreground)] text-sm font-medium hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus size={16} />
                    手动添加食材
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────── */}
        <section className="mt-6">
          <Link
            href="/recommend"
            className={cn(
              "flex items-center justify-center gap-2.5 py-4 rounded-[var(--radius-xl)]",
              "btn-primary text-base font-medium tracking-wide"
            )}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2C5.5 2 2 5.5 2 10s3.5 8 8 8 8-3.5 8-8-3.5-8-8-8z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M7 10l2.5 2.5L13 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            解锁今日菜品灵感
          </Link>
        </section>

      </main>
    </div>
  )
}