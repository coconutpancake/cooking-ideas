"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronDown, ChevronUp, X, Plus, RefreshCw } from "lucide-react"
import { StatusBar } from "@/components/shared/StatusBar"
import { ImageUploader } from "@/components/shared/ImageUploader"
import { useIngredients } from "@/hooks/useIngredients"
import { cn } from "@/lib/utils"
import type { IngredientItem } from "@/lib/mockApi"

export default function HomePage() {
  const { ingredients, isLoading, add, remove, refresh } = useIngredients()
  const [isFridgeExpanded, setIsFridgeExpanded] = useState(true)
  const [showUploadTip, setShowUploadTip] = useState(false)
  const [lastIdentified, setLastIdentified] = useState<IngredientItem[] | null>(null)

  const handleIngredientsIdentified = (newIngredients: IngredientItem[]) => {
    setLastIdentified(newIngredients)
    setShowUploadTip(true)
    // 3秒后隐藏提示
    setTimeout(() => setShowUploadTip(false), 3000)
  }

  const addManualIngredient = () => {
    const name = prompt("请输入食材名称：")
    if (name?.trim()) {
      add(name.trim())
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <StatusBar />

      <main className="pb-24 max-w-lg mx-auto">
        {/* Hero Section - Upload Button */}
        <section className="flex flex-col items-center justify-center py-8 px-4">
          <ImageUploader
            onIngredientsIdentified={handleIngredientsIdentified}
          />
          <h2 className="mt-4 text-lg font-medium text-zinc-700 dark:text-zinc-200">
            拍一拍或上传食材
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            AI 帮你发现美味灵感
          </p>

          {/* Success tip */}
          {showUploadTip && lastIdentified && (
            <div className="mt-4 px-4 py-3 bg-green-50 dark:bg-green-900/20 rounded-xl animate-pulse">
              <p className="text-sm text-green-700 dark:text-green-400">
                ✓ 已添加：{lastIdentified.map(i => i.name).join("、")}
              </p>
            </div>
          )}
        </section>

        {/* My Fridge Section */}
        <section className="px-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
            {/* Header */}
            <div
              onClick={() => setIsFridgeExpanded(!isFridgeExpanded)}
              className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">🧊</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-100">
                  我的冰箱
                </span>
                <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs rounded-full">
                  {ingredients.length} 种食材
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    refresh()
                  }}
                  className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  <RefreshCw size={16} className="text-zinc-400" />
                </div>
                {isFridgeExpanded ? (
                  <ChevronUp size={20} className="text-zinc-400" />
                ) : (
                  <ChevronDown size={20} className="text-zinc-400" />
                )}
              </div>
            </div>

            {/* Ingredients Tags */}
            {isFridgeExpanded && (
              <div className="px-4 pb-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : ingredients.length === 0 ? (
                  <div className="py-4 text-center text-sm text-zinc-400">
                    冰箱里还没有食材，拍照或上传识别
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {ingredients.map((item) => (
                      <div
                        key={item.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm rounded-full group hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                      >
                        {item.name}
                        <div
                          onClick={() => remove(item.id)}
                          className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 dark:hover:bg-red-800 cursor-pointer"
                        >
                          <X size={12} className="text-zinc-500 dark:text-zinc-400" />
                        </div>
                      </div>
                    ))}

                    {/* Add button */}
                    <button
                      onClick={addManualIngredient}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 text-sm rounded-full hover:border-orange-400 hover:text-orange-500 transition-colors"
                    >
                      <Plus size={14} />
                      添加
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* CTA Button */}
        <section className="px-4 mt-6">
          <Link
            href="/recommend"
            className="flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-2xl shadow-lg shadow-orange-500/30 hover:shadow-xl active:scale-[0.98] transition-all"
          >
            <span className="text-xl">💡</span>
            解锁今日菜品灵感
          </Link>
        </section>
      </main>
    </div>
  )
}
