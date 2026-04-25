"use client"

import { useRef, useState } from "react"
import { Camera, Upload, X, Loader2, AlertCircle } from "lucide-react"
import { compressImage, isMobileDevice } from "@/lib/imageUtils"
import { identifyIngredients, type IngredientItem } from "@/lib/mockApi"
import { addIngredients } from "@/lib/storage"
import { notifyIngredientsChanged } from "@/hooks/useIngredients"
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

  const mobile = isMobileDevice()

  const processImage = async (file: File) => {
    setIsProcessing(true)
    setError(null)
    setPreview(null)

    try {
      const compressed = await compressImage(file, 1024, 0.85)
      setPreview(compressed.base64)

      const response = await identifyIngredients(compressed.base64)

      if (response.success && response.data && response.data.ingredients.length > 0) {
        const names = response.data.ingredients.map(i => i.name)
        addIngredients(names)
        notifyIngredientsChanged()
        onIngredientsIdentified?.(response.data.ingredients)
      } else {
        setError("未能在图片中识别出食材，请上传包含清晰食材的图片")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "图片处理失败，请重试")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processImage(file)
    }
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
            className="w-40 h-40 object-cover rounded-[var(--radius-xl)] shadow-md"
          />
          <button
            onClick={clearPreview}
            className="absolute -top-2 -right-2 w-8 h-8 bg-[var(--foreground)]/60 rounded-full flex items-center justify-center hover:bg-[var(--foreground)]/80 transition-colors"
          >
            <X size={16} className="text-white" />
          </button>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="flex flex-col items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin"/>
          <p className="text-sm text-[var(--muted-foreground)]">正在识别食材...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isProcessing && (
        <div className="mb-4 px-4 py-3 rounded-[var(--radius-lg)] glass-card flex items-start gap-2 border border-[var(--destructive)]/20">
          <AlertCircle size={18} className="text-[var(--destructive)] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[var(--destructive)]">{error}</p>
        </div>
      )}

      {/* Upload Buttons */}
      {!isProcessing && !preview && (
        <div className="flex flex-col items-center gap-4">
          {/* Main Button - 奶油磨砂质感 */}
          <div className="relative">
            <button
              onClick={mobile ? handleCameraClick : handleUploadClick}
              className="w-24 h-24 rounded-full btn-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            >
              <Camera size={32} className="text-white" />
            </button>
            {/* Decorative ring - 低饱和虚线 */}
            <div className="absolute inset-0 w-24 h-24 rounded-full border-2 border-dashed border-[var(--primary)]/30 -z-10" />
          </div>

          <div className="flex items-center gap-3">
            {mobile && (
              <button
                onClick={handleCameraClick}
                className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-full)] glass-card text-sm font-medium text-[var(--foreground)] hover:bg-white transition-colors"
              >
                <Camera size={16} />
                拍照
              </button>
            )}
            <button
              onClick={handleUploadClick}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-full)] glass-card text-sm font-medium text-[var(--foreground)] hover:bg-white transition-colors"
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