import type { RequestItem } from './collection'

export interface ProjectMeta {
  name: string
  version: string
  createdAt: string
}

export interface WorkspaceTree {
  projectPath: string
  meta: ProjectMeta
  requests: RequestItem[]
}
