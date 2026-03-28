import { create } from "zustand"
import { persist } from "zustand/middleware"

interface FavoritesState {
  favoriteIds: string[]
  addFavorite: (id: string) => void
  removeFavorite: (id: string) => void
  toggleFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: [],
      addFavorite: (id) =>
        set((state) => ({
          favoriteIds: [...state.favoriteIds, id],
        })),
      removeFavorite: (id) =>
        set((state) => ({
          favoriteIds: state.favoriteIds.filter((fid) => fid !== id),
        })),
      toggleFavorite: (id) => {
        const { favoriteIds, addFavorite, removeFavorite } = get()
        if (favoriteIds.includes(id)) {
          removeFavorite(id)
        } else {
          addFavorite(id)
        }
      },
      isFavorite: (id) => get().favoriteIds.includes(id),
    }),
    {
      name: "cooking-ideas-favorites",
    }
  )
)
