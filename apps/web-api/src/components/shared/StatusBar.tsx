"use client"

import { Settings } from "lucide-react"
import Link from "next/link"

export function StatusBar() {
  return (
    <header className="sticky top-0 z-40 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)]/50">
      <div className="flex items-center justify-between h-14 px-5 max-w-lg mx-auto">

        {/* Logo - 手绘风格厨师图标 */}
        <div className="flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <ellipse cx="14" cy="18" rx="10" ry="7" fill="#F5DDD8" stroke="#E8A87C" strokeWidth="1.5"/>
            <ellipse cx="14" cy="18" rx="7" ry="4" fill="#E8A87C" opacity="0.3"/>
            <path d="M8 15 Q14 10 20 15" stroke="#D4956A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            <circle cx="10" cy="17" r="1" fill="#D4956A"/>
            <circle cx="18" cy="17" r="1" fill="#D4956A"/>
            <path d="M12 20 Q14 22 16 20" stroke="#D4956A" strokeWidth="1" fill="none" strokeLinecap="round"/>
          </svg>
          <span className="text-lg text-title text-[var(--foreground)] tracking-wide">
            做饭灵感
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Settings */}
          <Link
            href="/settings"
            className="p-2.5 rounded-[var(--radius-lg)] hover:bg-[var(--muted)] transition-colors"
          >
            <Settings size={20} className="text-[var(--muted-foreground)]" />
          </Link>

          {/* Avatar - 奶油暖橘渐变 */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E8A87C] to-[#D4956A] flex items-center justify-center shadow-sm">
            <span className="text-sm font-medium text-white">我</span>
          </div>
        </div>
      </div>
    </header>
  )
}