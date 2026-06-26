export function substituteVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (_, key) => vars[key.trim()] ?? `{{${key}}}`)
}

export function extractVarNames(text: string): string[] {
  const matches = text.matchAll(/\{\{([^}]+)\}\}/g)
  return [...matches].map((m) => m[1].trim())
}
