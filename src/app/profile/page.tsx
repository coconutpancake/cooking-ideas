"use client"

import { User, ChevronRight, Bell, HelpCircle, Info } from "lucide-react"
import { StatusBar } from "@/components/shared/StatusBar"
import { BottomNav } from "@/components/shared/BottomNav"

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <StatusBar />
      <main className="pb-24 max-w-lg mx-auto">
        {/* Profile Header */}
        <div className="bg-white dark:bg-zinc-900 p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
              <span className="text-2xl font-medium text-white">我</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                游客用户
              </h2>
              <p className="text-sm text-zinc-400 mt-0.5">
                登录后同步你的数据
              </p>
              <button className="mt-2 px-4 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-full">
                登录/注册
              </button>
            </div>
          </div>
        </div>

        {/* Menu List */}
        <div className="mt-4 bg-white dark:bg-zinc-900">
          {[
            { icon: Bell, label: "消息通知", value: null },
            { icon: HelpCircle, label: "帮助与反馈", value: null },
            { icon: Info, label: "关于做饭灵感", value: "v1.0" },
          ].map((item, i) => (
            <button
              key={i}
              className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className="text-zinc-400" />
                <span className="text-zinc-700 dark:text-zinc-200">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.value && (
                  <span className="text-sm text-zinc-400">{item.value}</span>
                )}
                <ChevronRight size={18} className="text-zinc-300" />
              </div>
            </button>
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
