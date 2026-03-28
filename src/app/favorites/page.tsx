"use client"

import { Heart } from "lucide-react"
import { StatusBar } from "@/components/shared/StatusBar"
import { BottomNav } from "@/components/shared/BottomNav"

export default function FavoritesPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <StatusBar />
      <main className="pb-24 max-w-lg mx-auto flex flex-col items-center justify-center p-8">
        <Heart size={64} className="text-zinc-300 dark:text-zinc-600" />
        <h2 className="mt-4 text-lg font-medium text-zinc-600 dark:text-zinc-400">
          暂无收藏
        </h2>
        <p className="mt-2 text-sm text-zinc-400 text-center">
          收藏你喜欢的菜谱，方便下次查找
        </p>
      </main>
      <BottomNav />
    </div>
  )
}
