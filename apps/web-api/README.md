# 做饭灵感（Cooking Ideas）

一个移动端优先的家常菜推荐应用：用户上传食材图片，AI 识别后给出菜谱推荐，并支持查看菜谱详情与步骤提示。

## 快速了解

- 前端：Next.js（App Router）+ React + TypeScript + Tailwind CSS
- 状态管理：Zustand（本地 UI 状态）+ TanStack Query（服务端请求状态）
- AI 能力：`/api/vision`（食材识别）、`/api/recommend`（菜谱推荐）、`/api/detail`（步骤生成）
- 数据持久化：LocalStorage（当前），Firebase（预留集成）

## 本地运行

```bash
npm install
npm run dev
```

访问 `http://localhost:3000`。

## API 列表

Base: `/api`

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/vision` | 识别食材（base64 图片） |
| `GET` | `/api/vision` | 识别服务状态（provider / model / mode） |
| `POST` | `/api/recommend` | 根据食材推荐菜谱 |
| `GET` | `/api/recommend` | 推荐服务状态 |
| `POST` | `/api/detail` | 生成菜谱步骤与详情 |
| `GET` | `/api/detail` | 详情服务状态 |

> 完整请求/响应格式见 `docs/specs/API_DOCS.md`

## 主要页面

- `/`：首页（食材管理 / 图片上传识别）
- `/recommend`：推荐列表页
- `/recipe/[id]`：菜谱详情页
- `/settings`：设置页

## 项目结构树

```text
.
├── README.md                         # 项目总览与快速上手说明
├── docs/                             # 项目文档
├── src/
│   ├── app/
│   │   ├── page.tsx                 # 首页：食材管理与上传入口
│   │   ├── recommend/page.tsx       # 推荐列表页：展示可做菜谱
│   │   ├── recipe/[id]/page.tsx     # 菜谱详情页：步骤与小贴士
│   │   ├── settings/page.tsx        # 设置页
│   │   ├── layout.tsx               # 全局布局
│   │   ├── globals.css              # 全局样式
│   │   ├── api/
│   │   │   ├── vision/route.ts      # 识别图片食材（AI视觉）
│   │   │   ├── recommend/route.ts   # 按食材生成菜谱推荐
│   │   │   └── detail/route.ts      # 生成/补全菜谱步骤与详情
│   ├── components/shared/           # 共享 UI 组件（上传、状态栏、详情子组件）
│   ├── hooks/
│   │   └── useIngredients.ts        # 食材读取/更新逻辑封装
│   ├── lib/                         # 业务工具与客户端能力封装
│   │   ├── imageUtils.ts            # 图片压缩与转换
│   │   ├── recommendApi.ts          # 推荐接口调用封装
│   │   ├── storage.ts               # LocalStorage 读写与缓存
│   │   ├── ingredientClassifier.ts  # 食材分类与整理逻辑
│   │   └── utils.ts                 # 通用工具函数
│   ├── stores/                      # Zustand 状态仓库
│   │   ├── appStore.ts              # 全局应用状态
│   │   ├── favoritesStore.ts        # 收藏相关状态
│   │   └── userStore.ts             # 用户相关状态
│   └── types/
│       └── index.ts                 # 全局类型定义
├── package.json                      # 依赖与 npm scripts
├── tsconfig.json                     # TypeScript 配置
└── eslint.config.mjs                 # ESLint 规则配置
```

## 文档索引

- `docs/specs/prdV1.0.md`：产品需求文档（PRD）
- `docs/specs/sddV1.0.md`：软件设计文档（SDD）
- `docs/reports/PROGRESS.md`：开发进度与里程碑

## 开发脚本

```bash
npm run dev
npm run build
npm run start
npm run lint
```
