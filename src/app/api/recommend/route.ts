import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// ============================================
// 类型定义
// ============================================

interface Ingredient {
  name: string
  amount?: string
}

interface Recipe {
  id: string
  title: string
  coverImage: string
  cookingTime: number
  cookingMethod: "炒" | "煮" | "蒸" | "烤" | "炸" | "凉拌" | "其他"
  tags: string[]
  mainIngredients: Ingredient[]   // 主食材（决定性食材）
  seasonings: Ingredient[]       // 调料与辅料（常备品）
}

interface Recommendation {
  recipeId: string
  title: string
  coverImage: string
  cookingMethod: string
  matchingScore: number
  availableMainIngredients: string[]   // 已匹配的主食材
  missingMainIngredients: string[]      // 缺少的主食材
  isAllAvailable: boolean               // 主食材是否全部备齐
  seasonings: string[]                  // 需要的调料（展示用）
  cookingTime: number
}

interface RecommendResponse {
  success: boolean
  data?: {
    recommendations: Recommendation[]
    totalCandidates: number
  }
  error?: string
}

// ============================================
// 预设菜谱数据库（包含常见家常菜）
// ============================================

const RECIPE_DATABASE: Recipe[] = [
  {
    id: "1",
    title: "番茄炒蛋",
    coverImage: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
    cookingTime: 15,
    cookingMethod: "炒",
    tags: ["家常菜", "快手"],
    mainIngredients: [
      { name: "番茄", amount: "2个" },
      { name: "鸡蛋", amount: "3个" },
    ],
    seasonings: [
      { name: "葱", amount: "适量" },
      { name: "盐", amount: "少许" },
      { name: "油", amount: "适量" },
    ],
  },
  {
    id: "2",
    title: "蒜蓉青菜",
    coverImage: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop",
    cookingTime: 10,
    cookingMethod: "炒",
    tags: ["素菜", "健康"],
    mainIngredients: [
      { name: "青菜", amount: "300g" },
    ],
    seasonings: [
      { name: "蒜", amount: "3瓣" },
      { name: "盐", amount: "适量" },
      { name: "油", amount: "适量" },
    ],
  },
  {
    id: "3",
    title: "麻婆豆腐",
    coverImage: "https://images.unsplash.com/photo-1582452932307-f63b7acc463e?w=400&h=300&fit=crop",
    cookingTime: 20,
    cookingMethod: "炒",
    tags: ["川菜", "下饭"],
    mainIngredients: [
      { name: "豆腐", amount: "1块" },
      { name: "肉末", amount: "100g" },
    ],
    seasonings: [
      { name: "豆瓣酱", amount: "1勺" },
      { name: "花椒", amount: "适量" },
      { name: "葱", amount: "适量" },
      { name: "姜", amount: "适量" },
      { name: "蒜", amount: "适量" },
    ],
  },
  {
    id: "4",
    title: "蛋炒饭",
    coverImage: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop",
    cookingTime: 10,
    cookingMethod: "炒",
    tags: ["主食", "快手"],
    mainIngredients: [
      { name: "米饭", amount: "1碗" },
      { name: "鸡蛋", amount: "2个" },
    ],
    seasonings: [
      { name: "葱", amount: "适量" },
      { name: "盐", amount: "适量" },
      { name: "油", amount: "适量" },
    ],
  },
  {
    id: "5",
    title: "红烧肉",
    coverImage: "https://images.unsplash.com/photo-1623653387945-2fd25214f8fc?w=400&h=300&fit=crop",
    cookingTime: 60,
    cookingMethod: "煮",
    tags: ["硬菜", "下饭"],
    mainIngredients: [
      { name: "五花肉", amount: "500g" },
    ],
    seasonings: [
      { name: "冰糖", amount: "30g" },
      { name: "生抽", amount: "2勺" },
      { name: "老抽", amount: "1勺" },
      { name: "八角", amount: "2个" },
      { name: "桂皮", amount: "1小块" },
      { name: "葱", amount: "适量" },
      { name: "姜", amount: "适量" },
    ],
  },
  {
    id: "6",
    title: "可乐鸡翅",
    coverImage: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=300&fit=crop",
    cookingTime: 30,
    cookingMethod: "煮",
    tags: ["肉类", "下饭"],
    mainIngredients: [
      { name: "鸡翅", amount: "8个" },
    ],
    seasonings: [
      { name: "可乐", amount: "1罐" },
      { name: "生抽", amount: "2勺" },
      { name: "姜", amount: "适量" },
    ],
  },
  {
    id: "7",
    title: "酸辣土豆丝",
    coverImage: "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=400&h=300&fit=crop",
    cookingTime: 15,
    cookingMethod: "炒",
    tags: ["川菜", "下饭"],
    mainIngredients: [
      { name: "土豆", amount: "2个" },
    ],
    seasonings: [
      { name: "干辣椒", amount: "5个" },
      { name: "醋", amount: "2勺" },
      { name: "盐", amount: "适量" },
      { name: "葱", amount: "适量" },
      { name: "蒜", amount: "适量" },
    ],
  },
  {
    id: "8",
    title: "宫保鸡丁",
    coverImage: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400&h=300&fit=crop",
    cookingTime: 25,
    cookingMethod: "炒",
    tags: ["川菜", "下饭"],
    mainIngredients: [
      { name: "鸡胸肉", amount: "200g" },
      { name: "花生", amount: "50g" },
    ],
    seasonings: [
      { name: "干辣椒", amount: "10个" },
      { name: "花椒", amount: "适量" },
      { name: "葱", amount: "适量" },
      { name: "姜", amount: "适量" },
      { name: "蒜", amount: "适量" },
    ],
  },
  {
    id: "9",
    title: "清蒸鲈鱼",
    coverImage: "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=400&h=300&fit=crop",
    cookingTime: 20,
    cookingMethod: "蒸",
    tags: ["海鲜", "清淡"],
    mainIngredients: [
      { name: "鲈鱼", amount: "1条" },
    ],
    seasonings: [
      { name: "葱", amount: "适量" },
      { name: "姜", amount: "适量" },
      { name: "蒸鱼豉油", amount: "2勺" },
    ],
  },
  {
    id: "10",
    title: "蒜蓉生蚝",
    coverImage: "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=400&h=300&fit=crop",
    cookingTime: 15,
    cookingMethod: "蒸",
    tags: ["海鲜"],
    mainIngredients: [
      { name: "生蚝", amount: "6个" },
    ],
    seasonings: [
      { name: "蒜", amount: "2头" },
      { name: "葱", amount: "适量" },
      { name: "盐", amount: "适量" },
      { name: "油", amount: "适量" },
    ],
  },
  {
    id: "11",
    title: "青椒肉丝",
    coverImage: "https://images.unsplash.com/photo-1595743825637-cdafc8ad4173?w=400&h=300&fit=crop",
    cookingTime: 20,
    cookingMethod: "炒",
    tags: ["家常菜", "下饭"],
    mainIngredients: [
      { name: "青椒", amount: "3个" },
      { name: "猪肉", amount: "200g" },
    ],
    seasonings: [
      { name: "盐", amount: "适量" },
      { name: "生抽", amount: "1勺" },
      { name: "淀粉", amount: "适量" },
    ],
  },
  {
    id: "12",
    title: "番茄蛋汤",
    coverImage: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop",
    cookingTime: 15,
    cookingMethod: "煮",
    tags: ["汤类", "家常菜"],
    mainIngredients: [
      { name: "番茄", amount: "2个" },
      { name: "鸡蛋", amount: "2个" },
    ],
    seasonings: [
      { name: "葱", amount: "适量" },
      { name: "盐", amount: "适量" },
      { name: "水", amount: "适量" },
    ],
  },
  {
    id: "13",
    title: "凉拌黄瓜",
    coverImage: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop",
    cookingTime: 10,
    cookingMethod: "凉拌",
    tags: ["凉菜", "清爽"],
    mainIngredients: [
      { name: "黄瓜", amount: "2根" },
    ],
    seasonings: [
      { name: "蒜", amount: "3瓣" },
      { name: "醋", amount: "2勺" },
      { name: "盐", amount: "适量" },
      { name: "香油", amount: "少许" },
    ],
  },
  {
    id: "14",
    title: "地三鲜",
    coverImage: "https://images.unsplash.com/photo-1601311830595-4f8e2b4a8a62?w=400&h=300&fit=crop",
    cookingTime: 25,
    cookingMethod: "炒",
    tags: ["素菜", "东北菜"],
    mainIngredients: [
      { name: "土豆", amount: "1个" },
      { name: "茄子", amount: "1个" },
      { name: "青椒", amount: "2个" },
    ],
    seasonings: [
      { name: "盐", amount: "适量" },
      { name: "生抽", amount: "1勺" },
      { name: "油", amount: "适量" },
    ],
  },
  {
    id: "15",
    title: "干煸四季豆",
    coverImage: "https://images.unsplash.com/photo-1557844352-761f2565b576?w=400&h=300&fit=crop",
    cookingTime: 20,
    cookingMethod: "炒",
    tags: ["川菜", "下饭"],
    mainIngredients: [
      { name: "四季豆", amount: "300g" },
      { name: "肉末", amount: "100g" },
    ],
    seasonings: [
      { name: "干辣椒", amount: "5个" },
      { name: "花椒", amount: "适量" },
      { name: "盐", amount: "适量" },
      { name: "蒜", amount: "适量" },
    ],
  },
  {
    id: "16",
    title: "红烧茄子",
    coverImage: "https://images.unsplash.com/photo-1536304929831-ee1b51bd5bec?w=400&h=300&fit=crop",
    cookingTime: 20,
    cookingMethod: "煮",
    tags: ["家常菜", "下饭"],
    mainIngredients: [
      { name: "茄子", amount: "2个" },
      { name: "肉末", amount: "100g" },
    ],
    seasonings: [
      { name: "豆瓣酱", amount: "1勺" },
      { name: "葱", amount: "适量" },
      { name: "姜", amount: "适量" },
      { name: "蒜", amount: "适量" },
    ],
  },
  {
    id: "17",
    title: "糖醋里脊",
    coverImage: "https://images.unsplash.com/photo-1562967914-608f82629710?w=400&h=300&fit=crop",
    cookingTime: 30,
    cookingMethod: "炸",
    tags: ["鲁菜", "酸甜"],
    mainIngredients: [
      { name: "里脊肉", amount: "300g" },
    ],
    seasonings: [
      { name: "番茄酱", amount: "3勺" },
      { name: "糖", amount: "2勺" },
      { name: "醋", amount: "2勺" },
      { name: "淀粉", amount: "适量" },
      { name: "鸡蛋", amount: "1个" },
    ],
  },
  {
    id: "18",
    title: "鱼香肉丝",
    coverImage: "https://images.unsplash.com/photo-1592303637753-ce1e5b5c42c2?w=400&h=300&fit=crop",
    cookingTime: 25,
    cookingMethod: "炒",
    tags: ["川菜", "下饭"],
    mainIngredients: [
      { name: "猪肉", amount: "200g" },
      { name: "木耳", amount: "50g" },
      { name: "胡萝卜", amount: "1根" },
      { name: "青椒", amount: "1个" },
    ],
    seasonings: [
      { name: "豆瓣酱", amount: "1勺" },
      { name: "醋", amount: "1勺" },
      { name: "糖", amount: "1勺" },
    ],
  },
  {
    id: "19",
    title: "水煮牛肉",
    coverImage: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&h=300&fit=crop",
    cookingTime: 30,
    cookingMethod: "煮",
    tags: ["川菜", "辣"],
    mainIngredients: [
      { name: "牛肉", amount: "300g" },
      { name: "豆芽", amount: "200g" },
    ],
    seasonings: [
      { name: "干辣椒", amount: "10个" },
      { name: "花椒", amount: "适量" },
      { name: "豆瓣酱", amount: "2勺" },
      { name: "葱", amount: "适量" },
      { name: "姜", amount: "适量" },
      { name: "蒜", amount: "适量" },
    ],
  },
  {
    id: "20",
    title: "蒜蓉西兰花",
    coverImage: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=300&fit=crop",
    cookingTime: 10,
    cookingMethod: "炒",
    tags: ["素菜", "健康"],
    mainIngredients: [
      { name: "西兰花", amount: "1颗" },
    ],
    seasonings: [
      { name: "蒜", amount: "5瓣" },
      { name: "盐", amount: "适量" },
      { name: "油", amount: "适量" },
    ],
  },
  {
    id: "21",
    title: "红烧牛肋条",
    coverImage: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&h=300&fit=crop",
    cookingTime: 60,
    cookingMethod: "煮",
    tags: ["硬菜", "肉类"],
    mainIngredients: [
      { name: "牛肋条", amount: "500g" },
    ],
    seasonings: [
      { name: "冰糖", amount: "30g" },
      { name: "生抽", amount: "2勺" },
      { name: "老抽", amount: "1勺" },
      { name: "八角", amount: "2个" },
      { name: "桂皮", amount: "1小块" },
      { name: "葱", amount: "适量" },
      { name: "姜", amount: "适量" },
    ],
  },
  {
    id: "22",
    title: "酱香牛肋条",
    coverImage: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop",
    cookingTime: 90,
    cookingMethod: "煮",
    tags: ["硬菜", "肉类"],
    mainIngredients: [
      { name: "牛肋条", amount: "500g" },
    ],
    seasonings: [
      { name: "黄酱", amount: "2勺" },
      { name: "甜面酱", amount: "1勺" },
      { name: "冰糖", amount: "20g" },
      { name: "生抽", amount: "2勺" },
      { name: "老抽", amount: "1勺" },
      { name: "葱", amount: "适量" },
      { name: "姜", amount: "适量" },
    ],
  },
  {
    id: "23",
    title: "黑椒牛肋条",
    coverImage: "https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=300&fit=crop",
    cookingTime: 30,
    cookingMethod: "炒",
    tags: ["硬菜", "肉类", "快手"],
    mainIngredients: [
      { name: "牛肋条", amount: "300g" },
      { name: "洋葱", amount: "1个" },
    ],
    seasonings: [
      { name: "黑胡椒", amount: "适量" },
      { name: "生抽", amount: "2勺" },
      { name: "蚝油", amount: "1勺" },
      { name: "糖", amount: "少许" },
    ],
  },
  {
    id: "24",
    title: "牛肋条炖土豆",
    coverImage: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop",
    cookingTime: 90,
    cookingMethod: "煮",
    tags: ["硬菜", "肉类", "下饭"],
    mainIngredients: [
      { name: "牛肋条", amount: "400g" },
      { name: "土豆", amount: "2个" },
    ],
    seasonings: [
      { name: "生抽", amount: "2勺" },
      { name: "老抽", amount: "1勺" },
      { name: "冰糖", amount: "15g" },
      { name: "八角", amount: "2个" },
      { name: "葱", amount: "适量" },
      { name: "姜", amount: "适量" },
    ],
  },
  {
    id: "25",
    title: "红烧牛腩",
    coverImage: "https://images.unsplash.com/photo-1603073163308-9654c3fb1b84?w=400&h=300&fit=crop",
    cookingTime: 90,
    cookingMethod: "煮",
    tags: ["硬菜", "肉类"],
    mainIngredients: [
      { name: "牛腩", amount: "500g" },
    ],
    seasonings: [
      { name: "冰糖", amount: "30g" },
      { name: "生抽", amount: "2勺" },
      { name: "老抽", amount: "1勺" },
      { name: "八角", amount: "2个" },
      { name: "桂皮", amount: "1小块" },
      { name: "葱", amount: "适量" },
      { name: "姜", amount: "适量" },
    ],
  },
  {
    id: "26",
    title: "咖喱牛腩",
    coverImage: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&h=300&fit=crop",
    cookingTime: 90,
    cookingMethod: "煮",
    tags: ["硬菜", "肉类", "咖喱"],
    mainIngredients: [
      { name: "牛腩", amount: "400g" },
      { name: "土豆", amount: "2个" },
      { name: "胡萝卜", amount: "1根" },
    ],
    seasonings: [
      { name: "咖喱块", amount: "2块" },
      { name: "椰浆", amount: "100ml" },
      { name: "洋葱", amount: "半个" },
    ],
  },
  {
    id: "27",
    title: "糖醋排骨",
    coverImage: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop",
    cookingTime: 40,
    cookingMethod: "煮",
    tags: ["硬菜", "肉类", "酸甜"],
    mainIngredients: [
      { name: "排骨", amount: "500g" },
    ],
    seasonings: [
      { name: "糖", amount: "3勺" },
      { name: "醋", amount: "3勺" },
      { name: "生抽", amount: "2勺" },
      { name: "料酒", amount: "1勺" },
      { name: "姜", amount: "适量" },
    ],
  },
  {
    id: "28",
    title: "红烧排骨",
    coverImage: "https://images.unsplash.com/photo-1623689046286-6776e8b9e526?w=400&h=300&fit=crop",
    cookingTime: 60,
    cookingMethod: "煮",
    tags: ["硬菜", "肉类", "下饭"],
    mainIngredients: [
      { name: "排骨", amount: "500g" },
    ],
    seasonings: [
      { name: "冰糖", amount: "30g" },
      { name: "生抽", amount: "2勺" },
      { name: "老抽", amount: "1勺" },
      { name: "八角", amount: "2个" },
      { name: "桂皮", amount: "1小块" },
      { name: "葱", amount: "适量" },
      { name: "姜", amount: "适量" },
    ],
  },
  {
    id: "29",
    title: "油焖大虾",
    coverImage: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=400&h=300&fit=crop",
    cookingTime: 20,
    cookingMethod: "煮",
    tags: ["海鲜", "硬菜"],
    mainIngredients: [
      { name: "大虾", amount: "300g" },
    ],
    seasonings: [
      { name: "生抽", amount: "2勺" },
      { name: "料酒", amount: "1勺" },
      { name: "糖", amount: "1勺" },
      { name: "葱", amount: "适量" },
      { name: "姜", amount: "适量" },
      { name: "蒜", amount: "适量" },
    ],
  },
  {
    id: "30",
    title: "蒜蓉虾",
    coverImage: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd45?w=400&h=300&fit=crop",
    cookingTime: 15,
    cookingMethod: "蒸",
    tags: ["海鲜", "快手"],
    mainIngredients: [
      { name: "大虾", amount: "300g" },
    ],
    seasonings: [
      { name: "蒜", amount: "2头" },
      { name: "料酒", amount: "1勺" },
      { name: "盐", amount: "适量" },
      { name: "葱", amount: "适量" },
    ],
  },
  {
    id: "31",
    title: "避风塘蟹",
    coverImage: "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=400&h=300&fit=crop",
    cookingTime: 30,
    cookingMethod: "炒",
    tags: ["海鲜", "硬菜"],
    mainIngredients: [
      { name: "蟹", amount: "1只" },
    ],
    seasonings: [
      { name: "蒜蓉", amount: "3勺" },
      { name: "面包糠", amount: "适量" },
      { name: "干辣椒", amount: "5个" },
      { name: "盐", amount: "适量" },
      { name: "葱", amount: "适量" },
    ],
  },
  {
    id: "32",
    title: "葱姜蟹",
    coverImage: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=300&fit=crop",
    cookingTime: 20,
    cookingMethod: "炒",
    tags: ["海鲜"],
    mainIngredients: [
      { name: "蟹", amount: "1只" },
    ],
    seasonings: [
      { name: "葱", amount: "3根" },
      { name: "姜", amount: "适量" },
      { name: "料酒", amount: "1勺" },
      { name: "生抽", amount: "1勺" },
      { name: "盐", amount: "适量" },
    ],
  },
  {
    id: "33",
    title: "红烧羊肉",
    coverImage: "https://images.unsplash.com/photo-1584450241882-3a7f8f8b0b7a?w=400&h=300&fit=crop",
    cookingTime: 60,
    cookingMethod: "煮",
    tags: ["肉类", "冬季进补"],
    mainIngredients: [
      { name: "羊肉", amount: "500g" },
    ],
    seasonings: [
      { name: "冰糖", amount: "20g" },
      { name: "生抽", amount: "2勺" },
      { name: "老抽", amount: "1勺" },
      { name: "八角", amount: "2个" },
      { name: "桂皮", amount: "1小块" },
      { name: "葱", amount: "适量" },
      { name: "姜", amount: "适量" },
    ],
  },
  {
    id: "34",
    title: "孜然羊肉",
    coverImage: "https://images.unsplash.com/photo-1603360946369-dc9bb6258142?w=400&h=300&fit=crop",
    cookingTime: 20,
    cookingMethod: "炒",
    tags: ["肉类", "川菜", "下饭"],
    mainIngredients: [
      { name: "羊肉", amount: "300g" },
    ],
    seasonings: [
      { name: "孜然", amount: "2勺" },
      { name: "干辣椒", amount: "10个" },
      { name: "花椒", amount: "适量" },
      { name: "盐", amount: "适量" },
      { name: "葱", amount: "适量" },
    ],
  },
  {
    id: "35",
    title: "可乐鸡翅",
    coverImage: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=300&fit=crop",
    cookingTime: 30,
    cookingMethod: "煮",
    tags: ["肉类", "快手", "小孩最爱"],
    mainIngredients: [
      { name: "鸡翅", amount: "8个" },
    ],
    seasonings: [
      { name: "可乐", amount: "1罐" },
      { name: "生抽", amount: "2勺" },
      { name: "老抽", amount: "少许" },
      { name: "姜", amount: "适量" },
    ],
  },
  {
    id: "36",
    title: "烤鸡翅",
    coverImage: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&h=300&fit=crop",
    cookingTime: 40,
    cookingMethod: "烤",
    tags: ["肉类", "烤箱菜"],
    mainIngredients: [
      { name: "鸡翅", amount: "8个" },
    ],
    seasonings: [
      { name: "蜂蜜", amount: "2勺" },
      { name: "生抽", amount: "2勺" },
      { name: "蚝油", amount: "1勺" },
      { name: "蒜", amount: "2瓣" },
      { name: "黑胡椒", amount: "适量" },
    ],
  },
  {
    id: "37",
    title: "辣子鸡",
    coverImage: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=300&fit=crop",
    cookingTime: 30,
    cookingMethod: "炒",
    tags: ["川菜", "肉类", "下饭"],
    mainIngredients: [
      { name: "鸡翅", amount: "6个" },
    ],
    seasonings: [
      { name: "干辣椒", amount: "30g" },
      { name: "花椒", amount: "10g" },
      { name: "生抽", amount: "1勺" },
      { name: "盐", amount: "适量" },
      { name: "葱", amount: "适量" },
      { name: "姜", amount: "适量" },
    ],
  },
  {
    id: "38",
    title: "蒜香排骨",
    coverImage: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop",
    cookingTime: 45,
    cookingMethod: "煮",
    tags: ["肉类", "下饭"],
    mainIngredients: [
      { name: "排骨", amount: "400g" },
    ],
    seasonings: [
      { name: "蒜", amount: "2头" },
      { name: "生抽", amount: "2勺" },
      { name: "老抽", amount: "1勺" },
      { name: "蚝油", amount: "1勺" },
      { name: "糖", amount: "少许" },
    ],
  },
  {
    id: "39",
    title: "虾仁炒蛋",
    coverImage: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&h=300&fit=crop",
    cookingTime: 15,
    cookingMethod: "炒",
    tags: ["海鲜", "快手", "家常菜"],
    mainIngredients: [
      { name: "虾仁", amount: "150g" },
      { name: "鸡蛋", amount: "3个" },
    ],
    seasonings: [
      { name: "葱", amount: "适量" },
      { name: "盐", amount: "适量" },
      { name: "料酒", amount: "1勺" },
    ],
  },
  {
    id: "40",
    title: "清蒸鲈鱼",
    coverImage: "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=400&h=300&fit=crop",
    cookingTime: 20,
    cookingMethod: "蒸",
    tags: ["海鲜", "清淡"],
    mainIngredients: [
      { name: "鲈鱼", amount: "1条" },
    ],
    seasonings: [
      { name: "葱", amount: "适量" },
      { name: "姜", amount: "适量" },
      { name: "蒸鱼豉油", amount: "2勺" },
    ],
  },
]

// ============================================
// 辅助函数
// ============================================

function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9]/g, "")
    .trim()
}

function ingredientMatches(userIngredient: string, recipeIngredient: string): boolean {
  const userNorm = normalizeIngredientName(userIngredient)
  const recipeNorm = normalizeIngredientName(recipeIngredient)

  if (userNorm === recipeNorm) return true
  if (userNorm.includes(recipeNorm) || recipeNorm.includes(userNorm)) return true

  const aliases: Record<string, string[]> = {
    番茄: ["西红柿"],
    西红柿: ["番茄"],
    鸡蛋: ["蛋", "鸡蛋"],
    蛋: ["鸡蛋"],
    葱: ["大葱", "小葱"],
    大葱: ["葱"],
    小葱: ["葱"],
    土豆: ["马铃薯"],
    马铃薯: ["土豆"],
    豆腐: ["嫩豆腐", "老豆腐"],
    嫩豆腐: ["豆腐"],
    老豆腐: ["豆腐"],
  }

  const userAliases = aliases[userNorm] || []
  const recipeAliases = aliases[recipeNorm] || []

  for (const alias of userAliases) {
    if (alias === recipeNorm) return true
  }
  for (const alias of recipeAliases) {
    if (alias === userNorm) return true
  }

  return false
}

// ============================================
// 计算单个菜谱的匹配度（仅基于主食材）
// ============================================

interface MatchResult {
  recipe: Recipe
  availableMainIngredients: string[]
  missingMainIngredients: string[]
  matchingScore: number
  isAllAvailable: boolean
}

function calculateMatch(recipe: Recipe, userIngredients: string[]): MatchResult {
  const availableMainIngredients: string[] = []
  const missingMainIngredients: string[] = []

  for (const mainIng of recipe.mainIngredients) {
    const found = userIngredients.some((userIng) =>
      ingredientMatches(userIng, mainIng.name)
    )

    if (found) {
      availableMainIngredients.push(mainIng.name)
    } else {
      missingMainIngredients.push(mainIng.name)
    }
  }

  // 匹配度 = 已匹配的主食材数 / 需主食材总数
  const matchingScore =
    recipe.mainIngredients.length > 0
      ? availableMainIngredients.length / recipe.mainIngredients.length
      : 0

  // 主食材100%匹配视为"食材已备齐"
  const isAllAvailable = missingMainIngredients.length === 0

  return {
    recipe,
    availableMainIngredients,
    missingMainIngredients,
    matchingScore,
    isAllAvailable,
  }
}

function sortRecommendations(results: MatchResult[]): MatchResult[] {
  return results.sort((a, b) => {
    // 规则1: 完全匹配优先
    if (a.isAllAvailable !== b.isAllAvailable) {
      return a.isAllAvailable ? -1 : 1
    }
    // 规则2: 匹配度高优先
    if (Math.abs(a.matchingScore - b.matchingScore) > 0.01) {
      return b.matchingScore - a.matchingScore
    }
    // 规则3: 缺少主食材少优先
    if (a.missingMainIngredients.length !== b.missingMainIngredients.length) {
      return a.missingMainIngredients.length - b.missingMainIngredients.length
    }
    // 规则4: 烹饪时间短优先
    return a.recipe.cookingTime - b.recipe.cookingTime
  })
}

// ============================================
// OpenAI 客户端
// ============================================

function createOpenAIClient(): OpenAI {
  const apiKey = process.env.AI_API_KEY
  const baseURL = process.env.AI_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1"

  if (!apiKey) {
    throw new Error("未配置 AI_API_KEY")
  }

  return new OpenAI({
    apiKey,
    baseURL,
    dangerouslyAllowBrowser: false,
  })
}

// ============================================
// API Route Handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ingredients } = body

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { success: false, error: "缺少食材列表" },
        { status: 400 }
      )
    }

    console.log("[Recommend API] 收到请求，用户食材:", ingredients)

    // 无 API Key 时使用本地匹配算法
    if (!process.env.AI_API_KEY) {
      console.log("[Recommend API] 使用本地匹配算法")

      const matchResults = RECIPE_DATABASE.map((recipe) =>
        calculateMatch(recipe, ingredients)
      )
      const sortedResults = sortRecommendations(matchResults)

      // 硬过滤：剔除匹配度为 0 的菜谱（主食材一个都没匹配）
      const filteredResults = sortedResults.filter((r) => r.matchingScore > 0)
      const top10 = filteredResults.slice(0, 10)

      const recommendations: Recommendation[] = top10.map((r) => ({
        recipeId: r.recipe.id,
        title: r.recipe.title,
        coverImage: r.recipe.coverImage,
        cookingMethod: r.recipe.cookingMethod,
        matchingScore: Math.round(r.matchingScore * 100) / 100,
        availableMainIngredients: r.availableMainIngredients,
        missingMainIngredients: r.missingMainIngredients,
        isAllAvailable: r.isAllAvailable,
        seasonings: r.recipe.seasonings.map((s) => s.name),
        cookingTime: r.recipe.cookingTime,
      }))

      return NextResponse.json({
        success: true,
        data: {
          recommendations,
          totalCandidates: filteredResults.length,
        },
      })
    }

    // 有 API Key 时，使用 AI 辅助筛选
    const client = createOpenAIClient()
    const model = process.env.TEXT_MODEL_NAME || "qwen-plus"

    const ingredientList = ingredients.join("、")
    const prompt = `你是一个顶级中餐厨师。请根据用户现有的食材「${ingredientList}」，生成15-20道最适合的菜谱推荐。

核心原则：
1. 【必须优先使用高价值食材】肉类、海鲜、贵重食材（如牛肋条、牛腩、猪蹄、排骨、鸡翅、鱼虾蟹等）必须被充分利用，不要浪费
2. 【同一食材多种做法】如果用户食材较少（如只有1-2种），请针对每种主食材推荐至少2-3种完全不同烹饪方式的菜谱。例如：土豆可以推荐"酸辣土豆丝(炒)"、"红烧土豆(煮)"、"狼牙土豆(炸)"等
3. 【充分利用每种食材】每种用户提供的食材都应该被考虑进推荐中

输出格式：
只输出菜名，用逗号分隔，不要任何解释，不要序号，不要换行。
例如：番茄炒蛋,蒜蓉青菜,红烧肉,糖醋排骨,清蒸鲈鱼,宫保鸡丁

请直接输出菜名列表：`

    console.log("[Recommend API] 调用 AI...")

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "你是一个专业中餐厨师，擅长根据用户现有食材推荐最佳菜谱。你必须充分利用每一种食材，特别是高价值的肉类和海鲜。同一食材要推荐不同的烹饪方式。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 300,
    })

    const aiResponse = response.choices?.[0]?.message?.content || ""
    console.log("[Recommend API] AI 返回:", aiResponse)

    // 解析 AI 返回的菜名
    const dishNames = aiResponse
      .split(/[,，、\n]/)
      .map((name) => name.trim())
      .filter((name) => name.length > 0 && name.length < 30)
      .slice(0, 20) // 最多20个

    console.log("[Recommend API] 解析菜名:", dishNames)

    // 从 AI 菜名中提取食材名称（用于扩展匹配）
    const extractedIngredients: string[] = []
    for (const dishName of dishNames) {
      // 尝试提取主食材（常见前缀/后缀模式）
      const patterns = [
        /^(红烧|酱香|糖醋|清蒸|爆炒|黑椒|蒜香|葱爆|干煸|水煮|干锅|麻辣|酸辣|咖喱|腐乳|回锅|溜肉段|宫保|鱼香|东坡|叉烧|白切|盐焗|蜜汁|锡纸|砂锅)/,  // 做法前缀
        /(?:炖|炒|蒸|煮|烤|炸|烩|焖|煎|煲|烧|拌|卤|熏|腌制)(.+?)(?:的做法?)?$/,  // 做法后跟食材
        /(.+?)(?:炖|炒|蒸|煮|烤|炸|烩|焖|煎|煲|烧|拌|卤|熏)$/,  // 食材后跟做法
      ]
      for (const pattern of patterns) {
        const match = dishName.match(pattern)
        if (match && match[1]) {
          const ingredient = match[1].replace(/[的得地]/g, "").trim()
          if (ingredient.length >= 2 && ingredient.length <= 10) {
            extractedIngredients.push(ingredient)
          }
        }
      }
      // 简单提取：尝试匹配高价值食材关键词
      const highValueKeywords = ["牛", "羊", "猪", "鸡", "鸭", "鱼", "虾", "蟹", "贝", "豆腐", "土豆", "青菜", "西兰花", "萝卜", "排骨", "肘子"]
      for (const kw of highValueKeywords) {
        if (dishName.includes(kw) && !extractedIngredients.includes(kw)) {
          extractedIngredients.push(kw)
        }
      }
    }

    console.log("[Recommend API] 提取的食材:", extractedIngredients)

    // 匹配菜谱：优先按菜名匹配，也按提取的食材匹配
    const matchedRecipes = new Set<Recipe>()

    // 1. 按菜名匹配
    for (const recipe of RECIPE_DATABASE) {
      if (dishNames.some(
        (dishName) =>
          recipe.title.includes(dishName) || dishName.includes(recipe.title)
      )) {
        matchedRecipes.add(recipe)
      }
    }

    // 2. 如果 AI 匹配太少，用提取的食材补充匹配
    if (matchedRecipes.size < 3) {
      const allIngredients = [...new Set([...ingredients, ...extractedIngredients])]
      for (const recipe of RECIPE_DATABASE) {
        const match = calculateMatch(recipe, allIngredients)
        if (match.matchingScore >= 0.5) {
          matchedRecipes.add(recipe)
        }
      }
    }

    const recipesToRank = matchedRecipes.size > 0 ? [...matchedRecipes] : RECIPE_DATABASE

    // 计算匹配度并排序
    const matchResults = recipesToRank.map((recipe) =>
      calculateMatch(recipe, ingredients)
    )
    const sortedResults = sortRecommendations(matchResults)

    // 硬过滤：剔除匹配度为 0 的菜谱（主食材一个都没匹配）
    const filteredResults = sortedResults.filter((r) => r.matchingScore > 0)
    const top10 = filteredResults.slice(0, 10)

    const recommendations: Recommendation[] = top10.map((r) => ({
      recipeId: r.recipe.id,
      title: r.recipe.title,
      coverImage: r.recipe.coverImage,
      cookingMethod: r.recipe.cookingMethod,
      matchingScore: Math.round(r.matchingScore * 100) / 100,
      availableMainIngredients: r.availableMainIngredients,
      missingMainIngredients: r.missingMainIngredients,
      isAllAvailable: r.isAllAvailable,
      seasonings: r.recipe.seasonings.map((s) => s.name),
      cookingTime: r.recipe.cookingTime,
    }))

    console.log("[Recommend API] 推荐结果:", recommendations.map((r) => `${r.title}(${r.matchingScore})`).join(", "))

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        totalCandidates: filteredResults.length,
      },
    })
  } catch (error) {
    console.error("[Recommend API] 错误:", error instanceof Error ? error.message : String(error))

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "服务器内部错误",
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  const hasKey = !!process.env.AI_API_KEY
  return NextResponse.json({
    status: "ok",
    recipeCount: RECIPE_DATABASE.length,
    mode: hasKey ? "ai-assisted" : "local-match",
  })
}
