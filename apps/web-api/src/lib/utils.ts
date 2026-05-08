import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化时间戳为友好相对时间
 * @param ts 时间戳（毫秒）
 * @returns 友好的时间描述
 */
export function formatRelativeTime(ts: number): string {
  const now = Date.now()
  const diff = now - ts
  const second = 1000
  const minute = 60 * second
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < 30 * second) {
    return "刚刚"
  }
  if (diff < 60 * second) {
    return `${Math.floor(diff / second)}秒前`
  }
  if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  }
  if (diff < day) {
    return `今天 ${new Date(ts).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`
  }
  if (diff < 2 * day) {
    return `昨天 ${new Date(ts).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`
  }
  return new Date(ts).toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
