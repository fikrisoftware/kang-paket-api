import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WorkspaceTree } from '../types/project'
import type { RequestItem } from '../types/collection'

interface ProjectStore {
  workspace: WorkspaceTree | null
  recentPaths: string[]
  setWorkspace: (w: WorkspaceTree | null) => void
  addRecentPath: (path: string) => void
  getCollections: () => Record<string, RequestItem[]>
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      workspace: null,
      recentPaths: [],

      setWorkspace: (workspace) => {
        set({ workspace })
        if (workspace?.projectPath) {
          get().addRecentPath(workspace.projectPath)
        }
      },

      addRecentPath: (path) =>
        set((s) => ({
          recentPaths: [path, ...s.recentPaths.filter((p) => p !== path)].slice(0, 10)
        })),

      getCollections: () => {
        const requests = get().workspace?.requests ?? []
        return requests.reduce<Record<string, RequestItem[]>>((acc, r) => {
          const key = r.collectionName ?? 'Default'
          if (!acc[key]) acc[key] = []
          acc[key].push(r)
          return acc
        }, {})
      }
    }),
    { name: 'kp-project' }
  )
)
