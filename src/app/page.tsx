"use client"

import { useState } from "react"
import { Camera, ChevronDown, ChevronUp, X, Plus, Sparkles } from "lucide-react"
import { StatusBar } from "@/components/shared/StatusBar"
import { BottomNav } from "@/components/shared/BottomNav"
import { mockIngredients } from "@/lib/mockData"

export default function HomePage() {
  const [ingredients, setIngredients] = useState<string[]>(mockIngredients.slice(0, 6))
  const [isFridgeExpanded, setIsFridgeExpanded] = useState(true)

  const removeIngredient = (name: string) => {
    setIngredients((prev) => prev.filter((i) => i !== name))
  }

  const addRandomIngredient = () => {
    const allIngredients = [
      "鸡蛋", "番茄", "米饭", "葱", "蒜", "盐", "油", "生抽",
      "青菜", "豆腐", "土豆", "胡萝卜", "洋葱", "肉末", "辣椒"
    ]
    const available = allIngredients.filter((i) => !ingredients.includes(i))
    if (available.length > 0) {
      const random = available[Math.floor(Math.random() * available.length)]
      setIngredients((prev) => [...prev, random])
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <StatusBar />

      <main className="pb-24 max-w-lg mx-auto">
        {/* Hero Section - Upload Button */}
        <section className="flex flex-col items-center justify-center py-8 px-4">
          <div className="relative">
            {/* Main upload button */}
            <button className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
              <Camera size={40} className="text-white" />
            </button>
            {/* Decorative ring */}
            <div className="absolute inset-0 w-32 h-32 rounded-full border-4 border-dashed border-orange-300 animate-pulse -z-10" />
          </div>
          <h2 className="mt-4 text-lg font-medium text-zinc-700 dark:text-zinc-200">
            拍一拍或上传食材
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            AI 帮你发现美味灵感
          </p>
        </section>

        {/* My Fridge Section */}
        <section className="px-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
            {/* Header */}
            <button
              onClick={() => setIsFridgeExpanded(!isFridgeExpanded)}
              className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
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
              {isFridgeExpanded ? (
                <ChevronUp size={20} className="text-zinc-400" />
              ) : (
                <ChevronDown size={20} className="text-zinc-400" />
              )}
            </button>

            {/* Ingredients Tags */}
            {isFridgeExpanded && (
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm rounded-full group hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                    >
                      {name}
                      <button
                        onClick={() => removeIngredient(name)}
                        className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} className="text-zinc-500" />
                      </button>
                    </span>
                  ))}

                  {/* Add button */}
                  <button
                    onClick={addRandomIngredient}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 text-sm rounded-full hover:border-orange-400 hover:text-orange-500 transition-colors"
                  >
                    <Plus size={14} />
                    添加
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="px-4 mt-6">
          <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl font-medium hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
              <Sparkles size={18} />
              AI 智能推荐
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
              查看全部菜谱
            </button>
          </div>
        </section>

        {/* Tips Section */}
        <section className="px-4 mt-6">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h3 className="font-medium text-zinc-800 dark:text-zinc-200">
                  今日推荐
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  根据你冰箱里的食材，推荐你做番茄炒蛋！简单又美味～
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
