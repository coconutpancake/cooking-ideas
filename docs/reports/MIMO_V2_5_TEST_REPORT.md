# MiMo v2.5 接入测试记录

日期：2026-05-28

## 配置

- API base URL: `https://api.xiaomimimo.com/v1`
- 文本推荐模型：`mimo-v2.5`
- 图片识别模型：`mimo-v2.5`
- 菜谱详情模型：`mimo-v2.5`
- SDK：OpenAI-compatible chat completions

## 关键兼容调整

- MiMo 推荐接口需要更强的 JSON 输出约束，否则容易返回 Markdown 或解释文字。
- 模型请求增加 `response_format: { type: "json_object" }`。
- 模型请求增加 `thinking: disabled` 扩展参数，减少思考内容干扰和响应时间。
- 推荐响应格式改为 `{"recipes":[...]}`，现有解析器已支持该结构。

## 本地 API 测试结果

测试环境：`http://127.0.0.1:3000`，本地 `.env.local` 使用 MiMo 配置。

| 功能 | 场景 | MiMo 耗时 | 结果 |
| --- | --- | ---: | --- |
| 推荐 | 4 条，含标星鸡蛋 | 4.3-6.6s | 成功 |
| 推荐 | 6 条，无偏好 | 5.9-9.6s | 成功 |
| 推荐 | 8 条，多食材 | 4.6-7.8s | 成功 |
| 推荐 | 10 条，App 首屏规模 | 9.9s | 成功 |
| 详情 | 番茄炒蛋 | 4.3-6.3s | 成功，4-5 步 |
| 图片识别 | 测试图 1 | 2.0-2.5s | 玉米、苹果、西兰花 |
| 图片识别 | 测试图 2 | 1.4s | 鸡蛋、大葱、胡萝卜 |
| 图片识别 | 测试图 3 | 2.3s | 西兰花、绿叶蔬菜、玉米、甜瓜、苹果、卷心菜、洋葱 |
| 图片识别 | 测试图 4 | 1.9s | 橘子 |
| 图片识别 | 微信图 1 | 2.5s | 大蒜 |
| 图片识别 | 微信图 2 | 1.4s | 白洋葱 |

## 与 Qwen 基准对比

此前 Qwen 生产测试记录：

| 功能 | Qwen 耗时 | MiMo 耗时 | 变化 |
| --- | ---: | ---: | --- |
| 推荐 4 条 | 4.4-6.9s | 4.3-6.6s | 接近 |
| 推荐 6 条 | 6.0-7.4s | 5.9-9.6s | 接近，略波动 |
| 推荐 8 条 | 8.5-9.4s | 4.6-7.8s | MiMo 更快 |
| 推荐 10 条 | 11.1-14.6s | 9.9s | MiMo 更快 |
| 详情 | 2.6-5.6s | 4.3-6.3s | MiMo 略慢 |
| 图片识别 6 张 | 2.9-12.2s | 1.4-2.5s | MiMo 明显更快 |

## 结论

MiMo v2.5 可以同时覆盖图片识别、推荐列表和菜谱详情三条核心链路。图片识别速度显著优于此前 Qwen 测试；推荐整体可用且 10 条首屏请求未超过 30 秒；详情可用但速度略慢于 Qwen-turbo。

上线前需要确认 Vercel Production 环境变量已切换：

```env
AI_API_KEY=<MiMo server key>
AI_BASE_URL=https://api.xiaomimimo.com/v1
VISION_MODEL_NAME=mimo-v2.5
TEXT_MODEL_NAME=mimo-v2.5
DETAIL_MODEL_NAME=mimo-v2.5
```
