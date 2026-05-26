# API Contract

This document is the contract for the future Expo client.

## Repository Layout

- API implementation: `apps/web-api/src/app/api/*`
- Server-only helpers: `apps/web-api/src/lib/server/*`
- Expo client caller: `apps/mobile-app/src/api/client.ts`
- Global documentation: `docs/*`

## Base Rules

- Base path: `/api`
- Content type: `application/json`
- Supported methods:
  - `POST` for business requests
  - `GET` for health or status checks
  - `OPTIONS` for CORS preflight
- Shared response headers:
  - `Access-Control-Allow-Origin`
  - `Access-Control-Allow-Methods: GET, POST, OPTIONS`
  - `Access-Control-Allow-Headers`
  - `Access-Control-Max-Age: 86400`
- CORS allowlist source:
  - `CORS_ALLOWED_ORIGINS` env variable, comma-separated
  - If unset, local/dev Expo origins such as `localhost`, `127.0.0.1`, LAN IPs, `*.expo.app`, `*.exp.direct` are allowed by default
- API route helpers apply CORS headers dynamically. `next.config.ts` only applies generic security headers such as `X-Content-Type-Options`, `Referrer-Policy`, and `X-Frame-Options`.

## Security Rules

- All model provider keys are server-only.
- `AI_API_KEY` is read only inside server route modules and `apps/web-api/src/lib/server/openai.ts`.
- No client-side module should import anything from `apps/web-api/src/lib/server/*`.
- `POST /api/vision`, `POST /api/recommend`, and `POST /api/detail` require `Authorization: Bearer <token>` when API authentication is enabled.
- Production defaults to requiring API auth. Set `API_AUTH_REQUIRED=true` and `API_CLIENT_TOKEN` in `apps/web-api` or Vercel environment variables.
- The Expo client sends the MVP app gate token from `EXPO_PUBLIC_API_AUTH_TOKEN`.
- The current MVP app gate is not final user identity. When anonymous/user login is introduced, replace the static token with provider access tokens while keeping the same `Authorization` header path.
- `SUPABASE_JWT_SECRET`, `SUPABASE_JWT_AUDIENCE`, and `SUPABASE_JWT_ISSUER` are reserved for Supabase Auth JWT validation.
- Provider credentials must never be exposed to mobile or web clients.

## Error Model

Business APIs return JSON errors in this shape:

```json
{
  "success": false,
  "error": "Error message"
}
```

Status endpoints return status metadata and do not use the `success` envelope.

## POST /api/vision

Recognize ingredients from a base64 image.

### Request

```json
{
  "image": "data:image/jpeg;base64,..."
}
```

### Validation

- `image` is required
- `image` must be `data:image/jpeg|jpg|png|webp;base64,...`
- JSON request body is capped at 3 MB
- Decoded image payload is capped at 2 MB

### Success Response

```json
{
  "success": true,
  "data": {
    "ingredients": [
      {
        "name": "tomato",
        "amount": "optional amount"
      }
    ],
    "imageId": "img_1712345678901",
    "message": "Detected 3 ingredients"
  }
}
```

### Error Responses

- `400`

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

```json
{
  "success": false,
  "error": "Missing image data"
}
```

```json
{
  "success": false,
  "error": "Invalid image format"
}
```

- `413`

```json
{
  "success": false,
  "error": "Image is too large"
}
```

- `500`

```json
{
  "success": false,
  "error": "Server AI_API_KEY is not configured"
}
```

```json
{
  "success": false,
  "error": "Empty model response"
}
```

```json
{
  "success": false,
  "error": "Failed to parse JSON response"
}
```

```json
{
  "success": false,
  "error": "Invalid recognition response format"
}
```

## GET /api/vision

### Success Response

```json
{
  "status": "ok",
  "provider": "aliyun-qwen",
  "model": "qwen-vl-plus",
  "configured": true,
  "mode": "real"
}
```

Possible `mode` values:

- `real`
- `not_configured`

## POST /api/recommend

Generate personalized recipe recommendations from the user's fridge and local preference context.

### Request

```json
{
  "ingredients": ["猪肉", "黄瓜", "意大利面"],
  "pinnedIngredients": ["猪肉"],
  "mealPreference": "comfort",
  "userPreferences": {
    "goal": "认真吃好每一顿",
    "tastes": ["无辣不欢", "轻食西餐"],
    "avoidances": ["不吃香菜"],
    "completedOnboarding": true,
    "updatedAt": 1779800000000
  },
  "excludeRecipeTitles": ["黄瓜炒肉片"],
  "pageSize": 10
}
```

### Validation

- `ingredients` is required
- `ingredients` must be a non-empty array
- `ingredients` is capped at 30 unique items
- each ingredient must be a non-empty string up to 30 characters
- `pinnedIngredients` is optional and capped at 30 unique items
- `mealPreference` is optional. Current mobile values are `speed`, `comfort`, `light`, `protein`, `lessOil`
- `userPreferences` is optional and may include `goal`, `tastes`, `avoidances`, and `completedOnboarding`
- `userPreferences.tastes` and `userPreferences.avoidances` are capped at 20 items each
- `excludeRecipeTitles` is optional and used by loading-more requests to reduce duplicate recipes
- `pageSize` is optional and controls the number of requested recommendations
- JSON request body is capped at 32 KB

### Success Response

```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "recipeId": "ai-1712345678901-0",
        "title": "黄瓜炒肉片",
        "emoji": "🥒🥩",
        "cookingMethod": "炒",
        "matchingScore": 1,
        "availableMainIngredients": ["猪肉", "黄瓜"],
        "missingMainIngredients": [],
        "isAllAvailable": true,
        "seasonings": ["生抽", "盐"],
        "cookingTime": 15,
        "strategy": "A"
      }
    ],
    "totalCandidates": 8
  }
}
```

### Recommendation Rules

- Matching score is calculated from `mainIngredients` only. Seasonings do not affect matching.
- Sort order: matching score desc, contains pinned ingredient first, strategy `A > B > C`, fewer missing main ingredients, shorter cooking time.
- Strategy meaning:
  - `A`: pinned ingredients + meal preference + long-term preferences
  - `B`: pinned ingredients + meal preference
  - `C`: based on current fridge ingredients with more exploratory variation
- Pinned ingredients are the user's explicit current intent and may exceed the "same main ingredient appears at most twice" diversity rule.
- Generic meat can match normal cut forms, such as pork with sliced pork or minced pork. It must not match strict parts, such as ribs, liver, wings, claws, beef brisket, or steak.
- Recipe titles must be consistent with the returned main ingredient array. If a title names a main ingredient, the `mainIngredients` list must include it.
- Seasoning-like items, such as tomato sauce, soy sauce, cooking wine, oyster sauce, starch, oil, salt, sugar, vinegar, pepper powder, chili powder, bean paste, ginger, garlic, water, and stock, belong in `seasonings`.
- Multi-select taste preferences should be covered across the recommendation list. They may also be reasonably combined, such as spicy Western-style dishes, when the result still follows real cooking logic and uses available ingredients.

### Error Responses

- `400`

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

```json
{
  "success": false,
  "error": "Missing ingredients array"
}
```

- `404`

```json
{
  "success": false,
  "error": "No matching recipes found"
}
```

- `500`

```json
{
  "success": false,
  "error": "Server AI_API_KEY is not configured"
}
```

```json
{
  "success": false,
  "error": "Failed to parse AI response"
}
```

```json
{
  "success": false,
  "error": "Internal server error"
}
```

## GET /api/recommend

### Success Response

```json
{
  "status": "ok",
  "mode": "ai-json",
  "description": "AI recipe recommendations in JSON format"
}
```

Possible `mode` values:

- `ai-json`
- `no-api-key`

## POST /api/detail

Generate detailed cooking steps for a selected recipe.

### Request

```json
{
  "recipeName": "Tomato Egg Stir Fry",
  "mainIngredients": ["tomato", "egg"],
  "availableIngredients": ["tomato", "egg", "salt"]
}
```

### Validation

- `recipeName` is required
- `recipeName` must be up to 60 characters
- `mainIngredients` must be a non-empty array
- `availableIngredients` must be an array
- ingredient arrays are capped at 30 unique items
- each ingredient must be a non-empty string up to 30 characters
- JSON request body is capped at 32 KB

### Success Response

```json
{
  "success": true,
  "steps": [
    {
      "order": 1,
      "description": "Heat the pan and add oil."
    },
    {
      "order": 2,
      "description": "Cook the eggs until just set and remove."
    }
  ],
  "tips": "Add the eggs back at the end to keep them tender.",
  "fullText": "1. Heat the pan and add oil.\n2. Cook the eggs until just set and remove.\n### Tips: Add the eggs back at the end to keep them tender."
}
```

### Error Responses

- `400`

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

```json
{
  "success": false,
  "error": "Missing recipeName"
}
```

- `503`

```json
{
  "success": false,
  "error": "Server AI_API_KEY is not configured"
}
```

- `500`

```json
{
  "success": false,
  "error": "Internal server error"
}
```

## GET /api/detail

### Success Response

```json
{
  "status": "ok",
  "mode": "ai",
  "description": "AI-generated cooking steps"
}
```

Possible `mode` values:

- `ai`
- `local`

## Client Call Sites

`apps/web-api` is now a headless API package. The old web frontend call sites were removed.

Expo mobile client call sites:

- `apps/mobile-app/src/api/client.ts` -> shared API client for `/api/vision`, `/api/recommend`, `/api/detail`
- `apps/mobile-app/hooks/use-vision-picker.ts` -> image picker, JPEG compression, and `/api/vision` request

Mobile API base URL resolution:

1. `EXPO_PUBLIC_API_BASE_URL` when explicitly configured
2. Development LAN fallback: `http://<Expo host IP>:3000`
3. Production fallback: `https://cooking-ideas.vercel.app`

Mobile API auth token:

- `EXPO_PUBLIC_API_AUTH_TOKEN` must match the backend `API_CLIENT_TOKEN` while the MVP app gate is enabled.
- This token is intentionally an app-level gate, not a user account token.

For Expo Go device testing, start the backend with:

```bash
npm run dev -- -H 0.0.0.0 -p 3000
```
