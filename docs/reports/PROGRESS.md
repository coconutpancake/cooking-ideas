# 做饭灵感 App - 开发进度追踪

## 项目概述
- **项目名称**: 做饭灵感
- **技术栈**: Next.js (App Router) + Tailwind CSS + TypeScript + shadcn/ui + Zustand + TanStack Query + Firebase
- **目标平台**: iOS (Mobile Web)

---

## 开发步骤 (To-Do List)

### Phase 1: 项目初始化与基础架构
- [x] 1.1 初始化 Next.js 项目 (App Router)
- [x] 1.2 配置 Tailwind CSS
- [x] 1.3 配置 TypeScript
- [x] 1.4 配置 shadcn/ui 组件库 (依赖已安装)
- [x] 1.5 配置 Firebase (Auth, Firestore, Storage)
- [x] 1.6 配置 Zustand 状态管理
- [x] 1.7 配置 TanStack Query 数据获取
- [x] 1.8 配置 Framer Motion 动画库
- [x] 1.9 配置 Lucide React 图标库
- [x] 1.10 配置 ESLint 和 Prettier

### Phase 2: 通用组件开发
- [x] 2.1 底部导航栏组件 (BottomNav)
- [x] 2.2 顶部状态栏组件 (StatusBar)
- [x] 2.3 图片上传组件 (ImageUploader)
- [x] 2.4 菜谱卡片组件 (RecipeCard)
- [x] 2.5 分类筛选组件 (CategoryFilter)
- [x] 2.6 搜索栏组件 (SearchBar)
- [x] 2.7 加载状态组件 (LoadingSpinner)
- [x] 2.8 空状态组件 (EmptyState)
- [x] 2.9 骨架屏组件 (Skeleton)

### Phase 3: 页面开发
- [x] 3.1 首页 - 灵感Feed流 (HomePage)
- [x] 3.2 推荐列表页 (RecommendPage)
- [x] 3.3 收藏页 (FavoritesPage)
- [x] 3.4 菜谱详情页 (RecipeDetailPage)
- [ ] 3.5 用户反馈页 (FeedbackPage)
- [x] 3.6 "我的"页面 (ProfilePage)

### Phase 4: 核心功能开发
- [x] 4.1 图片上传/拍照功能
- [x] 4.2 图片压缩与 Base64 转换
- [x] 4.3 LocalStorage 食材持久化
- [x] 4.4 首页冰箱实时读取 localStorage
- [x] 4.5 食材删除功能

### Phase 5: AI 视觉模型集成（阿里云通义千问）
- [x] 5.1 API Route `/api/vision`
- [x] 5.2 阿里云通义千问 (qwen-vl-plus)
- [x] 5.3 OpenAI SDK 兼容模式
- [x] 5.4 彻底移除静默兜底，假数据不再传到前端
- [x] 5.5 请求超时处理（30秒）
- [x] 5.6 错误处理与友好提示
- [x] 5.7 Prompt 优化（解决 AI 幻觉）
- [x] 5.8 数据去重逻辑
- [x] 5.9 temperature: 0.1 降温参数
- [x] 5.10 System Role 严格约束
- [x] 5.11 图片压缩质量提升（1024px）
- [x] 5.12 终端日志追踪（发送参数 + Raw Response）

### Phase 6: 菜谱推荐功能
- [x] 6.1 API Route `/api/recommend`
- [x] 6.2 预设 20 道家常菜谱数据库
- [x] 6.3 食材匹配算法（支持别名匹配）
- [x] 6.4 匹配度计算
- [x] 6.5 排序规则（完全匹配 > 高匹配度 > 少缺食材 > 快手）
- [x] 6.6 AI 辅助筛选（可选，无 API Key 时用本地算法）
- [x] 6.7 推荐列表页接入真实 API
- [x] 6.8 流式详情 API `/api/detail`（AI 流式生成烹饪步骤）
- [x] 6.9 详情页打字机效果（逐字显示步骤）
- [x] 6.10 食材高亮（已有食材高亮，缺少食材置灰）
- [x] 6.11 详情页非流式 API 降级（修复步骤渲染闪烁问题）
- [x] 6.12 useMemo 稳定派生数据（防止重复触发加载）
- [x] 6.13 详情页宽度适配（max-w-md mx-auto 居中显示）
- [x] 6.14 小贴士内容切分与渲染（AI 菜谱显示 AI 生成的小贴士）
- [x] 6.15 Emoji + 渐变色替代真实菜品图片（莫兰迪色系）
- [x] 6.16 推荐列表缓存机制（localStorage + 食材哈希验证）

### Phase 7: Firebase 后端集成
- [ ] 7.1 Firebase Auth 认证流程
- [ ] 7.2 Firestore 数据模型设计
- [ ] 7.3 菜品 CRUD 接口
- [ ] 7.4 收藏功能接口
- [ ] 7.5 反馈提交接口

### Phase 8: 状态管理与数据流
- [x] 8.1 全局状态层设计 (Zustand stores)
- [x] 8.2 数据获取层配置 (TanStack Query)
- [x] 8.3 离线缓存策略 (LocalStorage)
- [x] 8.4 useIngredients Hook

### Phase 9: 动画与交互优化
- [ ] 9.1 页面切换动画
- [ ] 9.2 列表加载动画
- [ ] 9.3 交互反馈动画
- [ ] 9.4 下拉刷新/上拉加载动画

### Phase 10: 测试与优化
- [ ] 10.1 响应式布局测试
- [ ] 10.2 性能优化 (Core Web Vitals)
- [ ] 10.3 SEO 优化
- [ ] 10.4 PWA 配置 (可选)

---

## 当前状态

### 项目进度
- [x] Phase 1-4, 6, 8 完成
- [x] Phase 5 AI 视觉模型集成完成
- [x] Phase 6 菜谱推荐功能完成
- [x] Expo 移动端 MVP 适配完成（真机拍照/相册识别通过）
- [ ] Phase 7 Firebase 后端集成未开始
- [ ] Phase 9 动画优化未开始
- [ ] Phase 10 测试优化未开始

### 最新提交
- `本次提交` — 移动端 MVP 联调完成：Expo 客户端接入后端 API、真机图片识别链路通过、本地 API 回退与 CORS 配置完成
- `596721d` — 完成 API 层独立封装与跨域配置
- `017622b` — 清理死代码与冗余逻辑（移除 recipes.ts 527行数据、mockApi.ts console.log、recommend/page.tsx 冗余导入与 filter if-else）
- `0361b2f` — 重构：组件提取与代码结构优化（新建 UploadTrigger.tsx、ingredientClassifier.ts、RecipeDetailComponents.tsx）

### 新增文件
```
src/
├── app/
│   ├── api/
│   │   ├── vision/route.ts         # AI 视觉识别 API
│   │   ├── recommend/route.ts      # 菜谱推荐 API
│   │   └── detail/route.ts         # AI 生成烹饪步骤 API
│   ├── recommend/page.tsx          # 推荐列表页（缓存优先）
│   └── recipe/[id]/page.tsx         # 菜谱详情页
├── components/shared/
│   ├── ImageUploader.tsx            # 拍照/上传组件
│   ├── StatusBar.tsx                # 状态栏组件
│   ├── UploadTrigger.tsx            # 上传触发器（从 page.tsx 提取）⭐
│   └── RecipeDetailComponents.tsx   # 详情页子组件（RecipeHeader/IngredientList/StepList/TipsCard）⭐
├── hooks/
│   └── useIngredients.ts            # 食材状态 Hook
└── lib/
    ├── recommendApi.ts              # 推荐 API 调用
    ├── recipes.ts                   # 菜谱接口定义（无数据）
    ├── imageUtils.ts                # 图片压缩工具
    ├── mockApi.ts                   # 视觉识别 API 调用
    ├── ingredientClassifier.ts      # 食材分类逻辑（从 page.tsx 提取）⭐
    ├── storage.ts                   # LocalStorage 工具（含推荐缓存）
    └── utils.ts                     # 工具函数（含 formatRelativeTime）
```

---

## 推荐算法说明

**输入**: 用户现有食材列表
**输出**: 按匹配度排序的推荐菜谱列表

**匹配度计算（仅基于主食材）**:
- 匹配度 = 已匹配的主食材数 / 菜谱所需主食材总数
- 调料（盐、油、酱油等常备品）不参与匹配度计算
- 主食材100%匹配时视为"食材已备齐"

**排序规则**:
1. 完全匹配优先（主食材不缺）
2. 匹配度高优先
3. 缺少主食材少优先
4. 烹饪时间短优先

**食材匹配**: 支持别名（如"番茄"="西红柿"）

---

## 菜谱数据模型

```typescript
interface Recipe {
  id: string
  title: string
  mainIngredients: { name: string; amount?: string }[]  // 主食材
  seasonings: { name: string; amount?: string }[]      // 调料与辅料
}
```

> 注意：本地菜谱数据已全部移除，推荐列表完全由 `/api/recommend` AI 动态生成。`recipes.ts` 仅保留 TypeScript 接口定义。

---

## 推荐返回格式

```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "recipeId": "1",
        "title": "番茄炒蛋",
        "emoji": "🍳",
        "cookingMethod": "炒",
        "matchingScore": 1.0,
        "availableMainIngredients": ["番茄", "鸡蛋"],
        "missingMainIngredients": [],
        "isAllAvailable": true,
        "seasonings": ["葱", "盐", "油"],
        "cookingTime": 15
      }
    ],
    "totalCandidates": 20
  }
}
```

---

## 核心技术约定

1. **目录结构**: Feature-based 结构 (`/features/[feature]`)
2. **组件规范**: shadcn/ui 基础组件 + 业务组件分离
3. **状态管理**: Zustand (UI状态) + TanStack Query (服务端状态)
4. **样式方案**: Tailwind CSS + CSS 变量系统
5. **移动端优化**: safe-area-pb, 最小点击区域 44px
6. **AI 模型**: 阿里云通义千问 (qwen-vl-plus)，OpenAI SDK 兼容模式
7. **拍照功能**: 手机端点击"拍照更新"同时支持拍照和从相册选择

---

## MVP 版本完成标记

**MVP 版本已完成**（2026-04-25）

### 已完成功能清单
- 首页：拍照/相册上传食材 + localStorage 持久化 + 相对时间显示
- 推荐列表：AI 生成多样化推荐 + 缓存机制（食材变化自动清除）
- 详情页：/api/detail 个性化步骤 + 全量食材高亮 + 无高亮小贴士
- iOS 原生 UI：纯白背景 + 橙色主题 + 圆形序号 + 骨架屏
- 性能优化：推荐列表缓存，避免重复调用大模型节省 Token

### 技术栈
Next.js (App Router) + Tailwind CSS + TypeScript + 阿里云通义千问 + LocalStorage

### 核心 API
- `POST /api/vision` — 图片识别食材
- `POST /api/recommend` — AI 生成多样化菜谱推荐（10道）
- `POST /api/detail` — AI 生成个性化烹饪步骤

---

## 移动端 MVP 完成标记

**Expo 移动端 MVP 已完成**（2026-05-06）

### 已验证链路
- Expo Go 真机可从相册选择图片并压缩为 JPEG Base64
- 移动端可调用 `/api/vision` 识别图片中的食材
- 本地 Next API 可通过局域网 `http://<电脑IP>:3000` 供真机调试
- Vercel API 仍作为生产默认地址
- API 层支持 `EXPO_PUBLIC_API_BASE_URL` 显式覆盖
- `/api/*` 已在 Next 配置层补充 CORS 响应头，覆盖 GET/POST/OPTIONS

### 移动端仓库关键文件
- `src/api/client.ts` — API 客户端，支持本地开发地址、生产地址和网络失败回退
- `hooks/use-vision-picker.ts` — 拍照/相册选择、图片压缩、调用视觉识别 API
- `hooks/use-ingredients.ts` — 食材本地持久化
- `app/index.tsx` — 冰箱首页与识别入口
- `app/recommend.tsx` — 推荐列表页
- `app/recipe/[id].tsx` — 菜谱详情页

### 调试约定
- 后端本地调试命令：`npm run dev -- -H 0.0.0.0 -p 3000`
- 移动端调试命令：`npx expo start`
- 真机调试建议使用 Expo LAN 模式，并保持手机与电脑在同一局域网
- 如需强制指定后端地址，设置 `EXPO_PUBLIC_API_BASE_URL=http://<电脑IP>:3000`

---

## 更新日志

| 日期 | 提交 | 更新内容 |
|------|------|----------|
| 2026-05-06 | 本次提交 | Expo 移动端 MVP 真机联调通过：图片选择、压缩、上传识别食材链路跑通；移动端 API 增加本地局域网回退；后端补充 `/api/*` CORS 响应头；清理本地日志/Expo 缓存提交风险 |
| 2026-04-26 | `017622b` | 清理死代码：移除 recipes.ts 527行本地数据、mockApi.ts console.log、recommend/page.tsx 冗余导入与 filter if-else 改用 FILTER_MAP；修复 detail/route.ts 本地 fallback 引用错误 |
| 2026-04-26 | `0361b2f` | 组件提取重构：新建 UploadTrigger.tsx（从 page.tsx 提取）、ingredientClassifier.ts（食材分类逻辑）、RecipeDetailComponents.tsx（详情页 RecipeHeader/IngredientList/StepList/TipsCard 子组件） |
| 2026-04-25 | — | 新增推荐列表缓存机制：API 结果存入 localStorage，食材变化时自动清除；返回详情页不再重复调用大模型，节省 Token |
| 2026-04-25 | — | Git commit: 完成 MVP 版本 UI 调整，详情页真实数据流接通 |
| 2026-04-25 | — | Git commit: 首页数据流彻底接通，清理冗余 UI |
| 2026-04-25 | — | Git commit: 完成前端 UI 最终打磨与高亮逻辑优化 |
| 2026-04-23 | — | 逻辑稳定版，准备移交局部 UI 修改 |
| 2026-03-28 | — | 重构匹配算法：仅基于主食材计算匹配度，调料不参与计算 |
| 2026-03-28 | — | 菜谱详情页：主食材和调料分为两栏独立展示 |
| 2026-03-28 | — | 新增流式详情 API `/api/detail`，AI 流式生成烹饪步骤 |
| 2026-03-28 | — | 详情页打字机效果逐步显示步骤 |
| 2026-03-28 | — | 详情页食材高亮：已有食材高亮，缺少食材置灰 |
| 2026-03-31 | — | 修复详情页步骤渲染闪烁：非流式 API + useMemo 稳定数据 + hasFetchedRef 防重入 |
| 2026-03-31 | — | 详情页宽度适配：添加 max-w-md mx-auto，移动端优先视觉体验 |
| 2026-03-31 | — | 小贴士功能：后端 Prompt 要求 AI 输出小贴士，正则提取后返回前端渲染 |
| 2026-03-31 | — | Emoji + 莫兰迪渐变色替代真实菜品图片：移除所有 `<img>` 标签，列表卡和详情页均使用 Emoji 配图 |
| 2026-04-23 | — | 逻辑稳定版，准备移交局部 UI 修改 |

---

## 技术债清理报告（2026-04-26）

### Batch 1：死代码与冗余逻辑清理（提交 `017622b`）
- **A** `src/lib/recipes.ts` — 移除 527 行本地菜谱数据，仅保留 TypeScript 接口定义
- **B** `src/lib/mockApi.ts` — 移除所有 console.log 语句 + 废弃的 `mockIdentifyIngredients` 函数
- **C** `src/app/recommend/page.tsx` — 移除 `type Recommendation` 冗余导入、2 处 `console.log` 调用
- **G** `src/app/recommend/page.tsx` — 简化 filter if-else 为 `FILTER_MAP` 常量对象
- **连带修复** `detail/route.ts` — 移除已失效的本地 fallback（`getRecipeByTitle`/`getRecipeById` 不再存在），无 API Key 时直接返回 503
- **连带修复** `recommend/route.ts` — 补上 `emoji` 字段缺失

### Batch 2：组件提取与代码结构优化（提交 `0361b2f`）
- **D** `src/components/shared/UploadTrigger.tsx` — 从 `page.tsx` 提取上传触发器组件（forwardRef + useImperativeHandle 模式）
- **E** `src/lib/ingredientClassifier.ts` — 从 `page.tsx` 提取 `classifyIngredient` 食材分类函数 + `CATEGORIES` 配置
- **F** `src/components/shared/RecipeDetailComponents.tsx` — 详情页 JSX 拆分为 `RecipeHeader`、`IngredientList`、`StepList`、`TipsCard` 四个独立组件
- **合并** `page.tsx` — 移除 UploadTrigger 内联代码 + `classifyIngredient` 内联函数，统一使用导入的新组件/模块
- **清理** `detail/page.tsx` — 移除未使用的 `isAIRecipe` 变量，重试逻辑简化为 `window.location.reload()`

### 架构决策记录

| 日期 | 决策 | 理由 |
|------|------|------|
| 2026-04-26 | 本地菜谱数据完全移除，API 无 fallback | `detail/route.ts` 的本地 fallback 引用已不存在的函数；推荐系统已完全由 AI 生成，本地数据不再需要 |
| 2026-03-28 | 主辅料分离：匹配度仅基于 mainIngredients 计算 | 调料为常备品，每家都有，若参与计算会导致匹配度失真。分离后推荐更符合实际烹饪场景 |
| 2026-04-25 | 推荐列表缓存机制 | 防止从详情页返回时重复调用大模型 API，节省 Token 成本。缓存有效性由食材哈希值判定 |
