/**
 * 图片压缩工具
 * 将图片压缩到指定宽度，保持比例
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
 * @param maxWidth 最大宽度，默认 800
 * @param quality 压缩质量 0-1，默认 0.8
 */
export function compressImage(
  file: File,
  maxWidth: number = 800,
  quality: number = 0.8
): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let { width, height } = img

        // 计算缩放比例
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("无法获取 Canvas context"))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // 转换为 Base64
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
