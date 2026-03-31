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
- [x] 2.3 图片上传组件 (ImageUploader) ⭐
- [ ] 2.4 菜谱卡片组件 (RecipeCard)
- [ ] 2.5 分类筛选组件 (CategoryFilter)
- [ ] 2.6 搜索栏组件 (SearchBar)
- [ ] 2.7 加载状态组件 (LoadingSpinner)
- [ ] 2.8 空状态组件 (EmptyState)
- [ ] 2.9 骨架屏组件 (Skeleton)

### Phase 3: 页面开发
- [x] 3.1 首页 - 灵感Feed流 (HomePage) ✅
- [x] 3.2 推荐列表页 (RecommendPage) ✅
- [x] 3.3 收藏页 (FavoritesPage) ✅
- [x] 3.4 菜谱详情页 (RecipeDetailPage) ✅
- [ ] 3.5 用户反馈页 (FeedbackPage)
- [x] 3.6 "我的"页面 (ProfilePage) ✅

### Phase 4: 核心功能开发 ⭐
- [x] 4.1 图片上传/拍照功能 ✅
- [x] 4.2 图片压缩与 Base64 转换 ✅
- [x] 4.3 LocalStorage 食材持久化 ✅
- [x] 4.4 首页冰箱实时读取 localStorage ✅
- [x] 4.5 食材删除功能 ✅

### Phase 5: AI 视觉模型集成 ⭐ (阿里云通义千问)
- [x] 5.1 API Route `/api/vision` ✅
- [x] 5.2 阿里云通义千问 (qwen-vl-plus) ✅
- [x] 5.3 OpenAI SDK 兼容模式 ✅
- [x] 5.4 彻底移除静默兜底，假数据不再传到前端 ✅
- [x] 5.5 请求超时处理（30秒） ✅
- [x] 5.6 错误处理与友好提示 ✅
- [x] 5.7 Prompt 优化（解决 AI 幻觉） ✅
- [x] 5.8 数据去重逻辑 ✅
- [x] 5.9 temperature: 0.1 降温参数 ✅
- [x] 5.10 System Role 严格约束 ✅
- [x] 5.11 图片压缩质量提升（1024px） ✅
- [x] 5.12 终端日志追踪（发送参数 + Raw Response） ✅

### Phase 6: 菜谱推荐功能 ⭐新增
- [x] 6.1 API Route `/api/recommend` ✅
- [x] 6.2 预设 20 道家常菜谱数据库 ✅
- [x] 6.3 食材匹配算法（支持别名匹配） ✅
- [x] 6.4 匹配度计算 ✅
- [x] 6.5 排序规则（完全匹配 > 高匹配度 > 少缺食材 > 快手） ✅
- [x] 6.6 AI 辅助筛选（可选，无 API Key 时用本地算法） ✅
- [x] 6.7 推荐列表页接入真实 API ✅
- [x] 6.8 流式详情 API `/api/detail`（AI 流式生成烹饪步骤） ✅ ⭐
- [x] 6.9 详情页打字机效果（逐字显示步骤） ✅
- [x] 6.10 食材高亮（已有食材高亮，缺少食材置灰） ✅
- [x] 6.11 详情页非流式 API 降级（修复步骤渲染闪烁问题） ✅
- [x] 6.12 useMemo 稳定派生数据（防止重复触发加载） ✅
- [x] 6.13 详情页宽度适配（max-w-md mx-auto 居中显示） ✅
- [x] 6.14 小贴士内容切分与渲染（AI 菜谱显示 AI 生成的小贴士） ✅ ⭐

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
- [x] 8.4 useIngredients Hook ✅

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
- [x] Phase 5 AI 视觉模型集成完成 ⭐
- [x] Phase 6 菜谱推荐功能完成 ⭐
- [x] Phase 6.8-6.14 流式详情功能完成 ⭐

### 新增文件
```
src/
├── app/
│   ├── api/
│   │   ├── vision/route.ts    # AI 视觉识别 API
│   │   ├── recommend/route.ts # 菜谱推荐 API
│   │   └── detail/route.ts    # 流式详情 API（AI 生成步骤）⭐
│   ├── recommend/page.tsx    # 推荐列表页（携带食材参数跳转）
│   └── recipe/[id]/page.tsx  # 菜谱详情页（流式步骤+高亮）⭐
├── components/shared/
│   └── ImageUploader.tsx       # 拍照/上传组件
├── hooks/
│   └── useIngredients.ts       # 食材状态 Hook
└── lib/
    ├── recommendApi.ts        # 推荐 API 调用
    ├── recipes.ts            # 菜谱数据（含完整步骤和小贴士）
    ├── imageUtils.ts           # 图片压缩工具
    ├── mockApi.ts              # 视觉识别 API 调用
    └── storage.ts             # LocalStorage 工具
```

### 推荐算法说明

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

### 菜谱数据模型
```typescript
interface Recipe {
  id: string
  title: string
  mainIngredients: { name: string; amount?: string }[]  // 主食材
  seasonings: { name: string; amount?: string }[]        // 调料与辅料
}
```

### 推荐返回格式
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "recipeId": "1",
        "title": "番茄炒蛋",
        "coverImage": "https://...",
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

### 核心技术约定
1. **目录结构**: Feature-based 结构 (`/features/[feature]`)
2. **组件规范**: shadcn/ui 基础组件 + 业务组件分离
3. **状态管理**: Zustand (UI状态) + TanStack Query (服务端状态)
4. **样式方案**: Tailwind CSS + CSS 变量系统
5. **移动端优化**: safe-area-pb, 最小点击区域 44px
6. **AI 模型**: 阿里云通义千问 (qwen-vl-plus)，OpenAI SDK 兼容模式

### 遇到的问题
- 无

### 核心架构决策
| 日期 | 决策内容 | 理由 |
|------|----------|------|
| 2026-03-28 | 主辅料分离：匹配度仅基于 mainIngredients 计算，调料（油盐酱醋等）不参与匹配 | 调料为常备品，每家都有，若参与计算会导致匹配度失真。分离后推荐更符合实际烹饪场景。 |

---

## 更新日志
| 日期 | 更新内容 |
|------|----------|
| 2026-03-27 | 项目初始化，创建 PROGRESS.md |
| 2026-03-28 | 完成 Phase 1 基础架构搭建，Phase 5 状态管理配置 |
| 2026-03-28 | npm install 完成，依赖安装成功 |
| 2026-03-28 | 完成 3 个核心页面开发：首页/推荐列表/菜谱详情 |
| 2026-03-28 | Git commit: 完成静态UI |
| 2026-03-28 | 完成核心功能：拍照上传/Base64/Mock API/localStorage |
| 2026-03-28 | Git commit: 完成拍照和本地存储 |
| 2026-03-28 | 完成 AI 视觉模型集成 (GPT-4 Vision/Claude Vision) |
| 2026-03-28 | 切换为阿里云通义千问，OpenAI SDK 兼容模式 |
| 2026-03-28 | 优化 Prompt（解决 AI 幻觉），添加数据去重逻辑 |
| 2026-03-28 | 降温 temperature: 0.1 + System Role + 图片质量提升到 1024px |
| 2026-03-28 | 移除静默兜底，API 错误必须报错；添加终端日志追踪 |
| 2026-03-28 | Git commit: 完成视觉大模型接入 |
| 2026-03-28 | 完成菜谱推荐功能：API + 匹配算法 + 真实数据渲染 |
| 2026-03-28 | 重构匹配算法：仅基于主食材计算匹配度，调料不参与计算 |
| 2026-03-28 | 菜谱详情页：主食材和调料分为两栏独立展示 |
| 2026-03-28 | 新增流式详情 API `/api/detail`，AI 流式生成烹饪步骤 |
| 2026-03-28 | 详情页打字机效果逐步显示步骤 |
| 2026-03-28 | 详情页食材高亮：已有食材高亮，缺少食材置灰 |
| 2026-03-31 | 修复详情页步骤渲染闪烁：非流式 API + useMemo 稳定数据 + hasFetchedRef 防重入 |
| 2026-03-31 | 详情页宽度适配：添加 max-w-md mx-auto，移动端优先视觉体验 |
| 2026-03-31 | 小贴士功能：后端 Prompt 要求 AI 输出小贴士，正则提取后返回前端渲染 |
