"use client"

import { CheckCircle2, Circle } from "lucide-react"
import type { Ingredient } from "@/lib/recipes"

interface RecipeHeaderProps {
  title: string
  cookingTime: number
  tags: string[]
}

export function RecipeHeader({ title, cookingTime, tags }: RecipeHeaderProps) {
  return (
    <div className="pb-4">
      <h1 className="text-2xl font-bold text-black leading-tight">{title}</h1>
      <p className="text-sm text-gray-400 mt-1">
        {cookingTime}分钟 · {tags[0]} · 2人份
      </p>
    </div>
  )
}

interface IngredientListProps {
  mainIngredients: Ingredient[]
  seasonings: Ingredient[]
  isUserHasIngredient: (name: string) => boolean
}

export function IngredientList({ mainIngredients, seasonings, isUserHasIngredient }: IngredientListProps) {
  return (
    <section>
      <h2 className="text-lg font-bold text-black pb-3 border-b border-gray-100">
        食材清单
      </h2>

      {/* 主食材 */}
      <div className="py-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1C3.5 1 1.5 3 1.5 5.5c0 1.8 1 3.3 2.5 4v1.5h3v-1.5c1.5-.7 2.5-2.2 2.5-4C10.5 3 8.5 1 6 1z" fill="#f97316"/>
            </svg>
          </div>
          <span className="text-sm font-semibold text-black">主食材</span>
        </div>
        <div className="space-y-0">
          {mainIngredients.map((ing, i) => {
            const hasIt = isUserHasIngredient(ing.name)
            return (
              <div
                key={i}
                className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  {hasIt ? (
                    <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                  ) : (
                    <Circle size={16} className="text-gray-300 flex-shrink-0" />
                  )}
                  <span className={hasIt ? "text-sm text-black" : "text-sm text-gray-400"}>
                    {ing.name}
                  </span>
                </div>
                <span className="text-sm text-gray-400">{ing.amount}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 调料辅料 */}
      <div className="py-3 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
            <Circle size={12} className="text-gray-400" />
          </div>
          <span className="text-sm font-semibold text-black">调料与辅料</span>
        </div>
        <div className="space-y-0">
          {seasonings.map((ing, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-b-0"
            >
              <span className="text-sm text-gray-500">{ing.name}</span>
              <span className="text-sm text-gray-400">{ing.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

interface Step {
  order: number
  description: string
}

interface StepListProps {
  steps: Step[]
  isLoading: boolean
  displayedText: string
  streamError: string | null
  onRetry: () => void
  highlightFn: (text: string) => React.ReactNode
}

export function StepList({ steps, isLoading, displayedText, streamError, onRetry, highlightFn }: StepListProps) {
  return (
    <section>
      <h2 className="text-lg font-bold text-black pb-3 border-b border-gray-100 flex items-center gap-2">
        做法步骤
        {isLoading && (
          <span className="inline-flex items-center gap-1.5 text-xs font-normal text-orange-500">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="animate-spin">
              <circle cx="7" cy="7" r="6" stroke="#f97316" strokeWidth="1.5" strokeDasharray="20 17" fill="none"/>
            </svg>
            AI 生成中...
          </span>
        )}
      </h2>

      {streamError ? (
        <div className="py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-500 flex-1">{streamError}</p>
            <button
              onClick={onRetry}
              className="ml-3 px-4 py-1.5 bg-red-50 text-red-500 text-xs font-medium rounded-full"
            >
              重试
            </button>
          </div>
        </div>
      ) : steps.length > 0 ? (
        <div className="py-4 space-y-4">
          {steps.map((step) => (
            <div key={step.order} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                {step.order}
              </div>
              <p className="text-sm text-black leading-relaxed pt-0.5">
                {highlightFn(step.description)}
              </p>
            </div>
          ))}
        </div>
      ) : isLoading ? (
        <div className="py-8">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {i}
                </div>
                <div className="flex-1 pt-0.5">
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4 mt-2" style={{ animationDelay: `${i * 100}ms` }} />
                </div>
              </div>
            ))}
          </div>
          {displayedText && (
            <div className="mt-4 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="animate-spin">
                <circle cx="7" cy="7" r="6" stroke="#f97316" strokeWidth="1.5" strokeDasharray="20 17" fill="none"/>
              </svg>
              <span className="text-xs text-gray-400">{displayedText}</span>
              <span className="w-2 h-4 bg-orange-500 animate-pulse" />
            </div>
          )}
        </div>
      ) : (
        <div className="py-8 text-center text-sm text-gray-400">正在加载步骤...</div>
      )}
    </section>
  )
}

interface TipsCardProps {
  tips: string
}

export function TipsCard({ tips }: TipsCardProps) {
  return (
    <section className="pb-6">
      <div className="rounded-xl bg-orange-50 p-4">
        <div className="flex items-start gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 flex-shrink-0">
            <path d="M8 1.5c-2 0-3.5 1.5-3.5 3.5 0 1.5 1 2.7 2.3 3.3l-.3 1.7h3l-.3-1.7c1.3-.6 2.3-1.8 2.3-3.3C11.5 3 10 1.5 8 1.5z" fill="#f97316"/>
            <circle cx="8" cy="8.5" r="1" fill="white"/>
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-orange-700 mb-1">小贴士</h3>
            <p className="text-sm text-gray-800 leading-relaxed">{tips}</p>
          </div>
        </div>
      </div>
    </section>
  )
}