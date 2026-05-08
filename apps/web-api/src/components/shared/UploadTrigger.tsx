"use client"

import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from "react"
import { Loader2 } from "lucide-react"
import { compressImage } from "@/lib/imageUtils"
import { identifyIngredients } from "@/lib/mockApi"
import { addIngredients } from "@/lib/storage"
import { notifyIngredientsChanged } from "@/hooks/useIngredients"

// ─── 内部上传触发器（供父组件调用）─────────────────────────────
export interface UploadTriggerRef {
  triggerUpload: () => void
}

const UploadTrigger = forwardRef<UploadTriggerRef>((_, ref) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useImperativeHandle(ref, () => ({
    triggerUpload: () => {
      inputRef.current?.click()
    },
  }))

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      const compressed = await compressImage(file, 1024, 0.85)
      const response = await identifyIngredients(compressed.base64)

      if (response.success && response.data && response.data.ingredients.length > 0) {
        const names = response.data.ingredients.map(i => i.name)
        addIngredients(names)
        notifyIngredientsChanged()
      } else {
        setError("未能在图片中识别出食材")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "图片处理失败")
    } finally {
      setIsProcessing(false)
      e.target.value = ""
    }
  }, [])

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-2xl px-6 py-4 flex items-center gap-3 shadow-lg">
            <Loader2 size={20} className="text-orange-500 animate-spin" />
            <span className="text-sm text-black font-medium">正在识别食材...</span>
          </div>
        </div>
      )}
    </>
  )
})

UploadTrigger.displayName = "UploadTrigger"

export default UploadTrigger