import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appDir = path.resolve(__dirname, "..")

function loadDotEnv(fileName) {
  const envPath = path.join(appDir, fileName)
  if (!fs.existsSync(envPath)) {
    return
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue
    }

    const [key, ...rest] = trimmed.split("=")
    if (!process.env[key]) {
      process.env[key] = rest.join("=").replace(/^["']|["']$/g, "")
    }
  }
}

loadDotEnv(".env.local")

const baseUrl = (process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "")
const authToken = process.env.SMOKE_API_TOKEN || process.env.API_CLIENT_TOKEN
const visionImagePath = process.env.VISION_TEST_IMAGE
const visionExpectedIngredient = process.env.VISION_EXPECTED_INGREDIENT
const requestTimeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 45000)

function withTimeout() {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs)
  return { controller, timeout }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function getJson(name, route) {
  const startedAt = Date.now()
  const { controller, timeout } = withTimeout()

  try {
    const response = await fetch(`${baseUrl}${route}`, { signal: controller.signal })
    const data = await response.json()
    assert(response.ok, `${name} returned HTTP ${response.status}: ${JSON.stringify(data)}`)
    return { data, elapsedMs: Date.now() - startedAt }
  } finally {
    clearTimeout(timeout)
  }
}

async function postJson(name, route, body) {
  const startedAt = Date.now()
  const { controller, timeout } = withTimeout()
  const headers = { "Content-Type": "application/json" }

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }

  try {
    const response = await fetch(`${baseUrl}${route}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const data = await response.json()
    assert(response.ok, `${name} returned HTTP ${response.status}: ${JSON.stringify(data)}`)
    assert(data.success !== false, `${name} returned success=false: ${JSON.stringify(data)}`)
    return { data, elapsedMs: Date.now() - startedAt }
  } finally {
    clearTimeout(timeout)
  }
}

function printResult(name, elapsedMs, summary) {
  console.log(`PASS ${name} ${elapsedMs}ms ${summary}`)
}

async function testHealth() {
  for (const route of ["/api/vision", "/api/recommend", "/api/detail"]) {
    const { data, elapsedMs } = await getJson(`GET ${route}`, route)
    assert(data.status === "ok", `${route} health check did not return ok`)
    printResult(`GET ${route}`, elapsedMs, data.mode || data.provider || "ok")
  }
}

async function testRecommendations() {
  const cases = [
    {
      name: "recommend small pinned",
      body: {
        ingredients: ["鸡蛋", "番茄", "胡萝卜", "洋葱"],
        pinnedIngredients: ["鸡蛋"],
        mealPreference: "speed",
        userPreferences: { goal: "日常均衡", tastes: ["家常"], avoidances: [] },
        excludeRecipeTitles: [],
        pageSize: 4,
      },
    },
    {
      name: "recommend no preference",
      body: {
        ingredients: ["鸡蛋", "番茄", "胡萝卜", "洋葱"],
        pinnedIngredients: [],
        mealPreference: null,
        userPreferences: null,
        excludeRecipeTitles: [],
        pageSize: 6,
      },
    },
    {
      name: "recommend rich fridge",
      body: {
        ingredients: ["鸡蛋", "番茄", "胡萝卜", "洋葱", "猪肉", "土豆", "青椒"],
        pinnedIngredients: [],
        mealPreference: null,
        userPreferences: null,
        excludeRecipeTitles: [],
        pageSize: 8,
      },
    },
  ]

  for (const item of cases) {
    const { data, elapsedMs } = await postJson(item.name, "/api/recommend", item.body)
    const recommendations = data.data?.recommendations || []
    assert(recommendations.length > 0, `${item.name} returned no recommendations`)
    assert(
      recommendations.every(
        (recipe) =>
          recipe.title &&
          Array.isArray(recipe.availableMainIngredients) &&
          Array.isArray(recipe.missingMainIngredients) &&
          typeof recipe.matchingScore === "number"
      ),
      `${item.name} returned malformed recipes`
    )
    printResult(item.name, elapsedMs, `${recommendations.length} recipes`)
  }
}

async function testDetail() {
  const { data, elapsedMs } = await postJson("detail tomato egg", "/api/detail", {
    recipeName: "番茄炒蛋",
    mainIngredients: ["番茄", "鸡蛋"],
    seasonings: ["盐", "糖", "葱花"],
    availableIngredients: ["番茄", "鸡蛋"],
  })

  assert(Array.isArray(data.steps) && data.steps.length >= 3, "detail returned too few steps")
  assert(Array.isArray(data.mainIngredients) && data.mainIngredients.length >= 2, "detail returned too few ingredient amounts")
  printResult("detail tomato egg", elapsedMs, `${data.steps.length} steps`)
}

async function testVision() {
  if (!visionImagePath) {
    console.log("SKIP vision image recognition set VISION_TEST_IMAGE to enable")
    return
  }

  assert(fs.existsSync(visionImagePath), `VISION_TEST_IMAGE does not exist: ${visionImagePath}`)
  const ext = path.extname(visionImagePath).toLowerCase()
  const mimeType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg"
  const image = `data:${mimeType};base64,${fs.readFileSync(visionImagePath).toString("base64")}`
  const { data, elapsedMs } = await postJson("vision image recognition", "/api/vision", { image })
  const ingredients = data.data?.ingredients || []

  assert(ingredients.length > 0, "vision returned no ingredients")
  if (visionExpectedIngredient) {
    assert(
      ingredients.some((item) => item.name?.includes(visionExpectedIngredient)),
      `vision did not include expected ingredient: ${visionExpectedIngredient}`
    )
  }
  printResult("vision image recognition", elapsedMs, ingredients.map((item) => item.name).join(","))
}

try {
  console.log(`Smoke testing ${baseUrl}`)
  await testHealth()
  await testRecommendations()
  await testDetail()
  await testVision()
  console.log("Smoke tests completed")
} catch (error) {
  console.error(`FAIL ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
