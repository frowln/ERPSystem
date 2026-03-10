import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FavoriteItem {
  href: string;
  label: string;
  icon?: string; // lucide icon name
}

export interface RecentItem {
  href: string;
  label: string;
  visitedAt: string; // ISO date
}

interface FavoritesState {
  favorites: FavoriteItem[];
  recents: RecentItem[];
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (href: string) => void;
  isFavorite: (href: string) => boolean;
  addRecent: (item: RecentItem) => void;
  clearRecents: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_RECENTS = 20;
const MAX_FAVORITES = 30;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      recents: [],

      addFavorite: (item) => {
        set((state) => {
          // Dedup by href
          if (state.favorites.some((f) => f.href === item.href)) return state;
          const next = [item, ...state.favorites];
          // Cap at MAX_FAVORITES
          return { favorites: next.slice(0, MAX_FAVORITES) };
        });
      },

      removeFavorite: (href) => {
        set((state) => ({
          favorites: state.favorites.filter((f) => f.href !== href),
        }));
      },

      isFavorite: (href) => {
        return get().favorites.some((f) => f.href === href);
      },

      addRecent: (item) => {
        set((state) => {
          // Remove existing entry with same href (dedup)
          const filtered = state.recents.filter((r) => r.href !== item.href);
          // Prepend new entry
          const next = [item, ...filtered];
          // Cap at MAX_RECENTS
          return { recents: next.slice(0, MAX_RECENTS) };
        });
      },

      clearRecents: () => {
        set({ recents: [] });
      },
    }),
    {
      name: 'privod-favorites',
    },
  ),
);
