import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light'
type SidebarPanel = 'collections' | 'history' | null

interface UiStore {
  theme: Theme
  sidebarOpen: boolean
  sidebarPanel: SidebarPanel
  toggleTheme: () => void
  setSidebarPanel: (panel: SidebarPanel) => void
}

export const useUiStore = create<UiStore>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      sidebarOpen: true,
      sidebarPanel: 'collections',

      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        document.documentElement.setAttribute('data-theme', next)
        set({ theme: next })
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
