# 小锅灵感 App - 软件设计文档 (SDD V2.0)

## 1. 技术架构

### 1.0 当前实现说明

本文档最初面向 V1.0 MVP，现已作为 V2.0 的持续更新版 SDD。V2.0 已在 Expo 移动端升级为三 Tab 架构，并新增本地偏好、标星食材、推荐上下文、我的页本地资料等能力。V2.0 的最新实施摘要见 `docs/specs/prdV2.0-implementation-summary.md`。

### 1.1 技术栈
- **仓库架构**：Monorepo 单体大仓库
- **Web/API 框架**：Next.js 14+ (App Router)
- **移动端框架**：Expo React Native
- **样式**：Tailwind CSS + shadcn/ui
- **类型**：TypeScript
- **状态管理**：Zustand (UI状态) + TanStack Query (服务端状态)
- **动画**：Framer Motion
- **图标**：Lucide React
- **AI集成**：OpenAI SDK (兼容小米 MiMo / OpenAI-compatible API)

### 1.2 项目结构
```
cooking_ideas/
├── apps/
│   ├── web-api/                    # Next.js 后端/API 与 Web 端
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── api/
│   │   │   │   │   ├── vision/     # AI 视觉识别 API
│   │   │   │   │   ├── recommend/  # 菜谱推荐 API
│   │   │   │   │   └── detail/     # AI 烹饪步骤 API
│   │   │   │   ├── recommend/      # 推荐列表页
│   │   │   │   ├── recipe/[id]/    # 菜谱详情页
│   │   │   │   └── page.tsx        # 首页/冰箱
│   │   │   ├── components/         # Web 组件
│   │   │   ├── hooks/              # Web Hooks
│   │   │   └── lib/                # Web/API 工具库
│   │   └── package.json
│   └── mobile-app/                 # Expo 移动端
│       ├── app/                    # Expo Router 页面
│       ├── components/             # 移动端组件
│       ├── hooks/                  # 移动端 Hooks
│       ├── src/api/client.ts       # 移动端 API 客户端
│       └── package.json
└── docs/                           # 全局项目文档
    ├── reports/
    └── specs/
```

### 1.3 Monorepo 约定
- 仓库根目录为 `cooking_ideas`，保留原后端项目 `.git` 历史。
- 后端/API 与 Web 端代码统一位于 `apps/web-api`。
- Expo 移动端代码统一位于 `apps/mobile-app`，该目录不保留独立 `.git`。
- 全局进度、接口、PRD、SDD 等文档统一维护在根目录 `docs`。
- 各应用依然保留独立 `package.json` 和锁文件，命令在对应应用目录内执行。

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
Request: {
  ingredients: string[],
  pinnedIngredients?: string[],
  mealPreference?: "speed" | "comfort" | "light" | "protein" | "lessOil" | null,
  userPreferences?: {
    goal: string,
    tastes: string[],
    avoidances: string[],
    completedOnboarding: boolean,
    updatedAt: number
  } | null,
  excludeRecipeTitles?: string[],
  pageSize?: number
}
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
1. **匹配度排序**：按 `matchingScore` 降序
2. **标星食材优先**：同匹配度下，包含标星食材的推荐排在前面
3. **策略排序**：同匹配度和标星状态下，按 `A > B > C` 排序
4. **缺少量排序**：按 `missingMainIngredients.length` 升序
5. **时间排序**：按 `cookingTime` 升序

### 4.2 匹配度计算公式
```
matchingScore = availableMainIngredients.length / mainIngredients.length
```
- 仅计算主食材，调料不参与
- 返回值保留两位小数
- 标星食材代表用户本次明确意图，不直接改变匹配度公式，但会影响同分排序

### 4.3 主食材和调料边界

- 主食材：肉、蛋、豆制品、蔬菜、主食等决定菜品主体的食材。
- 调料与辅料：油、盐、糖、醋、生抽、老抽、料酒、蚝油、淀粉、胡椒粉、辣椒粉、豆瓣酱、番茄酱、黄豆酱、甜面酱、葱姜蒜、清水、高汤等。
- 番茄酱不是番茄，不能进入主食材，也不能按“半个”估量。
- 通用肉类可以匹配常规切配形态，但不能匹配特殊部位，例如猪肉不等于排骨/猪肝，牛肉不等于牛排/牛腩，鸡肉不等于鸡翅/鸡爪。

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
| AI_BASE_URL | API 基础URL，默认 `https://api.xiaomimimo.com/v1` |
| VISION_MODEL_NAME | 视觉模型名称（默认 `mimo-v2.5`） |
| TEXT_MODEL_NAME | 文本推荐模型名称（默认 `mimo-v2.5`） |
| DETAIL_MODEL_NAME | 菜谱详情模型名称（默认 `mimo-v2.5`） |

---

## 9. 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 1.0 | 2026-03-28 | 初始版本，核心推荐功能 |
