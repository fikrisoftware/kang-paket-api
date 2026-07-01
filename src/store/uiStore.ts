import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'dark' | 'light' | 'midnight' | 'forest' | 'rose' | 'ocean'
type SidebarPanel = 'collections' | 'history' | null

export interface ThemeMeta {
  label: string
  accent: string
  bg: string
  dark: boolean
}

export const THEMES: Record<Theme, ThemeMeta> = {
  dark:     { label: 'Dark',     accent: '#10b981', bg: '#0f1117', dark: true  },
  midnight: { label: 'Midnight', accent: '#3b82f6', bg: '#0d1117', dark: true  },
  forest:   { label: 'Forest',   accent: '#22c55e', bg: '#0f1711', dark: true  },
  rose:     { label: 'Rose',     accent: '#f43f5e', bg: '#180f14', dark: true  },
  ocean:    { label: 'Ocean',    accent: '#06b6d4', bg: '#0f1923', dark: true  },
  light:    { label: 'Light',    accent: '#d97706', bg: '#fafaf9', dark: false },
}

interface UiStore {
  theme: Theme
  sidebarOpen: boolean
  sidebarPanel: SidebarPanel
  setTheme: (theme: Theme) => void
  setSidebarPanel: (panel: SidebarPanel) => void
}

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarOpen: true,
      sidebarPanel: 'collections',

      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme)
        set({ theme })
      },

      setSidebarPanel: (panel) =>
        set((s) => ({
          sidebarPanel: panel,
          sidebarOpen: panel !== null ? true : s.sidebarOpen
        }))
    }),
    { name: 'kp-ui' }
  )
)
