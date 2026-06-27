export interface EnvVariable {
  key: string
  value: string
  enabled: boolean
}

export interface Environment {
  name: string
  variables: EnvVariable[]
}
