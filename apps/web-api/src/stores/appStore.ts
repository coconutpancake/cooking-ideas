import { create } from "zustand"
import { type TabType } from "@/types"

interface AppState {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: "home",
  setActiveTab: (tab) => set({ activeTab: tab }),
}))
