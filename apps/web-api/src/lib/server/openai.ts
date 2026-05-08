import "server-only"

import OpenAI from "openai"

const DEFAULT_AI_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"

export function getRequiredEnv(name: "AI_API_KEY"): string
export function getRequiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`)
  }

  return value
}

export function createServerOpenAIClient(): OpenAI {
  return new OpenAI({
    apiKey: getRequiredEnv("AI_API_KEY"),
    baseURL: process.env.AI_BASE_URL || DEFAULT_AI_BASE_URL,
    dangerouslyAllowBrowser: false,
  })
}

export function getAIBaseURL(): string {
  return process.env.AI_BASE_URL || DEFAULT_AI_BASE_URL
}
