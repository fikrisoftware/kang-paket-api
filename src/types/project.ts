import type { RequestItem } from './collection'
import type { Environment } from './environment'

export interface ProjectMeta {
  name: string
  version: string
  createdAt: string
}

export interface WorkspaceTree {
  projectPath: string
  meta: ProjectMeta
  requests: RequestItem[]
  environments?: Environment[]
}
