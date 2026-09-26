import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoritesStore {
  items: string[]; // productIds
  addFavorite: (productId: string) => void;
  removeFavorite: (productId: string) => void;
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  count: () => number;
  syncFromServer: () => Promise<void>;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      items: [],

      addFavorite: (productId) => {
        set((state) => ({
          items: state.items.includes(productId)
            ? state.items
            : [...state.items, productId],
        }));
        if (typeof window !== "undefined") {
          fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
          }).catch(() => {});
        }
      },

      removeFavorite: (productId) => {
        set((state) => ({
          items: state.items.filter((id) => id !== productId),
        }));
        if (typeof window !== "undefined") {
          fetch(`/api/favorites?productId=${encodeURIComponent(productId)}`, {
            method: "DELETE",
          }).catch(() => {});
        }
      },

      toggleFavorite: (productId) => {
        const { items } = get();
        if (items.includes(productId)) {
          get().removeFavorite(productId);
        } else {
          get().addFavorite(productId);
        }
      },

      isFavorite: (productId) => get().items.includes(productId),
      count: () => get().items.length,

      syncFromServer: async () => {
        if (typeof window === "undefined") return;
        try {
          const res = await fetch("/api/favorites");
          if (!res.ok) return;
          const data = await res.json();
          if (Array.isArray(data?.items)) {
            set((state) => ({
              items: Array.from(new Set([...state.items, ...data.items])),
            }));
          }
        } catch {
          // ignore network errors
        }
      },
    }),
    {
      name: "sabyr-favorites",
    }
  )
);
