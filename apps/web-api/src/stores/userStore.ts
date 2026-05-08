import { create } from "zustand"
import { type User } from "@/types"

interface UserState {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
}))
