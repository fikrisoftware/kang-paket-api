import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { PaketRequest, PaketResponse } from '../types/request'
import type { RequestItem } from '../types/collection'

export interface Tab {
  id: string
  name: string
  request: PaketRequest
  response: PaketResponse | null
  isLoading: boolean
  isDirty: boolean
  /** Identitas request tersimpan di disk — terisi jika tab ini terhubung
   *  ke sebuah .kp.json, sehingga "Simpan" meng-update file yang sama. */
  savedId?: string
  filePath?: string
  collectionName?: string
  groupPath?: string[]
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
  openSavedRequest: (item: RequestItem) => string
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

        openSavedRequest: (item) => {
          // Jika sudah ada tab untuk request ini, aktifkan saja (hindari duplikat).
          const existing = get().tabs.find((t) => t.savedId === item.id)
          if (existing) {
            set({ activeTabId: existing.id })
            return existing.id
          }
          const tab: Tab = {
            ...newTab(item.name),
            name: item.name,
            request: {
              method: item.method,
              url: item.url,
              headers: item.headers,
              body: item.body,
              auth: item.auth
            },
            savedId: item.id,
            filePath: item.filePath,
            collectionName: item.collectionName,
            groupPath: item.groupPath
          }
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
      partialize: (s: TabStore) => ({ tabs: s.tabs, activeTabId: s.activeTabId })
    } as Parameters<typeof persist>[1]
  )
)

export const useActiveTab = (): Tab | undefined =>
  useTabStore((s) => s.tabs.find((t) => t.id === s.activeTabId))
