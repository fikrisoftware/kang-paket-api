import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { PaketRequest, PaketResponse } from '../types/request'

export interface Tab {
  id: string
  name: string
  request: PaketRequest
  response: PaketResponse | null
  isLoading: boolean
  isDirty: boolean
}

const DEFAULT_REQUEST: PaketRequest = {
  method: 'GET',
  url: '',
  headers: [],
  body: { type: 'none', content: '' },
  auth: { type: 'none' }
}

function newTab(name = 'New Request'): Tab {
  return {
    id: uuidv4(),
    name,
    request: { ...DEFAULT_REQUEST },
    response: null,
    isLoading: false,
    isDirty: false
  }
}

interface TabStore {
  tabs: Tab[]
  activeTabId: string
  addTab: (partial?: Partial<Tab>) => string
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTab: (id: string, patch: Partial<Tab>) => void
  updateRequest: (id: string, patch: Partial<PaketRequest>) => void
}

export const useTabStore = create<TabStore>()(
  persist(
    (set, get) => {
      const initial = newTab()
      return {
        tabs: [initial],
        activeTabId: initial.id,

        addTab: (partial) => {
          const tab = { ...newTab(), ...partial }
          set((s) => ({ tabs: [...s.tabs, tab], activeTabId: tab.id }))
          return tab.id
        },

        closeTab: (id) => {
          const { tabs, activeTabId } = get()
          if (tabs.length === 1) return
          const idx = tabs.findIndex((t) => t.id === id)
          const next = tabs[idx === 0 ? 1 : idx - 1]
          set({
            tabs: tabs.filter((t) => t.id !== id),
            activeTabId: activeTabId === id ? next.id : activeTabId
          })
        },

        setActiveTab: (id) => set({ activeTabId: id }),

        updateTab: (id, patch) =>
          set((s) => ({
            tabs: s.tabs.map((t) => (t.id === id ? { ...t, ...patch } : t))
          })),

        updateRequest: (id, patch) =>
          set((s) => ({
            tabs: s.tabs.map((t) =>
              t.id === id
                ? { ...t, request: { ...t.request, ...patch }, isDirty: true }
                : t
            )
          }))
      }
    },
    {
      name: 'kp-tabs',
      partialState: (s: TabStore) => ({ tabs: s.tabs, activeTabId: s.activeTabId })
    } as Parameters<typeof persist>[1]
  )
)

export const useActiveTab = (): Tab | undefined =>
  useTabStore((s) => s.tabs.find((t) => t.id === s.activeTabId))
