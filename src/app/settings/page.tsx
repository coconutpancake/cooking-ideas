"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { StatusBar } from "@/components/shared/StatusBar"

export default function SettingsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <StatusBar />
      <main className="max-w-lg mx-auto">
        {/* Header */}
        <div className="sticky top-14 z-30 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center h-14 px-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center -ml-2"
            >
              <ArrowLeft size={20} className="text-zinc-700 dark:text-zinc-300" />
            </button>
            <h1 className="ml-2 font-semibold text-zinc-800 dark:text-zinc-100">
              设置
            </h1>
          </div>
        </div>

        {/* Settings Content */}
        <div className="p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden">
            {[
              "深色模式",
              "消息推送",
              "清理缓存",
              "检查更新",
            ].map((item, i) => (
              <button
                key={i}
                className="w-full text-left p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-b-0"
              >
                <span className="text-zinc-700 dark:text-zinc-200">{item}</span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
