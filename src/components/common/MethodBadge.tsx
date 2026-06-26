interface Props {
  method: string
  className?: string
}

const METHOD_COLORS: Record<string, string> = {
  GET: '#10b981',
  POST: '#f59e0b',
  PUT: '#3b82f6',
  DELETE: '#ef4444',
  PATCH: '#8b5cf6',
  HEAD: '#6b7280',
  OPTIONS: '#6b7280'
}

export function MethodBadge({ method, className = '' }: Props): JSX.Element {
  const color = METHOD_COLORS[method.toUpperCase()] ?? '#6b7280'
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold font-mono leading-none ${className}`}
      style={{ background: color, color: '#fff', minWidth: 44, textAlign: 'center' }}
    >
      {method.toUpperCase()}
    </span>
  )
}
