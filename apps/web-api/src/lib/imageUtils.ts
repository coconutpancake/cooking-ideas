/**
 * 图片压缩工具
 * 将图片压缩到指定尺寸，保持比例
 */

export interface CompressedImage {
  base64: string
  width: number
  height: number
  originalSize: number
  compressedSize: number
}

/**
 * 压缩图片并转换为 Base64
 * @param file 图片文件
 * @param maxLongestEdge 最大边长，默认 1024（保证清晰度）
 * @param quality 压缩质量 0-1，默认 0.85
 */
export function compressImage(
  file: File,
  maxLongestEdge: number = 1024,
  quality: number = 0.85
): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let { width, height } = img

        // 计算缩放比例 - 确保最长边不超过 maxLongestEdge
        if (width > maxLongestEdge || height > maxLongestEdge) {
          if (width > height) {
            height = Math.round((height * maxLongestEdge) / width)
            width = maxLongestEdge
          } else {
            width = Math.round((width * maxLongestEdge) / height)
            height = maxLongestEdge
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("无法获取 Canvas context"))
          return
        }

        // 使用高质量渲染
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"
        ctx.drawImage(img, 0, 0, width, height)

        // 转换为 Base64 (JPEG)
        const base64 = canvas.toDataURL("image/jpeg", quality)
        const compressedSize = Math.round((base64.length - base64.indexOf(",") - 1) * 0.75)

        resolve({
          base64,
          width,
          height,
          originalSize: file.size,
          compressedSize,
        })
      }
      img.onerror = () => reject(new Error("图片加载失败"))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error("文件读取失败"))
    reader.readAsDataURL(file)
  })
}

/**
 * 检测是否为移动设备
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}
