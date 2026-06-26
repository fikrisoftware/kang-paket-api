import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Environment, EnvVariable } from '../types/environment'

interface EnvStore {
  environments: Environment[]
  activeEnvName: string | null
  setActiveEnv: (name: string | null) => void
  addEnvironment: (name: string) => void
  deleteEnvironment: (name: string) => void
  renameEnvironment: (oldName: string, newName: string) => void
  setVariables: (envName: string, variables: EnvVariable[]) => void
  getActiveVars: () => Record<string, string>
}

export const useEnvStore = create<EnvStore>()(
  persist(
    (set, get) => ({
      environments: [],
      activeEnvName: null,

      setActiveEnv: (name) => set({ activeEnvName: name }),

      addEnvironment: (name) =>
        set((s) => ({
          environments: [...s.environments, { name, variables: [] }]
        })),

      deleteEnvironment: (name) =>
        set((s) => ({
          environments: s.environments.filter((e) => e.name !== name),
          activeEnvName: s.activeEnvName === name ? null : s.activeEnvName
        })),

      renameEnvironment: (oldName, newName) =>
        set((s) => ({
          environments: s.environments.map((e) =>
            e.name === oldName ? { ...e, name: newName } : e
          ),
          activeEnvName: s.activeEnvName === oldName ? newName : s.activeEnvName
        })),

      setVariables: (envName, variables) =>
        set((s) => ({
          environments: s.environments.map((e) =>
            e.name === envName ? { ...e, variables } : e
          )
        })),

      getActiveVars: () => {
        const { environments, activeEnvName } = get()
        if (!activeEnvName) return {}
        const env = environments.find((e) => e.name === activeEnvName)
        if (!env) return {}
        return Object.fromEntries(
          env.variables.filter((v) => v.enabled && v.key).map((v) => [v.key, v.value])
        )
      }
    }),
    { name: 'kp-env' }
  )
)
