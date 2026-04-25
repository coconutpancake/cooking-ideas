"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { X, Plus, Snowflake, Camera, ChevronDown } from "lucide-react"
import { ImageUploader } from "@/components/shared/ImageUploader"
import { useIngredients } from "@/hooks/useIngredients"
import { cn } from "@/lib/utils"
import type { IngredientItem } from "@/lib/mockApi"

// ─── 食材分类 ───────────────────────────────────────────────
type CategoryKey = "meat" | "vegetable" | "other"

interface CategoryConfig {
  key: CategoryKey
  label: string
}

const CATEGORIES: CategoryConfig[] = [
  { key: "meat", label: "肉类海鲜" },
  { key: "vegetable", label: "蔬菜水果" },
  { key: "other", label: "调料其他" },
]

// 食材分类映射
function classifyIngredient(name: string): CategoryKey {
  const n = name.toLowerCase()
  if (/猪|牛|羊|鸡|鸭|鹅|肉|鱼|虾|蟹|贝|蛤|螺|鱿鱼|章鱼|牛排|香肠|腊肉|火腿|培根|排骨|蹄|内脏|肝|腰|肚/.test(n)) return "meat"
  if (/菜|蔬|番茄|西红柿|黄瓜|土豆|马铃薯|萝卜|胡萝卜|洋葱|葱|蒜|姜|椒|茄子|豆角|四季豆|西兰花|菠菜|白菜|生菜|油菜|芹菜|韭菜|香菜|茼蒿|苦瓜|丝瓜|冬瓜|南瓜|莲藕|竹笋|菌|菇|木耳|豆腐|豆浆|腐竹|水果|苹果|香蕉|梨|桃|橙|橘|葡萄|草莓|蓝莓|芒果|西瓜|菠萝|柠檬/.test(n)) return "vegetable"
  return "other"
}

// ─── 主组件 ──────────────────────────────────────────────────
export default function HomePage() {
  const { ingredients, isLoading, add, remove } = useIngredients()
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
    <div className="min-h-screen bg-gray-50">
      {/* 最外层：手机 App 居中宽度 */}
      <div className="max-w-md mx-auto relative min-h-screen">

        {/* ── 顶部标题区 ─────────────────────────────────────── */}
        <div className="px-5 pt-8 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black">我的冰箱</h1>
              <p className="text-sm text-gray-400 mt-1">食材越准确，推荐越合口味</p>
            </div>
          </div>
        </div>

        {/* ── 更新卡片 ────────────────────────────────────────── */}
        <div className="px-5 pb-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl bg-white">
            {/* 左侧：雪花 + 上次更新 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Snowflake size={20} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-black">上次更新</p>
                <p className="text-xs text-gray-400">2分钟前</p>
              </div>
            </div>
            {/* 右侧：拍照更新按钮 */}
            <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-full text-sm font-medium text-black hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <Camera size={16} className="text-orange-500" />
              拍照更新
            </button>
          </div>
        </div>

        {/* ── 食材列表 - 整体包裹在圆角卡片中 ─────────────────── */}
        <div className="px-5 pb-32">
          <div className="border border-gray-200 rounded-2xl p-4 bg-white">

            {/* 标题行 */}
            <div className="flex items-center justify-between py-2 mb-4">
              <h2 className="text-base font-semibold text-black">
                当前食材 <span className="text-orange-500">{ingredients.length}</span> 种
              </h2>
              <button className="text-sm text-blue-500 font-medium">编辑</button>
            </div>

            {/* 空状态 */}
            {!hasIngredients && !isLoading && (
              <div className="py-12 text-center">
                <p className="text-gray-400 text-sm">冰箱里空空如也</p>
                <p className="text-gray-300 text-xs mt-1">点击上方按钮添加食材</p>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* 分类区块 */}
            {hasIngredients && !isLoading && (
              <div className="space-y-5">
                {CATEGORIES.map((cat) => {
                  const items = grouped[cat.key]
                  if (items.length === 0) return null
                  return (
                    <div key={cat.key}>
                      {/* 分类标题 */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-gray-500">
                          {cat.label} ({items.length})
                        </span>
                      </div>
                      {/* 食材横向平铺 - 流式布局 */}
                      <div className="flex flex-wrap gap-3">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full"
                          >
                            <span className="text-sm text-black">{item.name}</span>
                            <button
                              onClick={() => remove(item.id)}
                              className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                            >
                              <X size={10} className="text-gray-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}

                {/* 手动添加 */}
                <button
                  onClick={addManualIngredient}
                  className="w-full py-2.5 flex items-center justify-center gap-1.5 text-sm text-blue-500 font-medium"
                >
                  <Plus size={16} />
                  手动添加食材
                </button>
              </div>
            )}

          </div>
        </div>

        {/* ── 底部操作区 ──────────────────────────────────────── */}
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 px-5 py-4 safe-area-pb">
          {/* 隐藏的真实上传按钮 */}
          <div className="sr-only">
            <ImageUploader onIngredientsIdentified={handleIngredientsIdentified} />
          </div>

          {/* 主按钮 */}
          <Link
            href="/recommend"
            className="flex items-center justify-center gap-2 py-4 bg-orange-500 text-white text-base font-semibold rounded-2xl"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2C5.5 2 2 5.5 2 10s3.5 8 8 8 8-3.5 8-8-3.5-8-8-8z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M7 10l2.5 2.5L13 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            解锁每日做饭灵感
          </Link>
          <p className="text-center text-xs text-gray-400 mt-2">根据现有食材，推荐适合的菜谱</p>

          {/* 成功提示 */}
          {showUploadTip && lastIdentified && (
            <div className="mt-3 px-4 py-2.5 bg-orange-50 border border-orange-100 rounded-xl">
              <p className="text-sm text-orange-500 font-medium">
                已添加：{lastIdentified.map(i => i.name).join("、")}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}