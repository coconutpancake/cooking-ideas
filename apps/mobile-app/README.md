# 小锅灵感移动端

做饭灵感的 Expo 移动端。当前 V2.0 版本在 MVP 基础上升级为三 Tab 架构：`冰箱`、`灵感`、`我`。核心能力包括真机拍照/相册识别食材、冰箱食材本地保存、标星必选食材、本餐偏好、专属口味档案、AI 菜谱推荐、推荐加载更多、菜谱详情与步骤高亮。

## Get started

1. 安装依赖

   ```powershell
   npm install
   ```

2. 启动后端 API

   在 `cooking_ideas` 目录启动 Next API，并监听局域网地址：

   ```powershell
   npm run dev -- -H 0.0.0.0 -p 3000
   ```

3. 启动移动端

   ```powershell
   npx expo start
   ```

4. 用 Expo Go 真机测试

   手机和电脑需要在同一局域网。开发环境下 API 客户端会优先尝试 `http://<Expo 主机 IP>:3000`，失败后再回退到 `https://cooking-ideas.vercel.app`。

## API 地址配置

默认解析顺序：

1. `EXPO_PUBLIC_API_BASE_URL`
2. 开发环境局域网地址：`http://<Expo 主机 IP>:3000`
3. 生产地址：`https://cooking-ideas.vercel.app`

如需手动指定本地后端：

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://<电脑IP>:3000"
npx expo start
```

## 核心文件

- `app/index.tsx`：启动路由，根据本地偏好完成状态进入 Onboarding 或 Tabs
- `app/onboarding.tsx`：首次偏好收集
- `app/(tabs)/index.tsx`：冰箱页、拍照/相册入口、识别结果写入、食材编辑、标星、本餐偏好、生成 CTA
- `app/(tabs)/inspiration.tsx`：灵感页、推荐列表、分类筛选、搜索、刷新、加载更多
- `app/(tabs)/profile.tsx`：我的页、本地头像昵称、专属口味档案、隐私/协议入口
- `app/recipe/[id].tsx`：菜谱详情页
- `components/preference-editor.tsx`：偏好编辑器，Onboarding 和我的页共用
- `hooks/use-vision-picker.ts`：图片选择、压缩、调用 `/api/vision`
- `hooks/use-ingredients.ts`：食材本地持久化
- `hooks/use-preferences.ts`：本地资料、长期偏好、本餐偏好读写
- `hooks/use-recommendations.ts`：推荐上下文构建、缓存、刷新、加载更多
- `lib/storage.ts`：AsyncStorage 数据层
- `lib/types.ts`：核心类型、默认标签、本餐偏好选项
- `lib/recipe-ingredients.ts`：详情页主食材/调料归类与用量估算
- `src/api/client.ts`：后端 API 客户端

## V2.0 本地数据

- 食材：本地保存，支持分类、删除、标星。
- 用户偏好：饮食目标、口味偏好、忌口与禁忌、Onboarding 完成状态。
- 本地资料：昵称、头像 URI，仅用于本机展示，不关联真实账号。
- 匿名设备 ID：本地生成，随 API Header 发送，用于后续限流和追踪扩展。
- 推荐缓存：按食材、标星、本餐偏好、长期偏好生成上下文 Hash；偏好保存后清缓存并触发灵感页自动刷新。

## 默认偏好标签

- 饮食目标：认真吃好每一顿、轻盈减脂、清淡养生、高蛋白增肌。
- 口味偏好：清淡鲜美、经典下饭、咸甜交织、无辣不欢、酸甜开胃、轻食西餐。
- 忌口与禁忌：不吃香菜、不吃葱。

偏好编辑器只展示当前默认标签和用户手动添加的自定义标签。已废弃的旧默认标签不会继续作为可选项展示。

## 验证状态

- 2026-05-06：Expo Go 真机图片上传与食材识别链路测试通过。
- 2026-05-26：V2.0 三 Tab、Onboarding、冰箱标星、本餐偏好、推荐上下文、我的页本地资料与偏好编辑、轻量 Toast、偏好保存后自动刷新推荐均完成并通过浏览器验证。
- `npm run lint` 通过。
- `npx tsc --noEmit` 通过。
