"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { StatusBar } from "@/components/shared/StatusBar"

export default function SettingsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <StatusBar />
      <main className="max-w-lg mx-auto">

        {/* Header */}
        <div className="sticky top-14 z-30 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)]/50">
          <div className="flex items-center h-14 px-5">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full hover:bg-[var(--muted)] flex items-center justify-center -ml-2 transition-colors"
            >
              <ArrowLeft size={20} className="text-[var(--muted-foreground)]" />
            </button>
            <h1 className="ml-2 text-lg text-title text-[var(--foreground)]">
              设置
            </h1>
          </div>
        </div>

        {/* Settings Content */}
        <div className="p-4 space-y-4">
          <div className="rounded-[var(--radius-xl)] glass-card overflow-hidden">
            {[
              "深色模式",
              "消息推送",
              "清理缓存",
              "检查更新",
            ].map((item, i) => (
              <button
                key={i}
                className="w-full text-left px-5 py-4 hover:bg-[var(--muted)]/50 transition-colors border-b border-[var(--border)]/50 last:border-b-0"
              >
                <span className="text-[var(--foreground)] font-medium">{item}</span>
              </button>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}