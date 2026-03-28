"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Heart, User } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { id: "home", label: "灵感", icon: Home, path: "/" },
  { id: "search", label: "搜索", icon: Search, path: "/recommend" },
  { id: "favorites", label: "收藏", icon: Heart, path: "/favorites" },
  { id: "profile", label: "我的", icon: User, path: "/profile" },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 safe-area-pb z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.path
          return (
            <Link
              key={tab.id}
              href={tab.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors",
                isActive
                  ? "text-orange-500"
                  : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              )}
            >
              <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
