"use client"

import Link from "next/link"
import { Search, SlidersHorizontal, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import { StatusBar } from "@/components/shared/StatusBar"
import { BottomNav } from "@/components/shared/BottomNav"
import { mockRecipes } from "@/lib/mockData"

export default function RecommendPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <StatusBar />

      <main className="pb-24 max-w-lg mx-auto">
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
            {/* Filter Button */}
            <button className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
              <SlidersHorizontal size={20} className="text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
            {["全部", "炒", "煮", "蒸", "烤", "炸", "凉拌"].map((cat, i) => (
              <button
                key={cat}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  i === 0
                    ? "bg-orange-500 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Recipe List */}
        <div className="p-4 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
            为你推荐
          </h2>

          {mockRecipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipe/${recipe.id}`}
              className="block bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm border border-zinc-100 dark:border-zinc-800 hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className="relative h-48 bg-zinc-200 dark:bg-zinc-800">
                <img
                  src={recipe.coverImage}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                />
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
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">
                      {recipe.title}
                    </h3>
                    <div className="flex gap-1.5 mt-1.5">
                      {recipe.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
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
                        食材已备齐
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
                          {recipe.missingIngredients.length}种
                        </span>
                        {" "}食材
                      </span>
                      <div className="flex gap-1 ml-1">
                        {recipe.missingIngredients.slice(0, 3).map((ing) => (
                          <span
                            key={ing}
                            className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs rounded"
                          >
                            {ing}
                          </span>
                        ))}
                        {recipe.missingIngredients.length > 3 && (
                          <span className="text-xs text-zinc-400">
                            +{recipe.missingIngredients.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
