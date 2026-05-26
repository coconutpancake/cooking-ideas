# Cooking Ideas API

Headless Next.js API for the Cooking Ideas mobile app.

The user-facing frontend has moved to `apps/mobile-app`. This package only keeps the API routes and a minimal health page.

## API

Base: `/api`

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/vision` | Recognize ingredients from a base64 image |
| `GET` | `/api/vision` | Vision service status |
| `POST` | `/api/recommend` | Generate personalized recipe recommendations from ingredients, pinned ingredients, meal preference, and local user preferences |
| `GET` | `/api/recommend` | Recommendation service status |
| `POST` | `/api/detail` | Generate recipe steps and tips |
| `GET` | `/api/detail` | Detail service status |

`POST` routes require `Authorization: Bearer <token>` in production. For the MVP app gate, set `API_CLIENT_TOKEN` on the API and `EXPO_PUBLIC_API_AUTH_TOKEN` in the Expo app. When full user auth is introduced, set `SUPABASE_JWT_SECRET` and send user access tokens through the same header.

## Structure

```text
src/
  app/
    api/
      vision/route.ts
      recommend/route.ts
      detail/route.ts
    favicon.ico
    layout.tsx
    page.tsx
  lib/
    server/
      http.ts
      openai.ts
```

## Recommendation V2 Rules

`POST /api/recommend` accepts the full recommendation context from the Expo app:

- all fridge ingredients
- pinned ingredients
- meal preference
- local user preferences
- previously displayed recipe titles
- page size

The service asks the text model for structured JSON and then applies deterministic post-processing:

- matching score is calculated only from main ingredients
- pinned ingredients are prioritized after matching score
- same score sorts by strategy A > B > C, fewer missing ingredients, then shorter cooking time
- generic meat does not match strict parts such as ribs, liver, wings, or steak
- title ingredients are reconciled with the main ingredient array
- seasoning-like items such as tomato sauce, soy sauce, cooking wine, starch, oil, salt, sugar, vinegar, and pepper powder are forced into seasonings
- multi-select taste preferences should be covered across the list and may be reasonably combined when the dish still follows real cooking logic

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```
