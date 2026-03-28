"use client"

import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Share2, Heart, Clock, ChefHat, CheckCircle2, Circle, Flame } from "lucide-react"
import { StatusBar } from "@/components/shared/StatusBar"
import { getRecipeById } from "@/lib/recipes"

export default function RecipeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const recipeId = params.id as string
  const recipe = getRecipeById(recipeId)

  if (!recipe) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-32">
        <StatusBar />
        <main className="max-w-lg mx-auto px-4 py-20 text-center">
          <p className="text-zinc-500">菜谱不存在</p>
          <Link
            href="/recommend"
            className="mt-4 inline-block px-6 py-2 bg-orange-500 text-white text-sm font-medium rounded-full"
          >
            返回推荐
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-32">
      <StatusBar />

      {/* Hero Image with Overlay */}
      <div className="relative h-72 bg-zinc-200 dark:bg-zinc-800">
        <img
          src={recipe.coverImage}
          alt={recipe.title}
          className="w-full h-full object-cover"
        />

        {/* Top Navigation */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors">
              <Share2 size={18} className="text-white" />
            </button>
            <button className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors">
              <Heart size={18} className="text-white" />
            </button>
          </div>
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <h1 className="text-2xl font-bold text-white">{recipe.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-white/90">
              <Clock size={14} />
              <span className="text-sm">{recipe.cookingTime}分钟</span>
            </div>
            <div className="flex gap-1.5">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Ingredients Section */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mb-3">
            食材清单
          </h2>

          {/* Main Ingredients */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-orange-200 dark:border-orange-900">
            <div className="flex items-center gap-2 mb-3">
              <Flame size={18} className="text-orange-500" />
              <span className="font-medium text-orange-600 dark:text-orange-400">
                主食材 ({recipe.mainIngredients.length})
              </span>
            </div>
            <div className="space-y-2">
              {recipe.mainIngredients.map((ing, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-zinc-700 dark:text-zinc-300">{ing.name}</span>
                  <span className="text-sm text-zinc-400">{ing.amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Seasonings */}
          <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-4 mt-3 border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-2 mb-3">
              <Circle size={18} className="text-zinc-400" />
              <span className="font-medium text-zinc-600 dark:text-zinc-400">
                调料与辅料 ({recipe.seasonings.length})
              </span>
            </div>
            <div className="space-y-2">
              {recipe.seasonings.map((ing, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">{ing.name}</span>
                  <span className="text-sm text-zinc-400">{ing.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Steps Section */}
        {recipe.steps && (
          <section>
            <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mb-3">
              做法步骤
            </h2>
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800 space-y-4">
              {recipe.steps.map((step) => (
                <div key={step.order} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                      {step.order}
                    </span>
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed pt-1">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tips Section */}
        {recipe.tips && (
          <section>
            <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mb-3">
              小贴士
            </h2>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-900">
              <p className="text-amber-800 dark:text-amber-300 text-sm leading-relaxed">
                {recipe.tips}
              </p>
            </div>
          </section>
        )}
      </main>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 p-4 safe-area-pb">
        <div className="max-w-lg mx-auto">
          <button className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all">
            <ChefHat size={20} />
            开始做菜
          </button>
        </div>
      </div>
    </div>
  )
}
