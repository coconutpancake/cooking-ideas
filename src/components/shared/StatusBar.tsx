"use client"

import { Settings, WifiOff } from "lucide-react"
import Link from "next/link"

export function StatusBar() {
  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-orange-500">🍳</span>
          <span className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
            做饭灵感
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Network status indicator */}
          <div className="flex items-center gap-1 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">
            <WifiOff size={14} className="text-zinc-400" />
            <span className="text-xs text-zinc-500">无网络</span>
          </div>

          {/* Settings */}
          <Link
            href="/settings"
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Settings size={20} className="text-zinc-600 dark:text-zinc-400" />
          </Link>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
            <span className="text-sm font-medium text-white">我</span>
          </div>
        </div>
      </div>
    </header>
  )
}
