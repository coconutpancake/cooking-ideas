"use client"

import { useRef, useState } from "react"
import { Camera, Upload, X, Loader2 } from "lucide-react"
import { compressImage, isMobileDevice } from "@/lib/imageUtils"
import { identifyIngredients, type IngredientItem } from "@/lib/mockApi"
import { addIngredient } from "@/lib/storage"
import { cn } from "@/lib/utils"

interface ImageUploaderProps {
  onIngredientsIdentified?: (ingredients: IngredientItem[]) => void
  className?: string
}

export function ImageUploader({ onIngredientsIdentified, className }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isFallback, setIsFallback] = useState(false)

  const mobile = isMobileDevice()

  const processImage = async (file: File) => {
    setIsProcessing(true)
    setError(null)
    setPreview(null)
    setIsFallback(false)

    try {
      // 压缩图片
      const compressed = await compressImage(file, 800, 0.8)
      setPreview(compressed.base64)

      // 调用 API 识别食材
      const response = await identifyIngredients(compressed.base64)

      if (response.success && response.data.ingredients.length > 0) {
        // 添加识别出的食材到 localStorage
        response.data.ingredients.forEach((item) => {
          addIngredient(item.name)
        })
        setIsFallback(!!response.data.message.includes("本地数据"))
        // 回调通知
        onIngredientsIdentified?.(response.data.ingredients)
      } else if (response.success && response.data.ingredients.length === 0) {
        setError("未能识别出食材，请上传包含食材的图片")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "图片处理失败")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processImage(file)
    }
    // 重置 input
    e.target.value = ""
  }

  const handleUploadClick = () => {
    inputRef.current?.click()
  }

  const handleCameraClick = () => {
    cameraRef.current?.click()
  }

  const clearPreview = () => {
    setPreview(null)
    setError(null)
    setIsFallback(false)
  }

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Hidden inputs */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Preview Area */}
      {preview && (
        <div className="relative mb-4">
          <img
            src={preview}
            alt="Preview"
            className="w-40 h-40 object-cover rounded-2xl shadow-md"
          />
          <button
            onClick={clearPreview}
            className="absolute -top-2 -right-2 w-8 h-8 bg-zinc-800/80 rounded-full flex items-center justify-center hover:bg-zinc-700 transition-colors"
          >
            <X size={16} className="text-white" />
          </button>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="flex flex-col items-center gap-2 mb-4">
          <Loader2 size={32} className="text-orange-500 animate-spin" />
          <p className="text-sm text-zinc-500">正在识别食材...</p>
        </div>
      )}

      {/* Fallback Tip */}
      {isFallback && !isProcessing && (
        <div className="mb-4 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm rounded-lg">
          网络不稳定，已使用本地数据
        </div>
      )}

      {/* Error State */}
      {error && !isFallback && (
        <div className="mb-4 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Upload Buttons */}
      {!isProcessing && !preview && (
        <div className="flex flex-col items-center gap-4">
          {/* Main Button */}
          <div className="relative">
            <button
              onClick={mobile ? handleCameraClick : handleUploadClick}
              className="w-28 h-28 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            >
              <Camera size={36} className="text-white" />
            </button>
            {/* Decorative ring */}
            <div className="absolute inset-0 w-28 h-28 rounded-full border-4 border-dashed border-orange-300 animate-pulse -z-10" />
          </div>

          <div className="flex items-center gap-4">
            {mobile && (
              <button
                onClick={handleCameraClick}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <Camera size={16} />
                拍照
              </button>
            )}
            <button
              onClick={handleUploadClick}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <Upload size={16} />
              上传图片
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
