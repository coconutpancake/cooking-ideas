export interface Recipe {
  id: string
  title: string
  coverImage: string
  ingredients: Ingredient[]
  steps: Step[]
  cookingTime: number // in minutes
  cookingMethod: "炒" | "煮" | "蒸" | "烤" | "炸" | "凉拌" | "其他"
  tags: string[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Ingredient {
  name: string
  amount: string
}

export interface Step {
  order: number
  description: string
  image?: string
}

export interface User {
  id: string
  email?: string
  displayName?: string
  photoURL?: string
  createdAt: Date
}

export interface Feedback {
  id: string
  userId: string
  type: "bug" | "feature" | "other"
  content: string
  contact?: string
  status: "pending" | "reviewed" | "resolved"
  createdAt: Date
}

export type TabType = "home" | "search" | "favorites" | "profile"
