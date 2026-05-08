# 做饭灵感移动端

做饭灵感的 Expo 移动端 MVP。当前版本已完成真机拍照/相册选择、图片压缩、食材识别、冰箱食材本地保存、菜谱推荐和详情页浏览。

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

- `app/index.tsx`：冰箱首页、拍照/相册入口、识别结果写入
- `app/recommend.tsx`：菜谱推荐列表
- `app/recipe/[id].tsx`：菜谱详情页
- `hooks/use-vision-picker.ts`：图片选择、压缩、调用 `/api/vision`
- `hooks/use-ingredients.ts`：食材本地持久化
- `src/api/client.ts`：后端 API 客户端

## 验证状态

- 2026-05-06：Expo Go 真机图片上传与食材识别链路测试通过。
- `npm run lint` 通过。
- `npx tsc --noEmit` 通过。
