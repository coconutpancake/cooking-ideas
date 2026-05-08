# Cooking Ideas API

Headless Next.js API for the Cooking Ideas mobile app.

The user-facing frontend has moved to `apps/mobile-app`. This package only keeps the API routes and a minimal health page.

## API

Base: `/api`

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/vision` | Recognize ingredients from a base64 image |
| `GET` | `/api/vision` | Vision service status |
| `POST` | `/api/recommend` | Generate recipe recommendations from ingredients |
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

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```
