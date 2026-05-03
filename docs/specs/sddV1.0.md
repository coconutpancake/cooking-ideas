# 做饭灵感 App - 软件设计文档 (SDD)

## 1. 技术架构

### 1.1 技术栈
- **框架**：Next.js 14+ (App Router)
- **样式**：Tailwind CSS + shadcn/ui
- **类型**：TypeScript
- **状态管理**：Zustand (UI状态) + TanStack Query (服务端状态)
- **动画**：Framer Motion
- **图标**：Lucide React
- **AI集成**：OpenAI SDK (兼容阿里云通义千问)

### 1.2 项目结构
```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── vision/          # AI 视觉识别
│   │   └── recommend/        # 菜谱推荐
│   ├── recommend/           # 推荐列表页
│   ├── recipe/[id]/         # 菜谱详情页
│   └── page.tsx             # 首页/冰箱
├── components/              # 组件
│   └── shared/              # 共享组件
├── hooks/                   # 自定义 Hooks
└── lib/                     # 工具库
    ├── storage.ts           # LocalStorage 封装
    ├── imageUtils.ts        # 图片压缩工具
    ├── recommendApi.ts      # 推荐 API 客户端
    └── recipes.ts           # 菜谱数据
```

---

## 2. 数据结构定义

### 2.1 食材 (Ingredient)
```typescript
interface Ingredient {
  name: string           // 食材名称
  amount?: string        // 用量（如"2个"、"适量"）
}
```

### 2.2 菜谱 (Recipe)
```typescript
interface Recipe {
  id: string                                    // 唯一标识
  title: string                                // 菜谱名称
  coverImage: string                           // 封面图片URL
  cookingTime: number                           // 烹饪时间（分钟）
  cookingMethod: "炒" | "煮" | "蒸" | "烤" | "炸" | "凉拌" | "其他"
  tags: string[]                               // 标签（如["川菜", "下饭"]）
  mainIngredients: Ingredient[]                 // 主食材列表（决定性食材）
  seasonings: Ingredient[]                     // 调料与辅料列表（常备品）
  steps?: { order: number; description: string }[]  // 烹饪步骤
  tips?: string                                // 小贴士
}
```

### 2.3 推荐结果 (Recommendation)
```typescript
interface Recommendation {
  recipeId: string              // 关联菜谱ID
  title: string                 // 菜谱名称
  coverImage: string            // 封面图片
  cookingMethod: string         // 烹饪方式
  matchingScore: number         // 匹配度（0-1，仅基于主食材）
  availableMainIngredients: string[]   // 已匹配的主食材
  missingMainIngredients: string[]     // 缺少的主食材
  isAllAvailable: boolean       // 主食材是否全部在库
  seasonings: string[]          // 所需调料（展示用）
  cookingTime: number           // 烹饪时间
}
```

### 2.4 用户食材 (UserIngredient)
```typescript
interface UserIngredient {
  id: string        // 唯一标识（时间戳）
  name: string      // 食材名称
  addedAt: number   // 添加时间
}
```

---

## 3. API 设计

### 3.1 视觉识别 API
```
POST /api/vision
Request: { image: string (Base64) }
Response: {
  success: boolean,
  data?: { ingredients: string[] },
  error?: string
}
```

### 3.2 菜谱推荐 API
```
POST /api/recommend
Request: { ingredients: string[] }
Response: {
  success: boolean,
  data?: {
    recommendations: Recommendation[],
    totalCandidates: number
  },
  error?: string
}
```

---

## 4. 推荐排序规则

### 4.1 排序优先级
1. **完全匹配优先**：`isAllAvailable = true` 的菜谱排在前面
2. **匹配度排序**：按 `matchingScore` 降序
3. **缺少量排序**：按 `missingMainIngredients.length` 升序
4. **时间排序**：按 `cookingTime` 升序

### 4.2 匹配度计算公式
```
matchingScore = availableMainIngredients.length / mainIngredients.length
```
- 仅计算主食材，调料不参与
- 返回值保留两位小数

---

## 5. 核心模块设计

### 5.1 图片处理流程
```
用户选择图片
    ↓
压缩至 1024px 长边（JPEG 质量 0.8）
    ↓
转换为 Base64
    ↓
调用 /api/vision
    ↓
AI 返回食材列表
    ↓
去重 + 存入 LocalStorage
```

### 5.2 推荐流程
```
用户进入推荐页
    ↓
读取 LocalStorage 获取用户食材
    ↓
调用 /api/recommend
    ↓
后端计算匹配度并排序
    ↓
返回推荐列表
    ↓
前端渲染
```

---

## 6. 状态管理

### 6.1 Zustand Store
- `useIngredientsStore`：管理用户食材列表

### 6.2 LocalStorage Keys
- `ingredients`：用户食材数组

### 6.3 TanStack Query
- `/api/recommend`：菜谱推荐查询
- 缓存策略：离开推荐页后重新拉取

---

## 7. 组件清单

| 组件 | 路径 | 说明 |
|------|------|------|
| StatusBar | `components/shared/StatusBar` | 顶部状态栏 |
| BottomNav | `components/shared/BottomNav` | 底部导航 |
| ImageUploader | `components/shared/ImageUploader` | 图片上传/拍照 |

---

## 8. 环境变量

| 变量 | 说明 |
|------|------|
| AI_API_KEY | 阿里云 API Key |
| AI_BASE_URL | API 基础URL |
| VISION_MODEL_NAME | 视觉模型名称（qwen-vl-plus） |
| TEXT_MODEL_NAME | 文本模型名称（qwen-plus） |

---

## 9. 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 1.0 | 2026-03-28 | 初始版本，核心推荐功能 |
