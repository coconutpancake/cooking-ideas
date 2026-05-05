# API Contract

This document is the contract for the future Expo client.

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
- Next config also applies API-wide CORS headers for `/api/:path*`, so Vercel-generated `OPTIONS` responses and browser/Expo Web debugging receive the same cross-origin contract.

## Security Rules

- All model provider keys are server-only.
- `AI_API_KEY` is read only inside server route modules and `src/lib/server/openai.ts`.
- No client-side module should import anything from `src/lib/server/*`.
- Current frontend request helpers call relative paths only and do not attach provider credentials.

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
- `image` must start with `data:image/`

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
  "error": "Missing image data"
}
```

```json
{
  "success": false,
  "error": "Invalid image format"
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

Generate recipe recommendations from user ingredients.

### Request

```json
{
  "ingredients": ["tomato", "egg", "tofu"]
}
```

### Validation

- `ingredients` is required
- `ingredients` must be a non-empty array

### Success Response

```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "recipeId": "ai-1712345678901-0",
        "title": "Tomato Egg Stir Fry",
        "emoji": "*",
        "cookingMethod": "stir-fry",
        "matchingScore": 1,
        "availableMainIngredients": ["tomato", "egg"],
        "missingMainIngredients": [],
        "isAllAvailable": true,
        "seasonings": ["salt"],
        "cookingTime": 15
      }
    ],
    "totalCandidates": 8
  }
}
```

### Error Responses

- `400`

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
- `mainIngredients` should be an array
- `availableIngredients` should be an array

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

Current web frontend still uses the same endpoints:

- `src/lib/mockApi.ts` -> `POST /api/vision`
- `src/lib/recommendApi.ts` -> `POST /api/recommend`
- `src/app/recipe/[id]/page.tsx` -> `POST /api/detail`

Expo mobile client call sites:

- `cooking_ideas_mobile/src/api/client.ts` -> shared API client for `/api/vision`, `/api/recommend`, `/api/detail`
- `cooking_ideas_mobile/hooks/use-vision-picker.ts` -> image picker, JPEG compression, and `/api/vision` request

Mobile API base URL resolution:

1. `EXPO_PUBLIC_API_BASE_URL` when explicitly configured
2. Development LAN fallback: `http://<Expo host IP>:3000`
3. Production fallback: `https://cooking-ideas.vercel.app`

For Expo Go device testing, start the backend with:

```bash
npm run dev -- -H 0.0.0.0 -p 3000
```
